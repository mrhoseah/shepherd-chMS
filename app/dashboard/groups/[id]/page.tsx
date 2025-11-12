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
  Download,
  DollarSign,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { MemberPicker } from "@/components/groups/member-picker";
import { LeaderCombobox } from "@/components/groups/leader-combobox";
import { useSession } from "next-auth/react";

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
  groupGivingEnabled?: boolean;
  leader?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  leadershipAssignments?: LeadershipAssignment[];
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
    donations?: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role?: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [canManageGiving, setCanManageGiving] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [leadershipDialogOpen, setLeadershipDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
  const [leadershipAssignments, setLeadershipAssignments] = useState<LeadershipAssignment[]>([]);
  const [memberRole, setMemberRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [leadershipFormData, setLeadershipFormData] = useState({
    userId: "",
    title: "",
    isPrimary: false,
    displayOrder: 0,
  });
  const [groupGivingStats, setGroupGivingStats] = useState<{
    totalAmount: number;
    totalDonations: number;
    thisMonth: number;
  } | null>(null);
  const [updatingGiving, setUpdatingGiving] = useState(false);

  useEffect(() => {
    fetchGroup();
    fetchLeaders();
  }, [groupId]);

  useEffect(() => {
    if (group?.groupGivingEnabled) {
      fetchGroupGivingStats();
    }
  }, [group?.id, group?.groupGivingEnabled]);

  useEffect(() => {
    if (leadershipDialogOpen && group) {
      fetchLeadershipAssignments(group.id);
    }
  }, [leadershipDialogOpen, group]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setGroup(null);
          return;
        }
        throw new Error("Failed to fetch group");
      }
      const data = await res.json();
      // API returns group directly, not wrapped in { group: ... }
      setGroup(data);
      
      // Check if user can manage giving
      if (session?.user) {
        checkGivingPermissions(data);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const checkGivingPermissions = async (groupData: Group) => {
    if (!session?.user) {
      setCanManageGiving(false);
      return;
    }

    try {
      // Get current user info
      const userRes = await fetch("/api/people/me");
      if (userRes.ok) {
        const user = await userRes.json();
        const userId = (session.user as any).id;
        
        // Check if user is admin or pastor
        const isAdminOrPastor = user.role === "ADMIN" || user.role === "PASTOR";
        
        // Check if user is a leader of this group
        const isGroupLeader = groupData.members?.some(
          (m) => m.user.id === userId && (m.isLeader || m.role === "leader" || m.role === "co-leader")
        );
        
        // Check leadership assignments
        const hasLeadershipAssignment = groupData.leadershipAssignments?.some(
          (la) => la.user.id === userId
        );
        
        setCanManageGiving(isAdminOrPastor || isGroupLeader || hasLeadershipAssignment);
      }
    } catch (error) {
      console.error("Error checking giving permissions:", error);
      setCanManageGiving(false);
    }
  };

  const fetchAvailableMembers = async (search: string = "", forLeader: boolean = false) => {
    try {
      const res = await fetch(`/api/people?search=${encodeURIComponent(search)}&limit=100`);
      const data = await res.json();
      // Filter out guests and members already in this group
      const memberIds = new Set(group?.members.map((m) => m.user.id) || []);
      const available = (data.people || data.users || []).filter((u: User) => {
        // Exclude guests for leader assignment (only allow ADMIN, PASTOR, LEADER, MEMBER)
        if (forLeader) {
          const allowedRoles = ["ADMIN", "PASTOR", "LEADER", "MEMBER"];
          if (!allowedRoles.includes(u.role)) return false;
        }
        // Exclude members already in this group
        return !memberIds.has(u.id);
      });
      setAvailableMembers(available);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchGroupGivingStats = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/giving/stats`);
      if (res.ok) {
        const data = await res.json();
        setGroupGivingStats(data);
      }
    } catch (error) {
      console.error("Error fetching group giving stats:", error);
    }
  };

  const handleToggleGroupGiving = async (enabled: boolean) => {
    setUpdatingGiving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupGivingEnabled: enabled }),
      });
      if (res.ok) {
        const updatedGroup = await res.json();
        setGroup({ ...group!, groupGivingEnabled: updatedGroup.groupGivingEnabled });
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update group giving setting");
      }
    } catch (error) {
      console.error("Error updating group giving:", error);
    } finally {
      setUpdatingGiving(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      // Fetch active people excluding guests; groups allow ADMIN, PASTOR, LEADER, MEMBER to be leaders
      const peopleRes = await fetch("/api/people?status=ACTIVE&limit=200&excludeRoles=GUEST");
      const peopleData = await peopleRes.json();
      const allPeople: User[] = (peopleData.people || peopleData.users || []).map((p: any) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email || null,
        phone: p.phone || null,
        role: p.role,
      }));
      const allowed = ["ADMIN", "PASTOR", "LEADER", "MEMBER"];
      setAvailableLeaders(allPeople.filter((u) => !u.role || allowed.includes(u.role)));
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

  const handleManageLeaders = () => {
    setLeadershipDialogOpen(true);
    fetchLeaders();
    if (group) {
      fetchLeadershipAssignments(group.id);
    }
    setLeadershipFormData({
      userId: "",
      title: "",
      isPrimary: false,
      displayOrder: 0,
    });
  };

  const handleAddLeadership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !leadershipFormData.userId || !leadershipFormData.title) {
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
          entityId: group.id,
          title: leadershipFormData.title,
          isPrimary: leadershipFormData.isPrimary,
          displayOrder: leadershipFormData.displayOrder,
        }),
      });

      if (res.ok) {
        fetchLeadershipAssignments(group.id);
        fetchGroup(); // Refresh group data
        setLeadershipFormData({
          userId: "",
          title: "",
          isPrimary: false,
          displayOrder: 0,
        });
        alert("Leader added successfully!");
      } else {
        const data = await res.json();
        if (res.status === 409) {
          alert(data.error || "This leadership assignment already exists for this group.");
        } else if (res.status === 400) {
          alert(data.error || "Invalid input. Please check your selections.");
        } else {
          alert(data.error || "Failed to add leader");
        }
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

      if (res.ok && group) {
        fetchLeadershipAssignments(group.id);
        fetchGroup(); // Refresh group data
        alert("Leader removed successfully!");
      } else {
        alert("Failed to remove leader");
      }
    } catch (error) {
      console.error("Error removing leadership:", error);
      alert("Failed to remove leader");
    }
  };

  const handleAddMember = async (userId: string, role?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: role || memberRole,
        }),
      });

      if (res.ok) {
        setAddMemberOpen(false);
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

  const filteredMembers =
    group?.members.filter((member) => {
      if (!searchQuery) return true;
      const query = searchQuery.trim().toLowerCase();
      const firstName = (member.user.firstName || "").toLowerCase();
      const lastName = (member.user.lastName || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = (member.user.email || "").toLowerCase();
      const phone = String(member.user.phone || "").toLowerCase();
      const role = (member.role || "").toLowerCase();
      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        role.includes(query)
      );
    }) || [];

  const handleExportMembers = () => {
    if (!group || filteredMembers.length === 0) {
      alert("No members to export");
      return;
    }

    // Prepare CSV data
    const headers = ["Name", "Group Name", "Phone Number"];
    const rows = filteredMembers.map((member) => {
      const fullName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim();
      const groupName = group.name || "";
      const phoneNumber = member.user.phone || "";
      
      return [
        fullName,
        groupName,
        phoneNumber,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group.name.replace(/[^a-z0-9]/gi, "_")}_members_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
          <Button
            variant="outline"
            onClick={handleManageLeaders}
          >
            <Crown className="w-4 h-4 mr-2" />
            Manage Leaders
          </Button>

          <MemberPicker
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            onSelect={handleAddMember}
            excludeUserIds={group?.members.map((m) => m.user.id) || []}
            forLeader={false}
            title="Add Member to Group"
            description="Search and select a member to add to this group."
            showRoleSelector={true}
            loading={saving}
          />
          <Button
            onClick={() => setAddMemberOpen(true)}
            style={{ backgroundColor: "#1E40AF" }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
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
              {group.leadershipAssignments && group.leadershipAssignments.length > 0 ? (
                <CardDescription className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {group.leadershipAssignments.map((assignment) => (
                      <span key={assignment.id} className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </span>
                        <span className="text-gray-500">({assignment.title})</span>
                        {assignment.isPrimary && (
                          <Badge variant="default" className="ml-1 text-xs">Primary</Badge>
                        )}
                      </span>
                    ))}
                  </div>
                </CardDescription>
              ) : group.leader ? (
                <CardDescription className="mt-1">
                  Leader: {group.leader.firstName} {group.leader.lastName}
                </CardDescription>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMembers}
                title="Export members to CSV"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Members
              </Button>
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
                          href={`/dashboard/people/${member.user.id}`}
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

      {/* Group Giving Settings & Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Group Giving
          </CardTitle>
          <CardDescription>
            Enable giving for group members and view giving statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Group Giving */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Enable Group Giving</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow group members to make donations associated with this group
              </p>
              {!canManageGiving && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Only group leaders, pastors, or admins can change this setting
                </p>
              )}
            </div>
            <Switch
              checked={group.groupGivingEnabled || false}
              onCheckedChange={handleToggleGroupGiving}
              disabled={updatingGiving || !canManageGiving}
            />
          </div>

          {/* Group Code (for Paybill) */}
          {group.groupGivingEnabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="groupCode" className="text-base font-semibold mb-2 block">
                    Group Code (for Paybill)
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Unique code used in M-Pesa Paybill account numbers (e.g., "ZION", "JERICHO")
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="groupCode"
                      value={group.groupCode || ""}
                      onChange={async (e) => {
                        const newCode = e.target.value.toUpperCase().trim();
                        if (canManageGiving) {
                          try {
                            const res = await fetch(`/api/groups/${groupId}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ groupCode: newCode || null }),
                            });
                            if (res.ok) {
                              const updated = await res.json();
                              setGroup({ ...group, groupCode: updated.groupCode });
                            } else {
                              const error = await res.json();
                              alert(error.error || "Failed to update group code");
                            }
                          } catch (error) {
                            console.error("Error updating group code:", error);
                          }
                        }
                      }}
                      placeholder="e.g., ZION"
                      className="font-mono"
                      disabled={!canManageGiving}
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Must be 3-10 alphanumeric characters, uppercase. Used in account numbers like "{group.groupCode || "GROUP"}-TTH"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          {group.groupGivingEnabled && groupGivingStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Donations
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {groupGivingStats.totalDonations}
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Amount
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  KES {groupGivingStats.totalAmount.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  This Month
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  KES {groupGivingStats.thisMonth.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {group.groupGivingEnabled && !groupGivingStats && (
            <div className="text-center py-4 text-gray-500">
              Loading statistics...
            </div>
          )}

          {!group.groupGivingEnabled && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Enable group giving to see statistics
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leadership Management Dialog */}
      <Dialog open={leadershipDialogOpen} onOpenChange={setLeadershipDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Leaders - {group?.name}
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

