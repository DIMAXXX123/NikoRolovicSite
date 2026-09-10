import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { buildThemeBootstrapScript } from "@/lib/theme";
import "./globals.css";

// Self-hosted through next/font — no render-blocking request to
// fonts.googleapis.com, and no layout shift while the font loads.
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Gimnazija Niko Rolović",
  description: "Studentski portal Gimnazije Niko Rolović",
  manifest: "/manifest.json",
  applicationName: "NR Gimnazija",
  appleWebApp: {
    capable: true,
    title: "NR Gimnazija",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale / userScalable: pinch-zoom stays available.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The theme class and CSS variables are set by the bootstrap script below
    // before first paint, so the server-rendered markup deliberately differs.
    <html lang="sr" suppressHydrationWarning className={dmSans.variable}>
      <head>
        <script
          // Runs before paint: reads the saved palette and colour mode and
          // applies them, falling back to the phone's system theme.
          dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }}
        />
        {/* Safari ignores the manifest, so it needs these spelled out. */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NR Gimnazija" />
      </head>
      <body className="min-h-dvh bg-background">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
