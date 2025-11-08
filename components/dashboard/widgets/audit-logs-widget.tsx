"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  user: { firstName: string; lastName: string } | null;
  createdAt: string;
}

interface AuditLogsWidgetProps {
  widgetId: string;
}

export function AuditLogsWidget({ widgetId }: AuditLogsWidgetProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/audit-logs?limit=5");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gray-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-gray-100/80 backdrop-blur-sm">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gray-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-gray-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-gray-100/80 backdrop-blur-sm group-hover:bg-gray-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          Audit Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:border-gray-200 hover:bg-white/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {log.action}
                    </p>
                    {log.user && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {log.user.firstName} {log.user.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/dashboard/settings/audit" className="block">
          <Button 
            variant="outline" 
            className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 group/btn transition-all duration-200"
          >
            View All Logs
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

