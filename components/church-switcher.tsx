"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  Check,
  X,
  Loader2,
  Search,
  MapPin,
  Users,
  Crown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChurchContext {
  churchId: string;
  churchName: string;
  churchLogo?: string | null;
}

interface Church {
  id: string;
  name: string;
  logo: string | null;
  location: string;
  isActive: boolean;
  plan: string;
  status: string;
  memberCount: number;
  createdAt: string;
}

const SYSTEM_ROLES = ["SUPERADMIN", "SYSTEM_ADMIN", "SYSTEM_SUPPORT"];

export function ChurchSwitcher() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<Church[]>([]);
  const [currentContext, setCurrentContext] = useState<ChurchContext | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role;
  const isSystemAdmin = SYSTEM_ROLES.includes(userRole);

  // Don't render if not a system admin
  if (!isSystemAdmin) {
    return null;
  }

  useEffect(() => {
    if (open) {
      fetchChurches();
    }
  }, [open]);

  const fetchChurches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/switch-church");
      if (!response.ok) {
        throw new Error("Failed to fetch churches");
      }
      const data = await response.json();
      setChurches(data.churches || []);
      setCurrentContext(data.currentContext || null);
    } catch (error: any) {
      console.error("Error fetching churches:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchToChurch = async (churchId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/switch-church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to switch church");
      }

      const data = await response.json();
      setCurrentContext(data.context);
      setOpen(false);
      
      // Refresh the page to load new church context
      router.refresh();
    } catch (error: any) {
      console.error("Error switching church:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearContext = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/switch-church", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear church context");
      }

      setCurrentContext(null);
      setOpen(false);
      
      // Refresh the page
      router.refresh();
    } catch (error: any) {
      console.error("Error clearing context:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredChurches = churches.filter((church) =>
    church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    church.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "PREMIUM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BASIC":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm truncate">
              {currentContext ? currentContext.churchName : "Select Church"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Switch Church Context
          </DialogTitle>
          <DialogDescription>
            Select a church to manage. You can switch context anytime or return to system view.
          </DialogDescription>
        </DialogHeader>

        {currentContext && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              {currentContext.churchLogo ? (
                <img
                  src={currentContext.churchLogo}
                  alt={currentContext.churchName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {currentContext.churchName.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-sm font-medium">Currently managing</div>
                <div className="text-xs text-muted-foreground">
                  {currentContext.churchName}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearContext}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search churches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredChurches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Building2 className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "No churches found" : "No churches available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChurches.map((church) => (
                <button
                  key={church.id}
                  onClick={() => switchToChurch(church.id)}
                  disabled={loading || church.id === currentContext?.churchId}
                  className="w-full p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    {church.logo ? (
                      <img
                        src={church.logo}
                        alt={church.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {church.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {church.name}
                        </h4>
                        {church.id === currentContext?.churchId && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {church.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{church.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getPlanColor(church.plan)}`}
                        >
                          {church.plan === "ENTERPRISE" && (
                            <Crown className="w-3 h-3 mr-1" />
                          )}
                          {church.plan}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{church.memberCount} members</span>
                        </div>
                        {!church.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
