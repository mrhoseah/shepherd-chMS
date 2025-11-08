"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, History, MessageSquare } from "lucide-react";
import { GuestFollowUpManager } from "./guest-follow-up-manager";
import { GuestVisitManager } from "./guest-visit-manager";
import { GuestFollowUpToggle } from "./guest-follow-up-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface GuestProfileTabsProps {
  guestId: string;
  enableFollowUps: boolean;
  visitCount: number;
  followUpCount: number;
  visits: any[];
  followUps: any[];
}

export function GuestProfileTabs({
  guestId,
  enableFollowUps,
  visitCount,
  followUpCount,
  visits,
  followUps,
}: GuestProfileTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">
          <User className="w-4 h-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="visits">
          <History className="w-4 h-4 mr-2" />
          Visit History ({visitCount})
        </TabsTrigger>
        {enableFollowUps && (
          <TabsTrigger value="follow-ups">
            <MessageSquare className="w-4 h-4 mr-2" />
            Follow-ups ({followUpCount})
          </TabsTrigger>
        )}
      </TabsList>

      {/* Overview Tab - This will be rendered by the parent */}
      <TabsContent value="overview" className="space-y-4">
        {/* Overview content will be passed as children or rendered separately */}
      </TabsContent>

      {/* Visit History Tab */}
      <TabsContent value="visits" className="space-y-4">
        <GuestVisitManager guestId={guestId} initialVisits={visits} />
      </TabsContent>

      {/* Follow-ups Tab */}
      {enableFollowUps && (
        <TabsContent value="follow-ups" className="space-y-4">
          <GuestFollowUpManager
            guestId={guestId}
            initialFollowUps={followUps}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

