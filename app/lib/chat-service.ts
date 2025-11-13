'use client';

import { databases } from "./appwrite";
import { ID, Query } from "appwrite";
import type { Message, Group, GroupMember, DirectMessageThread } from "./chat-types";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "69134fb7001b67bbe609";
const MESSAGES_COLLECTION = "messages";
const GROUPS_COLLECTION = "groups";
const GROUP_MEMBERS_COLLECTION = "group_members";
const DM_THREADS_COLLECTION = "dm_threads";
const USERS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "users";

// ===== MESSAGE FUNCTIONS =====

export async function sendMessage(
  senderId: string,
  senderUsername: string,
  content: string,
  type: "group" | "direct",
  groupId?: string,
  recipientId?: string,
  userRole?: string
): Promise<Message> {
  try {
        // Check permissions for announcement groups
    if (type === "group" && groupId) {
      const group = await databases.getDocument(DATABASE_ID, GROUPS_COLLECTION, groupId);
      if (group.isAnnouncement && userRole !== "Admin" && userRole !== "admin" && userRole !== "teacher") {
        throw new Error("Only administrators and teachers can send messages in announcements");
      }
    }

    const messageData: any = {
      senderId,
      senderUsername,
      content,
      type,
      createdAt: new Date().toISOString(),
      readBy: [senderId],
    };

    if (type === "group" && groupId) {
      messageData.groupId = groupId;
    } else if (type === "direct" && recipientId) {
      messageData.recipientId = recipientId;
      
      // Update or create DM thread
      await updateDMThread(senderId, senderUsername, recipientId, content);
    }

    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      ID.unique(),
      messageData
    );

    return message as unknown as Message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

export async function getGroupMessages(groupId: string, userId: string, limit: number = 50): Promise<Message[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      [
        Query.equal("groupId", groupId),
        Query.equal("type", "group"),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
      ]
    );

    // Filter out messages deleted by this user
    const filteredMessages = response.documents.filter((message: any) => {
      const deletedBy = message.deletedBy || [];
      return !deletedBy.includes(userId);
    });

    return filteredMessages.reverse() as unknown as Message[];
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return [];
  }
}

export async function getDirectMessages(
  userId1: string,
  userId2: string,
  currentUserId: string,
  limit: number = 50
): Promise<Message[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      [
        Query.equal("type", "direct"),
        Query.or([
          Query.and([
            Query.equal("senderId", userId1),
            Query.equal("recipientId", userId2)
          ]),
          Query.and([
            Query.equal("senderId", userId2),
            Query.equal("recipientId", userId1)
          ])
        ]),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
      ]
    );

    // Filter out messages deleted by the current user
    const filteredMessages = response.documents.filter((message: any) => {
      const deletedBy = message.deletedBy || [];
      return !deletedBy.includes(currentUserId);
    });

    return filteredMessages.reverse() as unknown as Message[];
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    return [];
  }
}

export async function markMessageAsRead(messageId: string, userId: string): Promise<void> {
  try {
    const message = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      messageId
    );

    const readBy = message.readBy || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION,
        messageId,
        { readBy }
      );
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
}

// ===== MESSAGE DELETION FUNCTIONS =====

export async function deleteMessageForMe(messageId: string, userId: string): Promise<void> {
  try {
    const message = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      messageId
    );

    const deletedBy = message.deletedBy || [];
    if (!deletedBy.includes(userId)) {
      deletedBy.push(userId);
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION,
        messageId,
        { deletedBy }
      );
    }
  } catch (error) {
    console.error("Error deleting message for user:", error);
    throw new Error("Failed to delete message for you");
  }
}

export async function deleteMessageForEveryone(messageId: string, userId: string): Promise<void> {
  try {
    const message = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      messageId
    );

    // Only allow the sender to delete for everyone
    if (message.senderId !== userId) {
      throw new Error("Only the sender can delete this message for everyone");
    }

    await databases.updateDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION,
      messageId,
      {
        deletedForEveryone: true,
      }
    );
  } catch (error) {
    console.error("Error deleting message for everyone:", error);
    throw new Error("Failed to delete message for everyone");
  }
}

// ===== GROUP FUNCTIONS =====

export async function createGroup(
  name: string,
  institutionId: string,
  createdBy: string,
  description?: string,
  isPrivate: boolean = false
): Promise<Group> {
  try {
    const group = await databases.createDocument(
      DATABASE_ID,
      GROUPS_COLLECTION,
      ID.unique(),
      {
        name,
        description: description || "",
        institutionId,
        createdBy,
        createdAt: new Date().toISOString(),
        isPrivate,
      }
    );

    // Add creator as admin member
    const currentUser = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, createdBy);
    await addGroupMember(group.$id, createdBy, currentUser.username, "admin");

    return group as unknown as Group;
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error("Failed to create group");
  }
}

export async function createAnnouncementGroup(institutionId: string): Promise<Group> {
  try {
    // Check if announcement group already exists for this institution
    const existing = await databases.listDocuments(
      DATABASE_ID,
      GROUPS_COLLECTION,
      [
        Query.equal("institutionId", institutionId),
        Query.equal("isAnnouncement", true),
      ]
    );

    if (existing.documents.length > 0) {
      return existing.documents[0] as unknown as Group;
    }

    // Create announcement group
    const group = await databases.createDocument(
      DATABASE_ID,
      GROUPS_COLLECTION,
      ID.unique(),
      {
        name: "Announcements",
        description: "Official announcements from administration",
        institutionId,
        createdBy: "system",
        createdAt: new Date().toISOString(),
        isPrivate: false,
        isAnnouncement: true,
      }
    );

    return group as unknown as Group;
  } catch (error) {
    console.error("Error creating announcement group:", error);
    throw new Error("Failed to create announcement group");
  }
}

export async function getAnnouncementGroup(institutionId: string): Promise<Group | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GROUPS_COLLECTION,
      [
        Query.equal("institutionId", institutionId),
        Query.equal("isAnnouncement", true),
      ]
    );

    if (response.documents.length > 0) {
      return response.documents[0] as unknown as Group;
    }

    return null;
  } catch (error) {
    console.error("Error fetching announcement group:", error);
    return null;
  }
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    // First get all group memberships for this user
    const memberships = await databases.listDocuments(
      DATABASE_ID,
      GROUP_MEMBERS_COLLECTION,
      [Query.equal("userId", userId)]
    );

    const groups: Group[] = [];

    // Get all groups the user is a member of
    if (memberships.documents.length > 0) {
      const groupIds = memberships.documents.map((m) => m.groupId);
      
      for (const groupId of groupIds) {
        try {
          const group = await databases.getDocument(
            DATABASE_ID,
            GROUPS_COLLECTION,
            groupId
          );
          groups.push(group as unknown as Group);
        } catch (error) {
          console.error(`Error fetching group ${groupId}:`, error);
        }
      }
    }

    // Get user info to find institution
    const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, userId);
    const institutionId = userDoc.institutionId;

    // Add announcement groups for this institution (accessible to all users)
    const announcementGroups = await databases.listDocuments(
      DATABASE_ID,
      GROUPS_COLLECTION,
      [
        Query.equal("institutionId", institutionId),
        Query.equal("isAnnouncement", true),
      ]
    );

    // Add announcement groups that aren't already in the list
    for (const announcementGroup of announcementGroups.documents) {
      const exists = groups.some(g => g.$id === announcementGroup.$id);
      if (!exists) {
        groups.push(announcementGroup as unknown as Group);
      }
    }

    return groups;
  } catch (error) {
    console.error("Error fetching user groups:", error);
    return [];
  }
}

export async function updateGroup(
  groupId: string,
  data: { name?: string; description?: string; isPrivate?: boolean }
): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      GROUPS_COLLECTION,
      groupId,
      data
    );
  } catch (error) {
    console.error("Error updating group:", error);
    throw new Error("Failed to update group");
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  try {
    // Delete all group members
    const members = await getGroupMembers(groupId);
    for (const member of members) {
      await databases.deleteDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION,
        member.$id
      );
    }

    // Delete the group
    await databases.deleteDocument(
      DATABASE_ID,
      GROUPS_COLLECTION,
      groupId
    );
  } catch (error) {
    console.error("Error deleting group:", error);
    throw new Error("Failed to delete group");
  }
}

// ===== GROUP MEMBER FUNCTIONS =====

export async function addGroupMember(
  groupId: string,
  userId: string,
  username: string,
  role: "admin" | "member" = "member"
): Promise<GroupMember> {
  try {
    // Check if user is already a member
    const existing = await databases.listDocuments(
      DATABASE_ID,
      GROUP_MEMBERS_COLLECTION,
      [
        Query.equal("groupId", groupId),
        Query.equal("userId", userId),
      ]
    );

    if (existing.documents.length > 0) {
      throw new Error("User is already a member of this group");
    }

    const member = await databases.createDocument(
      DATABASE_ID,
      GROUP_MEMBERS_COLLECTION,
      ID.unique(),
      {
        groupId,
        userId,
        username,
        role,
        joinedAt: new Date().toISOString(),
      }
    );

    return member as unknown as GroupMember;
  } catch (error) {
    console.error("Error adding group member:", error);
    throw new Error("Failed to add group member");
  }
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  try {
    const members = await databases.listDocuments(
      DATABASE_ID,
      GROUP_MEMBERS_COLLECTION,
      [
        Query.equal("groupId", groupId),
        Query.equal("userId", userId),
      ]
    );

    if (members.documents.length > 0) {
      await databases.deleteDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION,
        members.documents[0].$id
      );
    }
  } catch (error) {
    console.error("Error removing group member:", error);
    throw new Error("Failed to remove group member");
  }
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GROUP_MEMBERS_COLLECTION,
      [Query.equal("groupId", groupId)]
    );

    return response.documents as unknown as GroupMember[];
  } catch (error) {
    console.error("Error fetching group members:", error);
    return [];
  }
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: "admin" | "member"
): Promise<void> {
  try {
    const members = await databases.listDocuments(
      DATABASE_ID,
      GROUP_MEMBERS_COLLECTION,
      [
        Query.equal("groupId", groupId),
        Query.equal("userId", userId),
      ]
    );

    if (members.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION,
        members.documents[0].$id,
        { role }
      );
    }
  } catch (error) {
    console.error("Error updating member role:", error);
    throw new Error("Failed to update member role");
  }
}

// ===== DIRECT MESSAGE THREAD FUNCTIONS =====

async function updateDMThread(
  userId1: string,
  username1: string,
  userId2: string,
  lastMessageContent: string
): Promise<void> {
  try {
    // Sort IDs to ensure consistent ordering
    const [participant1Id, participant2Id] = [userId1, userId2].sort();
    
    // Get username for participant2
    const user2 = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, userId2);
    const username2 = user2.username;

    // Check if thread exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      DM_THREADS_COLLECTION,
      [
        Query.equal("participant1Id", participant1Id),
        Query.equal("participant2Id", participant2Id),
      ]
    );

    const threadData = {
      participant1Id,
      participant1Username: participant1Id === userId1 ? username1 : username2,
      participant2Id,
      participant2Username: participant2Id === userId2 ? username2 : username1,
      lastMessageAt: new Date().toISOString(),
      lastMessageContent: lastMessageContent.substring(0, 200),
    };

    if (existing.documents.length > 0) {
      // Update existing thread
      await databases.updateDocument(
        DATABASE_ID,
        DM_THREADS_COLLECTION,
        existing.documents[0].$id,
        {
          lastMessageAt: threadData.lastMessageAt,
          lastMessageContent: threadData.lastMessageContent,
        }
      );
    } else {
      // Create new thread
      await databases.createDocument(
        DATABASE_ID,
        DM_THREADS_COLLECTION,
        ID.unique(),
        threadData
      );
    }
  } catch (error) {
    console.error("Error updating DM thread:", error);
  }
}

export async function getUserDMThreads(userId: string): Promise<DirectMessageThread[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      DM_THREADS_COLLECTION,
      [
        Query.or([
          Query.equal("participant1Id", userId),
          Query.equal("participant2Id", userId)
        ]),
        Query.orderDesc("lastMessageAt"),
      ]
    );

    return response.documents as unknown as DirectMessageThread[];
  } catch (error) {
    console.error("Error fetching DM threads:", error);
    return [];
  }
}

// ===== USER SEARCH =====

export async function searchUsers(institutionId: string, searchTerm: string): Promise<any[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION,
      [
        Query.equal("institutionId", institutionId),
        Query.equal("status", "approved"),
        Query.search("username", searchTerm),
        Query.limit(20),
      ]
    );

    return response.documents;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

export async function getInstitutionUsers(institutionId: string): Promise<any[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION,
      [
        Query.equal("institutionId", institutionId),
        Query.equal("status", "approved"),
        Query.limit(100),
      ]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching institution users:", error);
    return [];
  }
}
