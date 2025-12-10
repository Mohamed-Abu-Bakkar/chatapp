"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, logoutUser, updateUserProfile } from "@/app/lib/auth";
import { useUserStore } from "@/app/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Building2,
  Shield,
  Check,
  X,
  Edit2,
  Save,
  
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(user?.username || "");
    setIsEditing(false);
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Page Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <div className="h-8 w-8 text-blue-600 dark:text-blue-400" >
                
                <UserIcon className="h-8 w-8" />
                </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Profile Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-11">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Success/Error Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <div
                className={`p-4 rounded-xl backdrop-blur-sm border flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                    : "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                }`}
              >
                {message.type === "success" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      Profile Information
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Update your personal details
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        minLength={3}
                        maxLength={50}
                        disabled={!isEditing}
                        className={`transition-all duration-300 ${
                          isEditing
                            ? "ring-2 ring-blue-500 dark:ring-blue-400"
                            : "bg-gray-50 dark:bg-gray-900/50"
                        }`}
                      />
                      <AnimatePresence>
                        {isEditing && username.trim() !== user.username && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 pt-2"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1"
                        >
                          <Button
                            type="submit"
                            disabled={
                              loading || username.trim() === user.username
                            }
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {loading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Details Cards */}
          {[
            {
              icon: Mail,
              label: "Email",
              value: user.email,
              gradient: "from-blue-500 to-cyan-500",
            },
            {
              icon: Building2,
              label: "Institution ID",
              value: user.institutionId,
              gradient: "from-purple-500 to-pink-500",
              mono: true,
            },
            {
              icon: Shield,
              label: "Role",
              value: user.role,
              gradient: "from-orange-500 to-red-500",
              capitalize: true,
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}
                    >
                      <item.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {item.label}
                      </div>
                      <div
                        className={`text-lg font-semibold text-gray-900 dark:text-white break-all ${
                          item.mono ? "font-mono text-sm" : ""
                        } ${item.capitalize ? "capitalize" : ""}`}
                      >
                        {item.value}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Account created on {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
