"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

interface AssignFamilyHeadDialogProps {
  userId: string;
  currentFamilyHead?: FamilyMember | null;
  familyMembers: FamilyMember[];
}

export function AssignFamilyHeadDialog({
  userId,
  currentFamilyHead,
  familyMembers,
}: AssignFamilyHeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHeadId, setSelectedHeadId] = useState<string>(
    currentFamilyHead?.id || "__none__"
  );
  const router = useRouter();

  useEffect(() => {
    setSelectedHeadId(currentFamilyHead?.id || "__none__");
  }, [currentFamilyHead]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${userId}/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyHeadId: selectedHeadId === "__none__" ? null : selectedHeadId || null,
        }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to assign family head");
      }
    } catch (error) {
      console.error("Error assigning family head:", error);
      alert("Failed to assign family head");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Crown className="w-4 h-4 mr-2" />
          {currentFamilyHead ? "Change Family Head" : "Assign Family Head"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Family Head</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="familyHead">Select Family Head</Label>
            <Select
              value={selectedHeadId}
              onValueChange={setSelectedHeadId}
            >
              <SelectTrigger id="familyHead" className="mt-1">
                <SelectValue placeholder="Select a family member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (Remove Family Head)</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                    {member.email && ` (${member.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              The family head will be assigned to all family members
            </p>
          </div>

          {currentFamilyHead && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Current Family Head:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {currentFamilyHead.firstName} {currentFamilyHead.lastName}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedHeadId && selectedHeadId !== "__none__" ? "Assign" : "Remove"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

