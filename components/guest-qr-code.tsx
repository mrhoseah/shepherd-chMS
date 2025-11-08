"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode, Printer } from "lucide-react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

export function GuestQRCode() {
  const router = useRouter();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const guestUrl = typeof window !== "undefined" 
          ? `${window.location.origin}/guest/register`
          : "/guest/register";
        
        // Generate small QR code (150x150 for compact display)
        const dataUrl = await QRCode.toDataURL(guestUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: "#1E40AF", // Shepherd Blue
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, []);

  const downloadQR = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement("a");
    link.download = "guest-registration-qr.png";
    link.href = qrCodeDataUrl;
    link.click();
  };

  const guestUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/guest/register`
    : "/guest/register";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Guest Registration QR Code
        </CardTitle>
        <CardDescription>
          Display this QR code for guests to scan and register
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-[150px]">
            <div className="animate-pulse text-gray-400">Generating QR code...</div>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <img 
                src={qrCodeDataUrl} 
                alt="Guest Registration QR Code" 
                className="w-[150px] h-[150px] border-2 border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white"
              />
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                Registration URL:
              </p>
              <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block break-all">
                {guestUrl}
              </code>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadQR}
                  disabled={!qrCodeDataUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: "#1E40AF" }}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.open(guestUrl, "_blank");
                    }
                  }}
                >
                  Open Page
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard/settings/qr-print")}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Stickers
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

