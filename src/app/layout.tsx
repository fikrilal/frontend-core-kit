import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import {
  absoluteUrl,
  siteDescription,
  siteName,
  siteOgAlt,
  siteUrl,
} from "@/app/site-metadata";
import { ThemeScript } from "@/components/theme/theme-script";
import { ThemeSync } from "@/components/theme/theme-sync";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: siteName,
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  category: "technology",
  creator: "fikrilal",
  authors: [
    {
      name: "fikrilal",
      url: "https://github.com/fikrilal",
    },
  ],
  keywords: [
    "Lamara",
    "AI coding tools",
    "token tracking",
    "Codex",
    "Claude Code",
    "OpenCode",
    "local-first",
    "Tauri",
  ],
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    url: siteUrl,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: siteOgAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: absoluteUrl("/twitter-image"),
        alt: siteOgAlt,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeSync />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
