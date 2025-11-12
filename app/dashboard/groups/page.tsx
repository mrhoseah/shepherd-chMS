"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserPlus, Edit, Trash2, ChevronRight, ChevronDown, Building2, Shuffle, Loader2, Crown } from "lucide-react";
import Link from "next/link";
import { GroupRotationManager } from "@/components/group-rotation-manager";
import { LeaderCombobox } from "@/components/groups/leader-combobox";

interface LeadershipAssignment {
  id: string;
  title: string;
  isPrimary: boolean;
  displayOrder: number;
  startDate: string;
  endDate?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    type?: string | null;
  } | null;
  subgroups?: Group[];
  leader?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  leadershipAssignments?: LeadershipAssignment[];
  members?: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    role: string;
    isLeader: boolean;
  }>;
  meetingDay?: string | null;
  meetingTime?: string | null;
  meetingLocation?: string | null;
  useRotation?: boolean;
  _count: {
    members: number;
    subgroups: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [leadershipDialogOpen, setLeadershipDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
  const [leadershipAssignments, setLeadershipAssignments] = useState<LeadershipAssignment[]>([]);
  const [leadershipFormData, setLeadershipFormData] = useState({
    userId: "",
    title: "",
    isPrimary: false,
    displayOrder: 0,
  });
  const [assignFormData, setAssignFormData] = useState({
    groupType: "connect-group",
    maxMembersPerGroup: 15,
    regionField: "residence",
    targetGroupIds: [] as string[],
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    parentId: "",
    leaderId: "",
    campusId: "",
    meetingDay: "",
    meetingTime: "",
    meetingLocation: "",
    useRotation: false,
  });

  useEffect(() => {
    fetchGroups();
    fetchLeaders();
  }, []);

  useEffect(() => {
    if (leadershipDialogOpen && selectedGroup) {
      fetchLeadershipAssignments(selectedGroup.id);
    }
  }, [leadershipDialogOpen, selectedGroup]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups?includeSubgroups=true");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      const res = await fetch("/api/people?excludeRoles=GUEST&status=ACTIVE&limit=200");
      const data = await res.json();
      setAvailableLeaders((data.people || data.users || []).map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
      })));
    } catch (error) {
      console.error("Error fetching leaders:", error);
    }
  };

  const fetchLeadershipAssignments = async (groupId: string) => {
    try {
      const res = await fetch(
        `/api/leadership-assignments?entityType=GROUP&entityId=${groupId}`
      );
      const data = await res.json();
      setLeadershipAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching leadership assignments:", error);
    }
  };

  const handleManageLeaders = (group: Group) => {
    setSelectedGroup(group);
    setLeadershipDialogOpen(true);
    fetchLeadershipAssignments(group.id);
    setLeadershipFormData({
      userId: "",
      title: "",
      isPrimary: false,
      displayOrder: 0,
    });
  };

  const handleAddLeadership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !leadershipFormData.userId || !leadershipFormData.title) {
      alert("Please select a leader and enter a title");
      return;
    }

    try {
      const res = await fetch("/api/leadership-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: leadershipFormData.userId,
          entityType: "GROUP",
          entityId: selectedGroup.id,
          title: leadershipFormData.title,
          isPrimary: leadershipFormData.isPrimary,
          displayOrder: leadershipFormData.displayOrder,
        }),
      });

      if (res.ok) {
        fetchLeadershipAssignments(selectedGroup.id);
        fetchGroups(); // Refresh groups list
        setLeadershipFormData({
          userId: "",
          title: "",
          isPrimary: false,
          displayOrder: 0,
        });
        alert("Leader added successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add leader");
      }
    } catch (error) {
      console.error("Error adding leadership:", error);
      alert("Failed to add leader");
    }
  };

  const handleRemoveLeadership = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to remove this leader?")) return;

    try {
      const res = await fetch(`/api/leadership-assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (res.ok && selectedGroup) {
        fetchLeadershipAssignments(selectedGroup.id);
        fetchGroups(); // Refresh groups list
        alert("Leader removed successfully!");
      } else {
        alert("Failed to remove leader");
      }
    } catch (error) {
      console.error("Error removing leadership:", error);
      alert("Failed to remove leader");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : "/api/groups";
      const method = editingGroup ? "PATCH" : "POST";
      const body = {
        ...formData,
        parentId: formData.parentId && formData.parentId !== "none" ? formData.parentId : null,
        leaderId: formData.leaderId || null,
        campusId: formData.campusId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        setEditingGroup(null);
        setFormData({
          name: "",
          description: "",
          type: "",
          parentId: "",
          leaderId: "",
          campusId: "",
          meetingDay: "",
          meetingTime: "",
          meetingLocation: "",
          useRotation: false,
        });
        fetchGroups();
        alert(editingGroup ? "Group updated successfully!" : "Group created successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save group");
      }
    } catch (error) {
      console.error("Error saving group:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      type: group.type || "",
      parentId: group.parentId || "",
      leaderId: group.leader?.id || "",
      campusId: "",
      meetingDay: group.meetingDay || "",
      meetingTime: group.meetingTime || "",
      meetingLocation: group.meetingLocation || "",
      useRotation: Boolean((group as any).useRotation),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGroups();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    }
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const res = await fetch("/api/groups/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignFormData),
      });

      const data = await res.json();

      if (res.ok) {
        let message = `Successfully assigned ${data.success} members to groups!`;
        if (data.failed > 0) {
          message += `\n${data.failed} assignments failed.`;
        }
        if (data.errors && data.errors.length > 0) {
          message += `\n\nErrors:\n${data.errors.slice(0, 5).join('\n')}`;
          if (data.errors.length > 5) {
            message += `\n... and ${data.errors.length - 5} more errors.`;
          }
        }
        if (data.familyUnitsProcessed) {
          message += `\n\nProcessed ${data.familyUnitsProcessed} family units across ${data.regionsProcessed || 0} regions.`;
        }
        alert(message);
        setAssignDialogOpen(false);
        fetchGroups();
      } else {
        alert(data.error || "Failed to assign members");
      }
    } catch (error: any) {
      console.error("Error assigning members:", error);
      alert(`An error occurred: ${error.message || "Please try again."}`);
    } finally {
      setAssigning(false);
    }
  };

  const renderGroupRow = (group: Group, level: number = 0) => {
    const hasSubgroups = group._count.subgroups > 0;
    const isExpanded = expandedGroups.has(group.id);
    const indent = level * 24;

    return (
      <TableRow key={group.id}>
        <TableCell style={{ paddingLeft: `${16 + indent}px` }}>
          <div className="flex items-center gap-2">
            {hasSubgroups ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleExpand(group.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            <Link
              href={`/dashboard/groups/${group.id}`}
              className="font-medium hover:underline"
            >
              {group.name}
            </Link>
            {group.type && (
              <Badge variant="outline" className="ml-2">
                {group.type}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          {group.parent ? (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {group.parent.name}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell>
          {group.leadershipAssignments && group.leadershipAssignments.length > 0 ? (
            <div className="space-y-1">
              {group.leadershipAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-2 text-sm">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span>
                    <span className="font-medium">
                      {assignment.user.firstName} {assignment.user.lastName}
                    </span>
                    <span className="text-gray-500 ml-1">({assignment.title})</span>
                    {assignment.isPrimary && (
                      <Badge variant="default" className="ml-1 text-xs">Primary</Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : group.leader ? (
            <span className="text-sm">
              {group.leader.firstName} {group.leader.lastName}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{group._count.members} members</Badge>
        </TableCell>
        <TableCell>
          {hasSubgroups && (
            <Badge variant="outline">{group._count.subgroups} subgroups</Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleManageLeaders(group)}
              title="Manage Leaders"
            >
              <Crown className="w-4 h-4" />
            </Button>
            <GroupRotationManager groupId={group.id} groupName={group.name} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(group)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(group.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderGroupsHierarchy = (groups: Group[], level: number = 0) => {
    return groups.map((group) => {
      const rows = [renderGroupRow(group, level)];
      
      if (expandedGroups.has(group.id) && group.subgroups && group.subgroups.length > 0) {
        rows.push(...renderGroupsHierarchy(group.subgroups, level + 1));
      }
      
      return rows;
    }).flat();
  };

  // Get top-level groups (no parent)
  const topLevelGroups = groups.filter((g) => !g.parentId);

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Groups</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage groups, subgroups, and their leaders
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shuffle className="w-4 h-4 mr-2" />
                Auto Assign Members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Automatically Assign Members to Groups</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold mb-2">Assignment Rules</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                    <li>Spouses will be assigned to the same group</li>
                    <li>Family members in the same residence will be grouped together</li>
                    <li>Members are grouped by geographic region</li>
                    <li>Groups will not exceed the maximum member limit</li>
                  </ul>
                </div>

                <div>
                  <Label htmlFor="groupType">Group Type</Label>
                  <Select
                    value={assignFormData.groupType}
                    onValueChange={(value) =>
                      setAssignFormData({ ...assignFormData, groupType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connect-group">Connect Group</SelectItem>
                      <SelectItem value="cell-group">Cell Group</SelectItem>
                      <SelectItem value="small-group">Small Group</SelectItem>
                      <SelectItem value="zone">Zone</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Type of groups to assign members to
                  </p>
                </div>

                <div>
                  <Label htmlFor="regionField">Group By</Label>
                  <Select
                    value={assignFormData.regionField}
                    onValueChange={(value) =>
                      setAssignFormData({ ...assignFormData, regionField: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residence">Residence</SelectItem>
                      <SelectItem value="county">County</SelectItem>
                      <SelectItem value="city">City</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Geographic field to use for grouping members
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Max Members Per Group</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min={5}
                    max={50}
                    value={assignFormData.maxMembersPerGroup}
                    onChange={(e) =>
                      setAssignFormData({
                        ...assignFormData,
                        maxMembersPerGroup: parseInt(e.target.value) || 15,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of members per group (default: 15)
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssignDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAutoAssign}
                    disabled={assigning}
                    style={{ backgroundColor: "#1E40AF" }}
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-4 h-4 mr-2" />
                        Assign Members
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{ backgroundColor: "#1E40AF" }}
              onClick={() => {
                setEditingGroup(null);
                setFormData({
                  name: "",
                  description: "",
                  type: "",
                  parentId: "",
                  leaderId: "",
                  campusId: "",
                  meetingDay: "",
                  meetingTime: "",
                  meetingLocation: "",
                  useRotation: false,
                });
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Group" : "Create New Group"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Group Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zone">Zone</SelectItem>
                    <SelectItem value="connect-group">Connect Group</SelectItem>
                    <SelectItem value="cell-group">Cell Group</SelectItem>
                    <SelectItem value="small-group">Small Group</SelectItem>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="parentId">Parent Group (Optional)</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top-level group)</SelectItem>
                    {groups
                      .filter((g) => !g.parentId && g.id !== editingGroup?.id)
                      .map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name} {g.type && `(${g.type})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent group to create a subgroup (e.g., Zone → Connect Group)
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meetingDay">Meeting Day</Label>
                  <Select
                    value={formData.meetingDay}
                    onValueChange={(value) =>
                      setFormData({ ...formData, meetingDay: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="meetingTime">Meeting Time</Label>
                  <Input
                    id="meetingTime"
                    type="time"
                    value={formData.meetingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="meetingLocation">Default Meeting Location</Label>
                <Input
                  id="meetingLocation"
                  value={formData.meetingLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingLocation: e.target.value })
                  }
                  placeholder="Used if rotation is not enabled"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty if using rotational meeting locations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="useRotation"
                  checked={formData.useRotation ?? false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, useRotation: checked === true })
                  }
                />
                <Label htmlFor="useRotation" className="cursor-pointer">
                  Use rotational meeting locations
                </Label>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Enable monthly rotation between member houses, church, or other locations
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                  {editingGroup ? "Update" : "Create"} Group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent Group</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Subgroups</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLevelGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No groups found. Create your first group!
                    </TableCell>
                  </TableRow>
                ) : (
                  renderGroupsHierarchy(topLevelGroups)
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leadership Management Dialog */}
      <Dialog open={leadershipDialogOpen} onOpenChange={setLeadershipDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Leaders - {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Leaders */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Current Leaders ({leadershipAssignments.length})
              </h3>
              {leadershipAssignments.length === 0 ? (
                <p className="text-gray-500 text-sm">No leaders assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {leadershipAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <div>
                          <p className="font-medium">
                            {assignment.user.firstName} {assignment.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {assignment.title}
                            {assignment.isPrimary && (
                              <Badge variant="default" className="ml-2">
                                Primary
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLeadership(assignment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Leader */}
            <div>
              <h3 className="font-semibold mb-3">Add New Leader</h3>
              <form onSubmit={handleAddLeadership} className="space-y-4">
                <div>
                  <Label htmlFor="leaderSelect">Select Leader *</Label>
                  <LeaderCombobox
                    value={leadershipFormData.userId}
                    onValueChange={(value) =>
                      setLeadershipFormData({ ...leadershipFormData, userId: value })
                    }
                    availableLeaders={availableLeaders}
                    excludeUserIds={leadershipAssignments.map((a) => a.user.id)}
                    placeholder="Choose a leader..."
                  />
                </div>

                <div>
                  <Label htmlFor="title">Leadership Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Group Leader, Co-Leader, Assistant Leader"
                    value={leadershipFormData.title}
                    onChange={(e) =>
                      setLeadershipFormData({
                        ...leadershipFormData,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: Group Leader, Co-Leader, Assistant Leader, Facilitator
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={leadershipFormData.isPrimary}
                      onChange={(e) =>
                        setLeadershipFormData({
                          ...leadershipFormData,
                          isPrimary: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="isPrimary" className="cursor-pointer">
                      Set as Primary Leader
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLeadershipDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                    Add Leader
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

