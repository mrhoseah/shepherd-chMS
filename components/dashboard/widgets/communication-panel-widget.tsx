"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunicationPanelWidgetProps {
  widgetId: string;
}

export function CommunicationPanelWidget({ widgetId }: CommunicationPanelWidgetProps) {
  const [data, setData] = useState<{
    recentMessages: number;
    unreadCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/communication-panel");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching communication panel:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-sky-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-sky-100/80 backdrop-blur-sm">
              <MessageSquare className="w-5 h-5 text-sky-600" />
            </div>
            Communication Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-24 mb-4" />
          <Skeleton className="h-10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-sky-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-sky-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-sky-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-sky-100/80 backdrop-blur-sm group-hover:bg-sky-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <MessageSquare className="w-5 h-5 text-sky-600" />
          </div>
          Communication Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-sky-100">
            <Mail className="w-5 h-5 text-sky-600 mb-2" />
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Recent</p>
            <p className="text-2xl font-bold text-gray-900">{data.recentMessages}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100">
            <Phone className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Unread</p>
            <p className="text-2xl font-bold text-gray-900">{data.unreadCount}</p>
          </div>
        </div>
        <Link href="/dashboard/communications" className="block">
          <Button 
            variant="outline" 
            className="w-full border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300 group/btn transition-all duration-200"
          >
            Open Panel
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

