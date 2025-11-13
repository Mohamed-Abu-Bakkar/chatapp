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
import {
  getGroupMembers,
  removeGroupMember,
  updateMemberRole,
} from "@/app/lib/chat-service";
import type { GroupMember } from "@/app/lib/chat-types";
import { Users, Crown, UserMinus } from "lucide-react";

interface GroupMembersDialogProps {
  groupId: string;
  isAdmin: boolean;
  currentUserId: string;
}

export function GroupMembersDialog({
  groupId,
  isAdmin,
  currentUserId,
}: GroupMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, groupId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const fetchedMembers = await getGroupMembers(groupId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeGroupMember(groupId, userId);
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";

    try {
      await updateMemberRole(groupId, userId, newRole);
      loadMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update member role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Members ({members.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>View and manage group members</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No members found
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.$id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.username}
                      {member.role === "admin" && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {isAdmin && member.userId !== currentUserId && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleToggleAdmin(member.userId, member.role)
                      }
                    >
                      {member.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
