import { UserRole } from "@prisma/client";

export interface DashboardWidget {
  id: string;
  title: string;
  component: string; // Component name to render
  requiredPermission?: {
    resource: string;
    action: string;
  };
  size: "small" | "medium" | "large" | "full";
  order: number;
  roles: UserRole[]; // Roles that can see this widget
}

export interface DashboardLayout {
  role: UserRole;
  widgets: DashboardWidget[];
  columns: 1 | 2 | 3 | 4;
}

// Dashboard configurations for each role
export const dashboardConfigs: Record<UserRole, DashboardLayout> = {
  ADMIN: {
    role: "ADMIN",
    columns: 4,
    widgets: [
      // System Overview KPIs
      {
        id: "total-members",
        title: "Total Members",
        component: "TotalMembersWidget",
        size: "small",
        order: 1,
        roles: ["ADMIN"],
      },
      {
        id: "weekly-giving",
        title: "This Week's Giving",
        component: "WeeklyGivingWidget",
        size: "small",
        order: 2,
        roles: ["ADMIN"],
      },
      {
        id: "service-attendance",
        title: "Service Attendance",
        component: "ServiceAttendanceWidget",
        size: "small",
        order: 3,
        roles: ["ADMIN"],
      },
      {
        id: "active-volunteers",
        title: "Active Volunteers",
        component: "ActiveVolunteersWidget",
        size: "small",
        order: 4,
        roles: ["ADMIN"],
      },
      // Financial Overview
      {
        id: "giving-summary",
        title: "Giving Summary",
        component: "GivingSummaryWidget",
        size: "medium",
        order: 5,
        roles: ["ADMIN"],
      },
      {
        id: "donor-management",
        title: "Donor Management",
        component: "DonorManagementWidget",
        size: "medium",
        order: 6,
        roles: ["ADMIN"],
      },
      {
        id: "fund-tracking",
        title: "Fund Tracking",
        component: "FundTrackingWidget",
        size: "medium",
        order: 7,
        roles: ["ADMIN"],
      },
      {
        id: "financial-reports",
        title: "Financial Reports",
        component: "FinancialReportsWidget",
        size: "large",
        order: 8,
        roles: ["ADMIN"],
      },
      // System Management
      {
        id: "user-management",
        title: "User Management",
        component: "UserManagementWidget",
        size: "medium",
        order: 9,
        roles: ["ADMIN"],
      },
      {
        id: "system-settings",
        title: "System Settings",
        component: "SystemSettingsWidget",
        size: "medium",
        order: 10,
        roles: ["ADMIN"],
      },
      {
        id: "audit-logs",
        title: "Audit Logs",
        component: "AuditLogsWidget",
        size: "large",
        order: 11,
        roles: ["ADMIN"],
      },
      // Events & Activities
      {
        id: "upcoming-events",
        title: "Upcoming Events",
        component: "UpcomingEventsWidget",
        size: "medium",
        order: 12,
        roles: ["ADMIN"],
      },
      {
        id: "event-registrations",
        title: "Event Registrations",
        component: "EventRegistrationsWidget",
        size: "medium",
        order: 13,
        roles: ["ADMIN"],
      },
      {
        id: "volunteer-assignments",
        title: "Volunteer Assignments",
        component: "VolunteerAssignmentsWidget",
        size: "large",
        order: 14,
        roles: ["ADMIN"],
      },
      {
        id: "resource-booking",
        title: "Resource Booking",
        component: "ResourceBookingWidget",
        size: "large",
        order: 15,
        roles: ["ADMIN"],
      },
      // Communications
      {
        id: "campaign-builder",
        title: "Campaign Builder",
        component: "CampaignBuilderWidget",
        size: "medium",
        order: 16,
        roles: ["ADMIN"],
      },
      {
        id: "engagement-metrics",
        title: "Engagement Metrics",
        component: "EngagementMetricsWidget",
        size: "medium",
        order: 17,
        roles: ["ADMIN"],
      },
      {
        id: "media-library",
        title: "Media Library",
        component: "MediaLibraryWidget",
        size: "medium",
        order: 18,
        roles: ["ADMIN"],
      },
      {
        id: "recent-campaigns",
        title: "Recent Campaigns",
        component: "RecentCampaignsWidget",
        size: "large",
        order: 19,
        roles: ["ADMIN"],
      },
      // Volunteers
      {
        id: "volunteer-pool",
        title: "Volunteer Pool",
        component: "VolunteerPoolWidget",
        size: "medium",
        order: 20,
        roles: ["ADMIN"],
      },
      {
        id: "scheduling-tool",
        title: "Scheduling Tool",
        component: "SchedulingToolWidget",
        size: "large",
        order: 21,
        roles: ["ADMIN"],
      },
      {
        id: "training-tracker",
        title: "Training Tracker",
        component: "TrainingTrackerWidget",
        size: "medium",
        order: 22,
        roles: ["ADMIN"],
      },
      // Pastoral & Engagement
      {
        id: "spiritual-milestones",
        title: "Spiritual Milestones",
        component: "SpiritualMilestonesWidget",
        size: "medium",
        order: 23,
        roles: ["ADMIN"],
      },
      {
        id: "member-engagement",
        title: "Member Engagement",
        component: "MemberEngagementWidget",
        size: "medium",
        order: 24,
        roles: ["ADMIN"],
      },
      {
        id: "prayer-requests",
        title: "Prayer Requests",
        component: "PrayerRequestsWidget",
        size: "large",
        order: 25,
        roles: ["ADMIN"],
      },
      // Reports Access
      {
        id: "reports-overview",
        title: "Reports Overview",
        component: "ReportsOverviewWidget",
        size: "full",
        order: 26,
        roles: ["ADMIN"],
      },
    ],
  },
  PASTOR: {
    role: "PASTOR",
    columns: 3,
    widgets: [
      {
        id: "total-members",
        title: "Total Members",
        component: "TotalMembersWidget",
        size: "small",
        order: 1,
        roles: ["PASTOR", "ADMIN"],
      },
      {
        id: "weekly-giving",
        title: "This Week's Giving",
        component: "WeeklyGivingWidget",
        size: "small",
        order: 2,
        roles: ["PASTOR", "ADMIN"],
      },
      {
        id: "service-attendance",
        title: "Service Attendance",
        component: "ServiceAttendanceWidget",
        size: "small",
        order: 3,
        roles: ["PASTOR", "ADMIN"],
      },
      {
        id: "spiritual-milestones",
        title: "Spiritual Milestones",
        component: "SpiritualMilestonesWidget",
        size: "medium",
        order: 4,
        roles: ["PASTOR", "ADMIN"],
      },
      {
        id: "member-engagement",
        title: "Member Engagement",
        component: "MemberEngagementWidget",
        size: "medium",
        order: 5,
        roles: ["PASTOR", "ADMIN"],
      },
      {
        id: "prayer-requests",
        title: "Prayer Requests",
        component: "PrayerRequestsWidget",
        size: "large",
        order: 6,
        roles: ["PASTOR", "ADMIN"],
      },
    ],
  },
  LEADER: {
    role: "LEADER",
    columns: 3,
    widgets: [
      {
        id: "group-roster",
        title: "Group Roster",
        component: "GroupRosterWidget",
        requiredPermission: { resource: "groups", action: "view" },
        size: "medium",
        order: 1,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "group-attendance",
        title: "Group Attendance",
        component: "GroupAttendanceWidget",
        requiredPermission: { resource: "groups", action: "view" },
        size: "small",
        order: 2,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "communication-panel",
        title: "Communication Panel",
        component: "CommunicationPanelWidget",
        requiredPermission: { resource: "communications", action: "view" },
        size: "medium",
        order: 3,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "group-events",
        title: "Group Events",
        component: "GroupEventsWidget",
        requiredPermission: { resource: "events", action: "view" },
        size: "large",
        order: 4,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
  MEMBER: {
    role: "MEMBER",
    columns: 2,
    widgets: [
      {
        id: "my-profile",
        title: "My Profile",
        component: "MyProfileWidget",
        size: "medium",
        order: 1,
        roles: ["MEMBER", "LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "my-groups",
        title: "My Groups",
        component: "MyGroupsWidget",
        size: "medium",
        order: 2,
        roles: ["MEMBER", "LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "upcoming-events",
        title: "Upcoming Events",
        component: "UpcomingEventsWidget",
        size: "full",
        order: 3,
        roles: ["MEMBER", "LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
  GUEST: {
    role: "GUEST",
    columns: 1,
    widgets: [
      {
        id: "welcome",
        title: "Welcome",
        component: "WelcomeWidget",
        size: "full",
        order: 1,
        roles: ["GUEST", "MEMBER", "LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
};

// Specialized dashboard configs based on permissions
export const specializedDashboards = {
  FINANCE_ADMIN: {
    widgets: [
      {
        id: "giving-summary",
        title: "Giving Summary",
        component: "GivingSummaryWidget",
        requiredPermission: { resource: "donations", action: "view" },
        size: "medium",
        order: 1,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "donor-management",
        title: "Donor Management",
        component: "DonorManagementWidget",
        requiredPermission: { resource: "donations", action: "manage" },
        size: "large",
        order: 2,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "fund-tracking",
        title: "Fund Tracking",
        component: "FundTrackingWidget",
        requiredPermission: { resource: "donations", action: "view" },
        size: "medium",
        order: 3,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "financial-reports",
        title: "Financial Reports",
        component: "FinancialReportsWidget",
        requiredPermission: { resource: "reports", action: "view" },
        size: "full",
        order: 4,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
  EVENT_COORDINATOR: {
    widgets: [
      {
        id: "upcoming-events",
        title: "Upcoming Events",
        component: "UpcomingEventsWidget",
        requiredPermission: { resource: "events", action: "view" },
        size: "medium",
        order: 1,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "event-registrations",
        title: "Event Registrations",
        component: "EventRegistrationsWidget",
        requiredPermission: { resource: "events", action: "manage" },
        size: "medium",
        order: 2,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "volunteer-assignments",
        title: "Volunteer Assignments",
        component: "VolunteerAssignmentsWidget",
        requiredPermission: { resource: "volunteers", action: "view" },
        size: "large",
        order: 3,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "resource-booking",
        title: "Resource Booking",
        component: "ResourceBookingWidget",
        requiredPermission: { resource: "events", action: "manage" },
        size: "full",
        order: 4,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
  COMMUNICATIONS_ADMIN: {
    widgets: [
      {
        id: "campaign-builder",
        title: "Campaign Builder",
        component: "CampaignBuilderWidget",
        requiredPermission: { resource: "communications", action: "manage" },
        size: "large",
        order: 1,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "engagement-metrics",
        title: "Engagement Metrics",
        component: "EngagementMetricsWidget",
        requiredPermission: { resource: "communications", action: "view" },
        size: "medium",
        order: 2,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "media-library",
        title: "Media Library",
        component: "MediaLibraryWidget",
        requiredPermission: { resource: "communications", action: "view" },
        size: "medium",
        order: 3,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "recent-campaigns",
        title: "Recent Campaigns",
        component: "RecentCampaignsWidget",
        requiredPermission: { resource: "communications", action: "view" },
        size: "full",
        order: 4,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
  VOLUNTEER_MANAGER: {
    widgets: [
      {
        id: "volunteer-pool",
        title: "Volunteer Pool",
        component: "VolunteerPoolWidget",
        requiredPermission: { resource: "volunteers", action: "view" },
        size: "large",
        order: 1,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "scheduling-tool",
        title: "Scheduling Tool",
        component: "SchedulingToolWidget",
        requiredPermission: { resource: "volunteers", action: "manage" },
        size: "full",
        order: 2,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
      {
        id: "training-tracker",
        title: "Training Tracker",
        component: "TrainingTrackerWidget",
        requiredPermission: { resource: "volunteers", action: "view" },
        size: "medium",
        order: 3,
        roles: ["LEADER", "PASTOR", "ADMIN"],
      },
    ],
  },
};

// Get dashboard config for a user based on their role and permissions
export function getDashboardConfig(
  role: UserRole,
  permissions?: { resource: string; action: string }[]
): DashboardLayout {
  const baseConfig = dashboardConfigs[role] || dashboardConfigs.GUEST;
  
  // Filter widgets based on permissions
  const filteredWidgets = baseConfig.widgets.filter((widget) => {
    // If widget has no permission requirement, show it
    if (!widget.requiredPermission) return true;
    
    // Check if user has the required permission
    if (permissions) {
      return permissions.some(
        (p) =>
          p.resource === widget.requiredPermission?.resource &&
          p.action === widget.requiredPermission?.action
      );
    }
    
    // If no permissions provided, show widget (will be filtered by role)
    return true;
  });
  
  return {
    ...baseConfig,
    widgets: filteredWidgets.sort((a, b) => a.order - b.order),
  };
}

// Get specialized dashboard if user has specific permissions
export function getSpecializedDashboard(
  role: UserRole,
  permissions?: { resource: string; action: string }[]
): DashboardLayout | null {
  // Check for Finance Admin
  if (
    permissions?.some(
      (p) => p.resource === "donations" && p.action === "manage"
    )
  ) {
    return {
      role,
      columns: 3,
      widgets: specializedDashboards.FINANCE_ADMIN.widgets.filter((w) =>
        w.roles.includes(role)
      ),
    };
  }
  
  // Check for Event Coordinator
  if (
    permissions?.some(
      (p) => p.resource === "events" && p.action === "manage"
    )
  ) {
    return {
      role,
      columns: 3,
      widgets: specializedDashboards.EVENT_COORDINATOR.widgets.filter((w) =>
        w.roles.includes(role)
      ),
    };
  }
  
  // Check for Communications Admin
  if (
    permissions?.some(
      (p) => p.resource === "communications" && p.action === "manage"
    )
  ) {
    return {
      role,
      columns: 3,
      widgets: specializedDashboards.COMMUNICATIONS_ADMIN.widgets.filter((w) =>
        w.roles.includes(role)
      ),
    };
  }
  
  // Check for Volunteer Manager
  if (
    permissions?.some(
      (p) => p.resource === "volunteers" && p.action === "manage"
    )
  ) {
    return {
      role,
      columns: 3,
      widgets: specializedDashboards.VOLUNTEER_MANAGER.widgets.filter((w) =>
        w.roles.includes(role)
      ),
    };
  }
  
  return null;
}

