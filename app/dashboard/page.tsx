"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    // TODO: Implement message sending to Appwrite
    setMessages([
      ...messages,
      {
        id: Date.now(),
        text: newMessage,
        sender: user.name,
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
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
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {user.name} ({user.role})
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Chat Section */}
          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>Institution chat room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 overflow-y-auto border rounded-md p-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{msg.sender}</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>

          {/* Announcements Section */}
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                Latest updates from your institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <div className="text-sm font-medium mb-1">
                    Welcome to Academic Chat
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Get started by introducing yourself in the chat!
                  </div>
                </div>
                {/* TODO: Fetch real announcements from Appwrite */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
