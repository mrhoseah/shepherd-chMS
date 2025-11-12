"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChartComponent, LineChartComponent, PieChartComponent, AreaChartComponent } from "./chart-components";
import { DataTable } from "./data-table";
import { MetricCard } from "./metric-card";
import { ReportSection } from "./report-section";
import { Download, DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/reports/export";

interface FinancialReportData {
  reportType: string;
  period: { start: string; end: string };
  [key: string]: any;
}

export function FinancialReports({ data, onPeriodChange, onReportTypeChange }: { data: FinancialReportData | null; onPeriodChange: (period: string) => void; onReportTypeChange?: (type: string) => void }) {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("profit-loss");

  useEffect(() => {
    if (data) {
      setReportType(data.reportType);
    }
  }, [data]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    onPeriodChange(newPeriod);
  };

  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    if (onReportTypeChange) {
      onReportTypeChange(type);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleExportPDF = () => {
    exportToPDF("financial-report-content", `financial-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const handleExportExcel = () => {
    if (!data) return;
    // Prepare data for Excel export
    const exportData = {
      headers: ["Category", "Amount"],
      rows: [] as (string | number)[][],
      title: `Financial Report - ${reportType}`,
    };

    if (reportType === "profit-loss") {
      if (data.income?.breakdown) {
        exportData.headers = ["Type", "Category", "Amount", "Percentage"];
        exportData.rows = [
          ...data.income.breakdown.map((item: any) => ["Income", item.category, item.amount, `${item.percentage.toFixed(2)}%`]),
          ...data.expenses.breakdown.map((item: any) => ["Expense", item.category, item.amount, `${item.percentage.toFixed(2)}%`]),
        ];
      }
    }

    exportToExcel(exportData);
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Select a report type and period to generate financial reports
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="financial-report-content" className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financial Reports</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={handleReportTypeChange}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                  <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cash-flow">Cash Flow</SelectItem>
                  <SelectItem value="giving-summary">Giving Summary</SelectItem>
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

      <Tabs value={reportType} onValueChange={handleReportTypeChange}>
        <TabsList className="hidden">
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="giving-summary">Giving Summary</TabsTrigger>
        </TabsList>

        {/* Profit & Loss Statement */}
        <TabsContent value="profit-loss" className="space-y-6">
          {data.reportType === "profit-loss" && (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Income"
                  value={formatCurrency(data.income?.total || 0)}
                  icon={TrendingUp}
                  iconColor="text-green-500"
                />
                <MetricCard
                  title="Total Expenses"
                  value={formatCurrency(data.expenses?.total || 0)}
                  icon={TrendingDown}
                  iconColor="text-red-500"
                />
                <MetricCard
                  title="Net Income"
                  value={formatCurrency(data.netIncome || 0)}
                  icon={DollarSign}
                  iconColor={data.netIncome >= 0 ? "text-green-500" : "text-red-500"}
                  change={{
                    value: Math.abs(data.margin || 0),
                    label: "margin",
                    isPositive: data.netIncome >= 0,
                  }}
                />
                <MetricCard
                  title="Profit Margin"
                  value={`${(data.margin || 0).toFixed(1)}%`}
                  description={data.netIncome >= 0 ? "Positive" : "Negative"}
                />
              </div>

              {/* Income Breakdown */}
              <ReportSection title="Income Breakdown">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <PieChartComponent
                      data={
                        data.income?.breakdown?.map((item: any) => ({
                          name: item.category,
                          value: item.amount,
                        })) || []
                      }
                      height={300}
                    />
                  </div>
                  <div>
                    <BarChartComponent
                      data={
                        data.income?.breakdown?.map((item: any) => ({
                          name: item.category,
                          amount: item.amount,
                        })) || []
                      }
                      height={300}
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <DataTable
                    data={data.income?.breakdown || []}
                    columns={[
                      { key: "category", label: "Category", sortable: true },
                      {
                        key: "amount",
                        label: "Amount",
                        sortable: true,
                        format: (val) => formatCurrency(val),
                        align: "right",
                      },
                      {
                        key: "percentage",
                        label: "Percentage",
                        sortable: true,
                        format: (val) => `${val.toFixed(2)}%`,
                        align: "right",
                      },
                    ]}
                    title="Income by Category"
                  />
                </div>
              </ReportSection>

              {/* Expenses Breakdown */}
              <ReportSection title="Expenses Breakdown">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <PieChartComponent
                      data={
                        data.expenses?.breakdown?.map((item: any) => ({
                          name: item.category,
                          value: item.amount,
                        })) || []
                      }
                      height={300}
                    />
                  </div>
                  <div>
                    <BarChartComponent
                      data={
                        data.expenses?.breakdown?.map((item: any) => ({
                          name: item.category,
                          amount: item.amount,
                        })) || []
                      }
                      height={300}
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <DataTable
                    data={data.expenses?.breakdown || []}
                    columns={[
                      { key: "category", label: "Category", sortable: true },
                      {
                        key: "amount",
                        label: "Amount",
                        sortable: true,
                        format: (val) => formatCurrency(val),
                        align: "right",
                      },
                      {
                        key: "percentage",
                        label: "Percentage",
                        sortable: true,
                        format: (val) => `${val.toFixed(2)}%`,
                        align: "right",
                      },
                    ]}
                    title="Expenses by Category"
                  />
                </div>
              </ReportSection>
            </>
          )}
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-6">
          {data.reportType === "balance-sheet" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Assets"
                  value={formatCurrency(data.assets?.total || 0)}
                  icon={Wallet}
                />
                <MetricCard
                  title="Total Liabilities"
                  value={formatCurrency(data.liabilities?.total || 0)}
                  icon={TrendingDown}
                  iconColor="text-red-500"
                />
                <MetricCard
                  title="Total Equity"
                  value={formatCurrency(data.equity?.total || 0)}
                  icon={TrendingUp}
                  iconColor="text-green-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ReportSection title="Assets">
                  <DataTable
                    data={data.assets?.breakdown || []}
                    columns={[
                      { key: "name", label: "Account", sortable: true },
                      {
                        key: "balance",
                        label: "Balance",
                        sortable: true,
                        format: (val) => formatCurrency(val),
                        align: "right",
                      },
                    ]}
                  />
                </ReportSection>

                <ReportSection title="Liabilities">
                  <DataTable
                    data={data.liabilities?.breakdown || []}
                    columns={[
                      { key: "name", label: "Account", sortable: true },
                      {
                        key: "balance",
                        label: "Balance",
                        sortable: true,
                        format: (val) => formatCurrency(val),
                        align: "right",
                      },
                    ]}
                  />
                </ReportSection>

                <ReportSection title="Equity">
                  <DataTable
                    data={data.equity?.breakdown || []}
                    columns={[
                      { key: "name", label: "Account", sortable: true },
                      {
                        key: "balance",
                        label: "Balance",
                        sortable: true,
                        format: (val) => formatCurrency(val),
                        align: "right",
                      },
                    ]}
                  />
                </ReportSection>
              </div>
            </>
          )}
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cash-flow" className="space-y-6">
          {data.reportType === "cash-flow" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Beginning Cash"
                  value={formatCurrency(data.beginningCash || 0)}
                />
                <MetricCard
                  title="Net Cash from Operations"
                  value={formatCurrency(data.operatingActivities?.netCash || 0)}
                  icon={data.operatingActivities?.netCash >= 0 ? TrendingUp : TrendingDown}
                  iconColor={data.operatingActivities?.netCash >= 0 ? "text-green-500" : "text-red-500"}
                />
                <MetricCard
                  title="Net Change in Cash"
                  value={formatCurrency(data.netChangeInCash || 0)}
                  icon={data.netChangeInCash >= 0 ? TrendingUp : TrendingDown}
                  iconColor={data.netChangeInCash >= 0 ? "text-green-500" : "text-red-500"}
                />
                <MetricCard
                  title="Ending Cash"
                  value={formatCurrency(data.endingCash || 0)}
                />
              </div>

              <ReportSection title="Cash Flow Details">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Operating Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Cash Received:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(data.operatingActivities?.cashReceived || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cash Paid:</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(data.operatingActivities?.cashPaid || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Net Cash from Operations:</span>
                          <span className="font-bold">
                            {formatCurrency(data.operatingActivities?.netCash || 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Investing Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <span className="font-semibold">Net Cash from Investing:</span>
                        <span className="font-bold">
                          {formatCurrency(data.investingActivities?.netCash || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Financing Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <span className="font-semibold">Net Cash from Financing:</span>
                        <span className="font-bold">
                          {formatCurrency(data.financingActivities?.netCash || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ReportSection>
            </>
          )}
        </TabsContent>

        {/* Giving Summary */}
        <TabsContent value="giving-summary" className="space-y-6">
          {data.reportType === "giving-summary" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Giving"
                  value={formatCurrency(data.summary?.totalGiving || 0)}
                  icon={DollarSign}
                  iconColor="text-green-500"
                />
                <MetricCard
                  title="Total Donations"
                  value={data.summary?.totalDonations || 0}
                />
                <MetricCard
                  title="Average Donation"
                  value={formatCurrency(data.summary?.averageDonation || 0)}
                />
                <MetricCard
                  title="Unique Donors"
                  value={data.summary?.uniqueDonors || 0}
                />
              </div>

              <ReportSection title="Giving Trends">
                <LineChartComponent
                  data={
                    data.monthlyBreakdown?.map((item: any) => ({
                      name: item.month,
                      amount: item.amount,
                    })) || []
                  }
                  height={400}
                />
              </ReportSection>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportSection title="Giving by Category">
                  <PieChartComponent
                    data={
                      data.byCategory?.map((item: any) => ({
                        name: item.category,
                        value: item.total,
                      })) || []
                    }
                    height={300}
                  />
                  <div className="mt-4">
                    <DataTable
                      data={data.byCategory || []}
                      columns={[
                        { key: "category", label: "Category", sortable: true },
                        {
                          key: "total",
                          label: "Total",
                          sortable: true,
                          format: (val) => formatCurrency(val),
                          align: "right",
                        },
                        {
                          key: "count",
                          label: "Count",
                          sortable: true,
                          align: "right",
                        },
                        {
                          key: "percentage",
                          label: "Percentage",
                          sortable: true,
                          format: (val) => `${val.toFixed(2)}%`,
                          align: "right",
                        },
                      ]}
                    />
                  </div>
                </ReportSection>

                <ReportSection title="Giving by Payment Method">
                  <PieChartComponent
                    data={
                      data.byMethod?.map((item: any) => ({
                        name: item.method,
                        value: item.total,
                      })) || []
                    }
                    height={300}
                  />
                  <div className="mt-4">
                    <DataTable
                      data={data.byMethod || []}
                      columns={[
                        { key: "method", label: "Method", sortable: true },
                        {
                          key: "total",
                          label: "Total",
                          sortable: true,
                          format: (val) => formatCurrency(val),
                          align: "right",
                        },
                        {
                          key: "count",
                          label: "Count",
                          sortable: true,
                          align: "right",
                        },
                        {
                          key: "percentage",
                          label: "Percentage",
                          sortable: true,
                          format: (val) => `${val.toFixed(2)}%`,
                          align: "right",
                        },
                      ]}
                    />
                  </div>
                </ReportSection>
              </div>

              {data.topDonors && data.topDonors.length > 0 && (
                <ReportSection title="Top Donors">
                  <DataTable
                    data={data.topDonors}
                    columns={[
                      { key: "name", label: "Name", sortable: true },
                      { key: "email", label: "Email", sortable: true },
                      {
                        key: "total",
                        label: "Total Given",
                        sortable: true,
                        format: (val) => formatCurrency(val),
                        align: "right",
                      },
                      {
                        key: "count",
                        label: "Donations",
                        sortable: true,
                        align: "right",
                      },
                    ]}
                  />
                </ReportSection>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

