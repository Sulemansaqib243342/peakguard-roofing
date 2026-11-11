import React from "react";
import { siteConfig } from "../site.config";
import { Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const { company, brand } = siteConfig;

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 pb-24 md:pb-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Business Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="font-display font-bold text-lg text-white">
                <span>{brand.logoText}</span>{" "}
                <span className="text-amber-400">{brand.logoHighlight}</span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed">
              {company.tagline}. Full replacements, storm leak repairs, and 21-point inspections powered by Whop Payments.
            </p>

            <div className="space-y-1 text-slate-400">
              <div>{company.address.formatted}</div>
              <div>{company.phoneDisplay}</div>
              <div>{company.license}</div>
            </div>
          </div>

          {/* Col 2: Services & Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </div>
            <ul className="space-y-2.5">
              <li>
                <a href="#services" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  Roofing Services
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#areas" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  Service Areas
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  Sample Reviews
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Hours */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Hours &amp; Dispatch
            </div>
            <ul className="space-y-2 text-slate-400">
              <li>{company.hours}</li>
              <li>{company.emergencyHours}</li>
              <li>
                <a href={`mailto:${company.email}`} className="text-slate-300 hover:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  {company.email}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded">
                  Request Free Estimate
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Billing & Whop Portal */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Billing &amp; Portal
            </div>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/admin/invoicing"
                  className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 text-slate-200 font-medium focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Invoicing Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/checkout/return?status=demo"
                  className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
                >
                  Checkout Return Status
                </Link>
              </li>
              <li>
                <a
                  href="https://whop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
                >
                  Powered by Whop
                </a>
              </li>
            </ul>
            <p className="pt-2 text-[11px] text-slate-500 leading-relaxed">
              Accepting cards, Apple Pay, and Google Pay via Whop Elements. Financing options appear at checkout for approved merchants.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>{company.insurance}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
