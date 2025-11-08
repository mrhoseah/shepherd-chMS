"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Invitation {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  message?: string;
  status: string;
  expiresAt: string;
  invitedBy?: {
    firstName: string;
    lastName: string;
  };
  campus?: {
    id: string;
    name: string;
  };
}

export default function InviteAcceptancePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    middleName: "",
    phone: "",
  });

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load invitation");
        setLoading(false);
        return;
      }

      if (data.status !== "PENDING") {
        setError(
          data.status === "ACCEPTED"
            ? "This invitation has already been accepted."
            : data.status === "EXPIRED"
            ? "This invitation has expired."
            : "This invitation is no longer valid."
        );
        setLoading(false);
        return;
      }

      const expiresAt = new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        setError("This invitation has expired.");
        setLoading(false);
        return;
      }

      setInvitation(data);
      setFormData((prev) => ({
        ...prev,
        phone: data.phone || "",
      }));
    } catch (error: any) {
      setError("Failed to load invitation. Please check the link and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          middleName: formData.middleName || undefined,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invitation");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.push("/auth/signin?message=Account created successfully. Please sign in.");
      }, 2000);
    } catch (error: any) {
      setError("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading invitation...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-green-600 dark:text-green-400 text-lg font-semibold">
                Account Created Successfully!
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting to sign in...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation?.campus?.name || "the platform"}
            {invitation?.invitedBy && (
              <> by {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Email:</strong> {invitation?.email}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Name:</strong> {invitation?.firstName} {invitation?.lastName}
            </p>
            {invitation?.message && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <strong>Message:</strong> {invitation.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
                placeholder="Enter your password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                minLength={8}
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input
                id="middleName"
                type="text"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                placeholder="Enter your middle name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter your phone number"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link
              href="/auth/signin"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

