"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Loader2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  _count: {
    members: number;
  };
}

interface AddToGroupDialogProps {
  userId: string;
  userName: string;
  currentGroups?: Array<{ group: { id: string; name: string } }>;
  onSuccess?: () => void;
}

export function AddToGroupDialog({
  userId,
  userName,
  currentGroups = [],
  onSuccess,
}: AddToGroupDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups?search=${encodeURIComponent(searchQuery)}&limit=100`);
      const data = await res.json();
      
      // Filter out groups the user is already in
      const currentGroupIds = new Set(currentGroups.map((g) => g.group.id));
      const available = data.groups.filter((g: Group) => !currentGroupIds.has(g.id));
      
      setGroups(available);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        fetchGroups();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, open]);

  const handleAddToGroup = async () => {
    if (!selectedGroupId) {
      alert("Please select a group");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: selectedRole,
        }),
      });

      if (res.ok) {
        setOpen(false);
        setSelectedGroupId("");
        setSelectedRole("member");
        setSearchQuery("");
        // Refresh the page data
        router.refresh();
        // Call onSuccess callback if provided (for backward compatibility)
        if (onSuccess) {
          onSuccess();
        }
        alert(`${userName} has been added to the group successfully!`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add member to group");
      }
    } catch (error) {
      console.error("Error adding to group:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query) ||
      group.type?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Add to Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add {userName} to a Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current groups */}
          {currentGroups.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Current Groups:</p>
              <div className="flex flex-wrap gap-2">
                {currentGroups.map((g) => (
                  <Badge key={g.group.id} variant="secondary">
                    {g.group.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <Input
              placeholder="Search groups by name, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Group selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Group</label>
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading groups...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? "No groups found" : "No available groups"}
              </div>
            ) : (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group.name}</span>
                        <div className="flex items-center gap-2 ml-4">
                          {group.type && (
                            <Badge variant="outline" className="text-xs">
                              {group.type}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {group._count.members} members
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="co-leader">Co-Leader</SelectItem>
                <SelectItem value="assistant-leader">Assistant Leader</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToGroup}
              disabled={saving || !selectedGroupId}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add to Group
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

