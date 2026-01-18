import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maritime Biking | Nova Scotia & Newfoundland 2008",
  description: "A 900-mile bicycle journey through Nova Scotia and Newfoundland in the summer of 2008.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${sourceSerif.variable} antialiased bg-stone-50 text-stone-900`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
