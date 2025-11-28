"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChurchContext {
  churchId: string;
  churchName: string;
  churchLogo?: string | null;
}

const SYSTEM_ROLES = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];

export function SystemAdminIndicator() {
  const { data: session } = useSession();
  const [context, setContext] = useState<ChurchContext | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role;
  const isSystemAdmin = SYSTEM_ROLES.includes(userRole);

  useEffect(() => {
    if (!isSystemAdmin) {
      setLoading(false);
      return;
    }

    fetchContext();
  }, [isSystemAdmin]);

  const fetchContext = async () => {
    try {
      const response = await fetch("/api/admin/switch-church");
      if (response.ok) {
        const data = await response.json();
        setContext(data.currentContext || null);
      }
    } catch (error) {
      console.error("Error fetching context:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSystemAdmin || loading || !context) {
    return null;
  }

  return (
    <Alert className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {context.churchLogo ? (
            <img
              src={context.churchLogo}
              alt={context.churchName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
              {context.churchName.charAt(0)}
            </div>
          )}
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            System Admin: Currently managing <strong>{context.churchName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
          <AlertCircle className="w-3 h-3" />
          Admin Access
        </div>
      </AlertDescription>
    </Alert>
  );
}
