"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { DashboardWidget } from "@/lib/dashboard-config";

// Import widget components
import { TotalMembersWidget } from "./widgets/total-members-widget";
import { WeeklyGivingWidget } from "./widgets/weekly-giving-widget";
import { ServiceAttendanceWidget } from "./widgets/service-attendance-widget";
import { ActiveVolunteersWidget } from "./widgets/active-volunteers-widget";
import { UpcomingEventsWidget } from "./widgets/upcoming-events-widget";
// ADMIN widgets
import { UserManagementWidget } from "./widgets/user-management-widget";
import { SystemSettingsWidget } from "./widgets/system-settings-widget";
import { AuditLogsWidget } from "./widgets/audit-logs-widget";
import { ReportsOverviewWidget } from "./widgets/reports-overview-widget";
// PASTOR widgets
import { SpiritualMilestonesWidget } from "./widgets/spiritual-milestones-widget";
import { MemberEngagementWidget } from "./widgets/member-engagement-widget";
import { PrayerRequestsWidget } from "./widgets/prayer-requests-widget";
// LEADER widgets
import { GroupRosterWidget } from "./widgets/group-roster-widget";
import { GroupAttendanceWidget } from "./widgets/group-attendance-widget";
import { CommunicationPanelWidget } from "./widgets/communication-panel-widget";
import { GroupEventsWidget } from "./widgets/group-events-widget";
// MEMBER widgets
import { MyProfileWidget } from "./widgets/my-profile-widget";
import { MyGroupsWidget } from "./widgets/my-groups-widget";
import { WelcomeWidget } from "./widgets/welcome-widget";
// Specialized widgets
import { GivingSummaryWidget } from "./widgets/giving-summary-widget";
import { DonorManagementWidget } from "./widgets/donor-management-widget";
import { FundTrackingWidget } from "./widgets/fund-tracking-widget";
import { FinancialReportsWidget } from "./widgets/financial-reports-widget";
// Events widgets
import { EventRegistrationsWidget } from "./widgets/event-registrations-widget";
import { VolunteerAssignmentsWidget } from "./widgets/volunteer-assignments-widget";
import { ResourceBookingWidget } from "./widgets/resource-booking-widget";
// Communications widgets
import { CampaignBuilderWidget } from "./widgets/campaign-builder-widget";
import { EngagementMetricsWidget } from "./widgets/engagement-metrics-widget";
import { MediaLibraryWidget } from "./widgets/media-library-widget";
import { RecentCampaignsWidget } from "./widgets/recent-campaigns-widget";
// Volunteers widgets
import { VolunteerPoolWidget } from "./widgets/volunteer-pool-widget";
import { SchedulingToolWidget } from "./widgets/scheduling-tool-widget";
import { TrainingTrackerWidget } from "./widgets/training-tracker-widget";

interface DashboardConfig {
  role: string;
  widgets: DashboardWidget[];
  columns: 1 | 2 | 3 | 4;
}

export function RoleBasedDashboard() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardConfig();
  }, []);

  const fetchDashboardConfig = async () => {
    try {
      const res = await fetch("/api/dashboard/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      } else {
        console.error("Failed to fetch dashboard config:", res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error fetching dashboard config:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const handleRetry = () => {
    setLoading(true);
    setConfig(null);
    fetchDashboardConfig();
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Failed to load dashboard configuration</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!config.widgets || config.widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">No widgets configured for your role</p>
        <p className="text-sm text-gray-400">Contact your administrator to configure your dashboard</p>
      </div>
    );
  }

  const getGridCols = (columns: number) => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  const getWidgetSize = (size: string) => {
    switch (size) {
      case "small":
        return "col-span-1";
      case "medium":
        return "col-span-1 md:col-span-2";
      case "large":
        return "col-span-1 md:col-span-2 lg:col-span-3";
      case "full":
        return "col-span-full";
      default:
        return "col-span-1";
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    const widgetProps = { widgetId: widget.id };
    
    switch (widget.component) {
      // Core widgets
      case "TotalMembersWidget":
        return <TotalMembersWidget key={widget.id} {...widgetProps} />;
      case "WeeklyGivingWidget":
        return <WeeklyGivingWidget key={widget.id} {...widgetProps} />;
      case "ServiceAttendanceWidget":
        return <ServiceAttendanceWidget key={widget.id} {...widgetProps} />;
      case "ActiveVolunteersWidget":
        return <ActiveVolunteersWidget key={widget.id} {...widgetProps} />;
      case "UpcomingEventsWidget":
        return <UpcomingEventsWidget key={widget.id} {...widgetProps} />;
      // ADMIN widgets
      case "UserManagementWidget":
        return <UserManagementWidget key={widget.id} {...widgetProps} />;
      case "SystemSettingsWidget":
        return <SystemSettingsWidget key={widget.id} {...widgetProps} />;
      case "AuditLogsWidget":
        return <AuditLogsWidget key={widget.id} {...widgetProps} />;
      case "ReportsOverviewWidget":
        return <ReportsOverviewWidget key={widget.id} {...widgetProps} />;
      // PASTOR widgets
      case "SpiritualMilestonesWidget":
        return <SpiritualMilestonesWidget key={widget.id} {...widgetProps} />;
      case "MemberEngagementWidget":
        return <MemberEngagementWidget key={widget.id} {...widgetProps} />;
      case "PrayerRequestsWidget":
        return <PrayerRequestsWidget key={widget.id} {...widgetProps} />;
      // LEADER widgets
      case "GroupRosterWidget":
        return <GroupRosterWidget key={widget.id} {...widgetProps} />;
      case "GroupAttendanceWidget":
        return <GroupAttendanceWidget key={widget.id} {...widgetProps} />;
      case "CommunicationPanelWidget":
        return <CommunicationPanelWidget key={widget.id} {...widgetProps} />;
      case "GroupEventsWidget":
        return <GroupEventsWidget key={widget.id} {...widgetProps} />;
      // MEMBER widgets
      case "MyProfileWidget":
        return <MyProfileWidget key={widget.id} {...widgetProps} />;
      case "MyGroupsWidget":
        return <MyGroupsWidget key={widget.id} {...widgetProps} />;
      case "WelcomeWidget":
        return <WelcomeWidget key={widget.id} {...widgetProps} />;
      // Specialized widgets
      case "GivingSummaryWidget":
        return <GivingSummaryWidget key={widget.id} {...widgetProps} />;
      case "DonorManagementWidget":
        return <DonorManagementWidget key={widget.id} {...widgetProps} />;
      case "FundTrackingWidget":
        return <FundTrackingWidget key={widget.id} {...widgetProps} />;
      case "FinancialReportsWidget":
        return <FinancialReportsWidget key={widget.id} {...widgetProps} />;
      // Events widgets
      case "EventRegistrationsWidget":
        return <EventRegistrationsWidget key={widget.id} {...widgetProps} />;
      case "VolunteerAssignmentsWidget":
        return <VolunteerAssignmentsWidget key={widget.id} {...widgetProps} />;
      case "ResourceBookingWidget":
        return <ResourceBookingWidget key={widget.id} {...widgetProps} />;
      // Communications widgets
      case "CampaignBuilderWidget":
        return <CampaignBuilderWidget key={widget.id} {...widgetProps} />;
      case "EngagementMetricsWidget":
        return <EngagementMetricsWidget key={widget.id} {...widgetProps} />;
      case "MediaLibraryWidget":
        return <MediaLibraryWidget key={widget.id} {...widgetProps} />;
      case "RecentCampaignsWidget":
        return <RecentCampaignsWidget key={widget.id} {...widgetProps} />;
      // Volunteers widgets
      case "VolunteerPoolWidget":
        return <VolunteerPoolWidget key={widget.id} {...widgetProps} />;
      case "SchedulingToolWidget":
        return <SchedulingToolWidget key={widget.id} {...widgetProps} />;
      case "TrainingTrackerWidget":
        return <TrainingTrackerWidget key={widget.id} {...widgetProps} />;
      default:
        return (
          <Card key={widget.id} className={getWidgetSize(widget.size)}>
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Widget component not implemented: {widget.component}</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {config.widgets && config.widgets.length > 0 ? (
        <div className={`grid ${getGridCols(config.columns)} gap-6`}>
          {config.widgets.map((widget) => renderWidget(widget))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No widgets available</p>
        </div>
      )}
    </div>
  );
}

