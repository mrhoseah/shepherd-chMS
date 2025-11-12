"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  UserMinus,
  Download,
  QrCode,
  Heart,
  MoreVertical,
  CheckSquare,
  Square,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { exportToCSV } from "@/lib/reports/export";

interface AttendanceCaptureProps {
  type: "session" | "event" | "group";
  referenceId: string;
  referenceName?: string;
  onAttendanceChange?: () => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export function AttendanceCapture({
  type,
  referenceId,
  referenceName,
  onAttendanceChange,
}: AttendanceCaptureProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [attendedUsers, setAttendedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [decisionFormData, setDecisionFormData] = useState({
    title: "",
    category: "MINISTRY",
    notes: "",
    userId: "",
    userName: "",
  });
  const [guestFormData, setGuestFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchAttendedUsers();
  }, [type, referenceId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/people?role=MEMBER&status=ACTIVE");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.people || data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendedUsers = async () => {
    try {
      const response = await fetch(
        `/api/attendance/list?type=${type}&referenceId=${referenceId}`
      );
      if (response.ok) {
        const data = await response.json();
        const userIds = new Set(data.attendees?.map((a: any) => a.userId) || []);
        setAttendedUsers(userIds);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  });

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleMarkAttendance = async () => {
    if (selectedUsers.size === 0) {
      setError("Please select at least one person");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/attendance/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          referenceId,
          userIds: Array.from(selectedUsers),
          checkInMethod: "manual",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      // Update attended users
      const newAttended = new Set(attendedUsers);
      selectedUsers.forEach((id) => newAttended.add(id));
      setAttendedUsers(newAttended);

      // Clear selection
      setSelectedUsers(new Set());

      if (onAttendanceChange) {
        onAttendanceChange();
      }
    } catch (error: any) {
      console.error("Error marking attendance:", error);
      setError(error.message || "Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAttendance = async (userId: string) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/attendance/capture?type=${type}&referenceId=${referenceId}&userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove attendance");
      }

      const newAttended = new Set(attendedUsers);
      newAttended.delete(userId);
      setAttendedUsers(newAttended);

      if (onAttendanceChange) {
        onAttendanceChange();
      }
    } catch (error: any) {
      console.error("Error removing attendance:", error);
      setError(error.message || "Failed to remove attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    const allUserIds = new Set(filteredUsers.map((u) => u.id));
    setSelectedUsers(allUserIds);
  };

  const handleMarkAllAbsent = () => {
    setSelectedUsers(new Set());
  };

  const handleSelectAttended = () => {
    const attended = new Set(attendedUsers);
    setSelectedUsers(attended);
  };

  const handleSelectNotAttended = () => {
    const notAttended = new Set(
      filteredUsers.filter((u) => !attendedUsers.has(u.id)).map((u) => u.id)
    );
    setSelectedUsers(notAttended);
  };

  const handleRecordDecision = async () => {
    if (!decisionFormData.userId || !decisionFormData.title) {
      setError("Please select a person and enter a decision title");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: decisionFormData.title,
          description: `Decision recorded for ${decisionFormData.userName}`,
          category: decisionFormData.category,
          linkedSessionId: type === "session" ? referenceId : null,
          // proposedById will be set by the API to the current session user
          notes: decisionFormData.notes,
          data: {
            personId: decisionFormData.userId,
            personName: decisionFormData.userName,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record decision");
      }

      setDecisionDialogOpen(false);
      setDecisionFormData({
        title: "",
        category: "MINISTRY",
        notes: "",
        userId: "",
        userName: "",
      });
      alert("Decision recorded successfully!");
    } catch (error: any) {
      console.error("Error recording decision:", error);
      setError(error.message || "Failed to record decision");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckInGuest = async () => {
    if (!guestFormData.firstName || !guestFormData.lastName) {
      setError("Please enter guest name");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // First create a guest user
      const userResponse = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: guestFormData.firstName,
          lastName: guestFormData.lastName,
          email: guestFormData.email || null,
          phone: guestFormData.phone || null,
          role: "GUEST",
          status: "ACTIVE",
        }),
      });

      if (!userResponse.ok) {
        const data = await userResponse.json();
        throw new Error(data.error || "Failed to create guest");
      }

      const userData = await userResponse.json();
      const guestId = userData.user?.id || userData.id;

      // Then mark them as present
      const attendanceResponse = await fetch("/api/attendance/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          referenceId,
          userIds: [guestId],
          checkInMethod: "manual",
        }),
      });

      if (!attendanceResponse.ok) {
        const data = await attendanceResponse.json();
        throw new Error(data.error || "Failed to check in guest");
      }

      setGuestDialogOpen(false);
      setGuestFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      });
      fetchUsers();
      fetchAttendedUsers();
      alert("Guest checked in successfully!");
    } catch (error: any) {
      console.error("Error checking in guest:", error);
      setError(error.message || "Failed to check in guest");
    } finally {
      setSaving(false);
    }
  };

  const handleExportAttendance = () => {
    const exportData = {
      headers: ["Name", "Email", "Phone", "Status", "Checked In At"],
      rows: filteredUsers.map((user) => {
        const hasAttended = attendedUsers.has(user.id);
        return [
          `${user.firstName} ${user.lastName}`,
          user.email || "",
          user.phone || "",
          hasAttended ? "Present" : "Absent",
          hasAttended ? format(new Date(), "MMM d, yyyy h:mm a") : "",
        ];
      }),
      title: `Attendance - ${referenceName || "Session"}`,
    };

    // Use the export utility
    exportToCSV(exportData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Capture Attendance
            {referenceName && (
              <Badge variant="outline" className="ml-2">
                {referenceName}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAllPresent}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Mark All Present
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSelectNotAttended}>
                  <Square className="w-4 h-4 mr-2" />
                  Select Not Attended
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportAttendance}>
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
                {type === "session" && (
                  <DropdownMenuItem onClick={() => setDecisionDialogOpen(true)}>
                    <Heart className="w-4 h-4 mr-2" />
                    Record Decision
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Check In Guest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check In Guest</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guestFirstName">First Name *</Label>
                      <Input
                        id="guestFirstName"
                        value={guestFormData.firstName}
                        onChange={(e) =>
                          setGuestFormData({ ...guestFormData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestLastName">Last Name *</Label>
                      <Input
                        id="guestLastName"
                        value={guestFormData.lastName}
                        onChange={(e) =>
                          setGuestFormData({ ...guestFormData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestFormData.email}
                      onChange={(e) =>
                        setGuestFormData({ ...guestFormData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestPhone">Phone</Label>
                    <Input
                      id="guestPhone"
                      value={guestFormData.phone}
                      onChange={(e) =>
                        setGuestFormData({ ...guestFormData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setGuestDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCheckInGuest} disabled={saving}>
                      {saving ? "Checking in..." : "Check In Guest"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm font-medium text-blue-900">
              {selectedUsers.size} person(s) selected
            </span>
            <Button
              size="sm"
              onClick={handleMarkAttendance}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Present
                </>
              )}
            </Button>
          </div>
        )}

        {/* User list */}
        <div className="border rounded-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.has(user.id);
                const hasAttended = attendedUsers.has(user.id);

                return (
                  <div
                    key={user.id}
                    className={`p-3 flex items-center justify-between hover:bg-gray-50 ${
                      hasAttended ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUser(user.id)}
                        disabled={hasAttended}
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.email || user.phone || "No contact info"}
                        </p>
                      </div>
                      {hasAttended && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Present
                        </Badge>
                      )}
                    </div>
                    {hasAttended && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttendance(user.id)}
                        disabled={saving}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
          <span>Total: {users.length}</span>
          <span>Present: {attendedUsers.size}</span>
          <span>Selected: {selectedUsers.size}</span>
        </div>
      </CardContent>

      {/* Decision Recording Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="decisionPerson">Person *</Label>
              <Select
                value={decisionFormData.userId}
                onValueChange={(value) => {
                  const user = users.find((u) => u.id === value);
                  setDecisionFormData({
                    ...decisionFormData,
                    userId: value,
                    userName: user ? `${user.firstName} ${user.lastName}` : "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="decisionTitle">Decision Title *</Label>
              <Input
                id="decisionTitle"
                value={decisionFormData.title}
                onChange={(e) =>
                  setDecisionFormData({ ...decisionFormData, title: e.target.value })
                }
                placeholder="e.g., Salvation Decision, Dedication"
                required
              />
            </div>
            <div>
              <Label htmlFor="decisionCategory">Category</Label>
              <Select
                value={decisionFormData.category}
                onValueChange={(value) =>
                  setDecisionFormData({ ...decisionFormData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINISTRY">Ministry</SelectItem>
                  <SelectItem value="FINANCIAL">Financial</SelectItem>
                  <SelectItem value="STAFFING">Staffing</SelectItem>
                  <SelectItem value="POLICY">Policy</SelectItem>
                  <SelectItem value="STRATEGIC">Strategic</SelectItem>
                  <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  <SelectItem value="FACILITIES">Facilities</SelectItem>
                  <SelectItem value="GOVERNANCE">Governance</SelectItem>
                  <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                  <SelectItem value="OUTREACH">Outreach</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="decisionNotes">Notes</Label>
              <Textarea
                id="decisionNotes"
                value={decisionFormData.notes}
                onChange={(e) =>
                  setDecisionFormData({ ...decisionFormData, notes: e.target.value })
                }
                placeholder="Additional details about this decision..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDecisionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordDecision} disabled={saving}>
                {saving ? "Recording..." : "Record Decision"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

