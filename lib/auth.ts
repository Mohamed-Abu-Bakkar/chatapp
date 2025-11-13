'use client';

import { account, databases } from "../app/lib/appwrite";
import { ID, Query } from "appwrite";
import { useUserStore } from "../app/lib/store";

// Database and Collection IDs (should be set in environment variables)
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "academic_chat";
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "users";
const INSTITUTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID || "institutions";

export interface User {
  $id: string;
  name: string;
  email: string;
  role: "Members" | "teacher" | "Admin";
  status: "pending" | "approved";
  institutionId: string;
  institutionName?: string;
}

export interface Institution {
  $id: string;
  name: string;
  code: string;
}

// Register a new user
export async function registerUser(
  name: string,
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
    const institution: Institution = {
      $id: institutionDoc.$id,
      name: institutionDoc.name,
      code: institutionDoc.code,
    };

    // Create Appwrite account
    await account.create(ID.unique(), email, password, name);

    // Log in the user
    await account.createEmailPasswordSession(email, password);

    // Get the current user
    const appwriteUser = await account.get();

    // Create user document in database
    const userDoc = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(),
      {
        userId: appwriteUser.$id,
        name,
        email,
        role: "student",
        status: "pending",
        institutionId: institution.$id,
        institutionName: institution.name,
      }
    );

    return {
      $id: userDoc.$id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      status: userDoc.status,
      institutionId: userDoc.institutionId,
      institutionName: userDoc.institutionName,
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw new Error("Registration failed");
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    await account.createEmailPasswordSession(email, password);
    const appwriteUser = await account.get();

    // Get user document from database
    const usersResponse = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("userId", appwriteUser.$id)]
    );

    if (usersResponse.documents.length === 0) {
      throw new Error("User document not found");
    }

    const userDoc = usersResponse.documents[0];

    return {
      $id: userDoc.$id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      status: userDoc.status,
      institutionId: userDoc.institutionId,
      institutionName: userDoc.institutionName,
    };
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
      [Query.equal("userId", appwriteUser.$id)]
    );

    if (usersResponse.documents.length === 0) {
      return null;
    }

    const userDoc = usersResponse.documents[0];

    return {
      $id: userDoc.$id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      status: userDoc.status,
      institutionId: userDoc.institutionId,
      institutionName: userDoc.institutionName,
    };
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

    return response.documents.map((doc) => ({
      $id: doc.$id,
      name: doc.name,
      email: doc.email,
      role: doc.role,
      status: doc.status,
      institutionId: doc.institutionId,
      institutionName: doc.institutionName,
    }));
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

