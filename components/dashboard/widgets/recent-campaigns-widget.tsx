"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, ArrowRight, Mail, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sentAt: string;
  recipients: number;
}

interface RecentCampaignsWidgetProps {
  widgetId: string;
}

export function RecentCampaignsWidget({ widgetId }: RecentCampaignsWidgetProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/recent-campaigns?limit=5");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching recent campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Megaphone className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-rose-100/80 backdrop-blur-sm">
              <Megaphone className="w-5 h-5 text-rose-600" />
            </div>
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-rose-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-rose-100/80 backdrop-blur-sm group-hover:bg-rose-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Megaphone className="w-5 h-5 text-rose-600" />
          </div>
          Recent Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No campaigns yet</p>
            <Link href="/dashboard/communications/campaigns/new">
              <Button variant="outline" size="sm" className="border-rose-200 text-rose-600">
                Create Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-rose-100 hover:border-rose-200 hover:bg-white/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 flex-shrink-0">
                        {getIcon(campaign.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</p>
                        <p className="text-xs text-gray-600">{campaign.recipients} recipients</p>
                      </div>
                    </div>
                    <Badge 
                      variant={campaign.status === "sent" ? "default" : campaign.status === "scheduled" ? "secondary" : "outline"}
                      className="bg-rose-100 text-rose-700 text-xs flex-shrink-0 ml-2"
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(campaign.sentAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/communications/campaigns" className="block">
              <Button 
                variant="outline" 
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 group/btn transition-all duration-200"
              >
                View All Campaigns
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

