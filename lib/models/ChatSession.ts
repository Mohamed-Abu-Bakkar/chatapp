import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSession extends Document {
  sessionId: string; // Unique session identifier
  userId: string;
  username: string;
  userRole: string;
  chatId: string;
  chatType: 'group' | 'direct';
  chatName?: string;
  recipientId?: string; // For direct messages
  recipientUsername?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  messageCount: number;
  isActive: boolean;
  lastActivity: Date;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  institutionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  userRole: { type: String, required: true },
  chatId: { type: String, required: true },
  chatType: { type: String, enum: ['group', 'direct'], required: true },
  chatName: { type: String },
  recipientId: { type: String },
  recipientUsername: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  messageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, required: true },
  deviceInfo: {
    userAgent: { type: String },
    platform: { type: String },
    language: { type: String },
  },
  institutionId: { type: String },
}, {
  timestamps: true,
});

// Indexes for efficient queries
ChatSessionSchema.index({ userId: 1, isActive: 1 });
ChatSessionSchema.index({ chatId: 1, isActive: 1 });
ChatSessionSchema.index({ sessionId: 1 });
ChatSessionSchema.index({ startTime: -1 });
ChatSessionSchema.index({ lastActivity: -1 });

// Removed pre-save middleware - duration will be calculated in the service

export default mongoose.models.ChatSession ||
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);