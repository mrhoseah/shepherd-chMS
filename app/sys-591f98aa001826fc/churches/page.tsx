"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Church,
  Building2,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Users,
  DollarSign,
  Crown,
  CheckCircle2,
  XCircle,
  Search,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface ChurchData {
  id: string;
  name: string;
  denomination: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isActive: boolean;
  isSponsored: boolean;
  unlimitedUse: boolean;
  createdAt: string;
  _count: {
    campuses: number;
  };
  subscription?: {
    plan: string;
    status: string;
  };
}

export default function ChurchesPage() {
  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<ChurchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [switchingChurch, setSwitchingChurch] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    denomination: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    timezone: "UTC",
    language: "en",
    currency: "USD",
    isActive: true,
    isSponsored: false,
    unlimitedUse: false,
  });

  useEffect(() => {
    fetchChurches();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = churches.filter(
        (church) =>
          church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          church.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          church.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChurches(filtered);
    } else {
      setFilteredChurches(churches);
    }
  }, [searchQuery, churches]);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/churches");
      if (!response.ok) throw new Error("Failed to fetch churches");
      const data = await response.json();
      setChurches(data);
      setFilteredChurches(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingChurch
        ? `/api/admin/churches/${editingChurch.id}`
        : "/api/admin/churches";
      
      const response = await fetch(url, {
        method: editingChurch ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save church");
      }

      toast({
        title: "Success",
        description: `Church ${editingChurch ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchChurches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (church: ChurchData) => {
    setEditingChurch(church);
    setFormData({
      name: church.name,
      denomination: church.denomination || "",
      email: church.email || "",
      phone: church.phone || "",
      address: "",
      city: church.city || "",
      state: church.state || "",
      zipCode: "",
      country: church.country || "",
      website: "",
      timezone: "UTC",
      language: "en",
      currency: "USD",
      isActive: church.isActive,
      isSponsored: church.isSponsored,
      unlimitedUse: church.unlimitedUse,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this church? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/churches/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete church");

      toast({
        title: "Success",
        description: "Church deleted successfully",
      });

      fetchChurches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManageChurch = async (churchId: string, churchName: string) => {
    setSwitchingChurch(churchId);
    
    try {
      // Switch church context
      const response = await fetch("/api/admin/switch-church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to switch church");
      }

      toast({
        title: "Switched Successfully",
        description: `Now managing ${churchName}`,
      });

      // Small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use window.location for full page reload to ensure cookie is read
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSwitchingChurch(null);
    }
  };

  const toggleChurchStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/churches/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error("Failed to update church status");

      toast({
        title: "Success",
        description: `Church ${!isActive ? "activated" : "deactivated"} successfully`,
      });

      fetchChurches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingChurch(null);
    setFormData({
      name: "",
      denomination: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      website: "",
      timezone: "UTC",
      language: "en",
      currency: "USD",
      isActive: true,
      isSponsored: false,
      unlimitedUse: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const activeChurches = churches.filter((c) => c.isActive).length;
  const sponsoredChurches = churches.filter((c) => c.isSponsored).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Church Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage all churches in the system
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Church
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingChurch ? "Edit Church" : "Add New Church"}
                </DialogTitle>
                <DialogDescription>
                  {editingChurch
                    ? "Update church information"
                    : "Create a new church in the system"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Church Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., East Gate Chapel"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="denomination">Denomination</Label>
                    <Input
                      id="denomination"
                      value={formData.denomination}
                      onChange={(e) =>
                        setFormData({ ...formData, denomination: e.target.value })
                      }
                      placeholder="e.g., Pentecostal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="contact@church.org"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+254..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder="https://church.org"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Region</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="e.g., Kenya"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) =>
                        setFormData({ ...formData, timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) =>
                        setFormData({ ...formData, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Active Status</Label>
                      <p className="text-sm text-gray-500">
                        Church can access the system
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sponsored Account</Label>
                      <p className="text-sm text-gray-500">
                        Free or subsidized account
                      </p>
                    </div>
                    <Switch
                      checked={formData.isSponsored}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isSponsored: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Unlimited Use</Label>
                      <p className="text-sm text-gray-500">
                        No usage limits or restrictions
                      </p>
                    </div>
                    <Switch
                      checked={formData.unlimitedUse}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, unlimitedUse: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingChurch ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingChurch ? "Update Church" : "Create Church"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Churches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Churches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeChurches}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Sponsored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sponsoredChurches}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Inactive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {churches.length - activeChurches}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search churches by name, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Churches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Churches</CardTitle>
          <CardDescription>
            {filteredChurches.length} church{filteredChurches.length !== 1 ? "es" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Church Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Campuses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChurches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No churches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredChurches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Church className="w-4 h-4 text-gray-400" />
                        {church.name}
                        {church.isSponsored && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      {church.denomination && (
                        <p className="text-xs text-gray-500 mt-1">
                          {church.denomination}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {church.email && (
                          <p className="text-gray-600">{church.email}</p>
                        )}
                        {church.phone && (
                          <p className="text-gray-500">{church.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {church.city && church.state
                          ? `${church.city}, ${church.state}`
                          : church.city || church.state || "—"}
                        {church.country && (
                          <p className="text-gray-500">{church.country}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {church._count.campuses} campus
                        {church._count.campuses !== 1 ? "es" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={church.isActive ? "default" : "secondary"}
                          className="w-fit"
                        >
                          {church.isActive ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {church.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {church.unlimitedUse && (
                          <Badge variant="outline" className="w-fit text-xs">
                            Unlimited
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(church.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleManageChurch(church.id, church.name)}
                          disabled={switchingChurch === church.id}
                        >
                          {switchingChurch === church.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Switching...
                            </>
                          ) : (
                            <>
                              <Settings className="w-4 h-4 mr-1" />
                              Manage
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(church)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleChurchStatus(church.id, church.isActive)
                          }
                        >
                          {church.isActive ? (
                            <XCircle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(church.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
