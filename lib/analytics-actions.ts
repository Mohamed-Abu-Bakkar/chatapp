'use server';

import { AnalyticsService } from '@/lib/analytics-service';
import type { Message } from '@/app/lib/chat-types';

export async function trackMessageServerAction(message: Message, chatType: 'group' | 'direct', userRole: string, institutionId?: string) {
  return AnalyticsService.trackMessage(message, chatType, userRole, institutionId);
}

export async function trackUserActivityServerAction(
  userId: string,
  username: string,
  userRole: string,
  activityType: 'login' | 'logout' | 'message_sent' | 'message_received' | 'file_upload' | 'profile_update' | 'chat_join' | 'chat_leave',
  metadata?: Record<string, any>,
  chatId?: string,
  chatType?: 'group' | 'direct',
  institutionId?: string
) {
  return AnalyticsService.trackUserActivity(userId, username, userRole, activityType, metadata, chatId, chatType, institutionId);
}

export async function startChatSessionServerAction(
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
  return AnalyticsService.startChatSession(userId, username, userRole, chatId, chatType, chatName, recipientId, recipientUsername, institutionId);
}

export async function endChatSessionServerAction(sessionId: string) {
  return AnalyticsService.endChatSession(sessionId);
}

export async function trackFileUploadServerAction(
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
  return AnalyticsService.trackFileUpload(fileId, fileName, originalName, fileSize, fileType, mediaType, fileExtension, uploadUrl, uploadedBy, uploaderUsername, uploaderRole, chatId, chatType, messageId, thumbnailUrl, dimensions, duration, institutionId);
}