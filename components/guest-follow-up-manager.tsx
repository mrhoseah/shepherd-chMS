"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Mail,
  MessageSquare,
  Phone,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GuestFollowUp {
  id: string;
  type: string;
  method: string;
  subject: string | null;
  content: string;
  scheduledAt: string | null;
  completedAt: string | null;
  status: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  notes: string | null;
  createdAt: string;
}

interface GuestFollowUpManagerProps {
  guestId: string;
  initialFollowUps: GuestFollowUp[];
}

const FOLLOW_UP_TYPES = [
  { value: "WELCOME", label: "Welcome" },
  { value: "THANK_YOU", label: "Thank You" },
  { value: "INVITATION", label: "Invitation" },
  { value: "CHECK_IN", label: "Check In" },
  { value: "PRAYER_REQUEST", label: "Prayer Request" },
  { value: "CONNECTION", label: "Connection" },
  { value: "BAPTISM", label: "Baptism" },
  { value: "OTHER", label: "Other" },
];

const FOLLOW_UP_METHODS = [
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SMS", label: "SMS", icon: MessageSquare },
  { value: "PHONE_CALL", label: "Phone Call", icon: Phone },
  { value: "IN_PERSON", label: "In Person", icon: User },
  { value: "LETTER", label: "Letter", icon: Mail },
  { value: "OTHER", label: "Other", icon: MessageSquare },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-500",
  SCHEDULED: "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
  NO_RESPONSE: "bg-amber-500",
};

export function GuestFollowUpManager({
  guestId,
  initialFollowUps,
}: GuestFollowUpManagerProps) {
  const [followUps, setFollowUps] = useState<GuestFollowUp[]>(initialFollowUps);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [leaders, setLeaders] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [formData, setFormData] = useState({
    type: "WELCOME",
    method: "EMAIL",
    subject: "",
    content: "",
    scheduledAt: "",
    assignedToId: "",
    notes: "",
  });

  // Fetch leaders when dialog opens
  useEffect(() => {
    if (open) {
      fetchLeaders();
    }
  }, [open]);

  const fetchLeaders = async () => {
    setLoadingLeaders(true);
    try {
      const response = await fetch("/api/communications/recipients?type=leaders");
      const data = await response.json();
      setLeaders(data.recipients || []);
    } catch (error) {
      console.error("Error fetching leaders:", error);
    } finally {
      setLoadingLeaders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that leader is assigned for in-person follow-ups
    if (formData.method === "IN_PERSON" && !formData.assignedToId) {
      alert("Please assign a leader for in-person follow-ups");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`/api/guests/${guestId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.scheduledAt || null,
          assignedToId: formData.assignedToId || null,
        }),
      });

      if (response.ok) {
        const newFollowUp = await response.json();
        setFollowUps([newFollowUp, ...followUps]);
        setOpen(false);
        setFormData({
          type: "WELCOME",
          method: "EMAIL",
          subject: "",
          content: "",
          scheduledAt: "",
          assignedToId: "",
          notes: "",
        });
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create follow-up");
      }
    } catch (error) {
      console.error("Error creating follow-up:", error);
      alert("Failed to create follow-up");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (followUpId: string, status: string) => {
    try {
      const response = await fetch(
        `/api/guests/${guestId}/follow-ups/${followUpId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setFollowUps(
          followUps.map((f) => (f.id === followUpId ? updated : f))
        );
      }
    } catch (error) {
      console.error("Error updating follow-up:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Follow-up History</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Follow-up</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLLOW_UP_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="method">Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          method: value,
                          // Clear assignedToId if method is not IN_PERSON
                          assignedToId: value === "IN_PERSON" ? formData.assignedToId : "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLLOW_UP_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Follow-up subject..."
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Follow-up message or notes..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledAt">Scheduled Date (Optional)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledAt: e.target.value })
                    }
                  />
                </div>
                {formData.method === "IN_PERSON" && (
                  <div>
                    <Label htmlFor="assignedToId">Assign Leader (Required for In-Person)</Label>
                    <Select
                      value={formData.assignedToId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assignedToId: value })
                      }
                      disabled={loadingLeaders}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingLeaders ? "Loading leaders..." : "Select a leader"} />
                      </SelectTrigger>
                      <SelectContent>
                        {leaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.firstName} {leader.lastName}
                            {leader.email && ` (${leader.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Follow-up"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {followUps.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUps.map((followUp) => {
                const MethodIcon =
                  FOLLOW_UP_METHODS.find((m) => m.value === followUp.method)
                    ?.icon || MessageSquare;

                return (
                  <TableRow key={followUp.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {
                          FOLLOW_UP_TYPES.find((t) => t.value === followUp.type)
                            ?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MethodIcon className="w-4 h-4 text-gray-400" />
                        <span>
                          {
                            FOLLOW_UP_METHODS.find(
                              (m) => m.value === followUp.method
                            )?.label
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {followUp.subject || "No subject"}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {followUp.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_COLORS[followUp.status] || "bg-gray-500"}
                      >
                        {followUp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {followUp.scheduledAt ? (
                        <div>
                          <p className="text-sm">
                            {new Date(followUp.scheduledAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              followUp.scheduledAt
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm">
                            {followUp.createdBy.firstName}{" "}
                            {followUp.createdBy.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(followUp.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {followUp.status !== "COMPLETED" &&
                          followUp.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusUpdate(followUp.id, "COMPLETED")
                              }
                              title="Mark as completed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No follow-ups recorded yet</p>
            <p className="text-sm mt-1">
              Click "New Follow-up" to create the first follow-up
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

