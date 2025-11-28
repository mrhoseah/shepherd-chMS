"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManageChurchButtonProps {
  churchId: string;
  churchName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function ManageChurchButton({
  churchId,
  churchName,
  variant = "default",
  size = "sm",
  className = "",
  showIcon = true,
}: ManageChurchButtonProps) {
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleManage = async () => {
    setSwitching(true);

    try {
      // Switch church context
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

      // Small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard with full page reload to ensure cookie is read
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSwitching(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleManage}
      disabled={switching}
      className={className}
    >
      {switching ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Switching...
        </>
      ) : (
        <>
          {showIcon && <Settings className="w-4 h-4 mr-1" />}
          Manage
        </>
      )}
    </Button>
  );
}
