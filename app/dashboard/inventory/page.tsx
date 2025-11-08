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
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Building2,
} from "lucide-react";
import Link from "next/link";

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

interface Department {
  id: string;
  name: string;
}

const categories = [
  "equipment",
  "supplies",
  "materials",
  "furniture",
  "electronics",
  "vehicles",
  "other",
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [formData, setFormData] = useState({
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
    fetchItems();
    fetchDepartments();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem
        ? `/api/inventory/${editingItem.id}`
        : "/api/inventory";
      const method = editingItem ? "PATCH" : "POST";

      const body = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : null,
        maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : null,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
        departmentId: formData.departmentId === "none" || !formData.departmentId ? null : formData.departmentId,
        sku: formData.sku || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        setEditingItem(null);
        setFormData({
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
            ? "Inventory item updated successfully!"
            : "Inventory item created successfully!"
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

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
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
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
        alert("Inventory item deleted successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete inventory item");
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      alert("Failed to delete inventory item");
    }
  };

  const getQuantityStatus = (item: InventoryItem) => {
    if (item.minQuantity && item.quantity <= item.minQuantity) {
      return { color: "destructive", icon: AlertTriangle, text: "Low Stock" };
    }
    if (item.maxQuantity && item.quantity >= item.maxQuantity) {
      return { color: "default", icon: TrendingUp, text: "Full Stock" };
    }
    return { color: "secondary", icon: Package, text: "In Stock" };
  };

  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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
            Inventory
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage church inventory and track items
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{ backgroundColor: "#1E40AF" }}
              onClick={() => {
                setEditingItem(null);
                setFormData({
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
                {editingItem ? "Edit Inventory Item" : "Create New Inventory Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="e.g., pieces, boxes, kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minQuantity">Min Quantity</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="0"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxQuantity">Max Quantity</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min="0"
                    value={formData.maxQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, maxQuantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="unitCost">Unit Cost</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) =>
                      setFormData({ ...formData, unitCost: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value })
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
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
              All Inventory Items
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  fetchItems();
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
                  fetchItems();
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
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No items found matching your search"
                        : "No inventory items found. Create your first item!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const status = getQuantityStatus(item);
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {item.quantity} {item.unit || ""}
                            </span>
                            {item.minQuantity && item.quantity <= item.minQuantity && (
                              <StatusIcon className="w-4 h-4 text-red-500" />
                            )}
                          </div>
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
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
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
    </div>
  );
}

