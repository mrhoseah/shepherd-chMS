"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserPermissionsDialogProps {
  userId: string;
  userName: string;
  userRole: string;
  canLogin: boolean;
  userStatus?: string;
  onUpdate?: () => void;
}

export function UserPermissionsDialog({
  userId,
  userName,
  userRole,
  canLogin: initialCanLogin,
  userStatus = "ACTIVE",
  onUpdate,
}: UserPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [canLogin, setCanLogin] = useState(initialCanLogin);
  const [status, setStatus] = useState(userStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setCanLogin(initialCanLogin);
    setStatus(userStatus);
  }, [initialCanLogin, userStatus]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation: Can't enable login if status is not ACTIVE
    if (canLogin && status !== "ACTIVE") {
      setError("Cannot grant login access. User status must be ACTIVE. Please set status to ACTIVE first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/people/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          canLogin,
          status: canLogin ? "ACTIVE" : status, // Auto-set to ACTIVE if enabling login
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          if (onUpdate) {
            onUpdate();
          }
        }, 1500);
      } else {
        if (data.requiresStatusChange) {
          setError(`Cannot grant login access. User status is ${data.currentStatus}. Please set status to ACTIVE first.`);
        } else {
          setError(data.error || "Failed to update permissions");
        }
      }
    } catch (error: any) {
      setError("An error occurred. Please try again.");
      console.error("Error updating permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole === "ADMIN";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="w-4 h-4 mr-2" />
          Permissions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Permissions - {userName}</DialogTitle>
          <DialogDescription>
            Control user access to the dashboard and system features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isAdmin && (
            <Alert>
              <AlertDescription>
                Administrators always have full access to the dashboard.
              </AlertDescription>
            </Alert>
          )}

          {status !== "ACTIVE" && !isAdmin && (
            <Alert variant="destructive">
              <AlertDescription>
                User status is {status}. Status must be ACTIVE to grant login access.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canLogin"
                checked={canLogin || isAdmin}
                disabled={isAdmin || loading || status !== "ACTIVE"}
                onCheckedChange={(checked) => setCanLogin(checked as boolean)}
              />
              <Label
                htmlFor="canLogin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow Dashboard Access
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {isAdmin
                ? "Admins always have dashboard access"
                : status !== "ACTIVE"
                ? "User must be ACTIVE to grant login access"
                : userRole === "LEADER"
                ? "Leaders with this permission can access the dashboard and manage their groups"
                : "Users with this permission can access the dashboard"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">User Status</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status}
            </p>
            <p className="text-xs text-gray-500">
              {status !== "ACTIVE" && "Set status to ACTIVE to enable login access"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">User Role</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {userRole}
            </p>
            <p className="text-xs text-gray-500">
              Role-based permissions are managed separately by administrators
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>Permissions updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setCanLogin(initialCanLogin);
                setError(null);
                setSuccess(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || isAdmin}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

