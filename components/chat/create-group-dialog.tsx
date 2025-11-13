"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createGroup } from "@/app/lib/chat-service";
import { Plus } from "lucide-react";

interface CreateGroupDialogProps {
  institutionId: string;
  userId: string;
  onGroupCreated: () => void;
  isMobile?: boolean;
}

export function CreateGroupDialog({
  institutionId,
  userId,
  onGroupCreated,
  isMobile = false,
}: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createGroup(
        formData.name,
        institutionId,
        userId,
        formData.description,
        formData.isPrivate
      );
      setFormData({ name: "", description: "", isPrivate: false });
      setOpen(false);
      onGroupCreated();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isMobile ? (
          <button
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="New Group"
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={
          isMobile ? "w-full h-full max-w-full max-h-full m-0 rounded-none" : ""
        }
      >
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a new chat group for your institution
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Group Name
            </label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter group name"
              maxLength={100}
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description (Optional)
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What's this group about?"
              maxLength={500}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) =>
                setFormData({ ...formData, isPrivate: e.target.checked })
              }
              className="h-4 w-4"
            />
            <label htmlFor="isPrivate" className="text-sm">
              Make this a private group
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
