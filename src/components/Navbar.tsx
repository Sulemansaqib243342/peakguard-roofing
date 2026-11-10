import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { Phone, Shield, Menu, X, ArrowRight } from "lucide-react";

interface NavbarProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEstimate, onOpenCheckout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top info bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-300">
              {siteConfig.company.emergencyHours}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>{siteConfig.company.license}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">{siteConfig.company.insurance}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <a
              href={`tel:${siteConfig.company.phone}`}
              className="text-amber-400 font-semibold hover:underline flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
            >
              <Phone className="w-3 h-3" />
              <span>{siteConfig.company.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a
              href="#"
              className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-xl"
              aria-label={`${siteConfig.company.name} Home`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
                <Shield className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center font-display font-bold text-lg tracking-tight text-slate-900">
                  <span>{siteConfig.brand.logoText}</span>
                  <span className="text-amber-600 ml-1">{siteConfig.brand.logoHighlight}</span>
                </div>
                <span className="text-[11px] tracking-wider uppercase font-medium text-slate-500">
                  Residential & Commercial
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links (reduced clutter) */}
            <nav className="hidden md:flex items-center gap-7">
              <a
                href="#services"
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              >
                Pricing
              </a>
              <a
                href="#service-area"
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              >
                Service Area
              </a>
              <a
                href="#reviews"
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              >
                Reviews
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
              >
                FAQ
              </a>
            </nav>

            {/* Desktop CTAs: Clear Hierarchy (Secondary Outline + Primary Filled) */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenCheckout("inspection")}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                Book Inspection ($149)
              </button>
              <button
                type="button"
                onClick={onOpenEstimate}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <span>Request Estimate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <a
                href={`tel:${siteConfig.company.phone}`}
                className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={`Call ${siteConfig.company.phoneDisplay}`}
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
            >
              Pricing Plans
            </a>
            <a
              href="#service-area"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
            >
              Service Area
            </a>
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
            >
              Reviews (Sample Content)
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
            >
              FAQ
            </a>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCheckout("inspection");
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-center"
              >
                Book $149 Roof Inspection
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenEstimate();
                }}
                className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 text-center shadow-sm"
              >
                Request Free Estimate
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
