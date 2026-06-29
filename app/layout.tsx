import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteLayout } from "@/components/layout/site-layout";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { FAVICON_PATHS } from "@/lib/constants/favicon";
import { absoluteUrl } from "@/lib/constants/site";
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
  themeColor: "#f06aad",
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
        <link rel="icon" href={absoluteUrl(FAVICON_PATHS.ico)} sizes="any" />
        <link rel="icon" type="image/svg+xml" href={absoluteUrl(FAVICON_PATHS.svg)} />
        <link rel="icon" type="image/png" sizes="48x48" href={absoluteUrl(FAVICON_PATHS.png48)} />
        <link rel="icon" type="image/png" sizes="32x32" href={absoluteUrl(FAVICON_PATHS.png32)} />
        <link rel="apple-touch-icon" href={absoluteUrl(FAVICON_PATHS.apple)} />
        <link rel="apple-touch-icon-precomposed" href={absoluteUrl(FAVICON_PATHS.applePrecomposed)} />
        <link rel="mask-icon" href={absoluteUrl(FAVICON_PATHS.maskIcon)} color="#f06aad" />
      </head>
      <body className="flex min-h-full min-h-screen-safe flex-col">
        <AnalyticsScripts />
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
