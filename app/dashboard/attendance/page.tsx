"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AttendanceCapture } from "@/components/attendance/attendance-capture";
import {
  Calendar,
  Users,
  Loader2,
  Plus,
  Clock,
  MapPin,
  Building,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface MasterEvent {
  id: string;
  name: string;
  type: "SERVICE" | "GROUP" | "EVENT" | "MEETING" | "FELLOWSHIP" | "TRAINING" | "OUTREACH" | "OTHER";
  description: string | null;
  campus: { id: string; name: string } | null;
  group: { id: string; name: string } | null;
  defaultStartTime: string | null;
  defaultDuration: number | null;
  isRecurring: boolean;
}

interface AttendanceSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  name: string | null;
  location: string | null;
  isJointService: boolean;
  masterEvent: {
    id: string;
    name: string;
    type: string;
    campus: { id: string; name: string } | null;
  };
  _count: {
    attendees: number;
    decisions: number;
  };
}

export default function AttendancePage() {
  const [masterEvents, setMasterEvents] = useState<MasterEvent[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [selectedMasterEventId, setSelectedMasterEventId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [masterEventDialogOpen, setMasterEventDialogOpen] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    name: "",
    location: "",
    isJointService: false,
  });
  const [masterEventFormData, setMasterEventFormData] = useState({
    name: "",
    type: "SERVICE" as const,
    description: "",
    campusId: "",
    defaultStartTime: "",
    defaultDuration: "",
    isRecurring: true,
  });

  useEffect(() => {
    fetchMasterEvents();
  }, []);

  useEffect(() => {
    if (selectedMasterEventId) {
      fetchAttendanceSessions();
    }
  }, [selectedMasterEventId]);

  const fetchMasterEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/master-events?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setMasterEvents(data.masterEvents || []);
        if (data.masterEvents && data.masterEvents.length > 0) {
          setSelectedMasterEventId(data.masterEvents[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching master events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSessions = async () => {
    if (!selectedMasterEventId) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const response = await fetch(
        `/api/attendance-sessions?masterEventId=${selectedMasterEventId}&startDate=${today.toISOString()}&endDate=${nextWeek.toISOString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
        } else {
          setSelectedSessionId("");
        }
      }
    } catch (error) {
      console.error("Error fetching attendance sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedMasterEventId) {
      alert("Please select a master event first");
      return;
    }

    try {
      const selectedMasterEvent = masterEvents.find((e) => e.id === selectedMasterEventId);
      const defaultStartTime = selectedMasterEvent?.defaultStartTime || "09:00";
      
      // Combine date and time
      const startDateTime = new Date(`${sessionFormData.date}T${sessionFormData.startTime || defaultStartTime}`);
      const endDateTime = sessionFormData.endTime 
        ? new Date(`${sessionFormData.date}T${sessionFormData.endTime}`)
        : null;

      const response = await fetch("/api/attendance-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterEventId: selectedMasterEventId,
          date: sessionFormData.date,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime?.toISOString() || null,
          name: sessionFormData.name || null,
          location: sessionFormData.location || null,
          isJointService: sessionFormData.isJointService,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionDialogOpen(false);
        setSessionFormData({
          date: format(new Date(), "yyyy-MM-dd"),
          startTime: "",
          endTime: "",
          name: "",
          location: "",
          isJointService: false,
        });
        fetchAttendanceSessions();
        // Auto-select the newly created session
        if (data.id) {
          setSelectedSessionId(data.id);
        }
        alert("Attendance session created successfully! QR codes for giving are being generated in the background.");
      } else {
        const data = await response.json();
        const errorMessage = data.error || "Failed to create session";
        console.error("Session creation error:", errorMessage);
        alert(`Error: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      alert(`An error occurred: ${error.message || "Please try again."}`);
    }
  };

  const handleCreateMasterEvent = async () => {
    if (!masterEventFormData.name) {
      alert("Please enter a name for the activity");
      return;
    }

    try {
      const response = await fetch("/api/master-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: masterEventFormData.name.trim(),
          type: masterEventFormData.type,
          description: masterEventFormData.description?.trim() || null,
          campusId: masterEventFormData.campusId && masterEventFormData.campusId !== "" ? masterEventFormData.campusId : null,
          defaultStartTime: masterEventFormData.defaultStartTime && masterEventFormData.defaultStartTime !== "" ? masterEventFormData.defaultStartTime : null,
          defaultDuration: masterEventFormData.defaultDuration && masterEventFormData.defaultDuration !== "" ? parseInt(masterEventFormData.defaultDuration) : null,
          isRecurring: masterEventFormData.isRecurring,
        }),
      });

      // Clone response to read it without consuming
      const responseClone = response.clone();
      let data: any = {};
      
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const responseText = await responseClone.text();
        console.error("Failed to parse response as JSON:", responseText);
        console.error("Response status:", response.status);
        console.error("Response headers:", Object.fromEntries(response.headers.entries()));
        alert(`Failed to create activity. Server returned: ${response.status} ${response.statusText}\n\nResponse: ${responseText.substring(0, 200)}`);
        return;
      }

      if (response.ok) {
        setMasterEventDialogOpen(false);
        setMasterEventFormData({
          name: "",
          type: "SERVICE",
          description: "",
          campusId: "",
          defaultStartTime: "",
          defaultDuration: "",
          isRecurring: true,
        });
        fetchMasterEvents();
        // Auto-select the newly created master event
        // API returns the master event directly, not wrapped
        if (data.id) {
          setSelectedMasterEventId(data.id);
        }
        alert("Activity created successfully!");
      } else {
        const errorMsg = data?.error || `Failed to create activity (${response.status})`;
        const details = data?.details ? `\n\nDetails: ${data.details}` : "";
        const code = data?.code ? `\n\nError Code: ${data.code}` : "";
        
        console.error("Master event creation error:", {
          status: response.status,
          statusText: response.statusText,
          responseText,
          parsedData: data,
          requestBody: {
            name: masterEventFormData.name,
            type: masterEventFormData.type,
            description: masterEventFormData.description,
            campusId: masterEventFormData.campusId,
            defaultStartTime: masterEventFormData.defaultStartTime,
            defaultDuration: masterEventFormData.defaultDuration,
            isRecurring: masterEventFormData.isRecurring,
          },
        });
        
        alert(errorMsg + details + code);
      }
    } catch (error: any) {
      console.error("Error creating master event:", error);
      alert(`An error occurred: ${error.message || "Please try again."}`);
    }
  };

  const selectedMasterEvent = masterEvents.find((e) => e.id === selectedMasterEventId);
  const selectedSession = attendanceSessions.find((s) => s.id === selectedSessionId);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SERVICE":
        return "bg-blue-100 text-blue-800";
      case "GROUP":
        return "bg-green-100 text-green-800";
      case "EVENT":
        return "bg-purple-100 text-purple-800";
      case "MEETING":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Capture Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Record attendance for any church activity using the universal system
          </p>
        </div>
        <Dialog open={masterEventDialogOpen} onOpenChange={setMasterEventDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="masterEventName">Activity Name *</Label>
                <Input
                  id="masterEventName"
                  value={masterEventFormData.name}
                  onChange={(e) =>
                    setMasterEventFormData({ ...masterEventFormData, name: e.target.value })
                  }
                  placeholder="e.g., Sunday Worship (9 AM)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="masterEventType">Activity Type *</Label>
                <Select
                  value={masterEventFormData.type}
                  onValueChange={(value: any) =>
                    setMasterEventFormData({ ...masterEventFormData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="GROUP">Group Meeting</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                    <SelectItem value="TRAINING">Training</SelectItem>
                    <SelectItem value="OUTREACH">Outreach</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="masterEventDescription">Description</Label>
                <Input
                  id="masterEventDescription"
                  value={masterEventFormData.description}
                  onChange={(e) =>
                    setMasterEventFormData({ ...masterEventFormData, description: e.target.value })
                  }
                  placeholder="Brief description of this activity"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultStartTime">Default Start Time</Label>
                  <Input
                    id="defaultStartTime"
                    type="time"
                    value={masterEventFormData.defaultStartTime}
                    onChange={(e) =>
                      setMasterEventFormData({ ...masterEventFormData, defaultStartTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={masterEventFormData.defaultDuration}
                    onChange={(e) =>
                      setMasterEventFormData({ ...masterEventFormData, defaultDuration: e.target.value })
                    }
                    placeholder="e.g., 90"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={masterEventFormData.isRecurring}
                  onChange={(e) =>
                    setMasterEventFormData({ ...masterEventFormData, isRecurring: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="isRecurring">Recurring Activity</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMasterEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMasterEvent}>
                  Create Activity
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Master Event Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : masterEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-gray-500 mb-2">No activities found.</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Create an activity to start capturing attendance.
                  </p>
                  <Button onClick={() => setMasterEventDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Activity
                  </Button>
                </div>
              ) : (
                <>
                  <Select value={selectedMasterEventId} onValueChange={setSelectedMasterEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center gap-2">
                            <span>{event.name}</span>
                            <Badge variant="outline" className={getTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedMasterEvent && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getTypeColor(selectedMasterEvent.type)}>
                          {selectedMasterEvent.type}
                        </Badge>
                        {selectedMasterEvent.campus && (
                          <Badge variant="outline">
                            <Building className="w-3 h-3 mr-1" />
                            {selectedMasterEvent.campus.name}
                          </Badge>
                        )}
                      </div>
                      {selectedMasterEvent.description && (
                        <p className="text-sm text-gray-600">{selectedMasterEvent.description}</p>
                      )}
                      {selectedMasterEvent.defaultStartTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Default: {selectedMasterEvent.defaultStartTime}</span>
                          {selectedMasterEvent.defaultDuration && (
                            <span>({selectedMasterEvent.defaultDuration} min)</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Attendance Sessions List */}
          {selectedMasterEventId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Sessions</CardTitle>
                  <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        New Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Attendance Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={sessionFormData.date}
                            onChange={(e) =>
                              setSessionFormData({ ...sessionFormData, date: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={sessionFormData.startTime}
                              onChange={(e) =>
                                setSessionFormData({ ...sessionFormData, startTime: e.target.value })
                              }
                              placeholder={selectedMasterEvent?.defaultStartTime || "09:00"}
                            />
                          </div>
                          <div>
                            <Label htmlFor="endTime">End Time</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={sessionFormData.endTime}
                              onChange={(e) =>
                                setSessionFormData({ ...sessionFormData, endTime: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="name">Session Name (Optional)</Label>
                          <Input
                            id="name"
                            value={sessionFormData.name}
                            onChange={(e) =>
                              setSessionFormData({ ...sessionFormData, name: e.target.value })
                            }
                            placeholder="Override default name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location (Optional)</Label>
                          <Input
                            id="location"
                            value={sessionFormData.location}
                            onChange={(e) =>
                              setSessionFormData({ ...sessionFormData, location: e.target.value })
                            }
                            placeholder="Specific location for this session"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isJointService"
                            checked={sessionFormData.isJointService}
                            onChange={(e) =>
                              setSessionFormData({ ...sessionFormData, isJointService: e.target.checked })
                            }
                            className="w-4 h-4"
                          />
                          <Label htmlFor="isJointService">Joint Service</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateSession}>
                            Create Session
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : attendanceSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-gray-500 mb-2">No sessions found</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Create a new session to capture attendance
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => setSessionDialogOpen(true)}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendanceSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedSessionId === session.id ? "border-blue-500 bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">
                              {session.name || selectedMasterEvent?.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(session.date), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(session.startTime), "h:mm a")}
                              </span>
                              {session.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {session.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{session._count.attendees}</p>
                            <p className="text-xs text-gray-500">attended</p>
                          </div>
                        </div>
                        {session.isJointService && (
                          <Badge variant="outline" className="mt-2">
                            Joint Service
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Attendance Capture */}
        <div className="lg:col-span-2">
          {selectedSessionId && selectedSession && selectedMasterEvent ? (
            <AttendanceCapture
              type="session"
              referenceId={selectedSessionId}
              referenceName={`${selectedSession.name || selectedMasterEvent.name} - ${format(
                new Date(selectedSession.date),
                "MMM d, yyyy"
              )}`}
            />
          ) : selectedMasterEventId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select or Create a Session
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an existing session from the list or create a new one to start capturing attendance.
                </p>
                <Button onClick={() => setSessionDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select an Activity
                </h3>
                <p className="text-gray-600">
                  Choose an activity from the list to view and create attendance sessions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

