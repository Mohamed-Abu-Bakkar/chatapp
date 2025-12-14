# Academic Chat App - Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=69134f93000138d6470c
NEXT_PUBLIC_APPWRITE_DATABASE_ID=69134fb7001b67bbe609
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID=institutions

# MongoDB Atlas for Analytics
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp_analytics?retryWrites=true&w=majority
```

## Appwrite Setup

### 1. Create Database

- Go to your Appwrite Console
- Create a new database named `academic_chat` (or use the ID you specified in env)

### 2. Create Collections

#### Institutions Collection (`institutions`)

Attributes:

- `name` (String, required)
- `code` (String, required, unique)

Indexes:

- Create index on `code` for fast lookups

#### Messages Collection (`messages`)

Attributes:

- `senderId` (String, required)
- `senderUsername` (String, required)
- `content` (String, required)
- `type` (String, required) - Enum: "group", "direct"
- `groupId` (String, optional) - For group messages
- `recipientId` (String, optional) - For direct messages
- `createdAt` (String, required)
- `readBy` (String array, required)
- `deletedBy` (String array, optional) - Array of user IDs who deleted this message for themselves
- `deletedForEveryone` (Boolean, optional) - Whether this message was deleted for all users

Indexes:

- Create index on `groupId` for group message queries
- Create index on `type` for message type filtering
- Create composite index on `senderId` and `recipientId` for direct message queries

#### Groups Collection (`groups`)

Attributes:

- `name` (String, required)
- `description` (String, optional)
- `institutionId` (String, required)
- `createdBy` (String, required)
- `createdAt` (String, required)
- `isPrivate` (Boolean, required)
- `isAnnouncement` (Boolean, optional) - Whether this is an announcement group

Indexes:

- Create index on `institutionId` for institution filtering
- Create index on `isAnnouncement` for announcement group queries

#### Group Members Collection (`group_members`)

Attributes:

- `groupId` (String, required)
- `userId` (String, required)
- `username` (String, required)
- `role` (String, required) - Enum: "admin", "member"
- `joinedAt` (String, required)

Indexes:

- Create index on `groupId` for group member queries
- Create composite index on `userId` and `groupId` for membership checks

### 3. Create Sample Institution

Create at least one institution document in the `institutions` collection:

```json
{
  "name": "Sample University",
  "code": "UNIV001"
}
```

### 4. Create Admin User

1. Register a user through the app
2. Manually update their document in Appwrite:
   - Set `role` to `"admin"`
   - Set `status` to `"approved"`

Or create an admin user directly in Appwrite and create a corresponding user document.

## MongoDB Atlas Setup for Analytics

### 1. Create MongoDB Atlas Account

- Go to [MongoDB Atlas](https://cloud.mongodb.com/)
- Create a free account and cluster

### 2. Create Database and Collections

The application will automatically create the following collections when you first run it:

- `messageanalytics` - Stores message statistics and metadata
- `useractivities` - Tracks user interactions and activities
- `chatsessions` - Monitors chat session durations and engagement
- `filemetadata` - Stores information about uploaded files

### 3. Configure Network Access

- In MongoDB Atlas, go to "Network Access"
- Add IP address `0.0.0.0/0` for development (restrict in production)

### 4. Create Database User

- Go to "Database Access" in MongoDB Atlas
- Create a new database user with read/write permissions
- Use these credentials in your `MONGODB_URI`

### 5. Get Connection String

- Go to "Clusters" and click "Connect"
- Choose "Connect your application"
- Copy the connection string and replace with your credentials
- Update the `MONGODB_URI` in your `.env.local` file

## Permissions

### Users Collection

- **Create**: Any authenticated user
- **Read**: Users can read their own document, admins can read all
- **Update**: Admins only (for approval)

### Institutions Collection

- **Read**: Any authenticated user
- **Create/Update**: Admins only

## Running the App

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000` to get started.

**Note:** The MongoDB Atlas collections and indexes will be automatically created when the application first connects to the database.

## User Flow

1. **Registration**: User registers with institution code → Status: `pending`
2. **Pending Page**: User sees "Awaiting approval" message
3. **Admin Approval**: Admin approves user → Status: `approved`
4. **Dashboard**: Approved users can access chat and announcements
