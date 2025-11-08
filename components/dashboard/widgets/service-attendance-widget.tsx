"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceAttendanceWidgetProps {
  widgetId: string;
}

export function ServiceAttendanceWidget({ widgetId }: ServiceAttendanceWidgetProps) {
  const [data, setData] = useState<{
    thisWeek: number;
    fourWeekAverage: number;
    change: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/service-attendance");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching service attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Service Attendance
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-amber-100/80 backdrop-blur-sm">
            <Sun className="w-5 h-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-9 w-20 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  const changePercent = data.fourWeekAverage > 0
    ? ((data.thisWeek - data.fourWeekAverage) / data.fourWeekAverage) * 100
    : 0;
  const isPositive = changePercent >= 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50/30 hover:scale-[1.02]">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-100/40 transition-colors duration-300" />
      
      {/* Accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Service Attendance
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-amber-100/80 backdrop-blur-sm group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
          <Sun className="w-5 h-5 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-4xl font-bold text-gray-900 mt-1 mb-2 tracking-tight">
          {data.thisWeek}
        </p>
        <p className="text-xs text-gray-600 mt-2 mb-4">
          <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
            isPositive 
              ? "text-amber-600 bg-amber-50" 
              : "text-red-600 bg-red-50"
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? "+" : ""}
            {changePercent.toFixed(1)}%
          </span>
          <span className="ml-2">vs. 4-week average</span>
        </p>
        <Link href="/dashboard/attendance" className="mt-3 block">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50/50 group/btn transition-all duration-200"
          >
            View Attendance
            <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

