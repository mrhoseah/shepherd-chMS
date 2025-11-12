"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appConfig } from "@/lib/app-config";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Calendar,
  Mail,
  Settings,
  Church,
  FileText,
  Building,
  ClipboardCheck,
  Image,
  Shield,
  Layers,
  TrendingUp,
  Workflow,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "People", url: "/dashboard/people", icon: Users },
  { title: "Groups", url: "/dashboard/groups", icon: Users },
  { title: "Departments", url: "/dashboard/departments", icon: Building },
  { title: "Giving & Finance", url: "/dashboard/donations", icon: Wallet },
  { title: "Events & Calendar", url: "/dashboard/events", icon: Calendar },
  { title: "Attendance", url: "/dashboard/attendance", icon: ClipboardCheck },
  { title: "Communications", url: "/dashboard/communications", icon: Mail },
  { title: "Media Library", url: "/dashboard/media", icon: Image },
  { title: "Documents", url: "/dashboard/documents", icon: FileText },
];

const analyticsNavItems: NavItem[] = [
  { title: "Analytics", url: "/dashboard/analytics", icon: TrendingUp },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
];

const adminNavItems: NavItem[] = [
  { title: "Workflows", url: "/dashboard/workflows", icon: Workflow },
  { title: "Bulk Operations", url: "/dashboard/bulk-operations", icon: Layers },
  { title: "Audit Logs", url: "/dashboard/audit-logs", icon: Shield },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Check if a path is active (handles query params and nested routes)
  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground">
              <Link href="/dashboard">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                  <Church className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">{appConfig.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{appConfig.tagline}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={`${item.url}-${index}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="group relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
                    >
                      <Link href={item.url}>
                        <Icon className="size-4 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Analytics & Insights */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Analytics & Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNavItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={`${item.url}-${index}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="group relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
                    >
                      <Link href={item.url}>
                        <Icon className="size-4 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Administration */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={`${item.url}-${index}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="group relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
                    >
                      <Link href={item.url}>
                        <Icon className="size-4 transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
