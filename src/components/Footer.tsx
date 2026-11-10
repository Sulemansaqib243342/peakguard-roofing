import React from "react";
import { siteConfig } from "../site.config";
import { Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const { company, brand } = siteConfig;

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="tracking-tight font-black text-xl text-white">
                <span>{brand.logoText}</span>{" "}
                <span className="text-amber-400">{brand.logoHighlight}</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {company.tagline}. Precision roofing installations, emergency storm services, and forensic drone inspections across Texas.
            </p>

            <div className="pt-2 space-y-1 text-slate-400">
              <div><strong>License:</strong> {company.license}</div>
              <div><strong>Insurance:</strong> {company.insurance}</div>
              <div><strong>Headquarters:</strong> {company.address.formatted}</div>
            </div>
          </div>

          {/* Col 3: Services Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Roofing Services
            </div>
            <ul className="space-y-2">
              {siteConfig.services.map((svc) => (
                <li key={svc.id}>
                  <a href="#services" className="hover:text-amber-400 transition-colors">
                    {svc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Quick Navigation */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Quick Links
            </div>
            <ul className="space-y-2">
              <li><a href="#pricing" className="hover:text-amber-400 transition-colors">Instant Booking Plans</a></li>
              <li><a href="#service-area" className="hover:text-amber-400 transition-colors">Service Areas & ZIPs</a></li>
              <li><a href="#financing" className="hover:text-amber-400 transition-colors">Financing Details</a></li>
              <li><a href="#reviews" className="hover:text-amber-400 transition-colors">Verified Reviews</a></li>
              <li><a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a></li>
              <li><a href="#estimate" className="hover:text-amber-400 transition-colors">Request Estimate</a></li>
            </ul>
          </div>

          {/* Col 5: Administration & Whop Commerce */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Billing & Portal
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin/invoicing"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-slate-300 font-semibold"
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Admin Invoicing Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/checkout/return?status=demo"
                  className="hover:text-amber-400 transition-colors"
                >
                  Checkout Return Demo
                </Link>
              </li>
              <li>
                <a
                  href="https://whop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  Powered by Whop
                </a>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-400 leading-normal">
              Accepting Apple Pay, Google Pay, Visa, Mastercard, and American Express through Whop.
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Accessibility</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
