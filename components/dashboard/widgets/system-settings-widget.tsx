"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SystemSettingsWidgetProps {
  widgetId: string;
}

export function SystemSettingsWidget({ widgetId }: SystemSettingsWidgetProps) {
  const [data, setData] = useState<{
    integrationsConfigured: number;
    totalIntegrations: number;
    integrations: Array<{ name: string; status: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/system-settings");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-slate-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-slate-100/80 backdrop-blur-sm">
              <Settings className="w-5 h-5 text-slate-600" />
            </div>
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-24 mb-4" />
          <Skeleton className="h-10" />
        </CardContent>
      </Card>
    );
  }

  const configuredPercent = data.totalIntegrations > 0 
    ? Math.round((data.integrationsConfigured / data.totalIntegrations) * 100)
    : 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-slate-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-slate-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-slate-100/80 backdrop-blur-sm group-hover:bg-slate-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          System Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Integrations</p>
            <Badge variant={configuredPercent === 100 ? "default" : "secondary"} className="bg-emerald-100 text-emerald-700">
              {configuredPercent}% Configured
            </Badge>
          </div>
          <div className="space-y-2">
            {data.integrations.slice(0, 3).map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-2 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100">
                <span className="text-sm text-gray-700">{integration.name}</span>
                {integration.status === "configured" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                )}
              </div>
            ))}
          </div>
        </div>
        <Link href="/dashboard/settings" className="block">
          <Button 
            variant="outline" 
            className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 group/btn transition-all duration-200"
          >
            Configure Settings
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

