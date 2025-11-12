"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Layout, BarChart3, Database, Download } from "lucide-react";
import { InteractiveFilters, FilterConfig } from "./interactive-filters";
import { CrossFilterProvider } from "./cross-filter";
import { SQLQueryBuilder } from "./sql-query-builder";
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  AreaChartComponent,
  RadarChartComponent,
  TreemapChartComponent,
  FunnelChartComponent,
  ComposedChartComponent,
  ScatterChartComponent,
} from "./chart-components";
import { DataTable } from "./data-table";
import { ReportSection } from "./report-section";
import { exportToPDF } from "@/lib/reports/export";
import { format } from "date-fns";

interface EnhancedReportsPageProps {
  initialData?: any;
}

export function EnhancedReportsPage({ initialData }: EnhancedReportsPageProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filters, setFilters] = useState<any>({});

  const filterConfigs: FilterConfig[] = [
    {
      key: "dateRange",
      label: "Date Range",
      type: "date-range",
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "all", label: "All Categories" },
        { value: "donations", label: "Donations" },
        { value: "expenses", label: "Expenses" },
        { value: "events", label: "Events" },
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
    },
    {
      key: "search",
      label: "Search",
      type: "search",
      placeholder: "Search reports...",
    },
  ];

  // Sample data for demonstration
  const sampleData = [
    { name: "Jan", value: 4000, amount: 2400 },
    { name: "Feb", value: 3000, amount: 1398 },
    { name: "Mar", value: 2000, amount: 9800 },
    { name: "Apr", value: 2780, amount: 3908 },
    { name: "May", value: 1890, amount: 4800 },
  ];

  const handleExportPDF = () => {
    try {
      exportToPDF("enhanced-reports-content", `enhanced-reports-${format(new Date(), "yyyy-MM-dd")}`);
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      alert(error.message || "Failed to export PDF. Please try again.");
    }
  };

  return (
    <CrossFilterProvider>
      <div className="space-y-6" id="enhanced-reports-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Enhanced Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Advanced analytics and visualization tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Interactive Filters */}
        <InteractiveFilters
          filters={filterConfigs}
          onFilterChange={setFilters}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <Layout className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="w-4 h-4 mr-2" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="sql">
              <Database className="w-4 h-4 mr-2" />
              SQL Builder
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportSection title="Bar Chart">
                <BarChartComponent data={sampleData} height={300} />
              </ReportSection>
              <ReportSection title="Line Chart">
                <LineChartComponent data={sampleData} height={300} />
              </ReportSection>
              <ReportSection title="Pie Chart">
                <PieChartComponent
                  data={sampleData.map((d) => ({ name: d.name, value: d.value }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Area Chart">
                <AreaChartComponent data={sampleData} height={300} />
              </ReportSection>
            </div>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportSection title="Radar Chart">
                <RadarChartComponent
                  data={sampleData.map((d) => ({
                    name: d.name,
                    value: d.value,
                    amount: d.amount,
                  }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Treemap Chart">
                <TreemapChartComponent
                  data={sampleData.map((d) => ({ name: d.name, value: d.value }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Funnel Chart">
                <FunnelChartComponent
                  data={sampleData.map((d) => ({ name: d.name, value: d.value }))}
                  height={300}
                />
              </ReportSection>
              <ReportSection title="Composed Chart">
                <ComposedChartComponent data={sampleData} height={300} />
              </ReportSection>
              <ReportSection title="Scatter Chart">
                <ScatterChartComponent
                  data={sampleData.map((d, i) => ({
                    name: d.name,
                    x: d.value,
                    y: d.amount,
                    z: i * 10,
                  }))}
                  height={300}
                />
              </ReportSection>
            </div>
          </TabsContent>

          {/* SQL Builder Tab */}
          <TabsContent value="sql" className="space-y-6">
            <SQLQueryBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </CrossFilterProvider>
  );
}

