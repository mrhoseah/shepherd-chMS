"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  QrCode, 
  Download, 
  Loader2, 
  Plus, 
  X, 
  Printer,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Grid3x3,
  LayoutGrid,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface QRCodeOption {
  id: string;
  amount: number | null;
  category: string;
  paymentMethod: string;
  label: string;
  qrCodeData?: string;
}

export default function GivingQRPrintPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeOption[]>([]);
  const [selectedQRCodes, setSelectedQRCodes] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<"2x3" | "3x4">("2x3");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(1000);
  const [customCategory, setCustomCategory] = useState<string>("TITHE");
  const [customPaymentMethod, setCustomPaymentMethod] = useState<"MPESA" | "PAYPAL">("MPESA");
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  // Predefined QR code options
  const predefinedAmounts = [100, 200, 500, 1000, 2000, 5000, 10000];
  const categories = [
    "TITHE",
    "OFFERING",
    "MISSIONS",
    "BUILDING_FUND",
    "SPECIAL_PROJECT",
    "OTHER",
  ];

  const handleAddQRCode = async (amount: number | null, category: string, paymentMethod: "MPESA" | "PAYPAL" = "MPESA") => {
    setLoading(true);
    try {
      const requestBody = {
        amount: amount !== null && amount !== undefined && amount !== 0 ? amount : (amount === 0 ? 0 : null),
        category: category || "TITHE",
        paymentMethod: paymentMethod || "MPESA",
      };

      const response = await fetch("/api/donations/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      if (response.ok) {
        let data;
        try {
          if (responseText && responseText.trim() !== '') {
            data = JSON.parse(responseText);
            
            if (!data.qrCode) {
              throw new Error("Response missing qrCode field");
            }
            
            const newQRCode: QRCodeOption = {
              id: data.qrCode.id,
              amount: data.qrCode.amount ? parseFloat(data.qrCode.amount.toString()) : null,
              category: data.qrCode.category || category,
              paymentMethod: data.qrCode.paymentMethod || paymentMethod,
              qrCodeData: data.qrCode.qrCodeData,
              label: data.qrCode.amount
                ? `${paymentMethod === "MPESA" ? "KES" : "$"} ${data.qrCode.amount.toLocaleString()} - ${category} (${paymentMethod})`
                : `Any Amount - ${category} (${paymentMethod})`,
            };
            setQrCodes([...qrCodes, newQRCode]);
            setSelectedQRCodes(new Set([...selectedQRCodes, newQRCode.id]));
            
            toast({
              title: "QR Code Generated",
              description: `Successfully created QR code for ${newQRCode.label}`,
              variant: "default",
            });
          } else {
            throw new Error("Empty response body");
          }
        } catch (parseError: any) {
          toast({
            title: "Error",
            description: `Failed to parse QR code response: ${parseError.message || "Invalid response format"}`,
            variant: "destructive",
          });
        }
      } else {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          if (responseText && responseText.trim() !== '' && responseText.trim() !== '{}') {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (parseError: any) {
          errorMessage = responseText || errorMessage;
        }
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Network Error",
        description: error.message || "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQRCode = (id: string) => {
    setQrCodes(qrCodes.filter((qc) => qc.id !== id));
    const newSelected = new Set(selectedQRCodes);
    newSelected.delete(id);
    setSelectedQRCodes(newSelected);
    toast({
      title: "QR Code Removed",
      description: "The QR code has been removed from your list",
    });
  };

  const handleToggleQRCode = (id: string) => {
    const newSelected = new Set(selectedQRCodes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQRCodes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQRCodes.size === qrCodes.length) {
      setSelectedQRCodes(new Set());
    } else {
      setSelectedQRCodes(new Set(qrCodes.map(qc => qc.id)));
    }
  };

  const handleClearAll = () => {
    setQrCodes([]);
    setSelectedQRCodes(new Set());
    toast({
      title: "List Cleared",
      description: "All QR codes have been removed",
    });
  };

  const handleGeneratePDF = async () => {
    if (selectedQRCodes.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one QR code to print",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/qr-codes/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodes: Array.from(selectedQRCodes).map((id) => ({ id })),
          layout,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Convert base64 to blob and download
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.filename || `qr-codes-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "PDF Generated Successfully!",
          description: `${data.pages} page(s) with ${data.totalQRCodes} QR code(s) ready for printing`,
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Generation Failed",
          description: error.error || "Failed to generate PDF",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = selectedQRCodes.size;
  const totalCount = qrCodes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                QR Code Print Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Generate and print QR codes for giving in professional A4 sticker format
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - QR Code Generation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Add Section */}
            <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Quick Add QR Codes
                </CardTitle>
                <CardDescription>
                  Select predefined amounts to quickly generate QR codes
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {predefinedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQRCode(amount, "TITHE")}
                      disabled={loading}
                      className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <Plus className="w-3 h-3 mr-1.5" />
                      KES {amount.toLocaleString()}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddQRCode(null, "TITHE")}
                    disabled={loading}
                    className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <Plus className="w-3 h-3 mr-1.5" />
                    Any Amount
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Custom Amount Section */}
            <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  Custom QR Code Generator
                </CardTitle>
                <CardDescription>
                  Create QR codes with custom amounts, categories, and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Amount Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customAmount" className="text-base font-semibold">Amount (KES)</Label>
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold text-lg shadow-md">
                      KES {customAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[customAmount]}
                      onValueChange={(value) => setCustomAmount(value[0])}
                      min={100}
                      max={100000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Input
                        id="customAmount"
                        type="number"
                        min="100"
                        max="1000000"
                        step="100"
                        value={customAmount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 100;
                          setCustomAmount(Math.max(100, Math.min(1000000, value)));
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setCustomAmount(100)}
                        size="sm"
                      >
                        Min
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCustomAmount(10000)}
                        size="sm"
                      >
                        10K
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCustomAmount(50000)}
                        size="sm"
                      >
                        50K
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Category and Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customCategory" className="text-base font-semibold">Category</Label>
                    <Select
                      value={customCategory}
                      onValueChange={setCustomCategory}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customPaymentMethod" className="text-base font-semibold">Payment Method</Label>
                    <Select
                      value={customPaymentMethod}
                      onValueChange={(value) => setCustomPaymentMethod(value as "MPESA" | "PAYPAL")}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MPESA">M-Pesa (Phone Number)</SelectItem>
                        <SelectItem value="PAYPAL">PayPal (Email)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => handleAddQRCode(customAmount, customCategory, customPaymentMethod)}
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Generate {customPaymentMethod} QR Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Selected QR Codes List */}
            {qrCodes.length > 0 && (
              <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Generated QR Codes
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedCount} of {totalCount} selected for printing
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs"
                      >
                        {selectedCount === totalCount ? "Deselect All" : "Select All"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {qrCodes.map((qrCode) => {
                      const isSelected = selectedQRCodes.has(qrCode.id);
                      return (
                        <div
                          key={qrCode.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-md"
                              : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleQRCode(qrCode.id)}
                            className="h-5 w-5"
                          />
                          {showPreview && qrCode.qrCodeData && (
                            <div className="w-16 h-16 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0">
                              <img
                                src={qrCode.qrCodeData}
                                alt="QR Code"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-base">
                                {qrCode.amount
                                  ? `${qrCode.paymentMethod === "MPESA" ? "KES" : "$"} ${qrCode.amount.toLocaleString()}`
                                  : "Any Amount"}
                              </p>
                              <Badge variant={qrCode.paymentMethod === "MPESA" ? "default" : "secondary"} className="text-xs">
                                {qrCode.paymentMethod}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {qrCode.category.replace(/_/g, " ")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQRCode(qrCode.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Print Settings & Actions */}
          <div className="space-y-6">
            {/* Print Settings */}
            <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-6">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Printer className="w-5 h-5 text-orange-600" />
                  Print Settings
                </CardTitle>
                <CardDescription>
                  Configure layout and generate PDF for printing
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Layout Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Page Layout</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setLayout("2x3")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        layout === "2x3"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Grid3x3 className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-semibold">2×3 Layout</div>
                      <div className="text-xs text-gray-500 mt-1">6 per page</div>
                    </button>
                    <button
                      onClick={() => setLayout("3x4")}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        layout === "3x4"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <LayoutGrid className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-semibold">3×4 Layout</div>
                      <div className="text-xs text-gray-500 mt-1">12 per page</div>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Preview Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Show Preview</Label>
                    <p className="text-xs text-gray-500 mt-1">Display QR code thumbnails</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                <Separator />

                {/* Generate PDF Button */}
                <Button
                  onClick={handleGeneratePDF}
                  disabled={selectedCount === 0 || generating}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Generate PDF ({selectedCount} QR{selectedCount !== 1 ? "s" : ""})
                    </>
                  )}
                </Button>

                {/* Stats */}
                {totalCount > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total QR Codes:</span>
                      <span className="font-semibold">{totalCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Selected:</span>
                      <span className="font-semibold text-blue-600">{selectedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Estimated Pages:</span>
                      <span className="font-semibold">
                        {layout === "2x3" 
                          ? Math.ceil(selectedCount / 6) 
                          : Math.ceil(selectedCount / 12)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="w-5 h-5 text-blue-600" />
                  Printing Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Layout 2×3:</strong> 6 QR codes per A4 page (larger stickers, ~3.5" × 3.5")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Layout 3×4:</strong> 12 QR codes per A4 page (smaller stickers, ~2.3" × 2.3")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use <strong>A4 sticker paper</strong> for best results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Enable <strong>"Background graphics"</strong> in print settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Set margins to <strong>minimum (0mm recommended)</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Each sticker includes: Church name, amount, category, QR code, and scan instructions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
