import React from "react";
import { siteConfig } from "../site.config";
import { ArrowRight, Phone, ShieldCheck, Star, CheckCircle2, Calendar } from "lucide-react";
import { trackServiceViewed } from "../lib/tracking";

interface HeroProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenEstimate, onOpenCheckout }) => {
  const handleBookInspection = () => {
    trackServiceViewed({
      id: "roof-inspection",
      title: "Roof Inspection",
      variantId: siteConfig.whop.plans.inspection.id,
    });
    onOpenCheckout("inspection");
  };

  return (
    <section className="relative overflow-hidden bg-[#0f172a] text-white pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
      {/* Subtle architectural gradient backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.16),_transparent_55%),linear-gradient(135deg,_#020617_0%,_#0f172a_55%,_#1e293b_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(155deg, transparent, transparent 28px, rgba(248,250,252,0.5) 28px, rgba(248,250,252,0.5) 29px)",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline, Subtext, Two CTAs, Trust Chips */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-amber-400">
              <span className="w-6 h-0.5 bg-amber-400 shrink-0" />
              <span>{siteConfig.company.name} • DFW Roofing</span>
            </div>

            <h1 className="text-[clamp(2.4rem,5vw,3.9rem)] font-display font-extrabold tracking-tight leading-[1.08] text-white">
              Protect Your Home.{" "}
              <span className="block text-amber-400">Love Your Roof.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              {siteConfig.company.tagline} — repairs, replacements, and 21-point inspections.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onOpenEstimate}
                className="px-7 py-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
              >
                <span>Free Estimate</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleBookInspection}
                className="px-6 py-4 rounded-xl text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Book {siteConfig.whop.plans.inspection.priceDisplay} Inspection</span>
              </button>
            </div>

            {/* Direct Phone */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Or call dispatch:</span>
              <a
                href={`tel:${siteConfig.company.phone}`}
                className="font-semibold text-white hover:text-amber-400 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
              >
                {siteConfig.company.phoneDisplay}
              </a>
            </div>

            {/* Trust Chips */}
            <div className="pt-4 border-t border-slate-800/90 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Licensed & Insured (Sample)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-200 font-medium">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{siteConfig.company.rating.score} Rating</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Free Written Quotes</span>
              </span>
            </div>
          </div>

          {/* Right Column: Illustrated Roof Card + Quick Reservation Floating Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
              {/* Illustrated Architectural Roof SVG */}
              <div className="rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border border-slate-800 p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  <span>21-Point Architectural Diagnostic</span>
                  <span className="text-amber-400">Whop Instant Booking</span>
                </div>

                <svg
                  viewBox="0 0 360 155"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Illustrated residential roof inspection diagram"
                  className="w-full h-auto"
                >
                  {/* Horizon & Grid */}
                  <line x1="16" y1="138" x2="344" y2="138" stroke="#334155" strokeWidth="1.5" />
                  {/* House Body */}
                  <rect x="64" y="86" width="232" height="52" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  {/* Windows */}
                  <rect x="92" y="100" width="38" height="22" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                  <rect x="230" y="100" width="38" height="22" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
                  {/* Door */}
                  <rect x="166" y="102" width="28" height="36" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Chimney */}
                  <rect x="236" y="34" width="22" height="32" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                  {/* Main Roof Pitch */}
                  <path d="M40 90 L180 22 L320 90 Z" fill="#0f172a" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M72 86 L180 34 L288 86" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 4" />
                  {/* Inspection Checkpoints */}
                  <circle cx="180" cy="22" r="5" fill="#f59e0b" />
                  <circle cx="122" cy="54" r="4" fill="#34d399" />
                  <circle cx="247" cy="54" r="4" fill="#34d399" />
                </svg>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center text-[11px]">
                  <div className="bg-slate-950/70 rounded-lg py-1.5 px-2">
                    <span className="block font-bold text-white">4K Drone</span>
                    <span className="text-slate-400">Aerial Scan</span>
                  </div>
                  <div className="bg-slate-950/70 rounded-lg py-1.5 px-2">
                    <span className="block font-bold text-white">$500 Lock</span>
                    <span className="text-slate-400">Credited 100%</span>
                  </div>
                  <div className="bg-slate-950/70 rounded-lg py-1.5 px-2">
                    <span className="block font-bold text-white">1–2 Days</span>
                    <span className="text-slate-400">Install Time</span>
                  </div>
                </div>
              </div>

              {/* Clean Floating White Action Card (Reference Inspired) */}
              <div className="rounded-xl bg-white text-slate-900 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-slate-950">Need a roof check today?</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Instant scheduling • Credited toward repairs</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBookInspection}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                >
                  <span>Reserve for {siteConfig.whop.plans.inspection.priceDisplay}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
