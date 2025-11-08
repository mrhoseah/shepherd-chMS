"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search,
  Crown,
  UserCheck,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  leader?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  members: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    };
    role: string;
    isLeader: boolean;
  }>;
  _count: {
    members: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [assignLeaderOpen, setAssignLeaderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedLeaderId, setSelectedLeaderId] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      setGroup(data.group);
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async (search: string = "") => {
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(search)}&limit=50`);
      const data = await res.json();
      // Filter out members already in this group
      const memberIds = new Set(group?.members.map((m) => m.user.id) || []);
      const available = data.users.filter((u: User) => !memberIds.has(u.id));
      setAvailableMembers(available);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      alert("Please select a member");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMemberId,
          role: memberRole,
        }),
      });

      if (res.ok) {
        setAddMemberOpen(false);
        setSelectedMemberId("");
        setMemberRole("member");
        fetchGroup();
        alert("Member added successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the group?")) return;

    try {
      const res = await fetch(`/api/groups/${groupId}/members?userId=${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchGroup();
        alert("Member removed successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  const handleAssignLeader = async () => {
    if (!selectedLeaderId) {
      alert("Please select a leader");
      return;
    }

    setSaving(true);
    try {
      // First, add as member if not already
      const isMember = group?.members.some((m) => m.user.id === selectedLeaderId);
      if (!isMember) {
        await fetch(`/api/groups/${groupId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedLeaderId,
            role: "leader",
          }),
        });
      } else {
        // Update existing member to leader
        const member = group?.members.find((m) => m.user.id === selectedLeaderId);
        if (member) {
          await fetch(`/api/groups/${groupId}/members`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              memberId: member.id,
              role: "leader",
            }),
          });
        }
      }

      // Update group leader
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaderId: selectedLeaderId,
        }),
      });

      if (res.ok) {
        setAssignLeaderOpen(false);
        setSelectedLeaderId("");
        fetchGroup();
        alert("Leader assigned successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to assign leader");
      }
    } catch (error) {
      console.error("Error assigning leader:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = group?.members.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.user.firstName.toLowerCase().includes(query) ||
      member.user.lastName.toLowerCase().includes(query) ||
      member.user.email?.toLowerCase().includes(query) ||
      member.user.phone?.toLowerCase().includes(query)
    );
  }) || [];

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="text-center py-12">
          <p className="text-gray-500">Group not found</p>
          <Button onClick={() => router.push("/dashboard/groups")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/groups")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {group.name}
              </h1>
              {group.type && (
                <Badge variant="outline">{group.type}</Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-5 h-5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{group.description || "No description available"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {group.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {group.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignLeaderOpen} onOpenChange={setAssignLeaderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Crown className="w-4 h-4 mr-2" />
                Assign Leader
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Group Leader</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="leaderSearch">Search Members</Label>
                  <Input
                    id="leaderSearch"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchAvailableMembers(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="leaderSelect">Select Leader</Label>
                  <Select
                    value={selectedLeaderId}
                    onValueChange={setSelectedLeaderId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a leader" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                          {member.email && ` (${member.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAssignLeaderOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignLeader}
                    disabled={saving || !selectedLeaderId}
                    style={{ backgroundColor: "#1E40AF" }}
                  >
                    {saving ? "Assigning..." : "Assign Leader"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: "#1E40AF" }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member to Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="memberSearch">Search Members</Label>
                  <Input
                    id="memberSearch"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchAvailableMembers(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="memberSelect">Select Member</Label>
                  <Select
                    value={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                          {member.email && ` (${member.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={memberRole} onValueChange={setMemberRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="co-leader">Co-Leader</SelectItem>
                      <SelectItem value="assistant-leader">Assistant Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddMemberOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    disabled={saving || !selectedMemberId}
                    style={{ backgroundColor: "#1E40AF" }}
                  >
                    {saving ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({group._count.members})
              </CardTitle>
              {group.leader && (
                <CardDescription className="mt-1">
                  Leader: {group.leader.firstName} {group.leader.lastName}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No members found matching your search" : "No members in this group"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {member.isLeader && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        <Link
                          href={`/dashboard/users/${member.user.id}`}
                          className="font-medium hover:underline"
                        >
                          {member.user.firstName} {member.user.lastName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{member.user.email || "—"}</TableCell>
                    <TableCell>{member.user.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.isLeader ? "default" : "secondary"}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

