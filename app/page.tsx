"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth";
import { useUserStore } from "@/app/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Redirect based on status and role
          if (currentUser.status === "pending") {
            router.push("/pending");
          } else if (currentUser.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }
      } catch {
        // User not logged in, stay on home page
      }
    }
    checkAuth();
  }, [router, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Academic Chat App</CardTitle>
          <CardDescription>
            Connect with your institution&apos;s academic community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <a href="/register">Create Account</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/login">Login</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
