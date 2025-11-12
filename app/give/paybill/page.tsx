"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Smartphone, Copy, CheckCircle2, QrCode, Loader2, Building2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  groupCode: string | null;
  groupGivingEnabled: boolean;
}

interface FundCategory {
  id: string;
  code: string;
  name: string;
}

export default function PaybillGivePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [fundCategories, setFundCategories] = useState<FundCategory[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedFundCategoryId, setSelectedFundCategoryId] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [paybillNumber, setPaybillNumber] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchFundCategories();
    fetchPaybillNumber();
  }, []);

  useEffect(() => {
    if (selectedGroupId && selectedFundCategoryId) {
      generateAccountNumber();
    } else {
      setAccountNumber("");
      setQrCodeData("");
    }
  }, [selectedGroupId, selectedFundCategoryId]);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups/my-groups");
      if (res.ok) {
        const data = await res.json();
        const groupsWithGiving = (data.groups || []).filter(
          (g: Group) => g.groupGivingEnabled && g.groupCode
        );
        setGroups(groupsWithGiving);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchFundCategories = async () => {
    try {
      const res = await fetch("/api/fund-categories?activeOnly=true");
      if (res.ok) {
        const data = await res.json();
        setFundCategories(data.fundCategories || []);
      }
    } catch (error) {
      console.error("Error fetching fund categories:", error);
    }
  };

  const fetchPaybillNumber = async () => {
    try {
      const res = await fetch("/api/settings/mpesa-paybill");
      if (res.ok) {
        const data = await res.json();
        setPaybillNumber(data.paybillNumber || "");
      }
    } catch (error) {
      console.error("Error fetching paybill number:", error);
    }
  };

  const generateAccountNumber = async () => {
    if (!selectedGroupId || !selectedFundCategoryId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/give/paybill/generate?groupId=${selectedGroupId}&fundCategoryId=${selectedFundCategoryId}`
      );
      if (res.ok) {
        const data = await res.json();
        setAccountNumber(data.accountNumber);
        
        // Generate QR code
        if (data.accountNumber && paybillNumber) {
          generateQRCode(data.accountNumber, paybillNumber);
        }
      } else {
        const errorData = await res.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to generate account number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating account number:", error);
      toast({
        title: "Error",
        description: "Failed to generate account number",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (accountNum: string, paybillNum: string) => {
    try {
      // Dynamically import QRCode to avoid SSR issues
      const QRCode = (await import("qrcode")).default;
      
      // Create M-Pesa deep link format
      // Format: mpesa://paybill?businessnumber={paybill}&accountnumber={account}
      const deepLink = `mpesa://paybill?businessnumber=${paybillNum}&accountnumber=${accountNum}`;
      
      const qrData = await QRCode.toDataURL(deepLink, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      
      setQrCodeData(qrData);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleCopy = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const selectedFund = fundCategories.find((f) => f.id === selectedFundCategoryId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            M-Pesa Paybill Giving
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Generate your account number for group giving
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection Form */}
          <Card>
            <CardHeader>
              <CardTitle>Select Group & Fund</CardTitle>
              <CardDescription>
                Choose your group and the fund category you want to give to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Group Selection */}
              <div>
                <Label htmlFor="group" className="mb-2 block">Group</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger id="group" className="h-12">
                    <SelectValue placeholder="Select your group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.length === 0 ? (
                      <SelectItem value="" disabled>
                        No groups with giving enabled
                      </SelectItem>
                    ) : (
                      groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!session?.user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please log in to see your groups
                  </p>
                )}
              </div>

              {/* Fund Category Selection */}
              <div>
                <Label htmlFor="fund" className="mb-2 block">Fund Category</Label>
                <Select value={selectedFundCategoryId} onValueChange={setSelectedFundCategoryId}>
                  <SelectTrigger id="fund" className="h-12">
                    <SelectValue placeholder="Select fund category" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundCategories.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name} ({fund.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generated Account Number */}
              {accountNumber && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <Label className="text-sm font-semibold mb-2 block">Your Account Number</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={accountNumber}
                      readOnly
                      className="text-2xl font-bold text-center font-mono bg-white dark:bg-gray-800"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Enter this code exactly in the M-Pesa Paybill Account Number field
                  </p>
                </div>
              )}

              {/* Paybill Instructions */}
              {accountNumber && paybillNumber && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    M-Pesa Paybill Instructions
                  </h3>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-gray-700 dark:text-gray-300">
                    <li>Go to M-Pesa on your phone</li>
                    <li>Select "Lipa na M-Pesa"</li>
                    <li>Select "Paybill"</li>
                    <li>
                      Enter Business Number: <strong className="font-mono">{paybillNumber}</strong>
                    </li>
                    <li>
                      Enter Account Number: <strong className="font-mono">{accountNumber}</strong>
                    </li>
                    <li>Enter your desired amount</li>
                    <li>Enter your M-Pesa PIN</li>
                    <li>Confirm the transaction</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Scan</CardTitle>
              <CardDescription>
                Scan the QR code to open M-Pesa with pre-filled details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : qrCodeData ? (
                <>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <img
                        src={qrCodeData}
                        alt="M-Pesa Paybill QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = qrCodeData;
                        link.download = `paybill-${accountNumber}.png`;
                        link.click();
                      }}
                      className="w-full"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a group and fund category to generate QR code</p>
                </div>
              )}

              {/* Details Summary */}
              {accountNumber && selectedGroup && selectedFund && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Transaction Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Group:</span>
                      <span className="font-semibold">{selectedGroup.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fund:</span>
                      <span className="font-semibold">{selectedFund.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                      <span className="font-mono font-bold">{accountNumber}</span>
                    </div>
                    {paybillNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Paybill Number:</span>
                        <span className="font-mono font-bold">{paybillNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

