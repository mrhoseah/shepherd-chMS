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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Permission {
  resource: string;
  action: string;
}

interface RolePermissions {
  [role: string]: Permission[];
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [selectedRole, setSelectedRole] = useState("leader");
  const [newResource, setNewResource] = useState("");
  const [newAction, setNewAction] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

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

  const handleInitialize = async () => {
    setInitializing(true);
    setError(null);
    try {
      const response = await fetch("/api/permissions", {
        method: "PUT",
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Policies initialized successfully!");
        await fetchPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to initialize policies");
      }
    } catch (error) {
      console.error("Error initializing policies:", error);
      setError("Failed to initialize policies");
    } finally {
      setInitializing(false);
    }
  };

  const handleAddPermission = async () => {
    if (!newResource || !newAction) {
      setError("Resource and action are required");
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          resource: newResource,
          action: newAction,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Permission added successfully!");
        setNewResource("");
        setNewAction("");
        await fetchPermissions();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to add permission");
      }
    } catch (error) {
      console.error("Error adding permission:", error);
      setError("Failed to add permission");
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

  const rolePermissions = permissions[selectedRole] || [];

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Role Permissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage permissions for different user roles using Casbin
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

      <Card>
        <CardHeader>
          <CardTitle>Initialize Default Policies</CardTitle>
          <CardDescription>
            Set up default permissions for admin, pastor, and leader roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleInitialize}
            disabled={initializing}
            variant="outline"
          >
            {initializing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Initialize Default Policies
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Role Permissions</CardTitle>
          <CardDescription>
            Add or remove permissions for specific roles
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
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="pastor">Pastor</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resource">Resource</Label>
              <Input
                id="resource"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                placeholder="e.g., groups, users, meetings"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="e.g., create, update, delete, view"
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={handleAddPermission} disabled={adding || !newResource || !newAction}>
            {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Plus className="w-4 h-4 mr-2" />
            Add Permission
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
                        No permissions found for {selectedRole}. Add permissions or initialize default policies.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rolePermissions.map((perm, index) => (
                      <TableRow key={`${perm.resource}-${perm.action}-${index}`}>
                        <TableCell className="font-medium">{perm.resource}</TableCell>
                        <TableCell>{perm.action}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePermission(perm.resource, perm.action)}
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
    </div>
  );
}

