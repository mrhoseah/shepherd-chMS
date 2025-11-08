"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupAttendanceWidgetProps {
  widgetId: string;
}

export function GroupAttendanceWidget({ widgetId }: GroupAttendanceWidgetProps) {
  const [data, setData] = useState<{
    thisMonth: number;
    lastMonth: number;
    averageAttendance: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/group-attendance");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching group attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-violet-50/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Group Attendance
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-violet-100/80 backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-9 w-20 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const change = data.lastMonth > 0 
    ? ((data.thisMonth - data.lastMonth) / data.lastMonth) * 100 
    : 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-violet-50/30 hover:scale-[1.02]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-violet-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Group Attendance
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-violet-100/80 backdrop-blur-sm group-hover:bg-violet-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
          <Calendar className="w-5 h-5 text-violet-600" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-4xl font-bold text-gray-900 mt-1 mb-2 tracking-tight">
          {data.thisMonth}
        </p>
        <p className="text-xs text-gray-600 mt-2 mb-4">
          <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
            change >= 0 
              ? "text-violet-600 bg-violet-50" 
              : "text-red-600 bg-red-50"
          }`}>
            {change >= 0 && <TrendingUp className="w-3 h-3" />}
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          <span className="ml-2">vs last month</span>
        </p>
        <Link href="/dashboard/groups/attendance" className="mt-3 block">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50/50 group/btn transition-all duration-200"
          >
            View Details
            <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

