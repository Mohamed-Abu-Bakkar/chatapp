'use client';

import { account, databases } from "./appwrite";
import { ID, Query } from "appwrite";
import { useUserStore } from "./store";

// Database and Collection IDs (should be set in environment variables)
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "academic_chat_db";
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "users";
const INSTITUTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID || "institutions";

export interface User {
  $id: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status: "pending" | "approved";
  institutionId: string;
  institutionName?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Institution {
  $id: string;
  institutionName: string;
  code: string;
}

function getInstitutionName(doc: Record<string, unknown>): string {
  const inferredName =
    (doc["institutionName"] as string | undefined) ??
    (doc["name"] as string | undefined) ??
    "";

  if (!inferredName) {
    throw new Error("Institution is missing a name attribute");
  }

  return inferredName;
}

async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password is required for hashing");
  }

  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Secure password hashing is not supported in this environment");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function mapUserDocument(doc: Record<string, any>): User {
  const createdAt =
    (doc.createdAt as string | undefined) ??
    (doc.$createdAt as string | undefined) ??
    new Date().toISOString();

  return {
    $id: doc.$id as string,
    username:
      (doc.username as string | undefined) ??
      (doc.name as string | undefined) ??
      "",
    email: (doc.email as string) ?? "",
    role: (doc.role as User["role"]) ?? "student",
    status: (doc.status as User["status"]) ?? "pending",
    institutionId: (doc.institutionId as string) ?? "",
    institutionName: doc.institutionName as string | undefined,
    createdAt,
    lastLogin: doc.lastLogin as string | undefined,
  };
}

// Register a new user
export async function registerUser(
  username: string,
  email: string,
  password: string,
  institutionCode: string
): Promise<User> {
  try {
    // First, find the institution by code
    const institutionsResponse = await databases.listDocuments(
      DATABASE_ID,
      INSTITUTIONS_COLLECTION_ID,
      [Query.equal("code", institutionCode)]
    );

    if (institutionsResponse.documents.length === 0) {
      throw new Error("Invalid institution code");
    }

    const institutionDoc = institutionsResponse.documents[0];
    const institutionName = getInstitutionName(institutionDoc as Record<string, unknown>);
    const institution: Institution = {
      $id: institutionDoc.$id,
      institutionName,
      code: institutionDoc.code,
    };

    const passwordHash = await hashPassword(password);
    const timestamp = new Date().toISOString();

    // Delete any existing session first
    try {
      await account.deleteSession("current");
    } catch {
      // No active session to delete, continue
    }

    // Create Appwrite account
    await account.create(ID.unique(), email, password, username);

    // Log in the user
    await account.createEmailPasswordSession(email, password);

    // Get the current user
    const appwriteUser = await account.get();

    // Truncate institutionName to 30 chars max to match Appwrite schema
    const truncatedInstitutionName = institutionName.length > 30 
      ? institutionName.substring(0, 30) 
      : institutionName;

    // Create user document in database
    const userDoc = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(),
      {
        username,
        passwordHash,
        email,
        role: "student",
        status: "pending",
        createdAt: timestamp,
        lastLogin: timestamp,
        institutionId: institutionCode, // Store the institution code instead of ID
        institutionName: truncatedInstitutionName,
      }
    );

    return mapUserDocument(userDoc as Record<string, any>);
  } catch (error) {
    console.error("Registration error:", error);
    throw new Error("Registration failed");
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    // Delete any existing session first
    try {
      await account.deleteSession("current");
    } catch {
      // No active session to delete, continue
    }

    await account.createEmailPasswordSession(email, password);
    const appwriteUser = await account.get();
    // Get user document from database
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("email", appwriteUser.email)]
    );

    if (usersResponse.documents.length === 0) {
      throw new Error("User document not found");
    }

    const userDoc = usersResponse.documents[0];
    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userDoc.$id,
      { lastLogin: new Date().toISOString() }
    );

    return mapUserDocument(updatedDoc as Record<string, any>);
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Login failed");
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const appwriteUser = await account.get();

    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("email", appwriteUser.email)]
    );

    if (usersResponse.documents.length === 0) {
      return null;
    }

    const userDoc = usersResponse.documents[0];

    return mapUserDocument(userDoc as Record<string, any>);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await account.deleteSession("current");
    useUserStore.getState().setUser(null);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Get pending users (for admin)
export async function getPendingUsers(): Promise<User[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("status", "pending")]
    );

    return response.documents.map((doc) =>
      mapUserDocument(doc as Record<string, any>)
    );
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return [];
  }
}

// Approve user (admin only)
export async function approveUser(userId: string): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        status: "approved",
      }
    );
  } catch (error) {
    console.error("Approve user error:", error);
    throw new Error("Failed to approve user");
  }
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.orderDesc("createdAt")]
    );

    return response.documents.map((doc) =>
      mapUserDocument(doc as Record<string, any>)
    );
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: User["role"]): Promise<void> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        role,
      }
    );
  } catch (error) {
    console.error("Update user role error:", error);
    throw new Error("Failed to update user role");
  }
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );
  } catch (error) {
    console.error("Delete user error:", error);
    throw new Error("Failed to delete user");
  }
}

// Update user profile (username)
export async function updateUserProfile(userId: string, username: string): Promise<void> {
  try {
    if (!username || username.trim().length < 3) {
      throw new Error("Username must be at least 3 characters long");
    }

    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        username: username.trim(),
      }
    );
  } catch (error: any) {
    console.error("Update user profile error:", error);
    throw new Error(error.message || "Failed to update profile");
  }
}
