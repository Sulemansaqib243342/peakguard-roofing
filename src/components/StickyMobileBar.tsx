import React from "react";
import { siteConfig } from "../site.config";
import { Phone, Calendar } from "lucide-react";

interface StickyMobileBarProps {
  onOpenCheckout: (planKey: "inspection" | "deposit" | "tuneUp") => void;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({ onOpenCheckout }) => {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 px-4 py-2.5 flex items-center gap-3 backdrop-blur-md shadow-lg"
      role="region"
      aria-label="Quick Mobile Actions"
    >
      <a
        href={`tel:${siteConfig.company.phone}`}
        className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        aria-label={`Call ${siteConfig.company.phoneDisplay}`}
      >
        <Phone className="w-3.5 h-3.5 text-slate-700" />
        <span>Call Now</span>
      </a>

      <button
        type="button"
        onClick={() => onOpenCheckout("inspection")}
        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Book Inspection</span>
      </button>
    </div>
  );
};
