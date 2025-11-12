"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Smartphone, Loader2, CheckCircle2, XCircle, User, Building2, CreditCard } from "lucide-react";

// Utility function to format phone number for M-Pesa (254XXXXXXXXX)
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Convert to 254 format
  if (cleaned.startsWith("0")) {
    // 0712345678 -> 254712345678
    cleaned = "254" + cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    // 712345678 -> 254712345678
    cleaned = "254" + cleaned;
  }
  
  return cleaned;
}

// Validate phone number format
function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // M-Pesa requires 12 digits starting with 254
  return /^254\d{9}$/.test(formatted);
}

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
  const [paymentMethod, setPaymentMethod] = useState<"stk" | "paybill">("stk");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

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

  // Fetch paybill settings
  useEffect(() => {
    fetchPaybillSettings();
  }, []);

  const fetchPaybillSettings = async () => {
    try {
      const res = await fetch("/api/settings/mpesa-paybill");
      if (res.ok) {
        const data = await res.json();
        if (data.paybillNumber) {
          setPaybillSettings({
            paybillNumber: data.paybillNumber,
            paybillAccountName: data.paybillAccountName || "",
          });
          setPaybillNumber(data.paybillNumber);
          if (data.paybillAccountName) {
            setAccountNumber(data.paybillAccountName);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching paybill settings:", error);
    }
  };

  // Try to detect phone number from browser (experimental)
  useEffect(() => {
    if (!userPhone && !phoneNumber) {
      detectBrowserPhone();
    }
  }, []);

  const fetchUserPhone = async () => {
    try {
      const res = await fetch("/api/people/me");
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

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError("");
    
    if (value && !isValidPhoneNumber(value)) {
      const formatted = formatPhoneNumber(value);
      if (formatted.length < 12 || !formatted.startsWith("254")) {
        setPhoneError("Please enter a valid Kenyan phone number (e.g., 0712 345 678)");
      }
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInfo) return;

    if (paymentMethod === "stk") {
      if (!phoneNumber) {
        setPhoneError("Phone number is required");
        return;
      }
      
      if (!isValidPhoneNumber(phoneNumber)) {
        setPhoneError("Please enter a valid Kenyan phone number");
        return;
      }
    } else {
      if (!paybillNumber || !accountNumber) {
        setStatus("error");
        setMessage("Paybill number and account number are required");
        return;
      }
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");
    setPhoneError("");

    try {
      if (paymentMethod === "stk") {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        const res = await fetch("/api/donations/mpesa-stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            amount: qrCodeInfo.amount,
            category: qrCodeInfo.category,
            qrCodeId: qrCodeInfo.id || null, // May be null for custom amounts
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
      } else {
        // Paybill payment - show instructions
        setStatus("success");
        setMessage(
          `Please send KES ${qrCodeInfo.amount ? Number(qrCodeInfo.amount).toLocaleString() : "your desired amount"} to Paybill ${paybillNumber}, Account Number: ${accountNumber}. Category: ${qrCodeInfo.category?.replace(/_/g, " ") || "Offering"}`
        );
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
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          <CardTitle className="text-2xl">M-Pesa Giving</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Eastgate Chapel
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {scanning && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Loading donation details...</p>
            </div>
          )}

          {!qrCodeInfo && !scanning && !qrData && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Scan a QR code to get started, or manually enter QR code data below
                </p>
              </div>
              <div>
                <Label htmlFor="qrData">QR Code Data</Label>
                <Input
                  id="qrData"
                  placeholder="Paste QR code data here"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleScanQR(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {qrCodeInfo && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {qrCodeInfo.amount
                        ? `KES ${Number(qrCodeInfo.amount).toLocaleString()}`
                        : "Any Amount"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {qrCodeInfo.category?.replace(/_/g, " ") || "Offering"}
                    </span>
                  </div>
                </div>
              </div>

              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "stk" | "paybill")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stk">
                    <Smartphone className="w-4 h-4 mr-2" />
                    STK Push
                  </TabsTrigger>
                  <TabsTrigger value="paybill">
                    <Building2 className="w-4 h-4 mr-2" />
                    Paybill
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stk" className="space-y-4">
                  <div>
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4" />
                      M-Pesa Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="0712 345 678 or 254712345678"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`text-lg ${phoneError ? "border-red-500" : ""}`}
                      autoFocus
                    />
                    {userPhone && userPhone !== phoneNumber && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs mt-2"
                        onClick={() => {
                          handlePhoneChange(userPhone);
                        }}
                      >
                        <User className="w-3 h-3 mr-1" />
                        Use my registered number ({userPhone})
                      </Button>
                    )}
                    {phoneError && (
                      <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                    )}
                    {!phoneError && phoneNumber && isValidPhoneNumber(phoneNumber) && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Valid format: {formatPhoneNumber(phoneNumber)}
                      </p>
                    )}
                    {!phoneError && !phoneNumber && (
                      <p className="text-xs text-gray-500 mt-2">
                        Enter the phone number registered with your M-Pesa account
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="paybill" className="space-y-4">
                  <div>
                    <Label htmlFor="paybillNumber" className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4" />
                      Paybill Number
                    </Label>
                    <Input
                      id="paybillNumber"
                      type="text"
                      placeholder="e.g., 123456"
                      value={paybillNumber}
                      onChange={(e) => setPaybillNumber(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the church paybill number (configured by admin)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="accountNumber" className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4" />
                      Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      placeholder="Your name or reference"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter your name or a reference for this donation
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold mb-2">Paybill Instructions:</p>
                    <ol className="text-xs space-y-1 list-decimal list-inside text-gray-700 dark:text-gray-300">
                      <li>Go to M-Pesa on your phone</li>
                      <li>Select "Lipa na M-Pesa"</li>
                      <li>Select "Paybill"</li>
                      <li>Enter Business Number: <strong>{paybillNumber || "[Paybill Number]"}</strong></li>
                      <li>Enter Account Number: <strong>{accountNumber || "[Your Name]"}</strong></li>
                      <li>Enter Amount: <strong>KES {qrCodeInfo.amount ? Number(qrCodeInfo.amount).toLocaleString() : "[Amount]"}</strong></li>
                      <li>Enter your M-Pesa PIN</li>
                    </ol>
                  </div>
                </TabsContent>
              </Tabs>

              <form onSubmit={handleInitiatePayment} className="space-y-4">

                {status === "success" && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                          Payment Request Sent!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {message || "Please check your phone and enter your M-Pesa PIN to complete the payment."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                  disabled={
                    loading ||
                    status === "success" ||
                    (paymentMethod === "stk" && (!phoneNumber || !isValidPhoneNumber(phoneNumber))) ||
                    (paymentMethod === "paybill" && (!paybillNumber || !accountNumber))
                  }
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {paymentMethod === "stk" ? "Sending Payment Request..." : "Processing..."}
                    </>
                  ) : status === "success" ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {paymentMethod === "stk" ? "Payment Request Sent" : "Instructions Displayed"}
                    </>
                  ) : (
                    <>
                      {paymentMethod === "stk" ? (
                        <>
                          <Smartphone className="w-5 h-5 mr-2" />
                          Pay with M-Pesa STK
                        </>
                      ) : (
                        <>
                          <Building2 className="w-5 h-5 mr-2" />
                          Get Paybill Instructions
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              {status === "success" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setQrCodeInfo(null);
                    setPhoneNumber("");
                    setStatus("idle");
                    setMessage("");
                    window.location.href = "/give/qr";
                  }}
                >
                  Make Another Donation
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

