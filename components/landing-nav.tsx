"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { appConfig } from "@/lib/app-config";

export function LandingNav() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4m8-8a8 8 0 00-8 8 8 8 0 0016 0 8 8 0 00-8-8z"
                  />
                </svg>
              </div>
            </Link>
            <Link href="/">
              <span className="text-xl font-bold text-gray-900">
                {appConfig.name}
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signin">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

