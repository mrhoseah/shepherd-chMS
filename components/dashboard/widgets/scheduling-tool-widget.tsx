"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ScheduleItem {
  id: string;
  eventName: string;
  date: string;
  time: string;
  assigned: number;
  needed: number;
  status: string;
}

interface SchedulingToolWidgetProps {
  widgetId: string;
}

export function SchedulingToolWidget({ widgetId }: SchedulingToolWidgetProps) {
  const [data, setData] = useState<{
    upcomingShifts: ScheduleItem[];
    unfilledShifts: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/scheduling-tool");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching scheduling data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-violet-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-violet-100/80 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            Scheduling Tool
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
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-violet-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-violet-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-violet-100/80 backdrop-blur-sm group-hover:bg-violet-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          Scheduling Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          {data.unfilledShifts > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">
                  {data.unfilledShifts} shift{data.unfilledShifts !== 1 ? "s" : ""} need volunteers
                </p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {data.upcomingShifts.slice(0, 5).map((shift) => {
              const percentage = shift.needed > 0 
                ? Math.round((shift.assigned / shift.needed) * 100)
                : 0;
              return (
                <div
                  key={shift.id}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-violet-100 hover:border-violet-200 hover:bg-white/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{shift.eventName}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(shift.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{shift.time}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={percentage >= 100 ? "default" : percentage >= 70 ? "secondary" : "destructive"}
                      className="bg-violet-100 text-violet-700 text-xs flex-shrink-0 ml-2"
                    >
                      {shift.assigned}/{shift.needed}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        percentage >= 100 ? "bg-green-500" : percentage >= 70 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Link href="/dashboard/volunteers/schedule" className="block">
          <Button 
            variant="outline" 
            className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 group/btn transition-all duration-200"
          >
            Open Scheduler
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

