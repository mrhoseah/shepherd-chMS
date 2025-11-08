"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Smartphone } from "lucide-react";

interface QRCodeDialogProps {
  onGenerate: (amount: string, category: string) => void;
  qrCode: string | null;
  scanUrl?: string | null;
  loading: boolean;
}

export function QRCodeDialog({ onGenerate, qrCode, scanUrl, loading }: QRCodeDialogProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OFFERING");

  const handleGenerate = () => {
    if (amount && category) {
      onGenerate(amount, category);
    }
  };

  const downloadQR = () => {
    if (qrCode) {
      const link = document.createElement("a");
      link.href = qrCode;
      link.download = `giving-qr-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      {!qrCode ? (
        <>
          <div>
            <Label htmlFor="qr-amount">Amount *</Label>
            <Input
              id="qr-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <Label htmlFor="qr-category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TITHE">Tithe</SelectItem>
                <SelectItem value="OFFERING">Offering</SelectItem>
                <SelectItem value="MISSIONS">Missions</SelectItem>
                <SelectItem value="BUILDING_FUND">Building Fund</SelectItem>
                <SelectItem value="SPECIAL_PROJECT">Special Project</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || !amount}
            className="w-full"
            style={{ backgroundColor: "#1E40AF" }}
          >
            {loading ? "Generating..." : "Generate QR Code"}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Scan this QR code with your phone to trigger M-Pesa STK push
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code" className="w-64 h-64 border rounded-lg" />
          </div>
          {scanUrl && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                Share this link with congregation:
              </p>
              <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block break-all">
                {scanUrl}
              </code>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={downloadQR}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              className="flex-1"
              style={{ backgroundColor: "#1E40AF" }}
              onClick={() => {
                window.location.reload();
              }}
            >
              Generate New
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

