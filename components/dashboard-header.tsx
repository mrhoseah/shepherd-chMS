"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import { GlobalSearch } from "@/components/global-search";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="hidden md:block flex-1 max-w-2xl mx-4">
            <GlobalSearch />
          </div>
          <NotificationsBell />
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

