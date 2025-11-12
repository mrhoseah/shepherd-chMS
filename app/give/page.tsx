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
import { Smartphone, Mail, Loader2, CheckCircle2, XCircle, Heart, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Format phone number for M-Pesa (254XXXXXXXXX)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

// Validate phone number
function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return /^254\d{9}$/.test(formatted);
}

// Validate email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function PublicGivePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [amount, setAmount] = useState<number>(1000);
  const [category, setCategory] = useState<string>("OFFERING");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "PAYPAL">("MPESA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string; groupGivingEnabled: boolean }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const categories = [
    { value: "TITHE", label: "Tithe" },
    { value: "OFFERING", label: "Offering" },
    { value: "MISSIONS", label: "Missions" },
    { value: "BUILDING_FUND", label: "Building Fund" },
    { value: "SPECIAL_PROJECT", label: "Special Project" },
    { value: "OTHER", label: "Other" },
  ];

  // Fetch user info if logged in
  useEffect(() => {
    if (session?.user) {
      fetchUserInfo();
      fetchUserGroups();
    }
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch("/api/people/me");
      if (res.ok) {
        const user = await res.json();
        if (user.phone) {
          setUserPhone(user.phone);
          if (!phoneNumber) setPhoneNumber(user.phone);
        }
        if (user.email) {
          setUserEmail(user.email);
          if (!email) setEmail(user.email);
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const res = await fetch("/api/groups/my-groups");
      if (res.ok) {
        const data = await res.json();
        const groupsWithGiving = (data.groups || []).filter(
          (g: any) => g.groupGivingEnabled
        );
        setUserGroups(groupsWithGiving);
        // Auto-select first group if only one
        if (groupsWithGiving.length === 1) {
          setSelectedGroupId(groupsWithGiving[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching user groups:", error);
    }
  };

  // Quick amount buttons
  const mpesaAmounts = [500, 1000, 2000, 5000, 10000, 20000];
  const paypalAmounts = [5, 10, 25, 50, 100, 250];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (paymentMethod === "MPESA") {
      if (!phoneNumber) {
        toast({
          title: "Phone number required",
          description: "Please enter your M-Pesa phone number",
          variant: "destructive",
        });
        return;
      }
      if (!isValidPhoneNumber(phoneNumber)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid Kenyan phone number (e.g., 0712 345 678)",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!email) {
        toast({
          title: "Email required",
          description: "Please enter your email address",
          variant: "destructive",
        });
        return;
      }
      if (!isValidEmail(email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (paymentMethod === "MPESA") {
        // M-Pesa STK Push
        const formattedPhone = formatPhoneNumber(phoneNumber);
        const response = await fetch("/api/donations/mpesa-stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            amount: amount,
            category: category,
            userId: (session?.user as any)?.id || null,
            groupId: selectedGroupId || null,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: "Payment request sent!",
            description: "Please check your phone and enter your M-Pesa PIN to complete the payment.",
          });
          // Store phone for next time
          localStorage.setItem("last_used_phone", phoneNumber);
          // Reset form
          setAmount(1000);
          setPhoneNumber("");
        } else {
          toast({
            title: "Payment failed",
            description: data.error || "Failed to initiate payment. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // PayPal payment
        const response = await fetch("/api/donations/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            category: category,
            email: email,
            userId: (session?.user as any)?.id || null,
            groupId: selectedGroupId || null,
          }),
        });

        const data = await response.json();

        if (response.ok && data.approvalUrl) {
          // Redirect to PayPal
          window.location.href = data.approvalUrl;
        } else {
          toast({
            title: "Payment failed",
            description: data.error || "Failed to initiate PayPal payment. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Give to Eastgate Chapel
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your generosity makes a difference
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-2 border-blue-100 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-2xl">Make a Donation</CardTitle>
            <CardDescription>
              Choose your amount and payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Button
                  type="button"
                  variant={paymentMethod === "MPESA" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => {
                    setPaymentMethod("MPESA");
                    setAmount(1000);
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  M-Pesa
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "PAYPAL" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => {
                    setPaymentMethod("PAYPAL");
                    setAmount(10);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  PayPal
                </Button>
              </div>

              {/* Amount Selection */}
              <div>
                <Label className="mb-3 block text-sm font-semibold">Amount</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {(paymentMethod === "MPESA" ? mpesaAmounts : paypalAmounts).map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={amount === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(preset)}
                      className="font-semibold"
                    >
                      {paymentMethod === "MPESA" ? (
                        <>KES {preset >= 1000 ? `${preset / 1000}K` : preset}</>
                      ) : (
                        <>${preset}</>
                      )}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {paymentMethod === "MPESA" ? "KES" : "$"}
                  </div>
                  <Input
                    type="number"
                    min={paymentMethod === "MPESA" ? 100 : 1}
                    max={paymentMethod === "MPESA" ? 1000000 : 100000}
                    step={paymentMethod === "MPESA" ? 100 : 1}
                    value={amount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || (paymentMethod === "MPESA" ? 100 : 1);
                      const min = paymentMethod === "MPESA" ? 100 : 1;
                      const max = paymentMethod === "MPESA" ? 1000000 : 100000;
                      setAmount(Math.max(min, Math.min(max, value)));
                    }}
                    className="pl-16 text-lg font-semibold h-14"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Group Selection (if user is member of groups with giving enabled) */}
              {userGroups.length > 0 && (
                <div>
                  <Label htmlFor="group" className="mb-2 block">Group (Optional)</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger id="group" className="h-12">
                      <SelectValue placeholder="Select a group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No group</SelectItem>
                      {userGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Associate this donation with a group
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <Label htmlFor="category" className="mb-2 block">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information */}
              {paymentMethod === "MPESA" ? (
                <div>
                  <Label htmlFor="phone" className="mb-2 block flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    M-Pesa Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  {userPhone && userPhone !== phoneNumber && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs mt-2"
                      onClick={() => setPhoneNumber(userPhone)}
                    >
                      Use my registered number ({userPhone})
                    </Button>
                  )}
                  {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid Kenyan phone number
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="email" className="mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  {userEmail && userEmail !== email && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs mt-2"
                      onClick={() => setEmail(userEmail)}
                    >
                      Use my registered email ({userEmail})
                    </Button>
                  )}
                  {email && !isValidEmail(email) && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === "MPESA" ? (
                      <>
                        <Smartphone className="w-5 h-5 mr-2" />
                        Pay with M-Pesa
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Continue to PayPal
                      </>
                    )}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">1</span>
                </div>
                <h3 className="font-semibold mb-2">Choose Amount</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a preset amount or enter your own
                </p>
              </div>
              <div>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">2</span>
                </div>
                <h3 className="font-semibold mb-2">Enter Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select category and enter your contact information
                </p>
              </div>
              <div>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">3</span>
                </div>
                <h3 className="font-semibold mb-2">Complete Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Follow the prompts to complete your donation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
