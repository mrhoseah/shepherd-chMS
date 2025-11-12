"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChartComponent, LineChartComponent, PieChartComponent, AreaChartComponent } from "./chart-components";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { ReportSection } from "./report-section";
import { Download, Calendar, Users, TrendingUp, DollarSign, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/reports/export";

interface EventsReportData {
  reportType: string;
  period: { start: string; end: string };
  [key: string]: any;
}

export function EventsReports({ data, onPeriodChange }: { data: EventsReportData | null; onPeriodChange: (period: string) => void }) {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("overview");

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExportPDF = () => {
    exportToPDF("events-report-content", `events-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const handleExportExcel = () => {
    if (!data) return;
    const exportData = {
      headers: ["Title", "Type", "Status", "Start Date", "Location", "Registrations", "Check-ins", "Attendance Rate"],
      rows: (data.events || []).map((e: any) => [
        e.title,
        e.type,
        e.status,
        format(new Date(e.startDate), "yyyy-MM-dd"),
        e.location || "",
        e.registrations,
        e.checkIns,
        e.attendanceRate ? `${e.attendanceRate.toFixed(1)}%` : "N/A",
      ]),
      title: `Events Report - ${reportType}`,
    };
    exportToExcel(exportData);
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Select a report type and period to generate events reports
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="events-report-content" className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Events Reports</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="attendance">Attendance Analysis</SelectItem>
                  <SelectItem value="registrations">Registrations</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="by-type">By Event Type</SelectItem>
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
          title="Total Events"
          value={data.summary?.totalEvents || 0}
          icon={Calendar}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Total Registrations"
          value={data.summary?.totalRegistrations || 0}
          icon={Users}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Total Check-ins"
          value={data.summary?.totalCheckIns || 0}
          icon={CheckCircle}
          iconColor="text-purple-500"
        />
        <MetricCard
          title="Average Attendance"
          value={data.summary?.averageAttendance?.toFixed(1) || "0"}
          description="per event"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Published Events"
          value={data.summary?.publishedEvents || 0}
        />
        <MetricCard
          title="Events Requiring Registration"
          value={data.summary?.eventsRequiringRegistration || 0}
        />
        <MetricCard
          title="Average Registrations"
          value={data.summary?.averageRegistrationsPerEvent?.toFixed(1) || "0"}
          description="per event"
        />
        {data.summary?.totalRevenue > 0 && (
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(data.summary.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-500"
          />
        )}
      </div>

      {/* Overview Report */}
      {reportType === "overview" && (
        <>
          <ReportSection title="Events by Type">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChartComponent
                data={
                  data.byType?.map((item: any) => ({
                    name: item.type,
                    value: item.count,
                  })) || []
                }
                height={300}
              />
              <BarChartComponent
                data={
                  data.byType?.map((item: any) => ({
                    name: item.type,
                    count: item.count,
                    registrations: item.registrations,
                    checkIns: item.checkIns,
                  })) || []
                }
                height={300}
              />
            </div>
            <div className="mt-4">
              <DataTable
                data={data.byType || []}
                columns={[
                  { key: "type", label: "Event Type", sortable: true },
                  { key: "count", label: "Count", sortable: true, align: "right" },
                  { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                  { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                  {
                    key: "utilizationRate",
                    label: "Utilization Rate",
                    sortable: true,
                    format: (val) => `${val.toFixed(1)}%`,
                    align: "right",
                  },
                ]}
              />
            </div>
          </ReportSection>

          <ReportSection title="Events by Status">
            <BarChartComponent
              data={
                data.byStatus?.map((item: any) => ({
                  name: item.status,
                  count: item.count,
                  registrations: item.registrations,
                  checkIns: item.checkIns,
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
                  { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                  { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                ]}
              />
            </div>
          </ReportSection>

          <ReportSection title="Monthly Events Trend">
            <LineChartComponent
              data={
                data.monthlyBreakdown?.map((item: any) => ({
                  name: item.month,
                  events: item.count,
                  registrations: item.registrations,
                  checkIns: item.checkIns,
                })) || []
              }
              height={400}
            />
          </ReportSection>

          <ReportSection title="All Events">
            <DataTable
              data={data.events || []}
              columns={[
                { key: "title", label: "Title", sortable: true },
                { key: "type", label: "Type", sortable: true },
                { key: "status", label: "Status", sortable: true },
                {
                  key: "startDate",
                  label: "Start Date",
                  sortable: true,
                  format: (val) => format(new Date(val), "MMM dd, yyyy"),
                },
                { key: "location", label: "Location", sortable: true },
                { key: "campus", label: "Campus", sortable: true },
                { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                {
                  key: "attendanceRate",
                  label: "Attendance Rate",
                  sortable: true,
                  format: (val) => (val ? `${val.toFixed(1)}%` : "N/A"),
                  align: "right",
                },
              ]}
              title="Events List"
            />
          </ReportSection>
        </>
      )}

      {/* Attendance Analysis */}
      {reportType === "attendance" && (
        <>
          <ReportSection title="Top Events by Attendance">
            <BarChartComponent
              data={
                data.topEventsByAttendance?.slice(0, 10).map((item: any) => ({
                  name: item.title.length > 20 ? item.title.substring(0, 20) + "..." : item.title,
                  checkIns: item.checkIns,
                  capacity: item.capacity || 0,
                })) || []
              }
              height={400}
            />
            <div className="mt-4">
              <DataTable
                data={data.topEventsByAttendance || []}
                columns={[
                  { key: "title", label: "Event Title", sortable: true },
                  { key: "type", label: "Type", sortable: true },
                  {
                    key: "startDate",
                    label: "Date",
                    sortable: true,
                    format: (val) => format(new Date(val), "MMM dd, yyyy"),
                  },
                  { key: "capacity", label: "Capacity", sortable: true, align: "right" },
                  { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                  { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                  {
                    key: "attendanceRate",
                    label: "Attendance Rate",
                    sortable: true,
                    format: (val) => `${val.toFixed(1)}%`,
                    align: "right",
                  },
                ]}
              />
            </div>
          </ReportSection>

          <ReportSection title="Attendance by Campus">
            <PieChartComponent
              data={
                data.byCampus?.map((item: any) => ({
                  name: item.campus,
                  value: item.checkIns,
                })) || []
              }
              height={300}
            />
            <div className="mt-4">
              <DataTable
                data={data.byCampus || []}
                columns={[
                  { key: "campus", label: "Campus", sortable: true },
                  { key: "count", label: "Events", sortable: true, align: "right" },
                  { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                ]}
              />
            </div>
          </ReportSection>
        </>
      )}

      {/* Registrations Analysis */}
      {reportType === "registrations" && (
        <>
          <ReportSection title="Registration vs Check-in Analysis">
            <AreaChartComponent
              data={
                data.registrationVsCheckIn?.slice(0, 10).map((item: any) => ({
                  name: item.eventTitle.length > 15
                    ? item.eventTitle.substring(0, 15) + "..."
                    : item.eventTitle,
                  registrations: item.registrations,
                  checkIns: item.checkIns,
                })) || []
              }
              height={400}
            />
            <div className="mt-4">
              <DataTable
                data={data.registrationVsCheckIn || []}
                columns={[
                  { key: "eventTitle", label: "Event Title", sortable: true },
                  { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                  { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                  {
                    key: "noShowRate",
                    label: "No-Show Rate",
                    sortable: true,
                    format: (val) => `${val.toFixed(1)}%`,
                    align: "right",
                  },
                ]}
              />
            </div>
          </ReportSection>

          {data.summary?.accommodationNeeds > 0 && (
            <ReportSection title="Accommodation Needs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard
                  title="Total Accommodation Requests"
                  value={data.summary.accommodationNeeds}
                />
                <MetricCard
                  title="Events with Accommodation Needs"
                  value={data.summary.eventsWithAccommodation}
                />
              </div>
            </ReportSection>
          )}
        </>
      )}

      {/* Revenue Analysis */}
      {reportType === "revenue" && data.summary?.totalRevenue > 0 && (
        <ReportSection title="Revenue Analysis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(data.summary.totalRevenue)}
              icon={DollarSign}
              iconColor="text-green-500"
            />
            <MetricCard
              title="Paid Events"
              value={data.summary.paidEvents}
            />
            <MetricCard
              title="Average Revenue per Event"
              value={formatCurrency(
                data.summary.paidEvents > 0
                  ? data.summary.totalRevenue / data.summary.paidEvents
                  : 0
              )}
            />
          </div>
          <DataTable
            data={
              data.events?.filter((e: any) => e.isPaid && e.price) || []
            }
            columns={[
              { key: "title", label: "Event Title", sortable: true },
              { key: "type", label: "Type", sortable: true },
              {
                key: "startDate",
                label: "Date",
                sortable: true,
                format: (val) => format(new Date(val), "MMM dd, yyyy"),
              },
              {
                key: "price",
                label: "Price",
                sortable: true,
                format: (val) => formatCurrency(val),
                align: "right",
              },
              { key: "registrations", label: "Registrations", sortable: true, align: "right" },
              {
                key: "revenue",
                label: "Revenue",
                sortable: true,
                format: (val, row) => formatCurrency((row.price || 0) * (row.registrations || 0)),
                align: "right",
              },
            ]}
            title="Paid Events Revenue"
          />
        </ReportSection>
      )}

      {/* By Event Type */}
      {reportType === "by-type" && (
        <ReportSection title="Events by Type">
          <BarChartComponent
            data={
              data.byType?.map((item: any) => ({
                name: item.type,
                count: item.count,
                registrations: item.registrations,
                checkIns: item.checkIns,
              })) || []
            }
            height={400}
          />
          <div className="mt-4">
            <DataTable
              data={data.byType || []}
              columns={[
                { key: "type", label: "Event Type", sortable: true },
                { key: "count", label: "Count", sortable: true, align: "right" },
                { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
                { key: "totalCapacity", label: "Total Capacity", sortable: true, align: "right" },
                {
                  key: "utilizationRate",
                  label: "Utilization Rate",
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
        <ReportSection title="Events by Campus">
          <PieChartComponent
            data={
              data.byCampus?.map((item: any) => ({
                name: item.campus,
                value: item.count,
              })) || []
            }
            height={300}
          />
          <div className="mt-4">
            <DataTable
              data={data.byCampus || []}
              columns={[
                { key: "campus", label: "Campus", sortable: true },
                { key: "count", label: "Events", sortable: true, align: "right" },
                { key: "registrations", label: "Registrations", sortable: true, align: "right" },
                { key: "checkIns", label: "Check-ins", sortable: true, align: "right" },
              ]}
            />
          </div>
        </ReportSection>
      )}
    </div>
  );
}

