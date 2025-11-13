export interface Message {
  $id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  groupId?: string;
  recipientId?: string;
  type: "group" | "direct";
  createdAt: string;
  readBy: string[];
  deletedBy?: string[];
  deletedForEveryone?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface Group {
  $id: string;
  name: string;
  description?: string;
  institutionId: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
  isAnnouncement?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface GroupMember {
  $id: string;
  groupId: string;
  userId: string;
  username: string;
  role: "admin" | "member";
  joinedAt: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface DirectMessageThread {
  $id: string;
  participant1Id: string;
  participant1Username: string;
  participant2Id: string;
  participant2Username: string;
  lastMessageAt: string;
  lastMessageContent?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface UserStatus {
  $id: string;
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen: string;
  $createdAt?: string;
  $updatedAt?: string;
}
