"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Residence {
  id: string;
  name: string;
}

interface ResidenceComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ResidenceCombobox({
  value,
  onValueChange,
  placeholder = "Select or add residence...",
}: ResidenceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newResidenceName, setNewResidenceName] = useState("");
  const [adding, setAdding] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch residences
  const fetchResidences = async (search: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append("search", search);
      }
      params.append("limit", "50");

      const response = await fetch(`/api/residences?${params}`);
      const data = await response.json();

      if (response.ok) {
        setResidences(data.residences || []);
      }
    } catch (error) {
      console.error("Error fetching residences:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchResidences();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (open) {
        fetchResidences(searchQuery);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, open]);

  // Refresh when dialog opens
  useEffect(() => {
    if (open) {
      fetchResidences(searchQuery);
      // Focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  const handleAddResidence = async () => {
    if (!newResidenceName.trim()) {
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/residences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newResidenceName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add to local state
        const newResidence: Residence = {
          id: data.id,
          name: data.name,
        };
        setResidences((prev) => [...prev, newResidence].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Select the new residence
        onValueChange(newResidence.name);
        
        // Close dialogs
        setShowAddDialog(false);
        setNewResidenceName("");
        setOpen(false);
      } else {
        alert(data.error || "Failed to add residence");
      }
    } catch (error) {
      console.error("Error adding residence:", error);
      alert("Failed to add residence");
    } finally {
      setAdding(false);
    }
  };

  const filteredResidences = residences.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedResidence = residences.find((r) => r.name === value);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value || ""}
        onChange={(e) => {
          // Allow typing to search
          setSearchQuery(e.target.value);
          if (!open) {
            setOpen(true);
          }
        }}
        onFocus={() => {
          if (!open) {
            setOpen(true);
          }
        }}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <Input
              placeholder="Search residences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : filteredResidences.length > 0 ? (
              <div>
                {filteredResidences.map((residence) => (
                  <div
                    key={residence.id}
                    onClick={() => {
                      onValueChange(residence.name);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      value === residence.name
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    {value === residence.name && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                    <span className={value === residence.name ? "font-medium" : ""}>
                      {residence.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm">
                <p className="mb-2 text-gray-500">No residences found.</p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewResidenceName(searchQuery);
                      setShowAddDialog(true);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add "{searchQuery}"
                  </Button>
                )}
              </div>
            )}
            <div className="border-t p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  setShowAddDialog(true);
                  setOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Add New Residence
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpen(false);
            setSearchQuery("");
          }}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Residence</DialogTitle>
            <DialogDescription>
              Add a new residence to the system. It will be available for all members and used for group assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="residenceName">Residence Name</Label>
              <Input
                id="residenceName"
                value={newResidenceName}
                onChange={(e) => setNewResidenceName(e.target.value)}
                placeholder="e.g., Westlands, Karen, Runda"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddResidence();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewResidenceName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddResidence}
                disabled={!newResidenceName.trim() || adding}
              >
                {adding ? "Adding..." : "Add Residence"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
