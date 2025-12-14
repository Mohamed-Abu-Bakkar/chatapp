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
    console.log('Environment variables loaded');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}

// Load env first
loadEnv();

import mongoose from 'mongoose';

async function testConnection() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI!;
    console.log('Connecting to MongoDB...');

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully!');

    // List collections
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('Existing collections:', collections.map(c => c.name));
    } else {
      console.log('Database connection not available');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
}

testConnection();