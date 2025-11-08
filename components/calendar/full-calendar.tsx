"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Calendar, List, Grid } from "lucide-react";

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

interface FullCalendarComponentProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventCreate?: (event: CalendarEvent) => Promise<void>;
  onEventUpdate?: (event: CalendarEvent) => Promise<void>;
  height?: string;
}

export function FullCalendarComponent({
  events,
  onEventClick,
  onDateSelect,
  onEventCreate,
  onEventUpdate,
  height = "auto",
}: FullCalendarComponentProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek" | "listWeek">("dayGridMonth");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    allDay: "false",
    type: "OTHER",
  });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    } else {
      setSelectedRange({ start: selectInfo.start, end: selectInfo.end });
      setNewEvent({
        title: "",
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay ? "true" : "false",
        type: "OTHER",
      });
      setCreateDialogOpen(true);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event: CalendarEvent = {
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      allDay: clickInfo.event.allDay,
      color: clickInfo.event.backgroundColor,
      extendedProps: clickInfo.event.extendedProps,
    };
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleEventCreate = async () => {
    if (!newEvent.title || !newEvent.start) return;

    const event: CalendarEvent = {
      id: `temp-${Date.now()}`,
      title: newEvent.title,
      start: newEvent.start,
      end: newEvent.end || newEvent.start,
      allDay: newEvent.allDay === "true",
      extendedProps: {
        type: newEvent.type,
      },
    };

    if (onEventCreate) {
      await onEventCreate(event);
    }

    setCreateDialogOpen(false);
    setNewEvent({
      title: "",
      start: "",
      end: "",
      allDay: "false",
      type: "OTHER",
    });
  };

  const handleEventDrop = async (info: any) => {
    const event: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      allDay: info.event.allDay,
      color: info.event.backgroundColor,
      extendedProps: info.event.extendedProps,
    };

    if (onEventUpdate) {
      await onEventUpdate(event);
    }
  };

  const changeView = (newView: "dayGridMonth" | "timeGridWeek" | "listWeek") => {
    setView(newView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  const today = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  const prev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
    }
  };

  const next = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
    }
  };

  const calendarEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color || getEventColor(event.extendedProps?.type),
    borderColor: event.color || getEventColor(event.extendedProps?.type),
    extendedProps: event.extendedProps,
  }));

  return (
    <Card>
      <CardContent className="p-6">
        {/* Calendar Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prev}>
              ← Prev
            </Button>
            <Button variant="outline" size="sm" onClick={today}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={next}>
              Next →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={view === "dayGridMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => changeView("dayGridMonth")}
            >
              <Grid className="w-4 h-4 mr-2" />
              Month
            </Button>
            <Button
              variant={view === "timeGridWeek" ? "default" : "outline"}
              size="sm"
              onClick={() => changeView("timeGridWeek")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Week
            </Button>
            <Button
              variant={view === "listWeek" ? "default" : "outline"}
              size="sm"
              onClick={() => changeView("listWeek")}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={view}
            headerToolbar={false}
            height={height}
            events={calendarEvents}
            editable={!!onEventUpdate}
            selectable={!!onDateSelect || !!onEventCreate}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            eventDisplay="block"
            nowIndicator={true}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: "08:00",
              endTime: "18:00",
            }}
          />
        </div>

        {/* Create Event Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-title">Title *</Label>
                <Input
                  id="event-title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="Event title"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-start">Start *</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, start: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event-end">End</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, end: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-type">Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, type: value })
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
                  <Label htmlFor="event-allDay">All Day</Label>
                  <Select
                    value={newEvent.allDay}
                    onValueChange={(value) =>
                      setNewEvent({ ...newEvent, allDay: value })
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
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEventCreate}>Create Event</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function getEventColor(type?: string): string {
  const colors: Record<string, string> = {
    SERVICE: "#3b82f6", // Blue
    MEETING: "#10b981", // Green
    CONFERENCE: "#f59e0b", // Amber
    OUTREACH: "#ef4444", // Red
    SOCIAL: "#8b5cf6", // Purple
    TRAINING: "#06b6d4", // Cyan
    OTHER: "#6b7280", // Gray
  };
  return colors[type || "OTHER"] || colors.OTHER;
}

