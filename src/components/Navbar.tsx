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
      {/* Emergency banner at very top */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-300">
              {siteConfig.company.emergencyHours}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>{siteConfig.company.license}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{siteConfig.company.insurance}</span>
            <span className="hidden sm:inline">•</span>
            <a
              href={`tel:${siteConfig.company.phone}`}
              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              {siteConfig.company.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center tracking-tight font-black text-xl text-slate-900">
                  <span>{siteConfig.brand.logoText}</span>
                  <span className="text-amber-600 ml-1">{siteConfig.brand.logoHighlight}</span>
                </div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
                  Residential & Commercial
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#services"
                className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Services
              </a>
              <a
                href="#pricing"
                className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Instant Pricing
              </a>
              <a
                href="#service-area"
                className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Service Area
              </a>
              <a
                href="#financing"
                className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Financing
              </a>
              <a
                href="#reviews"
                className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                Reviews
              </a>
              <a
                href="#faq"
                className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => onOpenCheckout("inspection")}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors"
              >
                Book Inspection ($149)
              </button>
              <button
                onClick={onOpenEstimate}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>Request Estimate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center gap-2">
              <a
                href={`tel:${siteConfig.company.phone}`}
                className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold"
                aria-label="Call Now"
              >
                <Phone className="w-5 h-5" />
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-amber-600"
            >
              Services
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-amber-600"
            >
              Instant Pricing
            </a>
            <a
              href="#service-area"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-amber-600"
            >
              Service Area
            </a>
            <a
              href="#financing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-amber-600"
            >
              Financing
            </a>
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-amber-600"
            >
              Reviews
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800 hover:text-amber-600"
            >
              FAQ
            </a>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCheckout("inspection");
                }}
                className="w-full py-3 rounded-lg text-sm font-bold text-slate-900 bg-amber-100 border border-amber-300 text-center"
              >
                Book $149 Roof Inspection
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenEstimate();
                }}
                className="w-full py-3 rounded-lg text-sm font-bold text-white bg-slate-900 text-center"
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
