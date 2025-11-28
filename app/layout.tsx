import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { appConfig } from "@/lib/app-config";
import { getAppNameFromDB } from "@/lib/app-config-server";
import { getChurchPWAConfig } from "@/lib/church-pwa";
import { ServiceWorkerRegistration } from "./sw-register";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ErrorSuppression } from "./error-suppression";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getAppNameFromDB();
  const pwaConfig = await getChurchPWAConfig();
  
  return {
    title: appName,
    description: pwaConfig.description,
    manifest: "/api/manifest", // Use dynamic manifest endpoint
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: pwaConfig.shortName,
    },
    icons: {
      icon: [
        { url: pwaConfig.icon192 ? pwaConfig.icon192.replace(/\.png$/i, ".svg") : "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
        { url: pwaConfig.icon512 ? pwaConfig.icon512.replace(/\.png$/i, ".svg") : "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
      ],
      apple: [
        { url: pwaConfig.icon192 ? pwaConfig.icon192.replace(/\.png$/i, ".svg") : "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      ],
    },
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const pwaConfig = await getChurchPWAConfig();
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: pwaConfig.themeColor,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorSuppression />
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
