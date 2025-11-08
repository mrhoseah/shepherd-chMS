"use client";

import { useState, useEffect } from "react";
import { FullCalendarComponent } from "@/components/calendar/full-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

interface EventDetail {
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
  campus: { id: string; name: string } | null;
  _count: { registrations: number; checkIns: number };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    fetchEvents();
    checkGoogleConnection();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events?limit=1000");
      const data = await res.json();
      
      const calendarEvents: CalendarEvent[] = (data.events || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate || event.startDate,
        allDay: false,
        extendedProps: {
          type: event.type,
          location: event.location,
          description: event.description,
          status: event.status,
        },
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const res = await fetch("/api/calendar/google/status");
      if (res.ok) {
        const data = await res.json();
        setGoogleConnected(data.connected || false);
      }
    } catch (error) {
      console.error("Error checking Google connection:", error);
    }
  };

  const handleEventClick = async (event: CalendarEvent) => {
    try {
      const res = await fetch(`/api/events/${event.id}`);
      if (res.ok) {
        const eventDetail: EventDetail = await res.json();
        setSelectedEvent(eventDetail);
        setEventDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  const handleDateSelect = (start: Date, end: Date) => {
    // Could open create event dialog with pre-filled dates
    console.log("Date selected:", start, end);
  };

  const handleEventCreate = async (event: CalendarEvent) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          startDate: event.start,
          endDate: event.end || event.start,
          type: event.extendedProps?.type || "OTHER",
          status: "DRAFT",
        }),
      });

      if (res.ok) {
        await fetchEvents();
      } else {
        throw new Error("Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: event.start,
          endDate: event.end || event.start,
        }),
      });

      if (res.ok) {
        await fetchEvents();
      } else {
        throw new Error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event");
    }
  };

  const handleGoogleSync = async () => {
    try {
      const res = await fetch("/api/calendar/google/auth");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error initiating Google sync:", error);
    }
  };

  const handleExportToGoogle = async () => {
    if (!selectedEvent) return;

    try {
      const res = await fetch("/api/calendar/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
        }),
      });

      if (res.ok) {
        alert("Event synced to Google Calendar successfully!");
      } else {
        throw new Error("Failed to sync event");
      }
    } catch (error) {
      console.error("Error syncing to Google:", error);
      alert("Failed to sync event to Google Calendar");
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="text-center py-12">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View and manage church events and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEvents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {!googleConnected && (
            <Button variant="outline" onClick={handleGoogleSync}>
              <Calendar className="w-4 h-4 mr-2" />
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Component */}
      <FullCalendarComponent
        events={events}
        onEventClick={handleEventClick}
        onDateSelect={handleDateSelect}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        height="800px"
      />

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Event details and information
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{selectedEvent.type}</Badge>
                <Badge
                  variant={
                    selectedEvent.status === "PUBLISHED"
                      ? "default"
                      : selectedEvent.status === "DRAFT"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {selectedEvent.status}
                </Badge>
              </div>

              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Start Date</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedEvent.startDate).toLocaleString()}
                  </p>
                </div>
                {selectedEvent.endDate && (
                  <div>
                    <h3 className="font-semibold mb-2">End Date</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedEvent.endDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedEvent.location && (
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.capacity && (
                  <div>
                    <h3 className="font-semibold mb-2">Capacity</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEvent.capacity} people
                    </p>
                  </div>
                )}
                {selectedEvent.isPaid && selectedEvent.price && (
                  <div>
                    <h3 className="font-semibold mb-2">Price</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ${selectedEvent.price.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Registrations</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent._count.registrations} registered
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Check-ins</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent._count.checkIns} checked in
                  </p>
                </div>
              </div>

              {selectedEvent.campus && (
                <div>
                  <h3 className="font-semibold mb-2">Campus</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.campus.name}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {googleConnected && (
                  <Button variant="outline" onClick={handleExportToGoogle}>
                    <Download className="w-4 h-4 mr-2" />
                    Sync to Google Calendar
                  </Button>
                )}
                <Button onClick={() => setEventDialogOpen(false)}>
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

