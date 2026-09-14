import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/toast";
import "./globals.css";
import { AutoLogin } from "@/components/auto-login";
import { AppAnalytics } from "@/components/app-analytics";

const nunito = Nunito({
  weight: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gimnazija Niko Rolović",
  description: "Studentski portal Gimnazije Niko Rolović",
  manifest: "/manifest.json",
  applicationName: "NR Gimnazija",
  appleWebApp: {
    capable: true,
    title: "NR Gimnazija",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <head>
        {/* Safari ignores the manifest, so it needs these spelled out. */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NR Gimnazija" />
      </head>
      <body
        className={`${nunito.variable} ${nunito.className} min-h-screen bg-background overflow-x-hidden`}
      >
        <AutoLogin />
        <AppAnalytics />
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
