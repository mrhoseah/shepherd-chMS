"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, Church } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TITLES, COUNTRIES, KENYAN_COUNTIES, fetchCountriesFromAPI } from "@/lib/guest-form-data";

export default function GuestRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState<string[]>(COUNTRIES);
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

  // Optionally fetch countries from REST Countries API on mount
  useEffect(() => {
    fetchCountriesFromAPI().then((apiCountries) => {
      if (apiCountries.length > 0) {
        // Prioritize Kenya at the top, then sort the rest
        const kenyaFirst = ["Kenya", ...apiCountries.filter(c => c !== "Kenya").sort()];
        setCountries(kenyaFirst);
      }
    }).catch(() => {
      // If API fails, keep using static list
      setCountries(COUNTRIES);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required");
      setLoading(false);
      return;
    }

    // At least one contact method required
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
        setError(data.error || "Failed to register. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h2 className="text-2xl font-bold">Thank You!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've received your information. We'll be in touch soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
              <Church className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome! We're Glad You're Here</CardTitle>
          <CardDescription>
            Please share your information so we can stay connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="title">Title</Label>
              <Select
                value={formData.title}
                onValueChange={(value) =>
                  setFormData({ ...formData, title: value })
                }
              >
                <SelectTrigger id="title" className="w-full">
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
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
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
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+254 700 000 000"
              />
            </div>

            <div>
              <Label htmlFor="residence">Residence / Area</Label>
              <Input
                id="residence"
                value={formData.residence}
                onChange={(e) =>
                  setFormData({ ...formData, residence: e.target.value })
                }
                placeholder="e.g., Westlands, Karen, etc."
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              >
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Select country (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="county">County</Label>
              <Select
                value={formData.county}
                onValueChange={(value) =>
                  setFormData({ ...formData, county: value })
                }
                disabled={formData.country !== "Kenya" && formData.country !== ""}
              >
                <SelectTrigger id="county" className="w-full">
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
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="e.g., Nairobi"
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Checkbox
                id="enableFollowUps"
                checked={formData.enableFollowUps}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableFollowUps: checked === true })
                }
              />
              <Label
                htmlFor="enableFollowUps"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Enable follow-up tracking for this guest
              </Label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-2">
              If enabled, we'll track follow-up communications and visits for this guest.
            </p>

            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: "#1E40AF" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              * Required fields. We respect your privacy and will only use this information to stay in touch.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

