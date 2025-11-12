"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Mail, Loader2, CheckCircle2, XCircle, User } from "lucide-react";

export default function PayPalGivePage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const qrCodeId = searchParams.get("qrCodeId");
  const amountParam = searchParams.get("amount");
  const categoryParam = searchParams.get("category");
  const [qrCodeInfo, setQrCodeInfo] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (qrCodeId) {
      fetchQRCodeInfo();
    } else if (amountParam) {
      // If amount is provided directly (from custom QR code), create QR code info
      setQrCodeInfo({
        amount: parseFloat(amountParam),
        category: categoryParam || "OFFERING",
        paymentMethod: "PAYPAL",
      });
    }
  }, [qrCodeId, amountParam, categoryParam]);

  // Fetch user email if logged in
  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      if (!email) {
        setEmail(session.user.email);
      }
    }
  }, [session]);

  const fetchQRCodeInfo = async () => {
    if (!qrCodeId) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/public/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeId }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setQrCodeInfo(result.qrCode);
      } else {
        setStatus("error");
        setMessage(result.error || "Invalid QR code");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to load QR code information");
    } finally {
      setProcessing(false);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    if (!qrCodeInfo) {
      setStatus("error");
      setMessage("QR code information not loaded");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // Create donation record and initiate PayPal payment
      const response = await fetch("/api/donations/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: qrCodeInfo.amount ? parseFloat(qrCodeInfo.amount.toString()) : null,
          category: qrCodeInfo.category || "OFFERING",
          email,
          qrCodeId: qrCodeId || null, // May be null for custom amounts
          reference: qrCodeId ? `QR-${qrCodeId}` : `CUSTOM-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.approvalUrl) {
        // Redirect to PayPal for payment
        window.location.href = data.approvalUrl;
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to initiate PayPal payment");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading QR code information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!qrCodeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500" />
              <p className="text-gray-600 text-center">{message || "QR code not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">PayPal Giving</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Eastgate Chapel
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {qrCodeInfo.amount
                    ? `$${parseFloat(qrCodeInfo.amount.toString()).toFixed(2)}`
                    : "Any Amount"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {qrCodeInfo.category?.replace(/_/g, " ") || "OFFERING"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleInitiatePayment} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-lg"
                disabled={loading}
                autoFocus
              />
              {userEmail && userEmail !== email && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs mt-2"
                  onClick={() => {
                    setEmail(userEmail);
                  }}
                >
                  <User className="w-3 h-3 mr-1" />
                  Use my account email ({userEmail})
                </Button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Enter the email address associated with your PayPal account
              </p>
            </div>

            {status === "error" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {message || "Failed to initiate payment. Please try again."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading || !email}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Continue to PayPal
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            You will be redirected to PayPal to complete your donation securely.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

