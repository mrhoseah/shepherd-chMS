"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddFamilyMemberDialogProps {
  userId: string;
  relationship?: "spouse" | "parent" | "child";
}

export function AddFamilyMemberDialog({
  userId,
  relationship: defaultRelationship,
}: AddFamilyMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [relationship, setRelationship] = useState<"spouse" | "parent" | "child">(
    defaultRelationship || "child"
  );
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/people?search=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await res.json();
      setSearchResults(data.people || data.users || []);
    } catch (error) {
      console.error("Error searching members:", error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      alert("Please select a member");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/people/${userId}/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship,
          memberId: selectedMember.id,
        }),
      });

      if (res.ok) {
        setOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedMember(null);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add family member");
      }
    } catch (error) {
      console.error("Error adding family member:", error);
      alert("Failed to add family member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Family Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="relationship">Relationship</Label>
            <Select
              value={relationship}
              onValueChange={(value: "spouse" | "parent" | "child") =>
                setRelationship(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="search">Search Member</Label>
            <Input
              id="search"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedMember?.id === member.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <div className="font-medium">
                    {member.firstName} {member.lastName}
                  </div>
                  {member.email && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {member.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedMember && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Selected: {selectedMember.firstName} {selectedMember.lastName}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedMember || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

