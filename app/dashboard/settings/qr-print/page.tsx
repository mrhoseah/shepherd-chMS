"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Printer, Download } from "lucide-react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

export default function QRPrintPage() {
  const router = useRouter();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState(1);
  const [size, setSize] = useState("2"); // inches

  useEffect(() => {
    const generateQR = async () => {
      try {
        const guestUrl = typeof window !== "undefined" 
          ? `${window.location.origin}/guest/register`
          : "/guest/register";
        
        // Generate QR code - size will be controlled by CSS for printing
        // Using 300px base, will scale with print CSS
        const dataUrl = await QRCode.toDataURL(guestUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000", // Black for better printing
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

  const handlePrint = () => {
    window.print();
  };

  const guestUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/guest/register`
    : "/guest/register";

  const qrSizeInches = parseFloat(size);
  const qrSizePixels = qrSizeInches * 96; // 96 DPI standard

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5in;
            padding: 0.5in;
            page-break-inside: avoid;
          }
          .sticker {
            width: ${qrSizeInches}in;
            height: ${qrSizeInches}in;
            border: 1px dashed #ccc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sticker-qr {
            width: ${qrSizeInches * 0.8}in;
            height: ${qrSizeInches * 0.8}in;
            image-rendering: crisp-edges;
          }
          .sticker-text {
            font-size: ${qrSizeInches * 0.1}in;
            text-align: center;
            margin-top: 0.1in;
            font-weight: bold;
          }
          @page {
            size: letter;
            margin: 0.5in;
          }
        }
        @media screen {
          .print-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            padding: 1rem;
          }
          .sticker {
            width: ${qrSizePixels}px;
            height: ${qrSizePixels}px;
            border: 2px dashed #ccc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            margin: 0.5rem;
          }
          .sticker-qr {
            width: ${qrSizePixels * 0.8}px;
            height: ${qrSizePixels * 0.8}px;
          }
          .sticker-text {
            font-size: ${qrSizePixels * 0.1}px;
            text-align: center;
            margin-top: 0.5rem;
            font-weight: bold;
            color: #333;
          }
        }
      `}} />

      <div className="p-6 space-y-6">
        {/* Controls - Hidden when printing */}
        <div className="no-print">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Print QR Code Stickers
              </CardTitle>
              <CardDescription>
                Configure and print guest registration QR codes for stickers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Sticker Size (inches)</Label>
                  <Input
                    id="size"
                    type="number"
                    min="1"
                    max="4"
                    step="0.5"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Common sizes: 1" (small), 2" (medium), 3" (large)
                  </p>
                </div>
                <div>
                  <Label htmlFor="copies">Number of Copies</Label>
                  <Input
                    id="copies"
                    type="number"
                    min="1"
                    max="50"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many stickers per page
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Registration URL:
                </p>
                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block break-all">
                  {guestUrl}
                </code>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  className="flex-1"
                  style={{ backgroundColor: "#1E40AF" }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Stickers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Printing Tips:
                </p>
                <ul className="text-xs text-yellow-800 dark:text-yellow-200 list-disc list-inside space-y-1">
                  <li>Use sticker paper (A4 or Letter size)</li>
                  <li>Ensure "Background graphics" is enabled in print settings</li>
                  <li>Set margins to minimum (0.5in recommended)</li>
                  <li>Test print one copy first to verify sizing</li>
                  <li>Use high-quality print settings for best results</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Printable QR Code Stickers */}
        <div className="print-container">
          {loading ? (
            <div className="flex items-center justify-center w-full h-64">
              <div className="animate-pulse text-gray-400">Generating QR codes...</div>
            </div>
          ) : (
            Array.from({ length: copies }).map((_, index) => (
              <div key={index} className="sticker">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Guest Registration QR Code" 
                  className="sticker-qr"
                />
                <div className="sticker-text">
                  Scan to Register
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

