import React from "react";
import Container from "./ui/Container";

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export type FooterProps = {
  className?: string;
  brandName?: string;
  brandHref?: string;
  columns?: FooterColumn[];
  finePrint?: React.ReactNode;
};

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Christmas Lists", href: "/children/list" },
      { label: "Magic Meter", href: "/children" },
      { label: "Parent Dashboard", href: "/parent/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "How It Works", href: "/#features" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "COPPA Compliance", href: "/privacy#coppa" },
    ],
  },
];

export default function Footer({
  className,
  brandName = "Spirit of Santa",
  brandHref = "/",
  columns = defaultColumns,
  finePrint,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className={cn("hidden md:block fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#005574] to-[#032255] text-white z-30 border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]", className)}>
      <Container py="sm" px="md">
        {/* Compact footer for fixed positioning */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <a href={brandHref} className="text-lg font-semibold text-white hover:opacity-80 transition-opacity">
              {brandName}
            </a>
            <span className="hidden sm:block text-sm text-white/70">
              Making holiday magic simpler for families.
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="/children/list" className="text-white/70 hover:text-white transition-colors">Christmas Lists</a>
            <a href="/parent/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</a>
            <a href="/big-magic" className="text-white/70 hover:text-white transition-colors font-semibold">Big Magic</a>
            <a href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="text-white/70 hover:text-white transition-colors">Terms</a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-white/60">
            © {year} {brandName}
          </div>
        </div>
      </Container>
    </footer>
  );
}
