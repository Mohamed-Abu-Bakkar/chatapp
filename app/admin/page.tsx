"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  logoutUser,
  getPendingUsers,
  approveUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
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

  const loadAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error("Error loading all users:", error);
    } finally {
      setLoadingUsers(false);
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
        await loadAllUsers();
      } catch {
        router.push("/login");
      }
    }
    checkUser();
  }, [router, setUser, loadPendingUsers, loadAllUsers]);

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
  }, [user, loadPendingUsers, loadAllUsers]);

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      await loadPendingUsers();
      await loadAllUsers(); // Refresh all users list too
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    try {
      await updateUserRole(userId, newRole);
      await loadAllUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteUser(userId);
      await loadAllUsers(); // Refresh the users list
      await loadPendingUsers(); // Also refresh pending users in case they were pending
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
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
                      <div className="font-medium">{pendingUser.username}</div>
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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                onClick={loadAllUsers}
                disabled={loadingUsers}
                variant="outline"
              >
                {loadingUsers ? "Loading..." : "Refresh Users"}
              </Button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">Loading users...</div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            ) : (
              <div className="space-y-4">
                {allUsers.map((user) => (
                  <div
                    key={user.$id}
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Role: {user.role} | Status: {user.status}
                      </div>
                      {user.institutionName && (
                        <div className="text-xs text-muted-foreground">
                          Institution: {user.institutionName}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Role Selection */}
                      <select
                        aria-label={`Change role for ${user.username}`}
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user.$id,
                            e.target.value as User["role"]
                          )
                        }
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Delete Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete {user.username}?
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.$id)}
                            >
                              Delete User
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
