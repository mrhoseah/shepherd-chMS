"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Mail, MessageSquare, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EngagementMetricsWidgetProps {
  widgetId: string;
}

export function EngagementMetricsWidget({ widgetId }: EngagementMetricsWidgetProps) {
  const [data, setData] = useState<{
    emailOpenRate: number;
    smsReadRate: number;
    notificationClickRate: number;
    averageEngagement: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/engagement-metrics");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching engagement metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-purple-100/80 backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            Engagement Metrics
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
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-purple-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-purple-100/80 backdrop-blur-sm group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-purple-100 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Average Engagement</span>
              <span className="text-2xl font-bold text-purple-600">{data.averageEngagement}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${data.averageEngagement}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 text-center">
              <Mail className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600 mb-1">Email</p>
              <p className="text-lg font-bold text-gray-900">{data.emailOpenRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-green-100 text-center">
              <MessageSquare className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600 mb-1">SMS</p>
              <p className="text-lg font-bold text-gray-900">{data.smsReadRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100 text-center">
              <Bell className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600 mb-1">Push</p>
              <p className="text-lg font-bold text-gray-900">{data.notificationClickRate}%</p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/communications/analytics" className="block">
          <Button 
            variant="outline" 
            className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 group/btn transition-all duration-200"
          >
            View Analytics
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

