"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Wallet, Users, Calendar, TrendingUp, BarChart3, UsersRound } from "lucide-react";
import { FinancialReports } from "@/components/reports/financial-reports";
import { MembersReports } from "@/components/reports/members-reports";
import { AttendanceReports } from "@/components/reports/attendance-reports";
import { EventsReports } from "@/components/reports/events-reports";
import { EnhancedReportsPage } from "@/components/reports/enhanced-reports-page";
import { GroupsReports } from "@/components/reports/groups-reports";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");
  const [period, setPeriod] = useState("month");
  const [financialData, setFinancialData] = useState<any>(null);
  const [membersData, setMembersData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [eventsData, setEventsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [financialReportType, setFinancialReportType] = useState("profit-loss");

  const fetchFinancialReport = async (period: string, reportType: string = "profit-loss") => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/financial?type=${reportType}&period=${period}`
      );
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error("Error fetching financial report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinancialReportTypeChange = (type: string) => {
    setFinancialReportType(type);
    fetchFinancialReport(period, type);
  };

  const fetchMembersReport = async (period: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/members?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setMembersData(data);
      }
    } catch (error) {
      console.error("Error fetching members report:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async (period: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/attendance?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      }
    } catch (error) {
      console.error("Error fetching attendance report:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsReport = async (period: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/events?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setEventsData(data);
      }
    } catch (error) {
      console.error("Error fetching events report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "financial") {
      fetchFinancialReport(period, financialReportType);
    } else if (activeTab === "members") {
      fetchMembersReport(period);
    } else if (activeTab === "attendance") {
      fetchAttendanceReport(period);
    } else if (activeTab === "events") {
      fetchEventsReport(period);
    }
  }, [activeTab, period, financialReportType]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate and export comprehensive reports for your church
        </p>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Reports Tab */}
        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedReportsPage />
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-6">
          <FinancialReports 
            data={financialData} 
            onPeriodChange={handlePeriodChange}
            onReportTypeChange={handleFinancialReportTypeChange}
          />
        </TabsContent>

        {/* Members Reports Tab */}
        <TabsContent value="members" className="space-y-6">
          <MembersReports data={membersData} onPeriodChange={handlePeriodChange} />
        </TabsContent>

        {/* Groups Reports Tab */}
        <TabsContent value="groups" className="space-y-6">
          <GroupsReports />
        </TabsContent>

        {/* Attendance Reports Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <AttendanceReports data={attendanceData} onPeriodChange={handlePeriodChange} />
        </TabsContent>

        {/* Events Reports Tab */}
        <TabsContent value="events" className="space-y-6">
          <EventsReports data={eventsData} onPeriodChange={handlePeriodChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

