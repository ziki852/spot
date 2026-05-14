import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spot — Discover great places in the UK",
  description: "Find and review restaurants, cafes, pubs, and more across the UK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafaf8] text-[#0e0e0e]">
        {children}
      </body>
    </html>
  );
}
