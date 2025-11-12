"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, UserCheck, Crown } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface MemberPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (userId: string, role?: string) => void;
  excludeUserIds?: string[];
  forLeader?: boolean;
  title?: string;
  description?: string;
  showRoleSelector?: boolean;
  loading?: boolean;
}

export function MemberPicker({
  open,
  onOpenChange,
  onSelect,
  excludeUserIds = [],
  forLeader = false,
  title = "Select Member",
  description,
  showRoleSelector = false,
  loading = false,
}: MemberPickerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    } else {
      // Reset when dialog closes
      setSearchQuery("");
      setSelectedUserId("");
      setSelectedRole("member");
    }
  }, [open]);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/people?search=${encodeURIComponent(searchQuery)}&limit=200`);
      const data = await res.json();
      
      // Filter users
      const excluded = new Set(excludeUserIds);
      const filtered = (data.people || data.users || []).filter((u: User) => {
        // Exclude already selected users
        if (excluded.has(u.id)) return false;
        
        // For leader selection, only allow ADMIN, PASTOR, LEADER, MEMBER
        if (forLeader) {
          const allowedRoles = ["ADMIN", "PASTOR", "LEADER", "MEMBER"];
          return allowedRoles.includes(u.role);
        }
        
        return true;
      });
      
      setUsers(filtered);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, open]);

  const handleSelect = () => {
    if (!selectedUserId) {
      alert("Please select a member");
      return;
    }
    onSelect(selectedUserId, showRoleSelector ? selectedRole : undefined);
    onOpenChange(false);
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role selector */}
          {showRoleSelector && (
            <div>
              <Label>Role</Label>
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
          )}

          {/* User list */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {fetching ? (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? "No users found" : "No users available"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  return (
                    <div
                      key={user.id}
                      className={`p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer ${
                        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => setSelectedUserId(user.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {user.email || user.phone || "No contact info"}
                        </p>
                      </div>
                      {forLeader && (user.role === "ADMIN" || user.role === "PASTOR" || user.role === "LEADER") && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              {filteredUsers.length} user(s) found
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={!selectedUserId || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Select
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

