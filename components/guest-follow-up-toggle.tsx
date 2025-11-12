"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface GuestFollowUpToggleProps {
  guestId: string;
  enabled: boolean;
}

export function GuestFollowUpToggle({
  guestId,
  enabled: initialEnabled,
}: GuestFollowUpToggleProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/people/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enableFollowUps: checked }),
      });

      if (response.ok) {
        setEnabled(checked);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update follow-up setting");
      }
    } catch (error) {
      console.error("Error updating follow-up setting:", error);
      alert("Failed to update follow-up setting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="enableFollowUps"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
        <div>
          <Label
            htmlFor="enableFollowUps"
            className="text-sm font-medium cursor-pointer"
          >
            Enable Follow-up Tracking
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            {enabled
              ? "Follow-ups and visits will be tracked for this guest"
              : "Follow-ups and visits will not be tracked for this guest"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : enabled ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}

