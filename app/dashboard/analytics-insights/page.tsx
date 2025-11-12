"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, DollarSign, Calendar, FileText } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the pages to avoid loading all at once
const AnalyticsPage = dynamic(() => import("../analytics/page"), { ssr: false });
const EngagementPage = dynamic(() => import("../engagement/page"), { ssr: false });
const FinancialInsightsPage = dynamic(() => import("../financial-insights/page"), { ssr: false });
const AttendancePatternsPage = dynamic(() => import("../attendance-patterns/page"), { ssr: false });
const ReportsPage = dynamic(() => import("../reports/page"), { ssr: false });

export default function AnalyticsInsightsPage() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Analytics & Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Comprehensive analytics, insights, and reporting for your church
        </p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Engagement</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0">
          <AnalyticsPage />
        </TabsContent>

        <TabsContent value="engagement" className="mt-0">
          <EngagementPage />
        </TabsContent>

        <TabsContent value="financial" className="mt-0">
          <FinancialInsightsPage />
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <AttendancePatternsPage />
        </TabsContent>

        <TabsContent value="reports" className="mt-0">
          <ReportsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

