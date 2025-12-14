import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageAnalytics extends Document {
  messageId: string; // Appwrite message ID
  chatId: string; // Group or direct chat ID
  chatType: 'group' | 'direct';
  senderId: string;
  senderUsername: string;
  recipientId?: string; // For direct messages
  messageType: 'text' | 'media' | 'announcement';
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  messageLength: number; // Character count
  hasMedia: boolean;
  timestamp: Date;
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  wordCount: number;
  userRole: string;
  institutionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageAnalyticsSchema = new Schema<IMessageAnalytics>({
  messageId: { type: String, required: true, unique: true },
  chatId: { type: String, required: true },
  chatType: { type: String, enum: ['group', 'direct'], required: true },
  senderId: { type: String, required: true },
  senderUsername: { type: String, required: true },
  recipientId: { type: String }, // For direct messages
  messageType: { type: String, enum: ['text', 'media', 'announcement'], required: true },
  mediaType: { type: String, enum: ['image', 'video', 'audio', 'document'] },
  messageLength: { type: Number, required: true },
  hasMedia: { type: Boolean, default: false },
  timestamp: { type: Date, required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  hourOfDay: { type: Number, required: true, min: 0, max: 23 },
  wordCount: { type: Number, required: true },
  userRole: { type: String, required: true },
  institutionId: { type: String },
}, {
  timestamps: true,
});

// Indexes for efficient queries
MessageAnalyticsSchema.index({ chatId: 1, timestamp: -1 });
MessageAnalyticsSchema.index({ senderId: 1, timestamp: -1 });
MessageAnalyticsSchema.index({ chatType: 1, timestamp: -1 });
MessageAnalyticsSchema.index({ dayOfWeek: 1, hourOfDay: 1 });
MessageAnalyticsSchema.index({ messageType: 1, timestamp: -1 });

export default mongoose.models.MessageAnalytics ||
  mongoose.model<IMessageAnalytics>('MessageAnalytics', MessageAnalyticsSchema);