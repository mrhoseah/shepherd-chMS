"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { UserPlus, Users, UserCheck, UserCog, Search, Eye, Edit, Trash2, LogIn, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { QuickGuestCapture } from "@/components/quick-guest-capture";
import { BulkMemberUpload } from "@/components/bulk-member-upload";
import { ResidenceCombobox } from "@/components/residence-combobox";
import { UserPermissionsDialog } from "@/components/user-permissions-dialog";
import { memberTitles, commonProfessions } from "@/lib/titles";
import { MemberLocationFields } from "@/components/member-location-fields";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  title?: string | null;
  residence?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  role: string;
  status: string;
  canLogin?: boolean;
  campus: { id: string; name: string } | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    title: "",
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    profession: "",
    baptismDate: "",
    dedicationDate: "",
    weddingAnniversary: "",
    address: "",
    city: "",
    county: "",
    state: "",
    country: "",
    residence: "",
    zipCode: "",
    role: "GUEST",
    status: "PENDING",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(activeTab !== "all" && { filter: activeTab }),
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, activeTab]);

  const handlePermissionsUpdate = () => {
    fetchUsers(); // Refresh users list after permission update
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      
      // Prepare body with proper date conversions and null handling
      const body: any = {
        ...formData,
        // Convert empty strings to null for optional fields
        title: formData.title || null,
        middleName: formData.middleName || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        profession: formData.profession || null,
        baptismDate: formData.baptismDate ? new Date(formData.baptismDate).toISOString() : null,
        dedicationDate: formData.dedicationDate ? new Date(formData.dedicationDate).toISOString() : null,
        weddingAnniversary: formData.weddingAnniversary ? new Date(formData.weddingAnniversary).toISOString() : null,
        address: formData.address || null,
        city: formData.city || null,
        county: formData.county || null,
        state: formData.state || null,
        country: formData.country || null,
        residence: formData.residence || null,
        zipCode: formData.zipCode || null,
        email: formData.email || null,
        phone: formData.phone || null,
      };

      // Remove password from update requests
      if (editingUser) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setOpen(false);
        setEditingUser(null);
        setFormData({
          email: "",
          phone: "",
          password: "",
          title: "",
          firstName: "",
          lastName: "",
          middleName: "",
          dateOfBirth: "",
          profession: "",
          baptismDate: "",
          dedicationDate: "",
          weddingAnniversary: "",
          address: "",
          city: "",
          county: "",
          state: "",
          country: "",
          residence: "",
          zipCode: "",
          role: "GUEST",
          status: "PENDING",
        });
        fetchUsers();
        alert(editingUser ? "Member updated successfully!" : "Member created successfully!");
      } else {
        alert(data.error || "Failed to save member. Please try again.");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      title: (user as any).title || "",
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: (user as any).middleName || "",
      dateOfBirth: (user as any).dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : "",
      profession: (user as any).profession || "",
      baptismDate: (user as any).baptismDate ? new Date((user as any).baptismDate).toISOString().split('T')[0] : "",
      dedicationDate: (user as any).dedicationDate ? new Date((user as any).dedicationDate).toISOString().split('T')[0] : "",
      weddingAnniversary: (user as any).weddingAnniversary ? new Date((user as any).weddingAnniversary).toISOString().split('T')[0] : "",
      address: (user as any).address || "",
      city: (user as any).city || "",
      county: (user as any).county || "",
      state: (user as any).state || "",
      country: (user as any).country || "",
      residence: (user as any).residence || "",
      zipCode: (user as any).zipCode || "",
      role: user.role,
      status: user.status,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return user.role !== "GUEST"; // Exclude guests from All Members tab
    if (activeTab === "pending") return user.status === "PENDING" && user.role !== "GUEST";
    if (activeTab === "active") return user.status === "ACTIVE" && user.role !== "GUEST";
    if (activeTab === "leaders") return user.role === "LEADER" || user.role === "PASTOR";
    if (activeTab === "guests") return user.role === "GUEST";
    return true;
  });

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage church members and their information</p>
        </div>
        <div className="flex gap-2">
          <QuickGuestCapture />
          <BulkMemberUpload onSuccess={fetchUsers} />
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{ backgroundColor: "#1E40AF" }}
              onClick={() => {
                setEditingUser(null);
        setFormData({
          email: "",
          phone: "",
          password: "",
          title: "",
          firstName: "",
          lastName: "",
          middleName: "",
          dateOfBirth: "",
          profession: "",
          baptismDate: "",
          dedicationDate: "",
          weddingAnniversary: "",
          address: "",
          city: "",
          county: "",
          state: "",
          country: "",
          residence: "",
          zipCode: "",
          role: "GUEST",
          status: "PENDING",
        });
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              New Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit Member" : "Add New Member"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Select
                    value={formData.title || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, title: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberTitles.map((title) => (
                        <SelectItem key={title.value} value={title.value}>
                          {title.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(value) =>
                      setFormData({ ...formData, profession: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonProfessions.map((prof) => (
                        <SelectItem key={prof} value={prof}>
                          {prof}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="baptismDate">Baptism Date</Label>
                  <Input
                    id="baptismDate"
                    type="date"
                    value={formData.baptismDate}
                    onChange={(e) =>
                      setFormData({ ...formData, baptismDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dedicationDate">Dedication Date</Label>
                  <Input
                    id="dedicationDate"
                    type="date"
                    value={formData.dedicationDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dedicationDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="weddingAnniversary">Wedding Anniversary</Label>
                  <Input
                    id="weddingAnniversary"
                    type="date"
                    value={formData.weddingAnniversary}
                    onChange={(e) =>
                      setFormData({ ...formData, weddingAnniversary: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="residence">Residence</Label>
                  <div className="relative">
                    <ResidenceCombobox
                      value={formData.residence}
                      onValueChange={(value) =>
                        setFormData({ ...formData, residence: value })
                      }
                      placeholder="Select or add residence..."
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for automatic group assignment
                  </p>
                </div>
              </div>

              <MemberLocationFields
                country={formData.country}
                state={formData.state}
                county={formData.county}
                zipCode={formData.zipCode}
                onCountryChange={(value) => setFormData({ ...formData, country: value, state: "", county: "" })}
                onStateChange={(value) => setFormData({ ...formData, state: value })}
                onCountyChange={(value) => setFormData({ ...formData, county: value })}
                onZipCodeChange={(value) => setFormData({ ...formData, zipCode: value })}
              />

              {!editingUser && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                    minLength={6}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUEST">Guest</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="LEADER">Leader</SelectItem>
                      <SelectItem value="PASTOR">Pastor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: "#1E40AF" }} disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"} Member
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
            All Members
          </TabsTrigger>
          <TabsTrigger value="active">
            <UserCheck className="w-4 h-4 mr-2" />
            Active
          </TabsTrigger>
          <TabsTrigger value="pending">
            <UserCog className="w-4 h-4 mr-2" />
            Pending Approval
          </TabsTrigger>
          <TabsTrigger value="leaders">
            <UserCheck className="w-4 h-4 mr-2" />
            Leaders
          </TabsTrigger>
          <TabsTrigger value="guests">
            <Users className="w-4 h-4 mr-2" />
            Guests
          </TabsTrigger>
        </TabsList>

        {/* All Members Tab */}
        <TabsContent value="all" className="space-y-4">
          <MemberList
            users={filteredUsers}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPermissionsUpdate={handlePermissionsUpdate}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </TabsContent>

        {/* Active Members Tab */}
        <TabsContent value="active" className="space-y-4">
          <MemberList
            users={filteredUsers}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPermissionsUpdate={handlePermissionsUpdate}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </TabsContent>

        {/* Pending Approval Tab */}
        <TabsContent value="pending" className="space-y-4">
          <MemberList
            users={filteredUsers}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPermissionsUpdate={handlePermissionsUpdate}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </TabsContent>

        {/* Leaders Tab */}
        <TabsContent value="leaders" className="space-y-4">
          <MemberList
            users={filteredUsers}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPermissionsUpdate={handlePermissionsUpdate}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-4">
          <MemberList
            users={filteredUsers}
            loading={loading}
            search={search}
            setSearch={setSearch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPermissionsUpdate={handlePermissionsUpdate}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            isGuestView={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Member List Component
function MemberList({
  users,
  loading,
  search,
  setSearch,
  onEdit,
  onDelete,
  onPermissionsUpdate,
  page,
  totalPages,
  setPage,
  isGuestView = false,
}: {
  users: User[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onPermissionsUpdate: () => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  isGuestView?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isGuestView ? "Guests List" : "Members List"}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={isGuestView ? "Search guests..." : "Search members..."}
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
        ) : users.length > 0 ? (
          <>
            {isGuestView ? (
              // Simplified Guest Table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Residence</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Date Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const fullName = [user.title, user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ");
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {fullName || `${user.firstName} ${user.lastName}`}
                        </TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>{user.residence || "-"}</TableCell>
                        <TableCell>{user.city || "-"}</TableCell>
                        <TableCell>{user.county || "-"}</TableCell>
                        <TableCell>{user.country || "-"}</TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/guests/${user.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              // Full Member Table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login Access</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isAdmin = user.role === "ADMIN";
                    const hasLoginAccess = isAdmin || (user.canLogin && user.status === "ACTIVE");
                    const canGrantAccess = !isAdmin && user.status === "ACTIVE";
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "ACTIVE"
                                ? "default"
                                : user.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <Badge variant="default" className="bg-blue-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            ) : hasLoginAccess ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.campus?.name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {canGrantAccess && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/users/${user.id}/permissions`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ 
                                        canLogin: !user.canLogin,
                                        status: "ACTIVE" // Ensure status is ACTIVE
                                      }),
                                    });
                                    if (response.ok) {
                                      onPermissionsUpdate();
                                    } else {
                                      const data = await response.json();
                                      if (data.requiresStatusChange) {
                                        alert(`Cannot grant access. User status is ${data.currentStatus}. Please set status to ACTIVE first.`);
                                      } else {
                                        alert(data.error || "Failed to update access");
                                      }
                                    }
                                  } catch (error) {
                                    console.error("Error toggling access:", error);
                                    alert("Failed to update access");
                                  }
                                }}
                                title={user.canLogin ? "Revoke access" : "Grant access"}
                              >
                                {user.canLogin ? (
                                  <LogOut className="w-4 h-4 text-red-600" />
                                ) : (
                                  <LogIn className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            )}
                            <UserPermissionsDialog
                              userId={user.id}
                              userName={`${user.firstName} ${user.lastName}`}
                              userRole={user.role}
                              canLogin={user.canLogin || false}
                              userStatus={user.status}
                              onUpdate={onPermissionsUpdate}
                            />
                            <Link href={`/dashboard/users/${user.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{isGuestView ? "No guests found" : "No members found"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
