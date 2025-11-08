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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Home, Church, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Rotation {
  id: string;
  locationType: "member-house" | "church" | "other";
  memberId?: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    address?: string;
    residence?: string;
  };
  locationName?: string;
  address?: string;
  month: number;
  year: number;
  notes?: string;
  isActive: boolean;
}

interface GroupRotationManagerProps {
  groupId: string;
  groupName: string;
}

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function GroupRotationManager({ groupId, groupName }: GroupRotationManagerProps) {
  const [open, setOpen] = useState(false);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    locationType: "member-house" as "member-house" | "church" | "other",
    memberId: "",
    locationName: "",
    address: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchRotations();
      fetchMembers();
    }
  }, [open, selectedYear]);

  const fetchRotations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/rotations?year=${selectedYear}`);
      const data = await response.json();
      if (response.ok) {
        setRotations(data.rotations || []);
      }
    } catch (error) {
      console.error("Error fetching rotations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`);
      const data = await response.json();
      if (response.ok) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingRotation
        ? `/api/groups/${groupId}/rotations/${editingRotation.id}`
        : `/api/groups/${groupId}/rotations`;
      const method = editingRotation ? "PATCH" : "POST";

      const body: any = {
        locationType: formData.locationType,
        month: formData.month,
        year: formData.year,
        notes: formData.notes || null,
      };

      if (formData.locationType === "member-house") {
        body.memberId = formData.memberId;
      } else if (formData.locationType === "other") {
        body.locationName = formData.locationName;
        body.address = formData.address || null;
      } else if (formData.locationType === "church") {
        body.locationName = "Church";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingRotation(null);
        setFormData({
          locationType: "member-house",
          memberId: "",
          locationName: "",
          address: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          notes: "",
        });
        fetchRotations();
        alert(editingRotation ? "Rotation updated successfully!" : "Rotation created successfully!");
      } else {
        alert(data.error || "Failed to save rotation");
      }
    } catch (error) {
      console.error("Error saving rotation:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rotationId: string) => {
    if (!confirm("Are you sure you want to delete this rotation?")) return;

    try {
      const response = await fetch(`/api/groups/${groupId}/rotations/${rotationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRotations();
        alert("Rotation deleted successfully!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete rotation");
      }
    } catch (error) {
      console.error("Error deleting rotation:", error);
      alert("Failed to delete rotation");
    }
  };

  const handleEdit = (rotation: Rotation) => {
    setEditingRotation(rotation);
    setFormData({
      locationType: rotation.locationType,
      memberId: rotation.memberId || "",
      locationName: rotation.locationName || "",
      address: rotation.address || "",
      month: rotation.month,
      year: rotation.year,
      notes: rotation.notes || "",
    });
  };

  const getLocationDisplay = (rotation: Rotation) => {
    if (rotation.locationType === "member-house" && rotation.member) {
      return `${rotation.member.firstName} ${rotation.member.lastName}'s House`;
    } else if (rotation.locationType === "church") {
      return "Church";
    } else {
      return rotation.locationName || "Other Location";
    }
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case "member-house":
        return <Home className="w-4 h-4" />;
      case "church":
        return <Church className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Manage Rotations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meeting Location Rotations - {groupName}</DialogTitle>
          <DialogDescription>
            Assign monthly meeting locations. Multiple groups can share the same location for combined meetings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Year Selector */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 1 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditingRotation(null);
                setFormData({
                  locationType: "member-house",
                  memberId: "",
                  locationName: "",
                  address: "",
                  month: new Date().getMonth() + 1,
                  year: selectedYear,
                  notes: "",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rotation
            </Button>
          </div>

          {/* Rotation Form */}
          {(editingRotation !== null || formData.month) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingRotation ? "Edit Rotation" : "Add New Rotation"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="month">Month</Label>
                      <Select
                        value={formData.month.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, month: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({ ...formData, year: parseInt(e.target.value) })
                        }
                        min={2020}
                        max={2100}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="locationType">Location Type</Label>
                    <Select
                      value={formData.locationType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, locationType: value, memberId: "", locationName: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member-house">Member House</SelectItem>
                        <SelectItem value="church">Church</SelectItem>
                        <SelectItem value="other">Other Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.locationType === "member-house" && (
                    <div>
                      <Label htmlFor="memberId">Member</Label>
                      <Select
                        value={formData.memberId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, memberId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.user.id} value={member.user.id}>
                              {member.user.firstName} {member.user.lastName}
                              {member.user.residence && ` (${member.user.residence})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.locationType === "other" && (
                    <>
                      <div>
                        <Label htmlFor="locationName">Location Name</Label>
                        <Input
                          id="locationName"
                          value={formData.locationName}
                          onChange={(e) =>
                            setFormData({ ...formData, locationName: e.target.value })
                          }
                          placeholder="e.g., Community Center, Park"
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
                          placeholder="Full address"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Any additional notes about this location"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingRotation(null);
                        setFormData({
                          locationType: "member-house",
                          memberId: "",
                          locationName: "",
                          address: "",
                          month: new Date().getMonth() + 1,
                          year: selectedYear,
                          notes: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading
                        ? "Saving..."
                        : editingRotation
                        ? "Update"
                        : "Create"}
                      Rotation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Rotations List */}
          <Card>
            <CardHeader>
              <CardTitle>Rotations for {selectedYear}</CardTitle>
              <CardDescription>
                Monthly meeting location assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : rotations.length > 0 ? (
                <div className="space-y-2">
                  {months.map((month) => {
                    const rotation = rotations.find(
                      (r) => r.month === month.value && r.year === selectedYear
                    );
                    return (
                      <div
                        key={month.value}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            {rotation
                              ? getLocationIcon(rotation.locationType)
                              : <Calendar className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium">{month.label}</div>
                            {rotation ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {getLocationDisplay(rotation)}
                                {rotation.member?.address && (
                                  <span className="ml-2">• {rotation.member.address}</span>
                                )}
                                {rotation.address && (
                                  <span className="ml-2">• {rotation.address}</span>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">Not assigned</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {rotation && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(rotation)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(rotation.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {!rotation && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormData({
                                  locationType: "member-house",
                                  memberId: "",
                                  locationName: "",
                                  address: "",
                                  month: month.value,
                                  year: selectedYear,
                                  notes: "",
                                });
                                setEditingRotation(null);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No rotations assigned for {selectedYear}. Click "Add Rotation" to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

