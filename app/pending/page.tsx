"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/app/lib/auth";
import { useUserStore } from "@/app/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PendingPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        if (currentUser.status !== "pending") {
          // User has been approved, redirect to appropriate page
          if (currentUser.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
          return;
        }
        setUser(currentUser);
      } catch {
        router.push("/login");
      }
    }
    checkUser();
  }, [router, setUser]);

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Awaiting Approval</CardTitle>
          <CardDescription>
            Your account is pending admin approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Hello {user.name}, your registration has been received. An
              administrator will review your account and approve it shortly.
              Please check back later.
            </p>
          </div>
          {user.institutionName && (
            <div className="text-sm text-muted-foreground">
              Institution:{" "}
              <span className="font-medium">{user.institutionName}</span>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
