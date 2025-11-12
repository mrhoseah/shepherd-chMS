"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FundCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FundCategoriesPage() {
  const [fundCategories, setFundCategories] = useState<FundCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FundCategory | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFundCategories();
  }, []);

  const fetchFundCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/fund-categories");
      const data = await response.json();
      if (response.ok) {
        setFundCategories(data.fundCategories || []);
      } else {
        setError(data.error || "Failed to fetch fund categories");
        toast({
          title: "Error",
          description: data.error || "Failed to fetch fund categories",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching fund categories:", error);
      setError("Failed to fetch fund categories");
      toast({
        title: "Error",
        description: "Failed to fetch fund categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: FundCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        code: category.code,
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCategory
        ? `/api/fund-categories/${editingCategory.id}`
        : "/api/fund-categories";
      const method = editingCategory ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: editingCategory
            ? "Fund category updated successfully"
            : "Fund category created successfully",
        });
        handleCloseDialog();
        fetchFundCategories();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save fund category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving fund category:", error);
      toast({
        title: "Error",
        description: "Failed to save fund category",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fund category? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/fund-categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Fund category deleted successfully",
        });
        fetchFundCategories();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete fund category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting fund category:", error);
      toast({
        title: "Error",
        description: "Failed to delete fund category",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (category: FundCategory) => {
    try {
      const response = await fetch(`/api/fund-categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Fund category ${!category.isActive ? "activated" : "deactivated"}`,
        });
        fetchFundCategories();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update fund category",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling fund category:", error);
      toast({
        title: "Error",
        description: "Failed to update fund category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fund Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage fund categories for group paybill giving
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fund Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Fund Category" : "Create Fund Category"}
              </DialogTitle>
              <DialogDescription>
                Fund categories are used in paybill account numbers (e.g., "GROUP-TTH")
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Fund Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })
                    }
                    placeholder="e.g., TTH, WLFR, BLDG"
                    maxLength={5}
                    required
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    3-5 uppercase alphanumeric characters. Used in account numbers like "GROUP-{formData.code || "CODE"}"
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tithe, Welfare Fund"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of this fund category"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fund Categories</CardTitle>
          <CardDescription>
            Manage fund codes used in M-Pesa Paybill account numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : fundCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No fund categories found</p>
              <p className="text-sm mt-2">Create your first fund category to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                        {category.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                        {category.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            About Fund Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Fund categories are used to categorize donations received via M-Pesa Paybill. Each
            category has a unique code that is combined with a group code to create account numbers.
          </p>
          <p>
            <strong>Example:</strong> If a group has code "JERICHO" and a fund category has code
            "TTH", the account number would be "JERICHO-TTH".
          </p>
          <p>
            Fund codes must be 3-5 uppercase alphanumeric characters and cannot contain the
            delimiter (-).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

