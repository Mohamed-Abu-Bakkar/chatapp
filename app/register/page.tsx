"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser } from "@/app/lib/auth";
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
  User,
  Mail,
  Lock,
  Building2,
  UserPlus,
  AlertCircle,
  UserIcon,
  
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    institutionCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await registerUser(
        formData.username,
        formData.email,
        formData.password,
        formData.institutionCode
      );
      setUser(user);
      router.push("/pending");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background Orbs */}
      <motion.div
        className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-linear-to-br from-blue-400/30 to-purple-400/30 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-linear-to-br from-pink-400/30 to-orange-400/30 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-indigo-400/20 to-cyan-400/20 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <UserIcon className="h-8 w-8 text-white" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                Join us and start chatting
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 text-indigo-600" />
                  Username
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  className="border-gray-200 transition-all focus:border-indigo-400 focus:ring-indigo-400"
                  placeholder="Enter your username"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="border-gray-200 transition-all focus:border-indigo-400 focus:ring-indigo-400"
                  placeholder="Enter your email"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  Password
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                  className="border-gray-200 transition-all focus:border-indigo-400 focus:ring-indigo-400"
                  placeholder="Create a password"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Institution Code
                </label>
                <Input
                  type="text"
                  value={formData.institutionCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      institutionCode: e.target.value,
                    })
                  }
                  required
                  className="border-gray-200 transition-all focus:border-indigo-400 focus:ring-indigo-400"
                  placeholder="Enter institution code"
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                  disabled={loading}
                >
                  {loading ? (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Creating Account...
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </span>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-sm text-gray-600"
              >
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-indigo-600 transition-colors hover:text-purple-600"
                >
                  Sign in
                </a>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
