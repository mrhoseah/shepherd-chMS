"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Crown,
  Building2,
  UsersRound,
  Baby,
  UserCog,
  Mail,
  Phone,
  Briefcase,
  UserCheck,
  X,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Leader {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  profileImage: string | null;
  totalAssignments: number;
  assignments: {
    groups: Array<{
      id: string;
      name: string;
      type: string | null;
      description: string | null;
      memberCount: number;
      assignmentType: string;
    }>;
    departments: Array<{
      id: string;
      name: string;
      description: string | null;
      isActive: boolean;
      memberCount: number;
      assignmentType: string;
    }>;
    childrenClasses: Array<{
      id: string;
      name: string;
      ageRange: string | null;
      capacity: number | null;
      assignmentType: string;
    }>;
    youthGroups: Array<{
      id: string;
      name: string;
      ageRange: string | null;
      description: string | null;
      assignmentType: string;
    }>;
    groupMemberships: Array<{
      id: string;
      name: string;
      type: string | null;
      role: string;
      assignmentType: string;
    }>;
  };
}

export default function LeadersPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaders();
  }, [roleFilter]);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const response = await fetch(`/api/leaders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeaders(data.leaders || []);
      }
    } catch (error) {
      console.error("Error fetching leaders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leaders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery || roleFilter !== "all") {
        fetchLeaders();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredLeaders = leaders.filter((leader) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        leader.name.toLowerCase().includes(query) ||
        leader.email?.toLowerCase().includes(query) ||
        leader.phone?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "PASTOR":
        return "default";
      case "LEADER":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "PASTOR":
        return "Pastor";
      case "LEADER":
        return "Leader";
      default:
        return role;
    }
  };

  const handleViewDetails = (leader: Leader) => {
    setSelectedLeader(leader);
    setDetailsOpen(true);
  };

  const handleRevokeLeadership = async (
    leaderId: string,
    assignmentType: string,
    assignmentId: string,
    assignmentName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to remove this leader from ${assignmentName}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/leaders/${leaderId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentType,
          assignmentId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Leadership assignment revoked successfully",
        });
        // Refresh leaders list
        fetchLeaders();
        // Close details dialog if open and refresh selected leader
        if (selectedLeader?.id === leaderId) {
          // Refresh the selected leader data
          const updatedLeaders = await fetch(`/api/leaders`).then((r) => r.json());
          const updatedLeader = updatedLeaders.leaders?.find((l: Leader) => l.id === leaderId);
          if (updatedLeader) {
            setSelectedLeader(updatedLeader);
          }
        }
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to revoke leadership",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error revoking leadership:", error);
      toast({
        title: "Error",
        description: "Failed to revoke leadership",
        variant: "destructive",
      });
    }
  };

  const allAssignments = selectedLeader
    ? [
        ...selectedLeader.assignments.groups.map((a) => ({ ...a, category: "Group" })),
        ...selectedLeader.assignments.departments.map((a) => ({ ...a, category: "Department" })),
        ...selectedLeader.assignments.childrenClasses.map((a) => ({ ...a, category: "Children Class" })),
        ...selectedLeader.assignments.youthGroups.map((a) => ({ ...a, category: "Youth Group" })),
        ...selectedLeader.assignments.groupMemberships.map((a) => ({ ...a, category: "Group Member Leader" })),
      ]
    : [];

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-8 h-8" />
            Leaders
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage church leaders and their assignments
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search leaders by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="PASTOR">Pastor</SelectItem>
            <SelectItem value="LEADER">Leader</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Leaders</p>
                <p className="text-2xl font-bold">{leaders.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pastors</p>
                <p className="text-2xl font-bold">
                  {leaders.filter((l) => l.role === "PASTOR").length}
                </p>
              </div>
              <UserCog className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leaders</p>
                <p className="text-2xl font-bold">
                  {leaders.filter((l) => l.role === "LEADER").length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">With Assignments</p>
                <p className="text-2xl font-bold">
                  {leaders.filter((l) => l.totalAssignments > 0).length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaders List */}
      {loading ? (
        <div className="text-center py-8">Loading leaders...</div>
      ) : filteredLeaders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No leaders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeaders.map((leader) => (
            <Card key={leader.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{leader.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getRoleBadgeVariant(leader.role)}>
                        {getRoleLabel(leader.role)}
                      </Badge>
                      {leader.totalAssignments > 0 && (
                        <Badge variant="outline">
                          {leader.totalAssignments} {leader.totalAssignments === 1 ? "Assignment" : "Assignments"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {leader.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{leader.email}</span>
                    </div>
                  )}
                  {leader.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{leader.phone}</span>
                    </div>
                  )}
                </div>
                
                {/* Quick Assignment Summary */}
                {leader.totalAssignments > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1">
                    {leader.assignments.groups.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <UsersRound className="w-3 h-3" />
                        <span>{leader.assignments.groups.length} {leader.assignments.groups.length === 1 ? "Group" : "Groups"}</span>
                      </div>
                    )}
                    {leader.assignments.departments.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Building2 className="w-3 h-3" />
                        <span>{leader.assignments.departments.length} {leader.assignments.departments.length === 1 ? "Department" : "Departments"}</span>
                      </div>
                    )}
                    {leader.assignments.childrenClasses.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Baby className="w-3 h-3" />
                        <span>{leader.assignments.childrenClasses.length} {leader.assignments.childrenClasses.length === 1 ? "Children Class" : "Children Classes"}</span>
                      </div>
                    )}
                    {leader.assignments.youthGroups.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{leader.assignments.youthGroups.length} {leader.assignments.youthGroups.length === 1 ? "Youth Group" : "Youth Groups"}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleViewDetails(leader)}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  View All Assignments
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leader Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              {selectedLeader?.name}
            </DialogTitle>
            <DialogDescription>
              Leader assignments and details
            </DialogDescription>
          </DialogHeader>

          {selectedLeader && (
            <div className="space-y-6">
              {/* Leader Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leader Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(selectedLeader.role)}>
                      {getRoleLabel(selectedLeader.role)}
                    </Badge>
                    <Badge variant="outline">{selectedLeader.status}</Badge>
                  </div>
                  {selectedLeader.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedLeader.email}</span>
                    </div>
                  )}
                  {selectedLeader.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedLeader.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignments Summary */}
              {allAssignments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Assignment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedLeader.assignments.groups.length > 0 && (
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {selectedLeader.assignments.groups.length}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedLeader.assignments.groups.length === 1 ? "Group" : "Groups"}
                          </p>
                        </div>
                      )}
                      {selectedLeader.assignments.departments.length > 0 && (
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {selectedLeader.assignments.departments.length}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedLeader.assignments.departments.length === 1 ? "Department" : "Departments"}
                          </p>
                        </div>
                      )}
                      {selectedLeader.assignments.childrenClasses.length > 0 && (
                        <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                            {selectedLeader.assignments.childrenClasses.length}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedLeader.assignments.childrenClasses.length === 1 ? "Children Class" : "Children Classes"}
                          </p>
                        </div>
                      )}
                      {selectedLeader.assignments.youthGroups.length > 0 && (
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {selectedLeader.assignments.youthGroups.length}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedLeader.assignments.youthGroups.length === 1 ? "Youth Group" : "Youth Groups"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    All Assignments ({allAssignments.length})
                  </CardTitle>
                  <CardDescription>
                    This leader can lead multiple groups, departments, and ministries simultaneously
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No assignments yet. This leader can be assigned to multiple groups, departments, or ministries.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedLeader.assignments.groups.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <UsersRound className="w-4 h-4" />
                            Groups ({selectedLeader.assignments.groups.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedLeader.assignments.groups.map((group) => (
                              <div
                                key={group.id}
                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{group.name}</p>
                                    {group.type && (
                                      <p className="text-sm text-gray-500">{group.type}</p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                      {group.memberCount} members
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">Primary Leader</Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRevokeLeadership(
                                          selectedLeader.id,
                                          "group",
                                          group.id,
                                          group.name
                                        )
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedLeader.assignments.departments.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Departments ({selectedLeader.assignments.departments.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedLeader.assignments.departments.map((dept) => (
                              <div
                                key={dept.id}
                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{dept.name}</p>
                                    {dept.description && (
                                      <p className="text-sm text-gray-500">{dept.description}</p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                      {dept.memberCount} members
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={dept.isActive ? "default" : "secondary"}>
                                      {dept.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRevokeLeadership(
                                          selectedLeader.id,
                                          "department",
                                          dept.id,
                                          dept.name
                                        )
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedLeader.assignments.childrenClasses.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Baby className="w-4 h-4" />
                            Children Classes ({selectedLeader.assignments.childrenClasses.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedLeader.assignments.childrenClasses.map((cls) => (
                              <div
                                key={cls.id}
                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{cls.name}</p>
                                    {cls.ageRange && (
                                      <p className="text-sm text-gray-500">Ages: {cls.ageRange}</p>
                                    )}
                                    {cls.capacity && (
                                      <p className="text-sm text-gray-500">Capacity: {cls.capacity}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRevokeLeadership(
                                        selectedLeader.id,
                                        "childrenClass",
                                        cls.id,
                                        cls.name
                                      )
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedLeader.assignments.youthGroups.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Youth Groups ({selectedLeader.assignments.youthGroups.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedLeader.assignments.youthGroups.map((yg) => (
                              <div
                                key={yg.id}
                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{yg.name}</p>
                                    {yg.ageRange && (
                                      <p className="text-sm text-gray-500">Ages: {yg.ageRange}</p>
                                    )}
                                    {yg.description && (
                                      <p className="text-sm text-gray-500">{yg.description}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRevokeLeadership(
                                        selectedLeader.id,
                                        "youthGroup",
                                        yg.id,
                                        yg.name
                                      )
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedLeader.assignments.groupMemberships.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <UsersRound className="w-4 h-4" />
                            Group Member Leader ({selectedLeader.assignments.groupMemberships.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedLeader.assignments.groupMemberships.map((gm) => (
                              <div
                                key={gm.id}
                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{gm.name}</p>
                                    {gm.type && (
                                      <p className="text-sm text-gray-500">{gm.type}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{gm.role}</Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRevokeLeadership(
                                          selectedLeader.id,
                                          "groupMembership",
                                          gm.id,
                                          gm.name
                                        )
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

