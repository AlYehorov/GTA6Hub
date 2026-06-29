import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteLayout } from "@/components/layout/site-layout";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { faviconHref } from "@/lib/constants/favicon";
import { rootMetadata } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" /> : null}
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" sizes="32x32" href={faviconHref("/icon-32.png")} />
        <link rel="icon" type="image/png" sizes="192x192" href={faviconHref("/icon-192.png")} />
        <link rel="icon" href={faviconHref("/favicon.ico")} sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href={faviconHref("/apple-touch-icon.png")} />
      </head>
      <body className="flex min-h-full min-h-screen-safe flex-col">
        <AnalyticsScripts />
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
