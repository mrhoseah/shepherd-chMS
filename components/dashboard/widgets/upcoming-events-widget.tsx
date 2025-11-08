"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, ArrowRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Event {
  id: string;
  title: string;
  startDate: string;
  location?: string;
  campus?: { name: string };
}

interface UpcomingEventsWidgetProps {
  widgetId: string;
}

export function UpcomingEventsWidget({ widgetId }: UpcomingEventsWidgetProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/upcoming-events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-purple-100/30 transition-colors duration-300" />
      
      {/* Accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-purple-100/80 backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => {
              const eventDate = new Date(event.startDate);
              const dayName = eventDate.toLocaleDateString("en-US", {
                weekday: "short",
              }).toUpperCase();
              const dayNum = eventDate.getDate();
              const monthName = eventDate.toLocaleDateString("en-US", {
                month: "short",
              }).toUpperCase();
              return (
                <div
                  key={event.id}
                  className="group/item flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-200"
                >
                  <div className="p-2.5 rounded-lg text-center font-bold flex-shrink-0 min-w-[60px] bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200/50 shadow-sm group-hover/item:shadow-md transition-shadow">
                    <p className="text-xs leading-tight text-purple-600">{dayName}</p>
                    <p className="text-2xl leading-none text-purple-700 mt-1">{dayNum}</p>
                    <p className="text-[10px] leading-tight text-purple-500 mt-0.5">{monthName}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm mb-1.5 line-clamp-1 group-hover/item:text-purple-700 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{formatTime(eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{event.location || event.campus?.name || "TBD"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Link href="/dashboard/events" className="mt-5 block">
          <Button 
            variant="outline" 
            className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 group/btn transition-all duration-200"
          >
            View Full Calendar
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

