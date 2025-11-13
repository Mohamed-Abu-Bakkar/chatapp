"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  searchUsers,
  addGroupMember,
  getInstitutionUsers,
} from "@/app/lib/chat-service";
import { UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddMemberDialogProps {
  groupId: string;
  institutionId: string;
  currentUserId: string;
  onMemberAdded: () => void;
}

export function AddMemberDialog({
  groupId,
  institutionId,
  currentUserId,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);

  // Load all institution users when dialog opens
  const loadInstitutionUsers = async () => {
    setLoading(true);
    try {
      const results = await getInstitutionUsers(institutionId);
      // Filter out current user
      setUsers(results.filter((u) => u.$id !== currentUserId));
      setInitialLoad(true);
    } catch (error) {
      console.error("Error loading institution users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !initialLoad) {
      loadInstitutionUsers();
    } else if (!newOpen) {
      // Reset state when closing
      setUsers([]);
      setSearchTerm("");
      setInitialLoad(false);
    }
  };

  const handleAddMember = async (userId: string, username: string) => {
    try {
      await addGroupMember(groupId, userId, username);
      onMemberAdded();
      setOpen(false);
      setUsers([]);
      setSearchTerm("");
      setInitialLoad(false);
    } catch (error: any) {
      console.error("Error adding member:", error);
      alert(error.message || "Failed to add member");
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // If search term is empty, reload all users
      await loadInstitutionUsers();
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(institutionId, searchTerm);
      // Filter out current user
      setUsers(results.filter((u) => u.$id !== currentUserId));
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Group Member</DialogTitle>
          <DialogDescription>
            Search users from your institution or browse all users to add to
            this group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by username (leave empty to show all)..."
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center text-muted-foreground py-4 text-sm">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-sm">
                {initialLoad
                  ? "No users found in your institution"
                  : "Search for users to add"}
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.$id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddMember(user.$id, user.username)}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
