"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChartComponent, LineChartComponent, PieChartComponent } from "./chart-components";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { ReportSection } from "./report-section";
import { Download, Users, TrendingUp, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/reports/export";

interface MembersReportData {
  reportType: string;
  period: { start: string; end: string };
  [key: string]: any;
}

export function MembersReports({ data, onPeriodChange }: { data: MembersReportData | null; onPeriodChange: (period: string) => void }) {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("overview");

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const handleExportPDF = () => {
    exportToPDF("members-report-content", `members-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const handleExportExcel = () => {
    if (!data) return;
    const exportData = {
      headers: ["Name", "Email", "Role", "Status", "Location", "Attendance", "Donations"],
      rows: (data.members || []).map((m: any) => [
        m.name,
        m.email || "",
        m.role,
        m.status,
        m.location,
        m.attendanceCount || 0,
        m.donationCount || 0,
      ]),
      title: `Members Report - ${reportType}`,
    };
    exportToExcel(exportData);
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Select a report type and period to generate members reports
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="members-report-content" className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members Reports</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="growth">Growth Trends</SelectItem>
                  <SelectItem value="demographics">Demographics</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Members"
          value={data.summary?.totalMembers || 0}
          icon={Users}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Active Members"
          value={data.summary?.activeMembers || 0}
          icon={UserPlus}
          iconColor="text-green-500"
        />
        <MetricCard
          title="New Members"
          value={data.summary?.newMembers || 0}
          icon={TrendingUp}
          iconColor="text-purple-500"
        />
        <MetricCard
          title="Inactive Members"
          value={data.summary?.inactiveMembers || 0}
          description="This period"
        />
      </div>

      {/* Overview Report */}
      {reportType === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportSection title="Members by Role">
              <PieChartComponent
                data={
                  data.byRole?.map((item: any) => ({
                    name: item.role,
                    value: item.count,
                  })) || []
                }
                height={300}
              />
              <div className="mt-4">
                <DataTable
                  data={data.byRole || []}
                  columns={[
                    { key: "role", label: "Role", sortable: true },
                    { key: "count", label: "Count", sortable: true, align: "right" },
                    {
                      key: "percentage",
                      label: "Percentage",
                      sortable: true,
                      format: (val) => `${val.toFixed(1)}%`,
                      align: "right",
                    },
                  ]}
                />
              </div>
            </ReportSection>

            <ReportSection title="Members by Status">
              <PieChartComponent
                data={
                  data.byStatus?.map((item: any) => ({
                    name: item.status,
                    value: item.count,
                  })) || []
                }
                height={300}
              />
              <div className="mt-4">
                <DataTable
                  data={data.byStatus || []}
                  columns={[
                    { key: "status", label: "Status", sortable: true },
                    { key: "count", label: "Count", sortable: true, align: "right" },
                    {
                      key: "percentage",
                      label: "Percentage",
                      sortable: true,
                      format: (val) => `${val.toFixed(1)}%`,
                      align: "right",
                    },
                  ]}
                />
              </div>
            </ReportSection>
          </div>

          <ReportSection title="Members by Location">
            <BarChartComponent
              data={
                data.byLocation?.map((item: any) => ({
                  name: item.location,
                  count: item.count,
                })) || []
              }
              height={300}
            />
            <div className="mt-4">
              <DataTable
                data={data.byLocation || []}
                columns={[
                  { key: "location", label: "Location", sortable: true },
                  { key: "count", label: "Count", sortable: true, align: "right" },
                  {
                    key: "percentage",
                    label: "Percentage",
                    sortable: true,
                    format: (val) => `${val.toFixed(1)}%`,
                    align: "right",
                  },
                ]}
              />
            </div>
          </ReportSection>

          <ReportSection title="All Members">
            <DataTable
              data={data.members || []}
              columns={[
                { key: "name", label: "Name", sortable: true },
                { key: "email", label: "Email", sortable: true },
                { key: "role", label: "Role", sortable: true },
                { key: "status", label: "Status", sortable: true },
                { key: "location", label: "Location", sortable: true },
                { key: "campus", label: "Campus", sortable: true },
                { key: "attendanceCount", label: "Attendance", sortable: true, align: "right" },
                { key: "donationCount", label: "Donations", sortable: true, align: "right" },
              ]}
              title="Members List"
            />
          </ReportSection>
        </>
      )}

      {/* Growth Trends */}
      {reportType === "growth" && (
        <ReportSection title="Member Growth Trends">
          <LineChartComponent
            data={
              data.monthlyGrowth?.map((item: any) => ({
                name: item.month,
                count: item.count,
              })) || []
            }
            height={400}
          />
        </ReportSection>
      )}

      {/* Demographics */}
      {reportType === "demographics" && (
        <>
          <ReportSection title="Geographic Distribution">
            <BarChartComponent
              data={
                data.byLocation?.map((item: any) => ({
                  name: item.location,
                  count: item.count,
                })) || []
              }
              height={300}
            />
          </ReportSection>
        </>
      )}

      {/* Engagement */}
      {reportType === "engagement" && (
        <ReportSection title="Member Engagement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <MetricCard
              title="Average Attendance"
              value={data.attendance?.averageAttendance?.toFixed(1) || "0"}
              description="per member"
            />
            <MetricCard
              title="Total Attendance Records"
              value={data.attendance?.total || 0}
            />
          </div>
          <DataTable
            data={data.members?.map((m: any) => ({
              ...m,
              engagementScore: ((m.attendanceCount || 0) + (m.donationCount || 0) * 2).toFixed(1),
            })) || []}
            columns={[
              { key: "name", label: "Name", sortable: true },
              { key: "attendanceCount", label: "Attendance", sortable: true, align: "right" },
              { key: "donationCount", label: "Donations", sortable: true, align: "right" },
              { key: "engagementScore", label: "Engagement Score", sortable: true, align: "right" },
            ]}
            title="Member Engagement"
          />
        </ReportSection>
      )}
    </div>
  );
}

