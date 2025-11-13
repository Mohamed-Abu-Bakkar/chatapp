# Chat App Database Schema

This document outlines the Appwrite collections needed for the chat functionality.

## Collections to Create in Appwrite

### 1. messages
- **Collection ID**: `messages`
- **Attributes**:
  - `senderId` (string, required, size: 50) - ID of the user sending the message
  - `senderUsername` (string, required, size: 50) - Username of sender
  - `content` (string, required, size: 5000) - Message content
  - `groupId` (string, optional, size: 50) - Group ID if group message
  - `recipientId` (string, optional, size: 50) - Recipient ID if direct message
  - `type` (string, required, size: 10) - "group" or "direct"
  - `createdAt` (datetime, required) - When message was sent
  - `readBy` (string[], optional) - Array of user IDs who read the message

- **Indexes**:
  - `groupId` - for fetching group messages
  - `recipientId` - for fetching direct messages
  - `senderId` - for fetching user's messages
  - `createdAt` - for ordering messages

- **Permissions**:
  - Read: Any authenticated user in the same institution
  - Create: Any authenticated user
  - Update: Message sender only (for editing)
  - Delete: Message sender only

### 2. groups
- **Collection ID**: `groups`
- **Attributes**:
  - `name` (string, required, size: 100) - Group name
  - `description` (string, optional, size: 500) - Group description
  - `institutionId` (string, required, size: 50) - Institution ID
  - `createdBy` (string, required, size: 50) - User ID of creator
  - `createdAt` (datetime, required) - When group was created
  - `isPrivate` (boolean, required, default: false) - Private or public group

- **Indexes**:
  - `institutionId` - for listing institution groups
  - `createdBy` - for user's created groups

- **Permissions**:
  - Read: Any authenticated user in the same institution
  - Create: Any authenticated user
  - Update: Group creator or admin only
  - Delete: Group creator only

### 3. group_members
- **Collection ID**: `group_members`
- **Attributes**:
  - `groupId` (string, required, size: 50) - Group ID
  - `userId` (string, required, size: 50) - User ID
  - `username` (string, required, size: 50) - Username
  - `role` (string, required, size: 20) - "admin" or "member"
  - `joinedAt` (datetime, required) - When user joined

- **Indexes**:
  - `groupId` - for fetching group members
  - `userId` - for fetching user's groups
  - Composite: `groupId` + `userId` (unique) - prevent duplicate membership

- **Permissions**:
  - Read: Group members only
  - Create: Group admins only
  - Update: Group admins only
  - Delete: Group admins only

### 4. dm_threads
- **Collection ID**: `dm_threads`
- **Attributes**:
  - `participant1Id` (string, required, size: 50) - First participant user ID
  - `participant1Username` (string, required, size: 50) - First participant username
  - `participant2Id` (string, required, size: 50) - Second participant user ID
  - `participant2Username` (string, required, size: 50) - Second participant username
  - `lastMessageAt` (datetime, required) - Last message timestamp
  - `lastMessageContent` (string, optional, size: 200) - Preview of last message

- **Indexes**:
  - `participant1Id` - for fetching user's DM threads
  - `participant2Id` - for fetching user's DM threads
  - Composite: `participant1Id` + `participant2Id` (unique) - prevent duplicate threads

- **Permissions**:
  - Read: Thread participants only
  - Create: Any authenticated user
  - Update: Thread participants only
  - Delete: Thread participants only

### 5. user_status (optional)
- **Collection ID**: `user_status`
- **Attributes**:
  - `userId` (string, required, size: 50, unique) - User ID
  - `username` (string, required, size: 50) - Username
  - `isOnline` (boolean, required, default: false) - Online status
  - `lastSeen` (datetime, required) - Last seen timestamp

- **Indexes**:
  - `userId` (unique) - for fetching user status

- **Permissions**:
  - Read: Any authenticated user in the same institution
  - Create: User only
  - Update: User only
  - Delete: User only

## Setup Instructions

1. Go to your Appwrite Console
2. Navigate to your database
3. Create each collection listed above
4. Add all attributes as specified
5. Create the indexes for better query performance
6. Set up permissions according to your security requirements

## Notes

- Adjust size limits based on your needs
- Consider adding more attributes like `attachments`, `reactions`, `mentions` for advanced features
- Set up proper validation rules in Appwrite
- Configure rate limiting to prevent spam
