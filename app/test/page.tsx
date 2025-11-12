"use client";

import { useEffect, useState } from "react";
import { account, databases } from "@/app/lib/appwrite";

export default function ConnectionTest() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Testing...");
  const [user, setUser] = useState<any>(null);
  const [databaseTest, setDatabaseTest] = useState<string>("");
  const [usersTest, setUsersTest] = useState<string>("");
  const [networkTest, setNetworkTest] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    async function testConnection() {
      console.log("🔍 Starting Appwrite connection test...");

      try {
        // Set debug info
        setDebugInfo(`Testing with:
Database ID: ${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}
Institutions Collection: ${process.env.NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID}
Users Collection: ${process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID}`);

        console.log("📋 Environment variables:", {
          endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
          project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
          database: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          institutions:
            process.env.NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID,
          users: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
        });

        // Test 0: Basic network connectivity
        console.log("🌐 Testing basic network connectivity...");
        try {
          const response = await fetch("https://cloud.appwrite.io/v1/", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log("✅ Basic network test successful:", response.status);
          setNetworkTest(`✅ Network reachable (Status: ${response.status})`);
        } catch (error) {
          console.error("❌ Basic network test failed:", error);
          setNetworkTest(`❌ Network unreachable: ${(error as Error).message}`);
        }

        // Test 1: Check if we can get account info (will fail if not authenticated)
        console.log("👤 Testing authentication...");
        try {
          const currentUser = await account.get();
          console.log("✅ Authentication successful:", currentUser);
          setUser(currentUser);
        } catch (error) {
          console.log("❌ Authentication failed (expected):", error);
        }

        // Test 2: Try to list institutions (this should work if connection is good)
        console.log("🏫 Testing institutions collection access...");
        try {
          console.log("📡 Making request to institutions collection...");
          const institutions = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_INSTITUTIONS_COLLECTION_ID ||
              "institutions"
          );
          console.log("✅ Institutions fetch successful:", institutions);
          setDatabaseTest(
            `✅ Found ${institutions.documents.length} institutions`
          );
        } catch (error) {
          const err = error as any;
          console.error("❌ Institutions error details:", {
            message: err.message,
            code: err.code,
            type: err.type,
            response: err.response,
            fullError: err,
          });
          const errorCode = err.code || "Unknown";
          const errorMessage = err.message || "Unknown error";

          if (errorCode === 401) {
            setDatabaseTest(
              `❌ Institutions failed: 401 Unauthorized - Check collection permissions in Appwrite Console`
            );
          } else if (errorCode === 404) {
            setDatabaseTest(
              `❌ Institutions failed: 404 Not Found - Check collection ID exists`
            );
          } else if (errorCode === 403) {
            setDatabaseTest(
              `❌ Institutions failed: 403 Forbidden - Check collection read permissions`
            );
          } else {
            setDatabaseTest(
              `❌ Institutions failed: ${errorMessage} (Code: ${errorCode})`
            );
          }
        }

        // Test 3: Try to list users (may require authentication)
        console.log("👥 Testing users collection access...");
        try {
          console.log("📡 Making request to users collection...");
          const users = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!
          );
          console.log("✅ Users fetch successful:", users);
          setUsersTest(`✅ Found ${users.documents.length} users`);
        } catch (error) {
          const err = error as any;
          console.error("❌ Users error details:", {
            message: err.message,
            code: err.code,
            type: err.type,
            response: err.response,
            fullError: err,
          });
          const errorCode = err.code || "Unknown";
          const errorMessage = err.message || "Unknown error";

          if (errorCode === 401) {
            setUsersTest(
              `❌ Users failed: 401 Unauthorized - This is normal (requires authentication)`
            );
          } else if (errorCode === 404) {
            setUsersTest(
              `❌ Users failed: 404 Not Found - Check collection ID exists`
            );
          } else if (errorCode === 403) {
            setUsersTest(
              `❌ Users failed: 403 Forbidden - Check collection read permissions`
            );
          } else {
            setUsersTest(
              `❌ Users failed: ${errorMessage} (Code: ${errorCode})`
            );
          }
        }

        console.log("🎉 All connection tests completed successfully!");
        setConnectionStatus("✅ Connected to Appwrite successfully!");
      } catch (error) {
        const err = error as Error;
        console.error("💥 Overall connection test failed:", {
          message: err.message,
          stack: err.stack,
          fullError: err,
        });
        setConnectionStatus(`❌ Connection failed: ${err.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Appwrite Connection Test</h1>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">🌐 Network Connectivity</h2>
            <p
              className={
                networkTest.includes("✅") ? "text-green-600" : "text-red-600"
              }
            >
              {networkTest || "Testing..."}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Authentication Status</h2>
            <p>
              {user
                ? `✅ Logged in as: ${user.name} (${user.email})`
                : "❌ Not authenticated"}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">
              Institutions Collection Access
            </h2>
            <p
              className={
                databaseTest.includes("✅") ? "text-green-600" : "text-red-600"
              }
            >
              {databaseTest || "Testing..."}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Users Collection Access</h2>
            <p
              className={
                usersTest.includes("✅") ? "text-green-600" : "text-red-600"
              }
            >
              {usersTest || "Testing..."}
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-blue-50">
            <h2 className="font-semibold mb-2">🔍 How to Check Console Logs</h2>
            <div className="text-sm space-y-2">
              <p>
                <strong>1.</strong> Press{" "}
                <kbd className="bg-gray-200 px-1 rounded">F12</kbd> or
                right-click → Inspect
              </p>
              <p>
                <strong>2.</strong> Click the <strong>Console</strong> tab
              </p>
              <p>
                <strong>3.</strong> Look for detailed error logs with 🔍, 📋,
                👤, 🏫, 👥 symbols
              </p>
              <p>
                <strong>4.</strong> Share the error details here
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-red-50">
            <h2 className="font-semibold mb-2 text-red-800">
              🚨 Network Connectivity Issue
            </h2>
            <div className="text-sm space-y-2 text-red-700">
              <p>
                <strong>Problem:</strong> "Failed to fetch" indicates a network
                connectivity issue
              </p>
              <p>
                <strong>Possible causes:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Internet connection issues</li>
                <li>Firewall blocking requests to Appwrite</li>
                <li>Corporate proxy blocking external APIs</li>
                <li>DNS resolution problems</li>
                <li>Appwrite service temporarily down</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
