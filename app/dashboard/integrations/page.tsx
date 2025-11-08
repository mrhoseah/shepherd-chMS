"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Mail,
  CreditCard,
  Image,
  Key,
  CheckCircle2,
  XCircle,
  Settings,
  ExternalLink,
  MessageSquare,
  Calendar,
  DollarSign,
} from "lucide-react";
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
    settingsUrl: "/dashboard/settings?tab=cognito",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Mobile money payments via STK Push",
    icon: <Smartphone className="w-5 h-5" />,
    category: "payment",
    status: "not_configured",
    settingsUrl: "/dashboard/settings?tab=mpesa",
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
    settingsUrl: "/dashboard/settings?tab=sms",
    docsUrl: "https://developers.africastalking.com/",
  },
  {
    id: "smtp",
    name: "SMTP Email",
    description: "Email delivery via SMTP",
    icon: <Mail className="w-5 h-5" />,
    category: "communication",
    status: "not_configured",
    settingsUrl: "/dashboard/settings?tab=email",
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Image and media storage",
    icon: <Image className="w-5 h-5" />,
    category: "storage",
    status: "configured",
    settingsUrl: "/dashboard/settings?tab=cloudinary",
    docsUrl: "https://cloudinary.com/documentation",
  },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    // Check integration status from localStorage
    const checkIntegrationStatus = () => {
      // This could be enhanced to check actual API connectivity
      const mpesaSettings = localStorage.getItem("mpesa_settings");
      const smsSettings = localStorage.getItem("sms_settings");
      const emailSettings = localStorage.getItem("email_settings");
      const cognitoSettings = localStorage.getItem("cognito_settings");
      const cloudinarySettings = localStorage.getItem("cloudinary_settings");

      // Update status based on configuration
      // In a real app, you'd check API connectivity
    };
    checkIntegrationStatus();
  }, []);

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "configured":
        return (
          <Badge variant="secondary">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Configured
          </Badge>
        );
      case "not_configured":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <XCircle className="w-3 h-3 mr-1" />
            Not Configured
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
    }
  };

  const categories = [
    { id: "all", name: "All Integrations", icon: Settings },
    { id: "authentication", name: "Authentication", icon: Key },
    { id: "payment", name: "Payment", icon: CreditCard },
    { id: "communication", name: "Communication", icon: MessageSquare },
    { id: "storage", name: "Storage", icon: Image },
    { id: "other", name: "Other", icon: Settings },
  ];

  const filteredIntegrations =
    activeTab === "all"
      ? integrations
      : integrations.filter((i) => i.category === activeTab);

  return (
    <div className="p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Integrations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage third-party service integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id}>
                <Icon className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
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
                    {integration.settingsUrl && (
                      <Link href={integration.settingsUrl} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </Link>
                    )}
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

          {filteredIntegrations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No integrations found in this category.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Integration Status Overview */}
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

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
          <CardDescription>
            Essential integrations to get started
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
                <Link href="/dashboard/settings?tab=cognito">
                  <Button variant="link" size="sm" className="p-0 mt-1">
                    Configure →
                  </Button>
                </Link>
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
                <Link href="/dashboard/settings?tab=mpesa">
                  <Button variant="link" size="sm" className="p-0 mt-1">
                    Configure →
                  </Button>
                </Link>
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
                <Link href="/dashboard/settings?tab=sms">
                  <Button variant="link" size="sm" className="p-0 mt-1">
                    Configure →
                  </Button>
                </Link>
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
                <Link href="/dashboard/settings?tab=cloudinary">
                  <Button variant="link" size="sm" className="p-0 mt-1">
                    Configure →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

