"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  MapPin,
  Users,
  Crown,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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

interface ChurchPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChurchPickerDialog({ open, onOpenChange }: ChurchPickerDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<Church[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [switchingChurch, setSwitchingChurch] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchChurches();
    }
  }, [open]);

  const fetchChurches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/switch-church");
      if (!response.ok) {
        throw new Error("Failed to fetch churches");
      }
      const data = await response.json();
      setChurches(data.churches || []);
    } catch (error: any) {
      console.error("Error fetching churches:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChurch = async (churchId: string, churchName: string) => {
    setSwitchingChurch(churchId);
    
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

      toast({
        title: "Switched Successfully",
        description: `Now managing ${churchName}`,
      });

      // Close dialog
      onOpenChange(false);

      // Small delay then redirect with full page reload
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Error switching church:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSwitchingChurch(null);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Select a Church to Manage
          </DialogTitle>
          <DialogDescription>
            Choose a church to switch context and access its dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search churches by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[450px] pr-4">
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
                  onClick={() => handleSelectChurch(church.id, church.name)}
                  disabled={switchingChurch !== null}
                  className="w-full p-4 rounded-lg border hover:bg-accent hover:border-primary transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-start gap-3">
                    {church.logo ? (
                      <img
                        src={church.logo}
                        alt={church.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {church.name.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-base truncate">
                          {church.name}
                        </h4>
                        {switchingChurch === church.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
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
