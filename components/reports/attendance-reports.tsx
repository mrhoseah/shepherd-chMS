"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChartComponent, LineChartComponent, AreaChartComponent } from "./chart-components";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { ReportSection } from "./report-section";
import { Download, Calendar, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/reports/export";

interface AttendanceReportData {
  reportType: string;
  period: { start: string; end: string };
  [key: string]: any;
}

export function AttendanceReports({ data, onPeriodChange }: { data: AttendanceReportData | null; onPeriodChange: (period: string) => void }) {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("overview");

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const handleExportPDF = () => {
    exportToPDF("attendance-report-content", `attendance-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const handleExportExcel = () => {
    if (!data) return;
    const exportData = {
      headers: ["Date", "Present", "Absent", "Total"],
      rows: (data.dailyBreakdown || []).map((item: any) => [
        item.date,
        item.present,
        item.absent,
        item.total,
      ]),
      title: `Attendance Report - ${reportType}`,
    };
    exportToExcel(exportData);
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Select a report type and period to generate attendance reports
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="attendance-report-content" className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Reports</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="by-role">By Role</SelectItem>
                  <SelectItem value="by-campus">By Campus</SelectItem>
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
          title="Total Attendance"
          value={data.summary?.totalAttendance || 0}
          icon={Calendar}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Present"
          value={data.summary?.present || 0}
          icon={Users}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Absent"
          value={data.summary?.absent || 0}
          icon={TrendingUp}
          iconColor="text-red-500"
        />
        <MetricCard
          title="Attendance Rate"
          value={`${(data.summary?.attendanceRate || 0).toFixed(1)}%`}
          description="Average"
        />
      </div>

      {/* Overview Report */}
      {reportType === "overview" && (
        <>
          <ReportSection title="Daily Attendance">
            <AreaChartComponent
              data={
                data.dailyBreakdown?.map((item: any) => ({
                  name: format(new Date(item.date), "MMM dd"),
                  present: item.present,
                  absent: item.absent,
                })) || []
              }
              height={400}
            />
            <div className="mt-4">
              <DataTable
                data={data.dailyBreakdown || []}
                columns={[
                  { key: "date", label: "Date", sortable: true },
                  { key: "present", label: "Present", sortable: true, align: "right" },
                  { key: "absent", label: "Absent", sortable: true, align: "right" },
                  { key: "total", label: "Total", sortable: true, align: "right" },
                ]}
              />
            </div>
          </ReportSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportSection title="Attendance by Role">
              <BarChartComponent
                data={
                  data.byRole?.map((item: any) => ({
                    name: item.role,
                    present: item.present,
                    absent: item.absent,
                  })) || []
                }
                height={300}
              />
              <div className="mt-4">
                <DataTable
                  data={data.byRole || []}
                  columns={[
                    { key: "role", label: "Role", sortable: true },
                    { key: "present", label: "Present", sortable: true, align: "right" },
                    { key: "absent", label: "Absent", sortable: true, align: "right" },
                    { key: "total", label: "Total", sortable: true, align: "right" },
                    {
                      key: "attendanceRate",
                      label: "Rate",
                      sortable: true,
                      format: (val) => `${val.toFixed(1)}%`,
                      align: "right",
                    },
                  ]}
                />
              </div>
            </ReportSection>

            <ReportSection title="Attendance by Campus">
              <BarChartComponent
                data={
                  data.byCampus?.map((item: any) => ({
                    name: item.campus,
                    present: item.present,
                    absent: item.absent,
                  })) || []
                }
                height={300}
              />
              <div className="mt-4">
                <DataTable
                  data={data.byCampus || []}
                  columns={[
                    { key: "campus", label: "Campus", sortable: true },
                    { key: "present", label: "Present", sortable: true, align: "right" },
                    { key: "absent", label: "Absent", sortable: true, align: "right" },
                    { key: "total", label: "Total", sortable: true, align: "right" },
                    {
                      key: "attendanceRate",
                      label: "Rate",
                      sortable: true,
                      format: (val) => `${val.toFixed(1)}%`,
                      align: "right",
                    },
                  ]}
                />
              </div>
            </ReportSection>
          </div>

          {data.topAttendees && data.topAttendees.length > 0 && (
            <ReportSection title="Top Attendees">
              <DataTable
                data={data.topAttendees}
                columns={[
                  { key: "name", label: "Name", sortable: true },
                  { key: "role", label: "Role", sortable: true },
                  { key: "present", label: "Present", sortable: true, align: "right" },
                  { key: "total", label: "Total", sortable: true, align: "right" },
                  {
                    key: "attendanceRate",
                    label: "Rate",
                    sortable: true,
                    format: (val) => `${val.toFixed(1)}%`,
                    align: "right",
                  },
                ]}
              />
            </ReportSection>
          )}
        </>
      )}

      {/* Trends */}
      {reportType === "trends" && (
        <>
          <ReportSection title="Weekly Attendance Trends">
            <LineChartComponent
              data={
                data.weeklyBreakdown?.map((item: any) => ({
                  name: item.week,
                  present: item.present,
                  absent: item.absent,
                })) || []
              }
              height={400}
            />
          </ReportSection>
        </>
      )}

      {/* By Role */}
      {reportType === "by-role" && (
        <ReportSection title="Attendance by Role">
          <BarChartComponent
            data={
              data.byRole?.map((item: any) => ({
                name: item.role,
                present: item.present,
                absent: item.absent,
              })) || []
            }
            height={400}
          />
          <div className="mt-4">
            <DataTable
              data={data.byRole || []}
              columns={[
                { key: "role", label: "Role", sortable: true },
                { key: "present", label: "Present", sortable: true, align: "right" },
                { key: "absent", label: "Absent", sortable: true, align: "right" },
                { key: "total", label: "Total", sortable: true, align: "right" },
                {
                  key: "attendanceRate",
                  label: "Rate",
                  sortable: true,
                  format: (val) => `${val.toFixed(1)}%`,
                  align: "right",
                },
              ]}
            />
          </div>
        </ReportSection>
      )}

      {/* By Campus */}
      {reportType === "by-campus" && (
        <ReportSection title="Attendance by Campus">
          <BarChartComponent
            data={
              data.byCampus?.map((item: any) => ({
                name: item.campus,
                present: item.present,
                absent: item.absent,
              })) || []
            }
            height={400}
          />
          <div className="mt-4">
            <DataTable
              data={data.byCampus || []}
              columns={[
                { key: "campus", label: "Campus", sortable: true },
                { key: "present", label: "Present", sortable: true, align: "right" },
                { key: "absent", label: "Absent", sortable: true, align: "right" },
                { key: "total", label: "Total", sortable: true, align: "right" },
                {
                  key: "attendanceRate",
                  label: "Rate",
                  sortable: true,
                  format: (val) => `${val.toFixed(1)}%`,
                  align: "right",
                },
              ]}
            />
          </div>
        </ReportSection>
      )}
    </div>
  );
}

