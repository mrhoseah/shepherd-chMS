"use client";

import { useState, useEffect } from "react";
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
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { FullCalendarComponent } from "@/components/calendar/full-calendar";
import { Calendar, List } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  capacity: number | null;
  isPublic: boolean;
  requiresRegistration: boolean;
  isPaid: boolean;
  price: number | null;
  posterUrl: string | null;
  campus: { id: string; name: string } | null;
  _count: { registrations: number; checkIns: number };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps?: {
    type?: string;
    location?: string;
    description?: string;
    status?: string;
  };
}

const getEventColor = (type: string): string => {
  const colors: Record<string, string> = {
    SERVICE: "#3B82F6",
    MEETING: "#10B981",
    CONFERENCE: "#8B5CF6",
    OUTREACH: "#F59E0B",
    SOCIAL: "#EC4899",
    TRAINING: "#06B6D4",
    OTHER: "#6B7280",
  };
  return colors[type] || "#6B7280";
};

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [events, setEvents] = useState<Event[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "OTHER",
    status: "DRAFT",
    startDate: "",
    endDate: "",
    location: "",
    capacity: "",
    isPublic: "true",
    requiresRegistration: "false",
    isPaid: "false",
    price: "",
    posterUrl: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "1000", // Get all events for calendar
        ...(search && { search }),
      });
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      const fetchedEvents = data.events || [];
      
      // Filter events based on type filter
      const filteredEvents = typeFilter && typeFilter !== "all"
        ? fetchedEvents.filter((e: Event) => e.type === typeFilter)
        : fetchedEvents;
      
      setEvents(filteredEvents);
      setTotalPages(data.pagination?.totalPages || 1);

      // Convert to calendar format
      const calEvents: CalendarEvent[] = filteredEvents.map((event: Event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate || event.startDate,
        allDay: false,
        color: getEventColor(event.type),
        extendedProps: {
          type: event.type,
          location: event.location || undefined,
          description: event.description || undefined,
          status: event.status,
        },
      }));
      setCalendarEvents(calEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search, typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          isPublic: formData.isPublic === "true",
          requiresRegistration: formData.requiresRegistration === "true",
          isPaid: formData.isPaid === "true",
        }),
      });

      if (res.ok) {
        setOpen(false);
        setEditingEvent(null);
        setFormData({
          title: "",
          description: "",
          type: "OTHER",
          status: "DRAFT",
          startDate: "",
          endDate: "",
          location: "",
          capacity: "",
          isPublic: "true",
          requiresRegistration: "false",
          isPaid: "false",
          price: "",
          posterUrl: "",
        });
        fetchEvents();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save event");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      type: event.type,
      status: event.status,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().slice(0, 16)
        : "",
      location: event.location || "",
      capacity: event.capacity?.toString() || "",
      isPublic: event.isPublic.toString(),
      requiresRegistration: event.requiresRegistration.toString(),
      isPaid: event.isPaid.toString(),
      price: event.price?.toString() || "",
      posterUrl: event.posterUrl || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    const fullEvent = events.find((e) => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
      setEventDialogOpen(true);
    }
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setFormData({
      ...formData,
      startDate: start.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16),
    });
    setOpen(true);
  };

  const handleEventCreate = async (event: CalendarEvent) => {
    // This will be handled by the form dialog
    return Promise.resolve();
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    const fullEvent = events.find((e) => e.id === event.id);
    if (fullEvent) {
      try {
        const res = await fetch(`/api/events/${fullEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: event.start,
            endDate: event.end || event.start,
          }),
        });
        if (res.ok) {
          fetchEvents();
        }
      } catch (error) {
        console.error("Error updating event:", error);
      }
    }
    return Promise.resolve();
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage church events and activities
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setFormData({
                  title: "",
                  description: "",
                  type: "OTHER",
                  status: "DRAFT",
                  startDate: "",
                  endDate: "",
                  location: "",
                  capacity: "",
                  isPublic: "true",
                  requiresRegistration: "false",
                  isPaid: "false",
                  price: "",
                  posterUrl: "",
                });
              }}
            >
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
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
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="CONFERENCE">Conference</SelectItem>
                      <SelectItem value="OUTREACH">Outreach</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
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
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div>
                <CloudinaryUpload
                  folder="eastgatechapel/events/posters"
                  label="Event Poster"
                  onUploadComplete={(url) =>
                    setFormData({ ...formData, posterUrl: url })
                  }
                  currentImageUrl={formData.posterUrl || null}
                  accept="image/*"
                  maxSizeMB={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="isPublic">Public</Label>
                  <Select
                    value={formData.isPublic}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isPublic: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requiresRegistration">Requires Registration</Label>
                  <Select
                    value={formData.requiresRegistration}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        requiresRegistration: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isPaid">Paid Event</Label>
                  <Select
                    value={formData.isPaid}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isPaid: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="w-4 h-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                    <p className="text-2xl font-bold text-green-600">
                      {events.filter((e) => e.status === "PUBLISHED").length}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {
                        events.filter((e) => {
                          const eventDate = new Date(e.startDate);
                          const now = new Date();
                          return (
                            eventDate.getMonth() === now.getMonth() &&
                            eventDate.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {
                        events.filter((e) => {
                          const eventDate = new Date(e.startDate);
                          return eventDate > new Date();
                        }).length
                      }
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar with Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>Event Calendar</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                      setTypeFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="CONFERENCE">Conference</SelectItem>
                      <SelectItem value="OUTREACH">Outreach</SelectItem>
                      <SelectItem value="SOCIAL">Social</SelectItem>
                      <SelectItem value="TRAINING">Training</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Event Type Legend */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Types:
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { type: "SERVICE", color: "#3B82F6", label: "Service" },
                    { type: "MEETING", color: "#10B981", label: "Meeting" },
                    { type: "CONFERENCE", color: "#F59E0B", label: "Conference" },
                    { type: "OUTREACH", color: "#EF4444", label: "Outreach" },
                    { type: "SOCIAL", color: "#8B5CF6", label: "Social" },
                    { type: "TRAINING", color: "#06B6D4", label: "Training" },
                    { type: "OTHER", color: "#6B7280", label: "Other" },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading calendar...</div>
              ) : (
                <FullCalendarComponent
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                  onDateSelect={handleDateSelect}
                  onEventCreate={handleEventCreate}
                  onEventUpdate={handleEventUpdate}
                  height="600px"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Events</CardTitle>
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Going</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {event.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(event.startDate).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                event.status === "PUBLISHED"
                                  ? "default"
                                  : event.status === "DRAFT"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{event._count.registrations}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(event)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(event.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.posterUrl && (
                <img
                  src={selectedEvent.posterUrl}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedEvent.description || "No description"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge
                    variant={
                      selectedEvent.status === "PUBLISHED"
                        ? "default"
                        : selectedEvent.status === "DRAFT"
                        ? "secondary"
                        : "destructive"
                    }
                    className="mt-1"
                  >
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Start Date</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(selectedEvent.startDate).toLocaleString()}
                  </p>
                </div>
                {selectedEvent.endDate && (
                  <div>
                    <Label className="text-sm font-semibold">End Date</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(selectedEvent.endDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedEvent.location && (
                <div>
                  <Label className="text-sm font-semibold">Location</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEvent.location}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Registrations</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEvent._count.registrations}
                    {selectedEvent.capacity && ` / ${selectedEvent.capacity}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Check-ins</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEvent._count.checkIns}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleEdit(selectedEvent);
                    setEventDialogOpen(false);
                  }}
                >
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEventDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
