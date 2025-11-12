"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  logoutUser,
  getPendingUsers,
  approveUser,
  type User,
} from "@/app/lib/auth";
import { useUserStore } from "@/app/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { realtime } from "@/app/lib/appwrite";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "academic_chat";
const USERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "users";

export default function AdminPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<unknown>(null);

  const loadPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error("Error loading pending users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        if (currentUser.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setUser(currentUser);
        await loadPendingUsers();
      } catch {
        router.push("/login");
      }
    }
    checkUser();
  }, [router, setUser, loadPendingUsers]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    // Set up realtime subscription for pending users
    const setupSubscription = async () => {
      const subscription = await realtime.subscribe(
        `databases.${DATABASE_ID}.collections.${USERS_COLLECTION_ID}.documents`,
        (response) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            )
          ) {
            loadPendingUsers();
          }
        }
      );
      subscriptionRef.current = subscription;
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        (subscriptionRef.current as () => void)();
        subscriptionRef.current = null;
      }
    };
  }, [user, loadPendingUsers]);

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      await loadPendingUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users and institution settings
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              Review and approve new user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending users at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((pendingUser) => (
                  <div
                    key={pendingUser.$id}
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">{pendingUser.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pendingUser.email}
                      </div>
                      {pendingUser.institutionName && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Institution: {pendingUser.institutionName}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleApprove(pendingUser.$id)}
                      size="sm"
                    >
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
