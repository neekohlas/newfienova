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

const siteUrl = 'https://neekohlas.github.io/newfienova';

export const metadata: Metadata = {
  title: "Maritime & Beyond | A Nova Scotia & Newfoundland Journey",
  description: "A 900-mile bicycle journey through Nova Scotia and Newfoundland in the summer of 2008.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Maritime & Beyond | A Nova Scotia & Newfoundland Journey",
    description: "A 900-mile bicycle journey through Nova Scotia and Newfoundland. Three friends, a veggie-oil Mercedes, and the summer of 2008.",
    url: siteUrl,
    siteName: "Maritime & Beyond",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Maritime & Beyond - Nova Scotia & Newfoundland bicycle journey',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Maritime & Beyond | A Nova Scotia & Newfoundland Journey",
    description: "A 900-mile bicycle journey through Nova Scotia and Newfoundland. Three friends, a veggie-oil Mercedes, and the summer of 2008.",
    images: ['/og-image.jpg'],
  },
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
