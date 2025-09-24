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
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Status", href: "/status" },
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
    <footer role="contentinfo" className={cn("border-t bg-surface text-fg", className)}>
      <Container py="lg" px="md">
        {/* Top: columns */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href={brandHref} className="text-lg font-semibold text-fg hover:opacity-90">
              {brandName}
            </a>
            <p className="mt-2 max-w-prose text-sm text-muted">
              Making holiday magic simpler for families.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="space-y-3">
              <div className="text-sm font-medium text-fg/80">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-sm text-muted hover:text-fg">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom: fine print */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t pt-6 text-sm text-muted sm:flex-row">
          <div>
            © {year} {brandName}. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="/legal/privacy" className="hover:text-fg">Privacy</a>
            <a href="/legal/terms" className="hover:text-fg">Terms</a>
            <a href="/contact" className="hover:text-fg">Contact</a>
            {finePrint}
          </div>
        </div>
      </Container>
    </footer>
  );
}
