"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FamilyNameEditorProps {
  userId: string;
  currentFamilyName?: string | null;
  hasFamilyHead: boolean;
}

export function FamilyNameEditor({
  userId,
  currentFamilyName,
  hasFamilyHead,
}: FamilyNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [familyName, setFamilyName] = useState(currentFamilyName || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!hasFamilyHead) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Assign a family head first to set a family name
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        familyName: familyName.trim() || null,
      };
      console.log("Sending family name update:", payload);
      
      const res = await fetch(`/api/users/${userId}/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log("Response status:", res.status, res.statusText);

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        let errorMessage = "Failed to update family name";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await res.json();
            errorMessage = error.error || error.message || errorMessage;
            console.error("API Error:", error);
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
            console.error("API Error (non-JSON):", text);
          }
        } catch (parseError) {
          console.error("Error parsing API response:", parseError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error("Error updating family name:", error);
      alert(error?.message || "Failed to update family name. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFamilyName(currentFamilyName || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label htmlFor="familyName">Family Name</Label>
        <div className="flex gap-2">
          <Input
            id="familyName"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="e.g., The Smith Family"
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm text-gray-600 dark:text-gray-400">
          Family Name
        </Label>
        <p className="text-lg font-semibold">
          {currentFamilyName || "No family name set"}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="w-4 h-4 mr-2" />
        {currentFamilyName ? "Edit" : "Set Name"}
      </Button>
    </div>
  );
}

