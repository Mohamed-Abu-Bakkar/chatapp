"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInstitutionUsers } from "@/app/lib/chat-service";
import { MessageSquare, Search, Plus } from "lucide-react";

interface StartDMDialogProps {
  institutionId: string;
  currentUserId: string;
  onUserSelected: (userId: string, username: string) => void;
  isMobile?: boolean;
}

export function StartDMDialog({
  institutionId,
  currentUserId,
  onUserSelected,
  isMobile = false,
}: StartDMDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await getInstitutionUsers(institutionId);
      // Filter out current user
      const filtered = fetchedUsers.filter((u) => u.$id !== currentUserId);
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string, username: string) => {
    onUserSelected(userId, username);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isMobile ? (
          <button
            className="w-14 h-14 rounded-full bg-gray-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="New Chat"
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : (
          <Button size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={
          isMobile ? "w-full h-full max-w-full max-h-full m-0 rounded-none" : ""
        }
      >
        <DialogHeader>
          <DialogTitle>Start Direct Message</DialogTitle>
          <DialogDescription>
            Select a user to start a conversation
          </DialogDescription>
        </DialogHeader>
        <div className={`space-y-4 ${isMobile ? "h-[calc(100vh-200px)]" : ""}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="pl-9"
            />
          </div>

          <div
            className={`space-y-2 overflow-y-auto ${
              isMobile ? "max-h-[calc(100vh-200px)]" : "max-h-96"
            }`}
          >
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {searchTerm ? "No users found" : "No users available"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.$id}
                  onClick={() => handleSelectUser(user.$id, user.username)}
                  className="w-full flex items-center gap-3 p-3 border rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
