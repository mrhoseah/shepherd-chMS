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
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Users,
  Package,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  description?: string | null;
  leaderId?: string | null;
  leader?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
  isActive: boolean;
  _count: {
    staff: number;
    inventoryItems: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leaderId: "",
    isActive: true,
  });

  useEffect(() => {
    fetchDepartments();
    fetchLeaders();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      const res = await fetch("/api/users?role=LEADER&status=ACTIVE&limit=100");
      const data = await res.json();
      setAvailableLeaders(data.users || []);
    } catch (error) {
      console.error("Error fetching leaders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDepartment
        ? `/api/departments/${editingDepartment.id}`
        : "/api/departments";
      const method = editingDepartment ? "PATCH" : "POST";

      const body = {
        ...formData,
        leaderId: formData.leaderId === "none" || !formData.leaderId ? null : formData.leaderId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        setEditingDepartment(null);
        setFormData({
          name: "",
          description: "",
          leaderId: "",
          isActive: true,
        });
        fetchDepartments();
        alert(
          editingDepartment
            ? "Department updated successfully!"
            : "Department created successfully!"
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save department");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      leaderId: department.leaderId || "none",
      isActive: department.isActive,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDepartments();
        alert("Department deleted successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department");
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query) ||
      dept.leader?.firstName.toLowerCase().includes(query) ||
      dept.leader?.lastName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Departments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage church departments and their leaders
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{ backgroundColor: "#1E40AF" }}
              onClick={() => {
                setEditingDepartment(null);
                setFormData({
                  name: "",
                  description: "",
                  leaderId: "",
                  isActive: true,
                });
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? "Edit Department" : "Create New Department"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name *</Label>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="leaderId">Department Leader</Label>
                <Select
                  value={formData.leaderId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, leaderId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a leader (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.firstName} {leader.lastName}
                        {leader.email && ` (${leader.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isActive: value === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                  {editingDepartment ? "Update" : "Create"} Department
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Departments
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No departments found matching your search"
                        : "No departments found. Create your first department!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/departments/${dept.id}`}
                          className="font-medium hover:underline"
                        >
                          {dept.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {dept.description || "—"}
                      </TableCell>
                      <TableCell>
                        {dept.leader ? (
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <Link
                              href={`/dashboard/users/${dept.leader.id}`}
                              className="hover:underline"
                            >
                              {dept.leader.firstName} {dept.leader.lastName}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Users className="w-3 h-3 mr-1" />
                          {dept._count.staff}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Package className="w-3 h-3 mr-1" />
                          {dept._count.inventoryItems}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={dept.isActive ? "default" : "secondary"}
                        >
                          {dept.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(dept)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(dept.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

