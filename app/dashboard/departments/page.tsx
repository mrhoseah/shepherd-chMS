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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Users,
  Package,
  Crown,
  Plus,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

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
  leadershipAssignments?: LeadershipAssignment[];
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

interface InventoryItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  sku?: string | null;
  quantity: number;
  unit?: string | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  unitCost?: number | null;
  location?: string | null;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  supplier?: string | null;
  isActive: boolean;
}

const categories = [
  "furniture",
  "electronics",
  "equipment",
  "vehicles",
  "appliances",
  "fixtures",
  "other",
];

export default function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
  const [leadershipDialogOpen, setLeadershipDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [leadershipAssignments, setLeadershipAssignments] = useState<LeadershipAssignment[]>([]);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leadershipFormData, setLeadershipFormData] = useState({
    userId: "",
    title: "",
    isPrimary: false,
    displayOrder: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leaderId: "",
    isActive: true,
  });
  const [itemFormData, setItemFormData] = useState({
    name: "",
    description: "",
    category: "",
    sku: "",
    quantity: "0",
    unit: "",
    minQuantity: "",
    maxQuantity: "",
    unitCost: "",
    location: "",
    departmentId: "",
    supplier: "",
    notes: "",
    isActive: true,
  });
  const [transactionData, setTransactionData] = useState({
    type: "IN",
    quantity: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchDepartments();
    fetchLeaders();
  }, []);

  useEffect(() => {
    if (activeTab === "inventory") {
      fetchItems();
    }
  }, [activeTab, categoryFilter, departmentFilter]);

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

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (departmentFilter && departmentFilter !== "all") params.append("departmentId", departmentFilter);
      params.append("isActive", "true");

      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      // Fetch all leaders (ADMIN, PASTOR, LEADER roles)
      const res = await fetch("/api/leaders?limit=100");
      const data = await res.json();
      if (data.leaders) {
        setAvailableLeaders(
          data.leaders.map((l: any) => ({
            id: l.id,
            firstName: l.firstName,
            lastName: l.lastName,
            email: l.email,
            phone: l.phone,
          }))
        );
      } else {
        // Fallback to people API
        const peopleRes = await fetch("/api/people?role=LEADER&status=ACTIVE&limit=100");
        const peopleData = await peopleRes.json();
        setAvailableLeaders(peopleData.people || peopleData.users || []);
      }
    } catch (error) {
      console.error("Error fetching leaders:", error);
    }
  };

  const fetchLeadershipAssignments = async (departmentId: string) => {
    try {
      const res = await fetch(
        `/api/leadership-assignments?entityType=DEPARTMENT&entityId=${departmentId}`
      );
      const data = await res.json();
      setLeadershipAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching leadership assignments:", error);
    }
  };

  const handleManageLeaders = (department: Department) => {
    setSelectedDepartment(department);
    setLeadershipDialogOpen(true);
    fetchLeadershipAssignments(department.id);
    setLeadershipFormData({
      userId: "",
      title: "",
      isPrimary: false,
      displayOrder: 0,
    });
  };

  const handleAddLeadership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment || !leadershipFormData.userId || !leadershipFormData.title) {
      alert("Please select a leader and enter a title");
      return;
    }

    try {
      const res = await fetch("/api/leadership-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: leadershipFormData.userId,
          entityType: "DEPARTMENT",
          entityId: selectedDepartment.id,
          title: leadershipFormData.title,
          isPrimary: leadershipFormData.isPrimary,
          displayOrder: leadershipFormData.displayOrder,
        }),
      });

      if (res.ok) {
        fetchLeadershipAssignments(selectedDepartment.id);
        fetchDepartments(); // Refresh departments list
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

      if (res.ok && selectedDepartment) {
        fetchLeadershipAssignments(selectedDepartment.id);
        fetchDepartments(); // Refresh departments list
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

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `/api/inventory/${editingItem.id}`
        : "/api/inventory";
      const method = editingItem ? "PATCH" : "POST";

      const body = {
        ...itemFormData,
        quantity: parseInt(itemFormData.quantity) || 0,
        minQuantity: itemFormData.minQuantity ? parseInt(itemFormData.minQuantity) : null,
        maxQuantity: itemFormData.maxQuantity ? parseInt(itemFormData.maxQuantity) : null,
        unitCost: itemFormData.unitCost ? parseFloat(itemFormData.unitCost) : null,
        departmentId: itemFormData.departmentId === "none" || !itemFormData.departmentId ? null : itemFormData.departmentId,
        sku: itemFormData.sku || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setItemOpen(false);
        setEditingItem(null);
        setItemFormData({
          name: "",
          description: "",
          category: "",
          sku: "",
          quantity: "0",
          unit: "",
          minQuantity: "",
          maxQuantity: "",
          unitCost: "",
          location: "",
          departmentId: "",
          supplier: "",
          notes: "",
          isActive: true,
        });
        fetchItems();
        alert(
          editingItem
            ? "Property item updated successfully!"
            : "Property item added successfully!"
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save inventory item");
      }
    } catch (error) {
      console.error("Error saving inventory item:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transactionData,
          quantity: parseInt(transactionData.quantity),
        }),
      });

      if (res.ok) {
        setTransactionOpen(false);
        setSelectedItem(null);
        setTransactionData({
          type: "IN",
          quantity: "",
          reason: "",
          notes: "",
        });
        fetchItems();
        alert("Transaction recorded successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to record transaction");
      }
    } catch (error) {
      console.error("Error recording transaction:", error);
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

  const handleItemEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || "",
      category: item.category,
      sku: item.sku || "",
      quantity: item.quantity.toString(),
      unit: item.unit || "",
      minQuantity: item.minQuantity?.toString() || "",
      maxQuantity: item.maxQuantity?.toString() || "",
      unitCost: item.unitCost?.toString() || "",
      location: item.location || "",
      departmentId: item.departmentId || "none",
      supplier: item.supplier || "",
      notes: "",
      isActive: item.isActive,
    });
    setItemOpen(true);
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

  const handleItemDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property item?")) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
        alert("Property item deleted successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete inventory item");
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      alert("Failed to delete inventory item");
    }
  };

  const getAvailabilityStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { color: "secondary", icon: Package, text: "Not Available" };
    }
    return { color: "default", icon: Package, text: "Available" };
  };

  const filteredDepartments = departments.filter((dept) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesName = dept.name.toLowerCase().includes(query);
    const matchesDescription = dept.description?.toLowerCase().includes(query);
    const matchesLegacyLeader =
      dept.leader?.firstName.toLowerCase().includes(query) ||
      dept.leader?.lastName.toLowerCase().includes(query);
    const matchesLeadershipAssignments =
      dept.leadershipAssignments?.some(
        (assignment) =>
          assignment.user.firstName.toLowerCase().includes(query) ||
          assignment.user.lastName.toLowerCase().includes(query) ||
          assignment.title.toLowerCase().includes(query)
      ) || false;

    return (
      matchesName ||
      matchesDescription ||
      matchesLegacyLeader ||
      matchesLeadershipAssignments
    );
  });

  const filteredItems = items.filter((item) => {
    if (itemSearchQuery) {
      const query = itemSearchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(query) &&
        !item.description?.toLowerCase().includes(query) &&
        !item.sku?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Departments & Property
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage church departments and property/assets
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Property & Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center justify-end">
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
                            {dept.leadershipAssignments && dept.leadershipAssignments.length > 0 ? (
                              <div className="space-y-1">
                                {dept.leadershipAssignments.map((assignment) => (
                                  <div key={assignment.id} className="flex items-center gap-2">
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                    <span className="text-sm">
                                      <span className="font-medium">
                                        {assignment.user.firstName} {assignment.user.lastName}
                                      </span>
                                      <span className="text-gray-500 ml-1">
                                        ({assignment.title})
                                      </span>
                                      {assignment.isPrimary && (
                                        <Badge variant="default" className="ml-1 text-xs">
                                          Primary
                                        </Badge>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : dept.leader ? (
                              <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                <Link
                                  href={`/dashboard/people/${dept.leader.id}`}
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
                                onClick={() => handleManageLeaders(dept)}
                                title="Manage Leaders"
                              >
                                <Crown className="w-4 h-4" />
                              </Button>
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
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center justify-end">
            <Dialog open={itemOpen} onOpenChange={setItemOpen}>
              <DialogTrigger asChild>
                <Button
                  style={{ backgroundColor: "#1E40AF" }}
                  onClick={() => {
                    setEditingItem(null);
                    setItemFormData({
                      name: "",
                      description: "",
                      category: "",
                      sku: "",
                      quantity: "0",
                      unit: "",
                      minQuantity: "",
                      maxQuantity: "",
                      unitCost: "",
                      location: "",
                      departmentId: "",
                      supplier: "",
                      notes: "",
                      isActive: true,
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Property Item" : "Add New Property Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemName">Item Name *</Label>
                      <Input
                        id="itemName"
                        value={itemFormData.name}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemCategory">Category *</Label>
                      <Select
                        value={itemFormData.category}
                        onValueChange={(value) =>
                          setItemFormData({ ...itemFormData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="itemDescription">Description</Label>
                    <Textarea
                      id="itemDescription"
                      value={itemFormData.description}
                      onChange={(e) =>
                        setItemFormData({ ...itemFormData, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemSku">Serial Number / Asset ID</Label>
                      <Input
                        id="itemSku"
                        value={itemFormData.sku}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, sku: e.target.value })
                        }
                        placeholder="e.g., SN12345, Asset-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemQuantity">Quantity *</Label>
                      <Input
                        id="itemQuantity"
                        type="number"
                        min="0"
                        value={itemFormData.quantity}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, quantity: e.target.value })
                        }
                        required
                        placeholder="Number of items"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemUnit">Unit</Label>
                      <Input
                        id="itemUnit"
                        value={itemFormData.unit}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, unit: e.target.value })
                        }
                        placeholder="e.g., pieces, units, sets"
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemUnitCost">Purchase Cost (Optional)</Label>
                      <Input
                        id="itemUnitCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemFormData.unitCost}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, unitCost: e.target.value })
                        }
                        placeholder="Original purchase price"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemDepartmentId">Department</Label>
                      <Select
                        value={itemFormData.departmentId}
                        onValueChange={(value) =>
                          setItemFormData({ ...itemFormData, departmentId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="itemLocation">Location</Label>
                      <Input
                        id="itemLocation"
                        value={itemFormData.location}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, location: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="itemSupplier">Vendor/Purchased From</Label>
                    <Input
                      id="itemSupplier"
                      value={itemFormData.supplier}
                      onChange={(e) =>
                        setItemFormData({ ...itemFormData, supplier: e.target.value })
                      }
                      placeholder="e.g., Store name, Donor name"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setItemOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                      {editingItem ? "Update" : "Create"} Item
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
                  <Package className="w-5 h-5" />
                  Church Property & Assets
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      setCategoryFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={departmentFilter}
                    onValueChange={(value) => {
                      setDepartmentFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Serial/ID</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          {itemSearchQuery
                            ? "No items found matching your search"
                            : "No property items found. Add your first church property item!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const status = getAvailabilityStatus(item);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Link
                                href={`/dashboard/inventory/${item.id}`}
                                className="font-medium hover:underline"
                              >
                                {item.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>{item.sku || "—"}</TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {item.quantity} {item.unit || "item(s)"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {item.department ? (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-gray-400" />
                                  <Link
                                    href={`/dashboard/departments/${item.department.id}`}
                                    className="hover:underline"
                                  >
                                    {item.department.name}
                                  </Link>
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{item.location || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={status.color as any}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.text}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setTransactionData({
                                      type: "IN",
                                      quantity: "",
                                      reason: "",
                                      notes: "",
                                    });
                                    setTransactionOpen(true);
                                  }}
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleItemEdit(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleItemDelete(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Transaction Dialog */}
          <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Record Transaction - {selectedItem?.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <Label htmlFor="transactionType">Transaction Type *</Label>
                  <Select
                    value={transactionData.type}
                    onValueChange={(value) =>
                      setTransactionData({ ...transactionData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">
                        <TrendingUp className="w-4 h-4 mr-2 inline" />
                        Restock (IN)
                      </SelectItem>
                      <SelectItem value="OUT">
                        <TrendingDown className="w-4 h-4 mr-2 inline" />
                        Usage (OUT)
                      </SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transactionQuantity">Quantity *</Label>
                  <Input
                    id="transactionQuantity"
                    type="number"
                    min="1"
                    value={transactionData.quantity}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        quantity: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={transactionData.reason}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, reason: e.target.value })
                    }
                    placeholder="e.g., Restock, Event usage, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="transactionNotes">Notes</Label>
                  <Textarea
                    id="transactionNotes"
                    value={transactionData.notes}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTransactionOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" style={{ backgroundColor: "#1E40AF" }}>
                    Record Transaction
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Leadership Management Dialog */}
      <Dialog open={leadershipDialogOpen} onOpenChange={setLeadershipDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Leaders - {selectedDepartment?.name}
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
                  <Label htmlFor="leaderSearch">Search Leaders</Label>
                  <Input
                    id="leaderSearch"
                    placeholder="Search by name or email"
                    value={leaderSearch}
                    onChange={(e) => setLeaderSearch(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="leaderSelect">Select Leader *</Label>
                  <Select
                    value={leadershipFormData.userId}
                    onValueChange={(value) =>
                      setLeadershipFormData({ ...leadershipFormData, userId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a leader" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLeaders
                        .filter((leader) => {
                          const inUse = leadershipAssignments.some((a) => a.user.id === leader.id);
                          if (inUse) return false;
                          if (!leaderSearch) return true;
                          const q = leaderSearch.toLowerCase();
                          const name = `${leader.firstName} ${leader.lastName}`.toLowerCase();
                          const email = (leader.email || "").toLowerCase();
                          return name.includes(q) || email.includes(q);
                        })
                        .map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.firstName} {leader.lastName}
                            {leader.email && ` (${leader.email})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Leadership Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Director, Assistant Director, Coordinator"
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
                    Examples: Director, Assistant Director, Coordinator, Ministry Leader
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
