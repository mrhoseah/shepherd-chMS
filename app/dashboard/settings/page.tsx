"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setMpesaSettings,
  setSmsSettings,
  setEmailSettings,
  setCognitoSettings,
  setCloudinarySettings,
} from "@/lib/store/slices/settingsSlice";
import { setCurrency } from "@/lib/store/slices/currencySlice";
import { store } from "@/lib/store/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Smartphone,
  QrCode,
  Mail,
  Bell,
  Shield,
  Key,
  Image,
  DollarSign,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  CreditCard,
  LayoutDashboard,
  Info,
  Plug,
} from "lucide-react";
import { GuestQRCode } from "@/components/guest-qr-code";
import Link from "next/link";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "authentication" | "payment" | "communication" | "storage" | "other";
  status: "connected" | "not_connected" | "configured" | "not_configured";
  settingsUrl?: string;
  docsUrl?: string;
}

const integrations: Integration[] = [
  {
    id: "cognito",
    name: "AWS Cognito",
    description: "User authentication and identity management",
    icon: <Key className="w-5 h-5" />,
    category: "authentication",
    status: "configured",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Mobile money payments via STK Push",
    icon: <Smartphone className="w-5 h-5" />,
    category: "payment",
    status: "not_configured",
    docsUrl: "https://developer.safaricom.co.ke/",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Online payment processing",
    icon: <CreditCard className="w-5 h-5" />,
    category: "payment",
    status: "not_configured",
    docsUrl: "https://developer.paypal.com/",
  },
  {
    id: "afrikas-talking",
    name: "Afrika's Talking",
    description: "SMS messaging service",
    icon: <MessageSquare className="w-5 h-5" />,
    category: "communication",
    status: "not_configured",
    docsUrl: "https://developers.africastalking.com/",
  },
  {
    id: "smtp",
    name: "SMTP Email",
    description: "Email delivery via SMTP",
    icon: <Mail className="w-5 h-5" />,
    category: "communication",
    status: "not_configured",
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Image and media storage",
    icon: <Image className="w-5 h-5" />,
    category: "storage",
    status: "configured",
    docsUrl: "https://cloudinary.com/documentation",
  },
];

// Helper function to get status badge
function getStatusBadge(status: string) {
  switch (status) {
    case "connected":
      return <Badge className="bg-green-500">Connected</Badge>;
    case "configured":
      return <Badge variant="secondary">Configured</Badge>;
    case "not_configured":
      return <Badge variant="outline">Not Configured</Badge>;
    case "not_connected":
      return <Badge variant="destructive">Not Connected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState(false);
  const [mpesaSettings, setMpesaSettings] = useState({
    consumerKey: "",
    consumerSecret: "",
    shortcode: "",
    passkey: "",
    callbackUrl: "",
  });
  const [smsSettings, setSmsSettings] = useState({
    apiKey: "",
    username: "",
    senderId: "",
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
  });
  const [cognitoSettings, setCognitoSettings] = useState({
    userPoolId: "af-south-1_HZYIpahzs",
    clientId: "2e0nfb1h5vg24r0692ff14i3d2",
    region: "af-south-1",
  });
  const [cloudinarySettings, setCloudinarySettings] = useState({
    cloudName: "",
    apiKey: "938738613582347",
    apiSecret: "GSU8fpKkKTpXG0DqtAZ7AiW2Ojs",
  });
  const [currencySettings, setCurrencySettings] = useState({
    currency: "KSH",
    currencySymbol: "KSh",
  });
  const [guestCommunicationSettings, setGuestCommunicationSettings] = useState({
    frequencyPerWeek: 1, // Default: once per week
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    // Load settings from database first, then fallback to Redux
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const dbSettings = data.settings || {};
          
          // Load settings from database if available
          if (dbSettings.mpesa) {
            setMpesaSettings(dbSettings.mpesa);
            dispatch(setMpesaSettings(dbSettings.mpesa));
          }
          if (dbSettings.sms) {
            setSmsSettings(dbSettings.sms);
            dispatch(setSmsSettings(dbSettings.sms));
          }
          if (dbSettings.email) {
            setEmailSettings(dbSettings.email);
            dispatch(setEmailSettings(dbSettings.email));
          }
          if (dbSettings.cognito) {
            setCognitoSettings(dbSettings.cognito);
            dispatch(setCognitoSettings(dbSettings.cognito));
          }
          if (dbSettings.cloudinary) {
            setCloudinarySettings(dbSettings.cloudinary);
            dispatch(setCloudinarySettings(dbSettings.cloudinary));
          }
          if (dbSettings.currency) {
            setCurrencySettings(dbSettings.currency);
            dispatch(setCurrency(dbSettings.currency));
          }
          if (dbSettings.guestCommunication) {
            setGuestCommunicationSettings(dbSettings.guestCommunication);
          }
          return; // Exit early if we loaded from DB
        }
      } catch (error) {
        console.error("Error loading settings from database:", error);
      }
      
      // Fallback to Redux store (localStorage) if database doesn't have settings
      const state = store.getState();
      if (state.settings.initialized) {
        setMpesaSettings(state.settings.mpesa);
        setSmsSettings(state.settings.sms);
        setEmailSettings(state.settings.email);
        setCognitoSettings(state.settings.cognito);
        setCloudinarySettings(state.settings.cloudinary);
      }
      if (state.currency.initialized) {
        setCurrencySettings({
          currency: state.currency.currency,
          currencySymbol: state.currency.currencySymbol,
        });
      }
    };

    loadSettings();

    // Set active tab from URL parameter
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, dispatch]);

  const handleSaveMpesa = async () => {
    setLoading(true);
    try {
      // Save to Redux
      dispatch(setMpesaSettings(mpesaSettings));
      
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            mpesa: mpesaSettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("M-Pesa settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving M-Pesa settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSms = async () => {
    setLoading(true);
    try {
      // Save to Redux
      dispatch(setSmsSettings(smsSettings));
      
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            sms: smsSettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("SMS settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving SMS settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    setLoading(true);
    try {
      // Save to Redux
      dispatch(setEmailSettings(emailSettings));
      
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            email: emailSettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("Email settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving email settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCognito = async () => {
    setLoading(true);
    try {
      // Save to Redux
      dispatch(setCognitoSettings(cognitoSettings));
      
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            cognito: cognitoSettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("Cognito settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving Cognito settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCloudinary = async () => {
    setLoading(true);
    try {
      // Save to Redux
      dispatch(setCloudinarySettings(cloudinarySettings));
      
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            cloudinary: cloudinarySettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("Cloudinary settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving Cloudinary settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrency = async () => {
    setLoading(true);
    try {
      // Save to Redux
      dispatch(setCurrency(currencySettings));
      
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            currency: currencySettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("Currency settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving currency settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGuestCommunication = async () => {
    setLoading(true);
    try {
      // Save to database
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            guestCommunication: guestCommunicationSettings,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }

      alert("Guest communication settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving guest communication settings:", error);
      alert(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your church management system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-8">
          <TabsTrigger value="overview">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="app">
            <Settings className="w-4 h-4 mr-2" />
            App
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="cognito">
            <Key className="w-4 h-4 mr-2" />
            Cognito
          </TabsTrigger>
          <TabsTrigger value="mpesa">
            <Smartphone className="w-4 h-4 mr-2" />
            M-Pesa
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="cloudinary">
            <Image className="w-4 h-4 mr-2" />
            Cloudinary
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                    <Badge className="bg-green-500">Connected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Authentication</span>
                    <Badge variant="secondary">Configured</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5" />
                  Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Configured</span>
                    <span className="text-lg font-semibold">
                      {integrations.filter((i) => i.status === "configured" || i.status === "connected").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Not Configured</span>
                    <span className="text-lg font-semibold">
                      {integrations.filter((i) => i.status === "not_configured").length}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("integrations")}
                  >
                    View All Integrations
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("app")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    App Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("integrations")}
                  >
                    <Plug className="w-4 h-4 mr-2" />
                    Manage Integrations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
              <CardDescription>
                Essential settings to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">1. AWS Cognito</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set up user authentication. Required for user login and registration.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-1"
                      onClick={() => setActiveTab("cognito")}
                    >
                      Configure →
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">2. M-Pesa</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable mobile money payments for donations and giving.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-1"
                      onClick={() => setActiveTab("mpesa")}
                    >
                      Configure →
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">3. Afrika's Talking</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send SMS notifications and messages to members.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-1"
                      onClick={() => setActiveTab("sms")}
                    >
                      Configure →
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <Image className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">4. Cloudinary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Store and serve images for member profiles, events, and media.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-1"
                      onClick={() => setActiveTab("cloudinary")}
                    >
                      Configure →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings Tab */}
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currency Configuration</CardTitle>
              <CardDescription>
                Set the default currency for financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  value={currencySettings.currency}
                  onChange={(e) =>
                    setCurrencySettings({ ...currencySettings, currency: e.target.value.toUpperCase() })
                  }
                  placeholder="KSH"
                  maxLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ISO 4217 currency code (e.g., KSH, USD, EUR)
                </p>
              </div>
              <div>
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={currencySettings.currencySymbol}
                  onChange={(e) =>
                    setCurrencySettings({ ...currencySettings, currencySymbol: e.target.value })
                  }
                  placeholder="KSh"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Symbol to display with amounts (e.g., KSh, $, €)
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Preview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Amount will be displayed as: <span className="font-semibold">{currencySettings.currencySymbol} 1,000.00</span>
                </p>
              </div>
              <Button onClick={handleSaveCurrency} disabled={loading}>
                {loading ? "Saving..." : "Save Currency Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code Giving</CardTitle>
              <CardDescription>
                Configure QR code settings for congregation giving
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Public QR Scan URL</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Share this URL with your congregation to scan QR codes for giving:
                </p>
                <code className="text-sm bg-white dark:bg-gray-800 p-2 rounded block">
                  {typeof window !== "undefined" ? window.location.origin : ""}/give/qr
                </code>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">How It Works</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Generate a QR code for a specific amount and category</li>
                  <li>Display the QR code (on screen, printed, etc.)</li>
                  <li>Congregation scans the QR code with their phone</li>
                  <li>They enter their phone number</li>
                  <li>M-Pesa STK push is automatically triggered</li>
                  <li>Payment is processed and recorded</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Communication Frequency</CardTitle>
              <CardDescription>
                Set how often guests should receive communications (per week)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="frequencyPerWeek">Communications Per Week</Label>
                <Input
                  id="frequencyPerWeek"
                  type="number"
                  min="0"
                  max="7"
                  value={guestCommunicationSettings.frequencyPerWeek}
                  onChange={(e) =>
                    setGuestCommunicationSettings({
                      ...guestCommunicationSettings,
                      frequencyPerWeek: Math.max(0, Math.min(7, parseInt(e.target.value) || 0)),
                    })
                  }
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of times per week guests should receive communications (0-7). 
                  This setting helps manage follow-up frequency for new guests.
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Current Setting</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Guests will receive communications <span className="font-semibold">{guestCommunicationSettings.frequencyPerWeek}</span> time(s) per week.
                </p>
                {guestCommunicationSettings.frequencyPerWeek === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Setting to 0 means guests will not receive scheduled communications.
                  </p>
                )}
              </div>
              <Button onClick={handleSaveGuestCommunication} disabled={loading}>
                {loading ? "Saving..." : "Save Guest Communication Settings"}
              </Button>
            </CardContent>
          </Card>

          <GuestQRCode />
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Role Permissions Management
              </CardTitle>
              <CardDescription>
                Manage permissions for different user roles using Casbin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/roles">
                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Roles & Permissions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Overview of all configured integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {integrations.filter((i) => i.status === "connected").length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Connected
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {integrations.filter((i) => i.status === "configured").length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Configured
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {integrations.filter((i) => i.status === "not_configured").length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Not Configured
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {integrations.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        {integration.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        {getStatusBadge(integration.status)}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => setActiveTab(integration.id)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    {integration.docsUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(integration.docsUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cognito Settings */}
        <TabsContent value="cognito">
          <Card>
            <CardHeader>
              <CardTitle>AWS Cognito Configuration</CardTitle>
              <CardDescription>
                Configure AWS Cognito for user authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userPoolId">User Pool ID</Label>
                <Input
                  id="userPoolId"
                  value={cognitoSettings.userPoolId}
                  onChange={(e) =>
                    setCognitoSettings({ ...cognitoSettings, userPoolId: e.target.value })
                  }
                  placeholder="us-east-1_XXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your AWS Cognito User Pool ID
                </p>
              </div>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={cognitoSettings.clientId}
                  onChange={(e) =>
                    setCognitoSettings({ ...cognitoSettings, clientId: e.target.value })
                  }
                  placeholder="Enter Cognito App Client ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  App Client ID from your Cognito User Pool
                </p>
              </div>
              <div>
                <Label htmlFor="region">AWS Region</Label>
                <Input
                  id="region"
                  value={cognitoSettings.region}
                  onChange={(e) =>
                    setCognitoSettings({ ...cognitoSettings, region: e.target.value })
                  }
                  placeholder="us-east-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AWS region where your Cognito User Pool is located
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Environment Variables</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Add these to your <code className="bg-white dark:bg-gray-800 px-1 rounded">.env</code> file:
                </p>
                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block">
                  COGNITO_USER_POOL_ID={cognitoSettings.userPoolId || "your-pool-id"}<br />
                  COGNITO_CLIENT_ID={cognitoSettings.clientId || "your-client-id"}<br />
                  COGNITO_REGION={cognitoSettings.region || "us-east-1"}<br />
                  AWS_ACCESS_KEY_ID=your-access-key<br />
                  AWS_SECRET_ACCESS_KEY=your-secret-key
                </code>
              </div>
              <Button onClick={handleSaveCognito} disabled={loading}>
                {loading ? "Saving..." : "Save Cognito Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* M-Pesa Settings */}
        <TabsContent value="mpesa">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa STK Push Configuration</CardTitle>
              <CardDescription>
                Configure M-Pesa credentials for mobile money payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="consumerKey">Consumer Key</Label>
                <Input
                  id="consumerKey"
                  type="password"
                  value={mpesaSettings.consumerKey}
                  onChange={(e) =>
                    setMpesaSettings({ ...mpesaSettings, consumerKey: e.target.value })
                  }
                  placeholder="Enter M-Pesa Consumer Key"
                />
              </div>
              <div>
                <Label htmlFor="consumerSecret">Consumer Secret</Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  value={mpesaSettings.consumerSecret}
                  onChange={(e) =>
                    setMpesaSettings({ ...mpesaSettings, consumerSecret: e.target.value })
                  }
                  placeholder="Enter M-Pesa Consumer Secret"
                />
              </div>
              <div>
                <Label htmlFor="shortcode">Shortcode</Label>
                <Input
                  id="shortcode"
                  value={mpesaSettings.shortcode}
                  onChange={(e) =>
                    setMpesaSettings({ ...mpesaSettings, shortcode: e.target.value })
                  }
                  placeholder="e.g., 174379"
                />
              </div>
              <div>
                <Label htmlFor="passkey">Passkey</Label>
                <Input
                  id="passkey"
                  type="password"
                  value={mpesaSettings.passkey}
                  onChange={(e) =>
                    setMpesaSettings({ ...mpesaSettings, passkey: e.target.value })
                  }
                  placeholder="Enter M-Pesa Passkey"
                />
              </div>
              <div>
                <Label htmlFor="callbackUrl">Callback URL</Label>
                <Input
                  id="callbackUrl"
                  value={mpesaSettings.callbackUrl}
                  onChange={(e) =>
                    setMpesaSettings({ ...mpesaSettings, callbackUrl: e.target.value })
                  }
                  placeholder="https://yourdomain.com/api/donations/mpesa-stk"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL where M-Pesa will send payment callbacks
                </p>
              </div>
              <Button onClick={handleSaveMpesa} disabled={loading}>
                {loading ? "Saving..." : "Save M-Pesa Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>Afrika's Talking SMS Configuration</CardTitle>
              <CardDescription>
                Configure SMS settings for sending messages to members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smsApiKey">API Key</Label>
                <Input
                  id="smsApiKey"
                  type="password"
                  value={smsSettings.apiKey}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, apiKey: e.target.value })
                  }
                  placeholder="Enter Afrika's Talking API Key"
                />
              </div>
              <div>
                <Label htmlFor="smsUsername">Username</Label>
                <Input
                  id="smsUsername"
                  value={smsSettings.username}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, username: e.target.value })
                  }
                  placeholder="Enter Afrika's Talking Username"
                />
              </div>
              <div>
                <Label htmlFor="senderId">Sender ID</Label>
                <Input
                  id="senderId"
                  value={smsSettings.senderId}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, senderId: e.target.value })
                  }
                  placeholder="e.g., EASTGATE"
                />
              </div>
              <Button onClick={handleSaveSms} disabled={loading}>
                {loading ? "Saving..." : "Save SMS Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                    }
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  value={emailSettings.smtpUser}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                  }
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                  }
                  placeholder="Enter SMTP password"
                />
              </div>
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                  }
                  placeholder="noreply@yourchurch.com"
                />
              </div>
              <Button onClick={handleSaveEmail} disabled={loading}>
                {loading ? "Saving..." : "Save Email Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloudinary Settings */}
        <TabsContent value="cloudinary">
          <Card>
            <CardHeader>
              <CardTitle>Cloudinary Configuration</CardTitle>
              <CardDescription>
                Configure Cloudinary for image and media storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cloudName">Cloud Name</Label>
                <Input
                  id="cloudName"
                  value={cloudinarySettings.cloudName}
                  onChange={(e) =>
                    setCloudinarySettings({ ...cloudinarySettings, cloudName: e.target.value })
                  }
                  placeholder="your-cloud-name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Cloudinary cloud name
                </p>
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  value={cloudinarySettings.apiKey}
                  onChange={(e) =>
                    setCloudinarySettings({ ...cloudinarySettings, apiKey: e.target.value })
                  }
                  placeholder="Enter Cloudinary API Key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Cloudinary API Key
                </p>
              </div>
              <div>
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={cloudinarySettings.apiSecret}
                  onChange={(e) =>
                    setCloudinarySettings({ ...cloudinarySettings, apiSecret: e.target.value })
                  }
                  placeholder="Enter Cloudinary API Secret"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Cloudinary API Secret (keep this secure)
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Environment Variables</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Add these to your <code className="bg-white dark:bg-gray-800 px-1 rounded">.env</code> file:
                </p>
                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded block">
                  CLOUDINARY_CLOUD_NAME={cloudinarySettings.cloudName || "your-cloud-name"}<br />
                  CLOUDINARY_API_KEY={cloudinarySettings.apiKey || "your-api-key"}<br />
                  CLOUDINARY_API_SECRET={cloudinarySettings.apiSecret || "your-api-secret"}
                </code>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold mb-2">Usage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cloudinary is used for storing and serving images throughout the system, including:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside mt-2 space-y-1">
                  <li>Member profile images</li>
                  <li>Family photos</li>
                  <li>Event posters</li>
                  <li>Media library files</li>
                </ul>
              </div>
              <Button onClick={handleSaveCloudinary} disabled={loading}>
                {loading ? "Saving..." : "Save Cloudinary Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
