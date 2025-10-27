import type { Metadata } from "next";
import { Geist, Geist_Mono, Paytone_One } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header.server";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers.client";
import SplashScreen from "@/components/SplashScreen";
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
  // Check if we're in development/pre-launch mode
  const isInDev = process.env.INDEV === 'true';
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${paytoneOne.variable} antialiased`}
      >
        <Providers>
          {/* Show splash screen if in dev/pre-launch mode */}
          <SplashScreen isInDev={isInDev} />
          
          {/* Normal app layout - only visible when INDEV is false */}
          <Header />
          <main className="pt-[74px] pb-4 md:pb-24">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
