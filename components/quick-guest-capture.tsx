"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TITLES, COUNTRIES, KENYAN_COUNTIES } from "@/lib/guest-form-data";

export function QuickGuestCapture() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    residence: "",
    city: "",
    county: "",
    country: "",
    enableFollowUps: true, // Default to true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required");
      setLoading(false);
      return;
    }

    if (!formData.email && !formData.phone) {
      setError("Please provide either an email or phone number");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/guest/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to register guest");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setFormData({ title: "", firstName: "", lastName: "", email: "", phone: "", residence: "", city: "", county: "", country: "", enableFollowUps: true });
      router.refresh();
      }, 1500);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSuccess(false);
      setError("");
      setFormData({ title: "", firstName: "", lastName: "", email: "", phone: "", residence: "", city: "", county: "", country: "", enableFollowUps: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Quick Guest Capture
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Guest Registration</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-sm font-medium">Guest registered successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="qg-title">Title</Label>
              <Select
                value={formData.title}
                onValueChange={(value) =>
                  setFormData({ ...formData, title: value })
                }
              >
                <SelectTrigger id="qg-title" className="w-full">
                  <SelectValue placeholder="Select title (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {TITLES.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qg-firstName">First Name *</Label>
                <Input
                  id="qg-firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  placeholder="John"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="qg-lastName">Last Name *</Label>
                <Input
                  id="qg-lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="qg-email">Email</Label>
              <Input
                id="qg-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="qg-phone">Phone</Label>
              <Input
                id="qg-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+254 700 000 000"
              />
            </div>

            <div>
              <Label htmlFor="qg-residence">Residence / Area</Label>
              <Input
                id="qg-residence"
                value={formData.residence}
                onChange={(e) =>
                  setFormData({ ...formData, residence: e.target.value })
                }
                placeholder="e.g., Westlands, Karen"
              />
            </div>

            <div>
              <Label htmlFor="qg-country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              >
                <SelectTrigger id="qg-country" className="w-full">
                  <SelectValue placeholder="Select country (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="qg-county">County</Label>
              <Select
                value={formData.county}
                onValueChange={(value) =>
                  setFormData({ ...formData, county: value })
                }
                disabled={formData.country !== "Kenya" && formData.country !== ""}
              >
                <SelectTrigger id="qg-county" className="w-full">
                  <SelectValue placeholder={formData.country === "Kenya" ? "Select county (optional)" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {KENYAN_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="qg-city">City</Label>
              <Input
                id="qg-city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="e.g., Nairobi"
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Checkbox
                id="qg-enableFollowUps"
                checked={formData.enableFollowUps}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableFollowUps: checked === true })
                }
              />
              <Label
                htmlFor="qg-enableFollowUps"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable follow-up tracking
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: "#1E40AF" }}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Guest"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

