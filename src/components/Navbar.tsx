import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { Phone, Home, Menu, X, ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface NavbarProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEstimate, onOpenCheckout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#pricing", label: "Pricing" },
    { href: "#areas", label: "Areas" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <>
      {/* Top Utility Strip */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800/80">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 text-slate-400 min-w-0 max-w-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{siteConfig.company.license}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline" />
            <span className="font-medium">{siteConfig.company.emergencyHours}</span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo Left */}
            <a
              href="#"
              className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-xl shrink-0"
              aria-label={`${siteConfig.company.name} Home`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm group-hover:bg-amber-400 transition-colors">
                <Home className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-slate-950">
                  {siteConfig.brand.logoText}
                </span>
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-amber-600 mt-0.5">
                  {siteConfig.brand.logoHighlight}
                </span>
              </div>
            </a>

            {/* Desktop Nav Links */}
            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-1 py-1"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right Phone & Amber CTA */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <a
                href={`tel:${siteConfig.company.phone}`}
                className="text-sm font-semibold text-slate-800 hover:text-amber-600 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-2 py-1"
              >
                <Phone className="w-4 h-4 text-amber-500" />
                <span>{siteConfig.company.phoneDisplay}</span>
              </a>

              <button
                type="button"
                onClick={onOpenEstimate}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span>Free Estimate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-2">
              <a
                href={`tel:${siteConfig.company.phone}`}
                className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                aria-label={`Call ${siteConfig.company.phoneDisplay}`}
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile Navigation"
            className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fade-in"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenEstimate();
                }}
                className="w-full py-3 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                Free Estimate
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCheckout("inspection");
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                Book {siteConfig.whop.plans.inspection.priceDisplay} Inspection
              </button>
            </div>
          </nav>
        )}
      </header>
    </>
  );
};
