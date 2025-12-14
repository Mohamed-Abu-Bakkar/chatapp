import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = envContent.split('\n').filter(line => line.includes('='));

    envVars.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      }
    });
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}

// Load env before any other imports
loadEnv();

import connectToDatabase from '@/lib/mongodb';
import MessageAnalytics from '@/lib/models/MessageAnalytics';
import UserActivity from '@/lib/models/UserActivity';
import ChatSession from '@/lib/models/ChatSession';
import FileMetadata from '@/lib/models/FileMetadata';

async function initMongoDB() {
  try {
    console.log('Initializing MongoDB connection...');
    await connectToDatabase();

    console.log('Checking/creating indexes...');

    // Create indexes with error handling for existing indexes
    const createIndexesSafely = async (model: any, name: string) => {
      try {
        await model.createIndexes();
        console.log(`✅ ${name} indexes created`);
      } catch (error: any) {
        if (error.code === 85 || error.codeName === 'IndexKeySpecsConflict') {
          console.log(`ℹ️  ${name} indexes already exist`);
        } else {
          console.log(`⚠️  ${name} indexes creation failed:`, error.message);
        }
      }
    };

    await createIndexesSafely(MessageAnalytics, 'MessageAnalytics');
    await createIndexesSafely(UserActivity, 'UserActivity');
    await createIndexesSafely(ChatSession, 'ChatSession');
    await createIndexesSafely(FileMetadata, 'FileMetadata');

    console.log('🎉 MongoDB initialization completed successfully!');
    console.log('\nAvailable collections:');
    console.log('- MessageAnalytics: Track message statistics and patterns');
    console.log('- UserActivity: Monitor user behavior and engagement');
    console.log('- ChatSession: Track active chat sessions');
    console.log('- FileMetadata: Store detailed file information');

  } catch (error) {
    console.error('❌ Error initializing MongoDB:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

initMongoDB();