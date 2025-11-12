# Academic Chat App - Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=69134f93000138d6470c
NEXT_PUBLIC_APPWRITE_DATABASE_ID=69134fb7001b67bbe609
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID=institutions
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

#### Users Collection (`users`)
Attributes:
- `userId` (String, required) - Appwrite user ID
- `name` (String, required)
- `email` (String, required)
- `role` (String, required) - Enum: "student", "teacher", "admin"
- `status` (String, required) - Enum: "pending", "approved"
- `institutionId` (String, required) - Reference to institution
- `institutionName` (String, optional)

Indexes:
- Create index on `userId` for user lookups
- Create index on `status` for pending user queries

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

## User Flow

1. **Registration**: User registers with institution code → Status: `pending`
2. **Pending Page**: User sees "Awaiting approval" message
3. **Admin Approval**: Admin approves user → Status: `approved`
4. **Dashboard**: Approved users can access chat and announcements

