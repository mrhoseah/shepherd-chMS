"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EventRegistration {
  id: string;
  eventTitle: string;
  registered: number;
  capacity: number;
  status: string;
}

interface EventRegistrationsWidgetProps {
  widgetId: string;
}

export function EventRegistrationsWidget({ widgetId }: EventRegistrationsWidgetProps) {
  const [data, setData] = useState<{
    events: EventRegistration[];
    totalRegistrations: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/event-registrations");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching event registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-orange-100/80 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            Event Registrations
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
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
          Event Registrations
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-orange-100 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Registrations</span>
              <span className="text-2xl font-bold text-orange-600">{data.totalRegistrations}</span>
            </div>
          </div>
          <div className="space-y-3">
            {data.events.slice(0, 4).map((event) => {
              const percentage = event.capacity > 0 
                ? Math.round((event.registered / event.capacity) * 100)
                : 0;
              return (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-orange-100 hover:border-orange-200 hover:bg-white/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 flex-1">{event.eventTitle}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0 ml-2">
                      <Users className="w-3 h-3" />
                      <span>{event.registered}/{event.capacity}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        percentage >= 90 ? "bg-red-500" : percentage >= 70 ? "bg-amber-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage}% filled</p>
                </div>
              );
            })}
          </div>
        </div>
        <Link href="/dashboard/events/registrations" className="block">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 group/btn transition-all duration-200"
          >
            Manage Registrations
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

