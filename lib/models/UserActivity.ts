import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
  userId: string;
  username: string;
  userRole: string;
  institutionId?: string;
  activityType: 'login' | 'logout' | 'message_sent' | 'message_received' | 'file_upload' | 'profile_update' | 'chat_join' | 'chat_leave';
  chatId?: string; // For chat-related activities
  chatType?: 'group' | 'direct';
  metadata?: {
    messageCount?: number;
    fileSize?: number;
    fileType?: string;
    sessionDuration?: number; // in minutes
    deviceType?: string;
    browser?: string;
    ipAddress?: string;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userRole: { type: String, required: true },
  institutionId: { type: String },
  activityType: {
    type: String,
    enum: ['login', 'logout', 'message_sent', 'message_received', 'file_upload', 'profile_update', 'chat_join', 'chat_leave'],
    required: true
  },
  chatId: { type: String },
  chatType: { type: String, enum: ['group', 'direct'] },
  metadata: {
    messageCount: { type: Number },
    fileSize: { type: Number },
    fileType: { type: String },
    sessionDuration: { type: Number },
    deviceType: { type: String },
    browser: { type: String },
    ipAddress: { type: String },
  },
  timestamp: { type: Date, required: true },
}, {
  timestamps: true,
});

// Indexes for efficient queries
UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ activityType: 1, timestamp: -1 });
UserActivitySchema.index({ chatId: 1, timestamp: -1 });
UserActivitySchema.index({ userRole: 1, timestamp: -1 });

export default mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);