"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowRight, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportsOverviewWidgetProps {
  widgetId: string;
}

export function ReportsOverviewWidget({ widgetId }: ReportsOverviewWidgetProps) {
  const [data, setData] = useState<{
    availableReports: Array<{ name: string; icon: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/reports-overview");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching reports overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="w-5 h-5" />;
      case "dollar":
        return <DollarSign className="w-5 h-5" />;
      case "calendar":
        return <Calendar className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-blue-100/80 backdrop-blur-sm">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            Reports Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-blue-100/80 backdrop-blur-sm group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          Reports Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {data.availableReports.map((report) => (
            <div
              key={report.name}
              className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-blue-100 hover:border-blue-200 hover:bg-white/80 transition-all duration-200 group/item"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover/item:bg-blue-200 transition-colors">
                  {getIcon(report.icon)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{report.name}</p>
                  <p className="text-xs text-gray-500">{report.count} reports</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/dashboard/reports" className="block">
          <Button 
            variant="outline" 
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 group/btn transition-all duration-200"
          >
            View All Reports
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

