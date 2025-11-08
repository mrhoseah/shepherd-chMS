"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ResourceBooking {
  id: string;
  resourceName: string;
  eventName: string;
  date: string;
  status: string;
}

interface ResourceBookingWidgetProps {
  widgetId: string;
}

export function ResourceBookingWidget({ widgetId }: ResourceBookingWidgetProps) {
  const [data, setData] = useState<{
    bookings: ResourceBooking[];
    upcomingBookings: number;
    conflicts: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/resource-booking");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching resource bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-teal-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-teal-100/80 backdrop-blur-sm">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            Resource Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-teal-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-teal-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-teal-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-teal-100/80 backdrop-blur-sm group-hover:bg-teal-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          Resource Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-teal-100">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{data.upcomingBookings}</p>
            </div>
            {data.conflicts > 0 && (
              <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-red-100">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Conflicts</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{data.conflicts}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {data.bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-teal-100 hover:border-teal-200 hover:bg-white/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{booking.resourceName}</p>
                    <p className="text-xs text-gray-600">{booking.eventName}</p>
                  </div>
                  <Badge 
                    variant={booking.status === "confirmed" ? "default" : booking.status === "pending" ? "secondary" : "destructive"}
                    className="bg-teal-100 text-teal-700 text-xs flex-shrink-0 ml-2"
                  >
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(booking.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link href="/dashboard/resources" className="block">
          <Button 
            variant="outline" 
            className="w-full border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 group/btn transition-all duration-200"
          >
            Manage Resources
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

