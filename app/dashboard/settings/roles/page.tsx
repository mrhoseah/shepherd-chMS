"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/ui/tag-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Users,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Edit,
  Save,
  X,
  Zap,
  FileText,
  Grid3x3,
  Search,
} from "lucide-react";

interface Permission {
  resource: string;
  action: string;
}

interface RolePermissions {
  [role: string]: Permission[];
}

interface User {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  canLogin: boolean;
}

const AVAILABLE_ROLES = [
  { value: "ADMIN", label: "Admin", description: "Full system access" },
  { value: "PASTOR", label: "Pastor", description: "Pastoral leadership access" },
  { value: "LEADER", label: "Leader", description: "Group/ministry leader access" },
  { value: "MEMBER", label: "Member", description: "Standard member access" },
  { value: "GUEST", label: "Guest", description: "Limited access" },
];

const COMMON_RESOURCES = [
  "users",
  "groups",
  "donations",
  "events",
  "reports",
  "settings",
  "communications",
  "volunteers",
  "inventory",
];

const COMMON_ACTIONS = ["view", "create", "update", "delete", "manage"];

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  baseRole: string;
  permissions: {
    resource: string;
    actions: string[];
  }[];
}

export default function RolesAndPermissionsPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("leader");
  const [newResources, setNewResources] = useState<string[]>([]);
  const [newActions, setNewActions] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState("");
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, Record<string, string[]>>>({});
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (activeTab === "roles") {
      fetchPermissions();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "templates") {
      fetchTemplates();
    } else if (activeTab === "matrix") {
      fetchPermissions().then(() => buildPermissionMatrix());
    }
  }, [activeTab]);

  // Clear tag inputs when role changes
  useEffect(() => {
    setNewResources([]);
    setNewActions([]);
  }, [selectedRole]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (activeTab === "users") {
      setUserPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage, userSearch, activeTab]);

  useEffect(() => {
    if (activeTab === "matrix" && Object.keys(permissions).length > 0) {
      buildPermissionMatrix();
    }
  }, [permissions, activeTab]);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/permissions");
      const data = await response.json();
      if (response.ok) {
        setPermissions(data.permissions || {});
      } else {
        const errorMsg = data.error || "Failed to fetch permissions";
        const details = data.details ? `: ${data.details}` : "";
        setError(`${errorMsg}${details}`);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setError(`Failed to fetch permissions: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: "10",
        ...(userSearch && { search: userSearch }),
      });
      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
        setUserTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/permissions", {
        method: "PUT",
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Default permissions initialized successfully!");
        await fetchPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to initialize permissions");
      }
    } catch (error) {
      console.error("Error initializing permissions:", error);
      setError("Failed to initialize permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (newResources.length === 0 || newActions.length === 0) {
      setError("At least one resource and one action are required");
      return;
    }

    setAdding(true);
    setError(null);
    
    try {
      // Add all combinations of resources and actions
      const permissionsToAdd = [];
      for (const resource of newResources) {
        for (const action of newActions) {
          permissionsToAdd.push({ resource, action });
        }
      }

      // Add permissions one by one (or batch if API supports it)
      let successCount = 0;
      let errorCount = 0;

      for (const perm of permissionsToAdd) {
        try {
          const response = await fetch("/api/permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: selectedRole,
              resource: perm.resource,
              action: perm.action,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully added ${successCount} permission(s)!${errorCount > 0 ? ` (${errorCount} failed)` : ""}`);
        setNewResources([]);
        setNewActions([]);
        await fetchPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to add permissions");
      }
    } catch (error) {
      console.error("Error adding permissions:", error);
      setError("Failed to add permissions");
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePermission = async (resource: string, action: string) => {
    if (!confirm(`Remove permission: ${selectedRole} can ${action} ${resource}?`)) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(
        `/api/permissions?role=${selectedRole}&resource=${resource}&action=${action}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess("Permission removed successfully!");
        await fetchPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to remove permission");
      }
    } catch (error) {
      console.error("Error removing permission:", error);
      setError("Failed to remove permission");
    }
  };

  const handleEditUserRole = (user: User) => {
    setEditingUser(user);
    setUserRole(user.role);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userRole }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("User role updated successfully!");
        setEditingUser(null);
        await fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      setError("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/permissions/templates");
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      } else {
        setError(data.error || "Failed to fetch templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setError("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId: string, roleName: string) => {
    setApplyingTemplate(templateId);
    setError(null);
    try {
      const response = await fetch("/api/permissions/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, roleName }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Template "${templates.find(t => t.id === templateId)?.name}" applied successfully!`);
        await fetchPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to apply template");
      }
    } catch (error) {
      console.error("Error applying template:", error);
      setError("Failed to apply template");
    } finally {
      setApplyingTemplate(null);
    }
  };

  const buildPermissionMatrix = () => {
    const matrix: Record<string, Record<string, string[]>> = {};
    const roles = ["admin", "pastor", "leader", "member", "guest"];
    const resources = COMMON_RESOURCES;

    roles.forEach((role) => {
      matrix[role] = {};
      resources.forEach((resource) => {
        const rolePerms = permissions[role] || [];
        const resourcePerms = rolePerms.filter((p) => p.resource === resource);
        matrix[role][resource] = resourcePerms.map((p) => p.action);
      });
    });

    setPermissionMatrix(matrix);
  };

  const rolePermissions = permissions[selectedRole] || [];
  const roleCounts = AVAILABLE_ROLES.map((role) => ({
    ...role,
    count: users.filter((u) => u.role === role.value).length,
  }));

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Roles & Permissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage user roles and role-based permissions
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">Role Permissions</TabsTrigger>
          <TabsTrigger value="users">User Roles</TabsTrigger>
        </TabsList>

        {/* Role Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Role Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {roleCounts.map((role) => (
              <Card key={role.value}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {role.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {role.count}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Initialize Default Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Initialize Default Policies</CardTitle>
              <CardDescription>
                Set up default permissions for all roles (Admin, Pastor, Leader)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInitialize} disabled={loading} variant="outline">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Initialize Default Permissions
              </Button>
            </CardContent>
          </Card>

          {/* Manage Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Role Permissions</CardTitle>
              <CardDescription>
                Add or remove permissions for specific roles using Casbin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="resources">Resources</Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    Add one or more resources. Press Enter or comma to add each tag.
                  </p>
                  <TagInput
                    value={newResources}
                    onChange={setNewResources}
                    placeholder="Type resource name and press Enter..."
                    suggestions={COMMON_RESOURCES}
                    disabled={adding}
                  />
                </div>
                <div>
                  <Label htmlFor="actions">Actions</Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    Add one or more actions. Press Enter or comma to add each tag.
                  </p>
                  <TagInput
                    value={newActions}
                    onChange={setNewActions}
                    placeholder="Type action name and press Enter..."
                    suggestions={COMMON_ACTIONS}
                    disabled={adding}
                  />
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Note:</strong> All combinations of selected resources and actions will be added as permissions.
                    {newResources.length > 0 && newActions.length > 0 && (
                      <span className="block mt-1">
                        This will create {newResources.length * newActions.length} permission(s).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleAddPermission}
                disabled={adding || newResources.length === 0 || newActions.length === 0}
              >
                {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Plus className="w-4 h-4 mr-2" />
                Add {newResources.length > 0 && newActions.length > 0 ? `${newResources.length * newActions.length} ` : ""}Permission{newResources.length * newActions.length !== 1 ? "s" : ""}
              </Button>

              {loading ? (
                <div className="text-center py-8">Loading permissions...</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rolePermissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                            No permissions found for {selectedRole}. Add permissions or
                            initialize default policies.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rolePermissions.map((perm, index) => (
                          <TableRow key={`${perm.resource}-${perm.action}-${index}`}>
                            <TableCell className="font-medium">
                              <Badge variant="secondary" className="font-normal">
                                {perm.resource}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{perm.action}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePermission(perm.resource, perm.action)}
                                title={`Remove ${perm.action} permission for ${perm.resource}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Role Templates
              </CardTitle>
              <CardDescription>
                Apply preset permission sets for specialized admin roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading templates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs text-gray-500">Base Role</Label>
                          <Badge variant="outline" className="mt-1">
                            {template.baseRole}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Permissions</Label>
                          <div className="mt-2 space-y-1">
                            {template.permissions.slice(0, 3).map((perm, idx) => (
                              <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                {perm.resource}: {perm.actions.join(", ")}
                              </div>
                            ))}
                            {template.permissions.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{template.permissions.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleApplyTemplate(template.id, template.baseRole.toLowerCase())}
                          disabled={applyingTemplate === template.id}
                          className="w-full"
                          variant="outline"
                        >
                          {applyingTemplate === template.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Apply Template
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix Tab */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5" />
                Permission Matrix
              </CardTitle>
              <CardDescription>
                Visual overview of all role permissions across resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading matrix...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role / Resource</TableHead>
                        {COMMON_RESOURCES.map((resource) => (
                          <TableHead key={resource} className="text-center">
                            {resource.charAt(0).toUpperCase() + resource.slice(1)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {["admin", "pastor", "leader", "member", "guest"].map((role) => (
                        <TableRow key={role}>
                          <TableCell className="font-medium capitalize">{role}</TableCell>
                          {COMMON_RESOURCES.map((resource) => {
                            const actions = permissionMatrix[role]?.[resource] || [];
                            return (
                              <TableCell key={resource} className="text-center">
                                {actions.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {actions.map((action) => (
                                      <Badge key={action} variant="outline" className="text-xs">
                                        {action}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage User Roles</CardTitle>
                  <CardDescription>
                    Assign roles to individual users. Admins have full access and cannot be changed.
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <>
                  <div className="border rounded-lg">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Login Access</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email || "-"}</TableCell>
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
                              <Badge
                                variant={user.canLogin ? "default" : "secondary"}
                              >
                                {user.canLogin ? "Enabled" : "Disabled"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {user.role !== "ADMIN" ? (
                                <Dialog
                                  open={editingUser?.id === user.id}
                                  onOpenChange={(open) => !open && setEditingUser(null)}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditUserRole(user)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit User Role</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>User</Label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {user.firstName} {user.lastName} ({user.email})
                                        </p>
                                      </div>
                                      <div>
                                        <Label htmlFor="userRole">Role</Label>
                                        <Select value={userRole} onValueChange={setUserRole}>
                                          <SelectTrigger id="userRole">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {AVAILABLE_ROLES.map((role) => (
                                              <SelectItem key={role.value} value={role.value}>
                                                {role.label} - {role.description}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => setEditingUser(null)}
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          Cancel
                                        </Button>
                                        <Button onClick={handleSaveUserRole} disabled={loading}>
                                          {loading && (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          )}
                                          <Save className="w-4 h-4 mr-2" />
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <Badge variant="default" className="bg-blue-600">
                                  Admin (Protected)
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                  {userTotalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {userPage} of {userTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                        disabled={userPage === userTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

