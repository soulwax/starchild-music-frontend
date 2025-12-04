// File: src/app/layout.tsx

import "@/styles/globals.css";

import { Geist } from "next/font/google";
import { type ReactNode } from "react";

import { ElectronStorageInit } from "@/components/ElectronStorageInit";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FloatingActionButton from "@/components/FloatingActionButton";
import Header from "@/components/Header";
import MobileContentWrapper from "@/components/MobileContentWrapper";
import MobileNavigation from "@/components/MobileNavigation";
import PersistentPlayer from "@/components/PersistentPlayer";
import { SessionProvider } from "@/components/SessionProvider";
import SuppressExtensionErrors from "@/components/SuppressExtensionErrors";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { MobilePanesProvider } from "@/contexts/MobilePanesContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TRPCReactProvider } from "@/trpc/react";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata = {
  title: "Starchild Music Stream",
  description:
    "Modern music streaming and discovery platform with smart recommendations",
  applicationName: "Starchild Music",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  other: {
    // Enhanced mobile meta tags
    "format-detection": "telephone=no", // Prevent auto-linking phone numbers
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://api.deezer.com" />
      </head>
      <body>
        <SuppressExtensionErrors />
        <ElectronStorageInit />
        <ErrorBoundary>
          <SessionProvider>
            <TRPCReactProvider>
              <ToastProvider>
                <AudioPlayerProvider>
                  <MobilePanesProvider>
                    {/* Header with hamburger menu */}
                    <Header />
                    {/* Mobile content wrapper with swipeable panes */}
                    <MobileContentWrapper>
                      {/* Main content with bottom padding for player and mobile nav */}
                      <div className="pb-36 md:pb-24">{children}</div>
                    </MobileContentWrapper>
                    {/* Mobile bottom navigation */}
                    <MobileNavigation />
                    {/* Floating action button for mobile */}
                    <FloatingActionButton />
                    {/* Persistent player - stays on all pages */}
                    <PersistentPlayer />
                  </MobilePanesProvider>
                </AudioPlayerProvider>
              </ToastProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
