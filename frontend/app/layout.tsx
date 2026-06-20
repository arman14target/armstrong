import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { NumericKeyboardProvider } from "@/contexts/NumericKeyboardContext";
import { WebOnlyClientExtras } from "@/components/WebOnlyClientExtras";
import { GymStoreProvider } from "@/hooks/useGymStore";
import { getSiteUrl } from "@/lib/siteUrl";
import { theme } from "@/lib/theme";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Armstrong — Gym Tracker",
  description: "Gym workout tracker for push, leg, abs, and pull days",
  manifest: `${basePath}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Armstrong",
  },
  icons: {
    icon: [
      { url: `${basePath}/icons/favicon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: `${basePath}/icons/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
    ],
    shortcut: `${basePath}/icons/icon-192.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: theme.colors.background,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${dmSans.variable}`}
    >
      <head>
        {basePath ? <base href={`${basePath}/`} /> : null}
      </head>
      <body>
        <AuthProvider>
          <GymStoreProvider>
            <NumericKeyboardProvider>
              <AppShell>{children}</AppShell>
            </NumericKeyboardProvider>
          </GymStoreProvider>
        </AuthProvider>
        <WebOnlyClientExtras />
      </body>
    </html>
  );
}
