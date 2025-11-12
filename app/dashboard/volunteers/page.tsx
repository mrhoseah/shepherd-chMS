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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, UserPlus, Search, Edit, Trash2, Users, Calendar, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface VolunteerRole {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  isActive: boolean;
}

interface VolunteerAssignment {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  role: VolunteerRole;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  _count: { shifts: number };
}

export default function VolunteersPage() {
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<VolunteerAssignment | null>(null);
  const [editingRole, setEditingRole] = useState<VolunteerRole | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    userId: "",
    roleId: "",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    department: "",
    isActive: "true",
  });

  useEffect(() => {
    fetchAssignments();
    fetchRoles();
    fetchUsers();
  }, [activeTab]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/volunteers/assignments");
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/volunteers/roles");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/people?limit=1000");
      const data = await res.json();
      setUsers(data.people || data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAssignment
        ? `/api/volunteers/assignments/${editingAssignment.id}`
        : "/api/volunteers/assignments";
      const method = editingAssignment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          endDate: formData.endDate || null,
        }),
      });

      if (res.ok) {
        setOpen(false);
        setEditingAssignment(null);
        setFormData({
          userId: "",
          roleId: "",
          status: "active",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          notes: "",
        });
        fetchAssignments();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save assignment");
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert("Failed to save assignment");
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRole
        ? `/api/volunteers/roles/${editingRole.id}`
        : "/api/volunteers/roles";
      const method = editingRole ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...roleFormData,
          isActive: roleFormData.isActive === "true",
        }),
      });

      if (res.ok) {
        setRoleOpen(false);
        setEditingRole(null);
        setRoleFormData({
          name: "",
          description: "",
          department: "",
          isActive: "true",
        });
        fetchRoles();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save role");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Failed to save role");
    }
  };

  const handleEdit = (assignment: VolunteerAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      userId: assignment.user.id,
      roleId: assignment.role.id,
      status: assignment.status,
      startDate: new Date(assignment.startDate).toISOString().split("T")[0],
      endDate: assignment.endDate
        ? new Date(assignment.endDate).toISOString().split("T")[0]
        : "",
      notes: "",
    });
    setOpen(true);
  };

  const handleEditRole = (role: VolunteerRole) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || "",
      department: role.department || "",
      isActive: role.isActive.toString(),
    });
    setRoleOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const res = await fetch(`/api/volunteers/assignments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAssignments();
      } else {
        alert("Failed to delete assignment");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return assignment.status === "active";
    if (activeTab === "inactive") return assignment.status === "inactive";
    if (activeTab === "pending") return assignment.status === "pending";
    return true;
  });

  const filteredBySearch = filteredAssignments.filter((assignment) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      assignment.user.firstName.toLowerCase().includes(searchLower) ||
      assignment.user.lastName.toLowerCase().includes(searchLower) ||
      assignment.role.name.toLowerCase().includes(searchLower) ||
      assignment.role.department?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Volunteers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage volunteer roles and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Handshake className="w-4 h-4 mr-2" />
                Manage Roles
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? "Edit Role" : "Create New Role"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="roleName">Role Name *</Label>
                  <Input
                    id="roleName"
                    value={roleFormData.name}
                    onChange={(e) =>
                      setRoleFormData({ ...roleFormData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="roleDepartment">Department</Label>
                  <Input
                    id="roleDepartment"
                    value={roleFormData.department}
                    onChange={(e) =>
                      setRoleFormData({ ...roleFormData, department: e.target.value })
                    }
                    placeholder="e.g., Worship, Children, Ushering"
                  />
                </div>
                <div>
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    value={roleFormData.description}
                    onChange={(e) =>
                      setRoleFormData({ ...roleFormData, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="roleIsActive">Status</Label>
                  <Select
                    value={roleFormData.isActive}
                    onValueChange={(value) =>
                      setRoleFormData({ ...roleFormData, isActive: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRoleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                    {editingRole ? "Update" : "Create"} Role
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                style={{ backgroundColor: "#1E40AF" }}
                onClick={() => {
                  setEditingAssignment(null);
                  setFormData({
                    userId: "",
                    roleId: "",
                    status: "active",
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: "",
                    notes: "",
                  });
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="userId">Volunteer *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                          {user.email && ` (${user.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roleId">Role *</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, roleId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((role) => role.isActive)
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                            {role.department && ` - ${role.department}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                    {editingAssignment ? "Update" : "Create"} Assignment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <Users className="w-4 h-4 mr-2" />
            All Volunteers
          </TabsTrigger>
          <TabsTrigger value="active">
            <CheckCircle className="w-4 h-4 mr-2" />
            Active
          </TabsTrigger>
          <TabsTrigger value="inactive">
            <Users className="w-4 h-4 mr-2" />
            Inactive
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Calendar className="w-4 h-4 mr-2" />
            Pending
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Volunteer Assignments</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search volunteers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredBySearch.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shifts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBySearch.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.role.name}</Badge>
                        </TableCell>
                        <TableCell>
                          {assignment.role.department || "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === "active"
                                ? "default"
                                : assignment.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{assignment._count.shifts}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(assignment)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(assignment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Handshake className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No volunteers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

