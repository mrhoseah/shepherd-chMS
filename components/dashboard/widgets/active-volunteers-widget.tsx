"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ActiveVolunteersWidgetProps {
  widgetId: string;
}

export function ActiveVolunteersWidget({ widgetId }: ActiveVolunteersWidgetProps) {
  const [data, setData] = useState<{
    active: number;
    fulfillmentRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/active-volunteers");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching active volunteers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
          <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Active Volunteers
          </CardTitle>
          <div className="p-2.5 rounded-xl bg-blue-100/80 backdrop-blur-sm">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-9 w-20 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 hover:scale-[1.02]">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/40 transition-colors duration-300" />
      
      {/* Accent border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Active Volunteers
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-blue-100/80 backdrop-blur-sm group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
          <ClipboardList className="w-5 h-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-4xl font-bold text-gray-900 mt-1 mb-2 tracking-tight">
          {data.active}
        </p>
        <p className="text-xs text-gray-600 mt-2 mb-4">
          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {data.fulfillmentRate}%
          </span>
          <span className="ml-2">fulfilled in schedule</span>
        </p>
        <Link href="/dashboard/volunteers" className="mt-3 block">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 group/btn transition-all duration-200"
          >
            Manage Volunteers
            <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

