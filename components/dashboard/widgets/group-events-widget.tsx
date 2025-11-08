"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupEvent {
  id: string;
  title: string;
  startDate: string;
  location?: string;
}

interface GroupEventsWidgetProps {
  widgetId: string;
}

export function GroupEventsWidget({ widgetId }: GroupEventsWidgetProps) {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/group-events?limit=5");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching group events:", error);
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

  if (loading) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-orange-100/80 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            Group Events
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-orange-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-orange-100/80 backdrop-blur-sm group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          Group Events
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No upcoming group events</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {events.map((event) => {
              const eventDate = new Date(event.startDate);
              const dayName = eventDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dayNum = eventDate.getDate();
              return (
                <div
                  key={event.id}
                  className="group/item flex items-start space-x-3 p-3 rounded-lg border border-orange-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200"
                >
                  <div className="p-2 rounded-lg text-center font-bold flex-shrink-0 min-w-[50px] bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200/50">
                    <p className="text-xs leading-tight text-orange-600">{dayName}</p>
                    <p className="text-xl leading-none text-orange-700 mt-1">{dayNum}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{event.title}</p>
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{formatTime(eventDate)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Link href="/dashboard/groups/events" className="block">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 group/btn transition-all duration-200"
          >
            View All Events
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

