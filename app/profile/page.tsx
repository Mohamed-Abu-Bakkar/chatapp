"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, updateUserProfile } from "@/app/lib/auth";
import { useUserStore } from "@/app/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User as UserIcon, Mail, Building2, Shield } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        if (currentUser.status === "pending") {
          router.push("/pending");
          return;
        }
        setUser(currentUser);
        setUsername(currentUser.username);
      } catch {
        router.push("/login");
      }
    }
    checkUser();
  }, [router, setUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateUserProfile(user.$id, username.trim());
      
      // Update local user state
      const updatedUser = { ...user, username: username.trim() };
      setUser(updatedUser);
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account information</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {message && (
                  <div
                    className={`p-3 rounded-md ${
                      message.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </div>

                <Button type="submit" disabled={loading || username.trim() === user.username}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your account information (read-only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Username</div>
                  <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                  <div className="font-medium text-gray-900 dark:text-white">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Institution ID</div>
                  <div className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                    {user.institutionId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Role</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
