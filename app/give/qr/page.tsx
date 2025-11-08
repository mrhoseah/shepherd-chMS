"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, Loader2, CheckCircle2, XCircle, User } from "lucide-react";

export default function QRGivePage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const qrData = searchParams.get("data");
  const [qrCodeInfo, setQrCodeInfo] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [detectingPhone, setDetectingPhone] = useState(false);

  useEffect(() => {
    if (qrData) {
      handleScanQR(qrData);
    }
  }, [qrData]);

  // Fetch user phone number if logged in
  useEffect(() => {
    if (session?.user) {
      fetchUserPhone();
    }
  }, [session]);

  // Try to detect phone number from browser (experimental)
  useEffect(() => {
    if (!userPhone && !phoneNumber) {
      detectBrowserPhone();
    }
  }, []);

  const fetchUserPhone = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const user = await res.json();
        if (user.phone) {
          setUserPhone(user.phone);
          if (!phoneNumber) {
            setPhoneNumber(user.phone);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user phone:", error);
    }
  };

  const detectBrowserPhone = async () => {
    setDetectingPhone(true);
    try {
      // Try to use WebOTP API (experimental, limited browser support)
      if ("OTPCredential" in window) {
        // This requires HTTPS and user interaction
        // For now, we'll just try to get it from navigator if available
      }

      // Alternative: Try to detect from device info (not reliable)
      // Most browsers don't expose phone number for security reasons
      
      // Check if we can get it from any stored data
      const storedPhone = localStorage.getItem("last_used_phone");
      if (storedPhone && !phoneNumber) {
        setPhoneNumber(storedPhone);
      }
    } catch (error) {
      // Browser phone detection not available
    } finally {
      setDetectingPhone(false);
    }
  };

  const handleScanQR = async (data: string) => {
    setScanning(true);
    try {
      // Parse QR data
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        // If not JSON, treat as QR code ID
        parsed = { qrCodeId: data };
      }

      // Call public API to validate QR code
      const res = await fetch("/api/public/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeId: parsed.qrCodeId || parsed.id,
          qrData: data,
        }),
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
      setMessage("Failed to scan QR code");
    } finally {
      setScanning(false);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !qrCodeInfo) return;

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/donations/mpesa-stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          amount: qrCodeInfo.amount,
          category: qrCodeInfo.category,
          qrCodeId: qrCodeInfo.id,
          userId: (session?.user as any)?.id || null, // Include userId if logged in
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus("success");
        setMessage(result.message || "STK Push initiated. Please check your phone to complete payment.");
        // Store phone number for next time
        if (phoneNumber) {
          localStorage.setItem("last_used_phone", phoneNumber);
        }
        setPhoneNumber("");
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to initiate payment");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <CardTitle className="text-2xl">Scan to Give</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Scan the QR code or enter QR code data to make a donation
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!qrCodeInfo && !scanning && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="qrData">QR Code Data</Label>
                <Input
                  id="qrData"
                  placeholder="Paste QR code data or scan QR code"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleScanQR(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="text-center text-sm text-gray-500">
                <p>Or use your phone camera to scan the QR code</p>
              </div>
            </div>
          )}

          {scanning && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Validating QR code...</p>
            </div>
          )}

          {qrCodeInfo && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">QR Code Valid</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-semibold">
                      KSh {Number(qrCodeInfo.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="font-semibold">
                      {qrCodeInfo.category?.replace("_", " ") || "Offering"}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInitiatePayment} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
                    {userPhone && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setPhoneNumber(userPhone);
                        }}
                      >
                        <User className="w-3 h-3 mr-1" />
                        Use my number
                      </Button>
                    )}
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {userPhone 
                      ? "Using your registered phone number. You can change it if needed."
                      : "Enter your M-Pesa registered phone number"}
                  </p>
                  {detectingPhone && (
                    <p className="text-xs text-blue-500 mt-1">
                      Attempting to detect phone number...
                    </p>
                  )}
                </div>

                {status === "success" && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
                  </div>
                )}

                {status === "error" && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !phoneNumber}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initiating Payment...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Pay with M-Pesa
                    </>
                  )}
                </Button>
              </form>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setQrCodeInfo(null);
                  setPhoneNumber("");
                  setStatus("idle");
                  setMessage("");
                }}
              >
                Scan Another QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

