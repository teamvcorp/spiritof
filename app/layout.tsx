import type { Metadata } from "next";
import { Geist, Geist_Mono, Paytone_One } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header.server";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers.client";
const paytoneOne = Paytone_One({
  variable: "--font-paytone-one",
  subsets: ["latin"],
  weight: "400",
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spirit of Santa - Christmas Gift Management",
  description: "Manage your children's Christmas lists, track their magic scores, and spread holiday joy with our family-friendly Christmas gift platform.",
  keywords: "Christmas, gifts, children, Santa, holiday, family, magic score, gift lists",
  openGraph: {
    title: "Spirit of Santa - Christmas Gift Management",
    description: "Manage your children's Christmas lists, track their magic scores, and spread holiday joy with our family-friendly Christmas gift platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${paytoneOne.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main className="pt-[72px] pb-4 md:pb-24">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
