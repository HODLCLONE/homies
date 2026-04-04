import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STMBL",
  description: "Random-but-filtered Farcaster discovery.",
  metadataBase: new URL("https://stmbl.hodlhq.app"),
  openGraph: {
    title: "STMBL",
    description: "Random-but-filtered Farcaster discovery.",
    url: "https://stmbl.hodlhq.app",
    siteName: "STMBL",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
