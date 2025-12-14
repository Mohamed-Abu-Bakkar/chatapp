import mongoose, { Schema, Document } from 'mongoose';

export interface IFileMetadata extends Document {
  fileId: string; // UploadThing file ID
  fileName: string;
  originalName: string;
  fileSize: number; // in bytes
  fileType: string; // MIME type
  mediaType: 'image' | 'video' | 'audio' | 'document';
  fileExtension: string;
  uploadUrl: string; // UploadThing URL
  thumbnailUrl?: string; // For images/videos
  uploadedBy: string; // User ID
  uploaderUsername: string;
  uploaderRole: string;
  chatId: string;
  chatType: 'group' | 'direct';
  messageId?: string; // Associated message ID
  dimensions?: {
    width: number;
    height: number;
  }; // For images/videos
  duration?: number; // For audio/video in seconds
  checksum?: string; // File hash for integrity
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  downloadCount: number;
  lastAccessed?: Date;
  institutionId?: string;
  metadata: {
    encoding?: string;
    compression?: string;
    bitrate?: number;
    sampleRate?: number; // For audio
    frameRate?: number; // For video
    codec?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FileMetadataSchema = new Schema<IFileMetadata>({
  fileId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true },
  fileExtension: { type: String, required: true },
  uploadUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  uploadedBy: { type: String, required: true },
  uploaderUsername: { type: String, required: true },
  uploaderRole: { type: String, required: true },
  chatId: { type: String, required: true },
  chatType: { type: String, enum: ['group', 'direct'], required: true },
  messageId: { type: String },
  dimensions: {
    width: { type: Number },
    height: { type: Number },
  },
  duration: { type: Number },
  checksum: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  downloadCount: { type: Number, default: 0 },
  lastAccessed: { type: Date },
  institutionId: { type: String },
  metadata: {
    encoding: { type: String },
    compression: { type: String },
    bitrate: { type: Number },
    sampleRate: { type: Number },
    frameRate: { type: Number },
    codec: { type: String },
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
FileMetadataSchema.index({ uploadedBy: 1, createdAt: -1 });
FileMetadataSchema.index({ chatId: 1, createdAt: -1 });
FileMetadataSchema.index({ mediaType: 1, createdAt: -1 });
FileMetadataSchema.index({ fileType: 1 });
FileMetadataSchema.index({ isDeleted: 1, createdAt: -1 });

export default mongoose.models.FileMetadata ||
  mongoose.model<IFileMetadata>('FileMetadata', FileMetadataSchema);