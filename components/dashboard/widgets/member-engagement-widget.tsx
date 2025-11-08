"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Users, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MemberEngagementWidgetProps {
  widgetId: string;
}

export function MemberEngagementWidget({ widgetId }: MemberEngagementWidgetProps) {
  const [data, setData] = useState<{
    attendanceRate: number;
    participationRate: number;
    engagementScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/member-engagement");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching member engagement:", error);
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
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            Member Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-10" />
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
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          Member Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4 mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Engagement</span>
              <span className="text-2xl font-bold text-teal-600">{data.engagementScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data.engagementScore}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-teal-100">
              <Calendar className="w-4 h-4 text-teal-600 mb-1" />
              <p className="text-xs text-gray-600 mb-1">Attendance</p>
              <p className="text-lg font-bold text-gray-900">{data.attendanceRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-teal-100">
              <Users className="w-4 h-4 text-teal-600 mb-1" />
              <p className="text-xs text-gray-600 mb-1">Participation</p>
              <p className="text-lg font-bold text-gray-900">{data.participationRate}%</p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/engagement" className="block">
          <Button 
            variant="outline" 
            className="w-full border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 group/btn transition-all duration-200"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

