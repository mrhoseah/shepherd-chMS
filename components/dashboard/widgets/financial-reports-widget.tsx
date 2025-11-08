"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Download, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Report {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: string;
}

interface FinancialReportsWidgetProps {
  widgetId: string;
}

export function FinancialReportsWidget({ widgetId }: FinancialReportsWidgetProps) {
  const [data, setData] = useState<{
    reports: Report[];
    availableReports: Array<{ name: string; type: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/financial-reports");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching financial reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-indigo-100/80 backdrop-blur-sm">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            Financial Reports
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
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-indigo-100/80 backdrop-blur-sm group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          Financial Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Available Reports</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {data.availableReports.slice(0, 4).map((report, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-indigo-100 hover:border-indigo-200 hover:bg-white/80 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{report.name}</p>
                    <p className="text-xs text-gray-500">{report.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {data.reports && data.reports.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-700 mb-3">Recent Reports</p>
              <div className="space-y-2">
                {data.reports.slice(0, 3).map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-indigo-100 hover:border-indigo-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{report.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{report.period}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="flex-shrink-0">
                        <Download className="w-4 h-4 text-indigo-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <Link href="/dashboard/reports/financial" className="block">
          <Button 
            variant="outline" 
            className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 group/btn transition-all duration-200"
          >
            View All Reports
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

