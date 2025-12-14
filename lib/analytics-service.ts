import connectToDatabase from '@/lib/mongodb';
import MessageAnalytics from '@/lib/models/MessageAnalytics';
import UserActivity from '@/lib/models/UserActivity';
import ChatSession from '@/lib/models/ChatSession';
import FileMetadata from '@/lib/models/FileMetadata';
import type { Message } from '@/app/lib/chat-types';

export class AnalyticsService {
  // Message Analytics
  static async trackMessage(message: Message, chatType: 'group' | 'direct', userRole: string, institutionId?: string) {
    try {
      await connectToDatabase();

      const timestamp = new Date(message.createdAt);
      const messageContent = JSON.parse(message.content || '{}');
      const textContent = messageContent.text || '';
      const hasMedia = !!(messageContent.mediaUrl);

      const analytics = new MessageAnalytics({
        messageId: message.$id,
        chatId: message.groupId || message.recipientId || '',
        chatType,
        senderId: message.senderId,
        senderUsername: message.senderUsername || '',
        recipientId: chatType === 'direct' ? message.recipientId : undefined,
        messageType: hasMedia ? 'media' : 'text',
        mediaType: messageContent.mediaType,
        messageLength: textContent.length,
        hasMedia,
        timestamp,
        dayOfWeek: timestamp.getDay(),
        hourOfDay: timestamp.getHours(),
        wordCount: textContent.split(/\s+/).filter((word: string) => word.length > 0).length,
        userRole,
        institutionId,
      });

      await analytics.save();
      console.log('Message analytics tracked:', message.$id);
    } catch (error) {
      console.error('Error tracking message analytics:', error);
    }
  }

  // User Activity Tracking
  static async trackUserActivity(
    userId: string,
    username: string,
    userRole: string,
    activityType: 'login' | 'logout' | 'message_sent' | 'message_received' | 'file_upload' | 'profile_update' | 'chat_join' | 'chat_leave',
    metadata?: any,
    chatId?: string,
    chatType?: 'group' | 'direct',
    institutionId?: string
  ) {
    try {
      await connectToDatabase();

      const activity = new UserActivity({
        userId,
        username,
        userRole,
        institutionId,
        activityType,
        chatId,
        chatType,
        metadata,
        timestamp: new Date(),
      });

      await activity.save();
      console.log('User activity tracked:', activityType, userId);
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  // Chat Session Management
  static async startChatSession(
    userId: string,
    username: string,
    userRole: string,
    chatId: string,
    chatType: 'group' | 'direct',
    chatName?: string,
    recipientId?: string,
    recipientUsername?: string,
    institutionId?: string
  ) {
    try {
      await connectToDatabase();

      const sessionId = `${userId}_${chatId}_${Date.now()}`;
      const now = new Date();

      const session = new ChatSession({
        sessionId,
        userId,
        username,
        userRole,
        chatId,
        chatType,
        chatName,
        recipientId,
        recipientUsername,
        startTime: now,
        lastActivity: now,
        institutionId,
      });

      await session.save();
      console.log('Chat session started:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error starting chat session:', error);
      return null;
    }
  }

  static async updateChatSession(sessionId: string, messageCount?: number) {
    try {
      await connectToDatabase();

      const updateData: any = { lastActivity: new Date() };
      if (messageCount !== undefined) {
        updateData.$inc = { messageCount };
      }

      await ChatSession.findOneAndUpdate(
        { sessionId },
        updateData,
        { new: true }
      );
    } catch (error) {
      console.error('Error updating chat session:', error);
    }
  }

  static async endChatSession(sessionId: string) {
    try {
      await connectToDatabase();

      const session = await ChatSession.findOne({ sessionId });
      if (!session) {
        console.error('Session not found:', sessionId);
        return;
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / (1000 * 60)); // minutes

      await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          isActive: false,
          endTime,
          duration
        },
        { new: true }
      );
      console.log('Chat session ended:', sessionId, 'Duration:', duration, 'minutes');
    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  }

  // File Metadata Tracking
  static async trackFileUpload(
    fileId: string,
    fileName: string,
    originalName: string,
    fileSize: number,
    fileType: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    fileExtension: string,
    uploadUrl: string,
    uploadedBy: string,
    uploaderUsername: string,
    uploaderRole: string,
    chatId: string,
    chatType: 'group' | 'direct',
    messageId?: string,
    thumbnailUrl?: string,
    dimensions?: { width: number; height: number },
    duration?: number,
    institutionId?: string
  ) {
    try {
      await connectToDatabase();

      const fileMetadata = new FileMetadata({
        fileId,
        fileName,
        originalName,
        fileSize,
        fileType,
        mediaType,
        fileExtension,
        uploadUrl,
        thumbnailUrl,
        uploadedBy,
        uploaderUsername,
        uploaderRole,
        chatId,
        chatType,
        messageId,
        dimensions,
        duration,
        institutionId,
      });

      await fileMetadata.save();
      console.log('File metadata tracked:', fileId);
    } catch (error) {
      console.error('Error tracking file metadata:', error);
    }
  }

  // Analytics Queries
  static async getMessageStats(chatId?: string, days: number = 30) {
    try {
      await connectToDatabase();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage = { timestamp: { $gte: startDate } };
      if (chatId) {
        (matchStage as any).chatId = chatId;
      }

      const stats = await MessageAnalytics.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            textMessages: { $sum: { $cond: [{ $eq: ['$messageType', 'text'] }, 1, 0] } },
            mediaMessages: { $sum: { $cond: [{ $eq: ['$messageType', 'media'] }, 1, 0] } },
            announcements: { $sum: 0 }, // Temporarily set to 0 until announcement tracking is implemented
            avgMessageLength: { $avg: '$messageLength' },
            totalUsers: { $addToSet: '$senderId' },
          }
        },
        {
          $project: {
            totalMessages: 1,
            textMessages: 1,
            mediaMessages: 1,
            announcements: 1,
            avgMessageLength: { $round: ['$avgMessageLength', 1] },
            uniqueUsers: { $size: '$totalUsers' },
          }
        }
      ]);

      return stats[0] || {
        totalMessages: 0,
        textMessages: 0,
        mediaMessages: 0,
        announcements: 0,
        avgMessageLength: 0,
        uniqueUsers: 0,
      };
    } catch (error) {
      console.error('Error getting message stats:', error);
      return null;
    }
  }

  static async getUserActivityStats(userId?: string, days: number = 7) {
    try {
      await connectToDatabase();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage = { timestamp: { $gte: startDate } };
      if (userId) {
        (matchStage as any).userId = userId;
      }

      const stats = await UserActivity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$activityType',
            count: { $sum: 1 },
          }
        },
        {
          $group: {
            _id: null,
            activities: {
              $push: {
                type: '$_id',
                count: '$count'
              }
            },
            totalActivities: { $sum: '$count' }
          }
        }
      ]);

      return stats[0] || { activities: [], totalActivities: 0 };
    } catch (error) {
      console.error('Error getting user activity stats:', error);
      return null;
    }
  }
}