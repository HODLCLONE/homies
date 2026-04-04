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

const appUrl = "https://stmbl.hodlhq.app";
const imageUrl = `${appUrl}/opengraph-image`;
const miniappImageUrl = `${appUrl}/miniapp-image`;
const miniAppEmbed = {
  version: "next",
  imageUrl: miniappImageUrl,
  button: {
    title: "Open STMBL",
    action: {
      type: "launch_frame",
      name: "STMBL",
      url: appUrl,
      splashImageUrl: miniappImageUrl,
      splashBackgroundColor: "#061018",
    },
  },
};

export const metadata: Metadata = {
  title: "STMBL · Farcaster discovery",
  description: "A fast Farcaster mini app for finding real people, casts, and corners of the graph worth opening.",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "STMBL · Farcaster discovery",
    description: "Find real Farcaster people and casts worth opening.",
    url: appUrl,
    siteName: "STMBL",
    images: [imageUrl],
  },
  other: {
    "fc:frame": JSON.stringify(miniAppEmbed),
    "fc:miniapp": JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
