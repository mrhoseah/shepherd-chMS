"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { LogOut, User, Settings, ChevronDown, Shield, Building2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChurchPickerDialog } from "@/components/church-picker-dialog";

const SYSTEM_ROLES = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];

export function UserMenu() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [churchPickerOpen, setChurchPickerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || status === "loading") {
    return (
      <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shadow-md bg-gray-400 animate-pulse" />
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 w-20 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="text-xs text-gray-500 w-16 h-3 bg-gray-200 rounded mt-1 animate-pulse" />
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const firstName = userName.split(" ")[0];
  const userRole = (session?.user as any)?.role || "User";
  const isSuperAdmin = userRole === "SUPERADMIN";
  const isSystemAdmin = SYSTEM_ROLES.includes(userRole);

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shadow-md" style={{ backgroundColor: "#1E40AF" }}>
            {userInitial}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {firstName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {userRole}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isSuperAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/sys-591f98aa001826fc" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>System Admin</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isSystemAdmin && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setChurchPickerOpen(true)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Church Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

      {/* Church Picker Dialog */}
      <ChurchPickerDialog 
        open={churchPickerOpen} 
        onOpenChange={setChurchPickerOpen}
      />
    </>
  );
}

