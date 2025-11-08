"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowRight, Plus, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignBuilderWidgetProps {
  widgetId: string;
}

export function CampaignBuilderWidget({ widgetId }: CampaignBuilderWidgetProps) {
  const [data, setData] = useState<{
    recentCampaigns: number;
    draftCampaigns: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/campaign-builder");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching campaign builder data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-pink-100/80 backdrop-blur-sm">
              <Megaphone className="w-5 h-5 text-pink-600" />
            </div>
            Campaign Builder
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
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-pink-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-pink-100/80 backdrop-blur-sm group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Megaphone className="w-5 h-5 text-pink-600" />
          </div>
          Campaign Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-pink-100">
              <Mail className="w-5 h-5 text-pink-600 mb-2" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Recent</p>
              <p className="text-2xl font-bold text-gray-900">{data.recentCampaigns}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100">
              <MessageSquare className="w-5 h-5 text-amber-600 mb-2" />
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">{data.draftCampaigns}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link href="/dashboard/communications/campaigns/new">
              <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Campaign
              </Button>
            </Link>
            <Link href="/dashboard/communications/templates">
              <Button variant="outline" className="w-full border-pink-200 text-pink-600 hover:bg-pink-50">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
        <Link href="/dashboard/communications/campaigns" className="block">
          <Button 
            variant="outline" 
            className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 group/btn transition-all duration-200"
          >
            View All Campaigns
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

