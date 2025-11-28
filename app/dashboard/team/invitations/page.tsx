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
import {
  UserPlus,
  Mail,
  Loader2,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  Shield,
  Eye,
  Edit,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  invitationType: string;
  status: string;
  message: string | null;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

const roleIcons: Record<string, any> = {
  ADMIN: Crown,
  EDITOR: Edit,
  VIEWER: Eye,
  SYSTEM_ADMIN: Shield,
  SYSTEM_SUPPORT: Shield,
};

const roleDescriptions: Record<string, string> = {
  ADMIN: "Full access to manage church settings, members, and all features",
  EDITOR: "Can create and edit content, members, events (no settings or finance)",
  VIEWER: "Read-only access to view church data and reports",
  PASTOR: "Pastor-level access with ministry management",
  LEADER: "Ministry leader with group management",
  FINANCE: "Financial management and reporting access",
};

export default function ChurchInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "VIEWER",
    message: "",
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invitations/church");
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const data = await response.json();
      setInvitations(data);
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
      const response = await fetch("/api/invitations/church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${formData.email}`,
      });

      setDialogOpen(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "VIEWER",
        message: "",
      });
      fetchInvitations();
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

  const handleResend = async (id: string) => {
    try {
      const response = await fetch(`/api/invitations/${id}/resend`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to resend invitation");

      toast({
        title: "Success",
        description: "Invitation resent successfully",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to cancel invitation");

      toast({
        title: "Success",
        description: "Invitation cancelled",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const canInviteRole = (role: string) => {
    // Only ADMIN can invite other ADMINs, EDITORs, and VIEWERs
    return session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pendingCount = invitations.filter((i) => i.status === "PENDING").length;
  const acceptedCount = invitations.filter((i) => i.status === "ACCEPTED").length;
  const expiredCount = invitations.filter((i) => i.status === "EXPIRED").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="w-8 h-8" />
            Team Invitations
          </h1>
          <p className="text-gray-500 mt-1">
            Invite admins, editors, and viewers to your church
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canInviteRole("ADMIN")}>
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your church team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="email@example.com"
                  />
                </div>

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
                  <Label htmlFor="role">Role *</Label>
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
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Admin</p>
                            <p className="text-xs text-gray-500">
                              Full church management
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="EDITOR">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Editor</p>
                            <p className="text-xs text-gray-500">
                              Edit content and members
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Viewer</p>
                            <p className="text-xs text-gray-500">Read-only access</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="PASTOR">Pastor</SelectItem>
                      <SelectItem value="LEADER">Leader</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                  {roleDescriptions[formData.role] && (
                    <p className="text-sm text-gray-500">
                      {roleDescriptions[formData.role]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Add a personal message to the invitation..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {acceptedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{expiredCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sent Invitations</CardTitle>
          <CardDescription>
            Manage pending and completed invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invitee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No invitations sent yet
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invitation) => {
                  const RoleIcon = roleIcons[invitation.role] || Shield;
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invitation.firstName} {invitation.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{invitation.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <RoleIcon className="w-3 h-3" />
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invitation.status === "PENDING" && (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                        {invitation.status === "ACCEPTED" && (
                          <Badge className="bg-green-500 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Accepted
                          </Badge>
                        )}
                        {invitation.status === "EXPIRED" && (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Expired
                          </Badge>
                        )}
                        {invitation.status === "CANCELLED" && (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Cancelled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {invitation.invitedBy
                          ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invitation.status === "PENDING" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResend(invitation.id)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(invitation.id)}
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
