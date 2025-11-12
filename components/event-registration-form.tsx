"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface EventRegistrationFormProps {
  eventId: string;
  eventTitle: string;
  requiresRegistration: boolean;
  capacity?: number | null;
  currentRegistrations?: number;
  onSuccess?: () => void;
}

export function EventRegistrationForm({
  eventId,
  eventTitle,
  requiresRegistration,
  capacity,
  currentRegistrations,
  onSuccess,
}: EventRegistrationFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    ministry: "",
    country: "",
    phone: "",
    email: "",
    needsAccommodation: false,
    notes: "",
  });

  // If user is logged in, pre-fill with their info
  useEffect(() => {
    if (session?.user && !formData.name && !formData.email) {
      const userName = (session.user as any).name || "";
      const userEmail = session.user.email || "";
      setFormData((prev) => ({
        ...prev,
        name: userName,
        email: userEmail,
      }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userId = (session?.user as any)?.id || null;
      const body: any = {
        ...formData,
        userId,
      };

      // Remove empty fields
      Object.keys(body).forEach((key) => {
        if (body[key] === "") {
          delete body[key];
        }
      });

      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register for event");
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setError(error.message || "Failed to register for event");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold">Registration Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You have successfully registered for {eventTitle}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!requiresRegistration) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-600 dark:text-gray-400">
            This event does not require registration.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isAtCapacity = capacity && currentRegistrations && currentRegistrations >= capacity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for {eventTitle}</CardTitle>
        <CardDescription>
          {isAtCapacity
            ? "This event is at full capacity"
            : capacity
            ? `${currentRegistrations || 0} of ${capacity} spots filled`
            : "Fill in your details to register"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              disabled={loading || isAtCapacity}
            />
          </div>

          <div>
            <Label htmlFor="ministry">Ministry/Church</Label>
            <Input
              id="ministry"
              value={formData.ministry}
              onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
              placeholder="Your ministry or church name"
              disabled={loading || isAtCapacity}
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Kenya"
              disabled={loading || isAtCapacity}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254712345678"
                disabled={loading || isAtCapacity}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                disabled={loading || isAtCapacity}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requirements or notes"
              disabled={loading || isAtCapacity}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="needsAccommodation"
              checked={formData.needsAccommodation}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, needsAccommodation: checked === true })
              }
              disabled={loading || isAtCapacity}
            />
            <Label
              htmlFor="needsAccommodation"
              className="text-sm font-normal cursor-pointer"
            >
              I need accommodation
            </Label>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || isAtCapacity}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : isAtCapacity ? (
              "Event Full"
            ) : (
              "Register for Event"
            )}
          </Button>

          {!session && (
            <p className="text-xs text-gray-500 text-center">
              Note: You can register without an account. Provide at least email or phone.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

