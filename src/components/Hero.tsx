import React from "react";
import { siteConfig } from "../site.config";
import { ShieldCheck, ArrowRight, Clock, Award, Star, CheckCircle2 } from "lucide-react";
import { trackServiceViewed } from "../lib/tracking";

interface HeroProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenEstimate, onOpenCheckout }) => {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-900">
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top info pill badge (Static dot, no animation) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
              <span>Texas Storm Damage & Diagnostic Assessments</span>
            </div>

            {/* Main Headline per strict prompt spec:
                size ~clamp(2.25rem, 4.5vw, 3.5rem), weight 700, line-height 1.15,
                negative letter spacing, max 2-3 lines, only "50 Years." accent in gold */}
            <h1 className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold font-display tracking-tight leading-[1.15] text-white max-w-2xl">
              Roofing Built to Protect Your Home for the Next{" "}
              <span className="text-amber-400">50 Years.</span>
            </h1>

            {/* Sub-headline: 16-18px, line-height 1.6-1.7, muted color with good contrast */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-[1.65]">
              Precision tear-offs, storm leak repairs, and 21-point forensic drone inspections.
              Transparent flat rates, certified craftsmanship, and instant payments via Whop.
            </p>

            {/* Bullet Highlights */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Fully Licensed & Insured (Sample)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Non-Prorated Warranty Options</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Magnetic Yard Nail Sweep</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Financing Available at Checkout</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3">
              <button
                type="button"
                onClick={onOpenEstimate}
                className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-sm flex items-center justify-center gap-2 text-center focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Request Free Estimate</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  trackServiceViewed({
                    id: "roof-inspection",
                    title: "Roof Inspection",
                    variantId: siteConfig.whop.plans.inspection.id,
                  });
                  onOpenCheckout("inspection");
                }}
                className="px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all flex items-center justify-center gap-2 text-center focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Book {siteConfig.whop.plans.inspection.priceDisplay} Inspection</span>
              </button>
            </div>

            {/* Trust markers under CTAs */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-slate-200">
                  {siteConfig.company.rating.score}
                </span>
                <span className="text-slate-400">
                  ({siteConfig.company.rating.reviewCount})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Certified Installer Standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emergency Tarp Response</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card with Direct Booking Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl space-y-5">
              
              {/* Card Header (Deleted the fake "Verified Active" badge per Requirement D) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Instant Online Booking</h2>
                    <p className="text-xs text-slate-400">Whop Payments: Cards, Apple Pay, Google Pay</p>
                  </div>
                </div>
              </div>

              {/* 3 Quick-Book Plans Showcase (Each whole card is a button with hover state) */}
              <div className="space-y-3">
                {/* Plan 1 */}
                <button
                  type="button"
                  onClick={() => onOpenCheckout("inspection")}
                  className="w-full text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-950 transition-all cursor-pointer group flex items-center justify-between focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        Roof Inspection
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                        POPULAR
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">21-point drone scan + credited toward repairs</p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <div className="text-base font-bold text-amber-400">
                      {siteConfig.whop.plans.inspection.priceDisplay}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-amber-300 group-hover:underline">
                      Book &rarr;
                    </span>
                  </div>
                </button>

                {/* Plan 2 */}
                <button
                  type="button"
                  onClick={() => onOpenCheckout("deposit")}
                  className="w-full text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-950 transition-all cursor-pointer group flex items-center justify-between focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {siteConfig.whop.plans.deposit.name}
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                        CARD SAVED
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{siteConfig.whop.plans.deposit.description}</p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <div className="text-base font-bold text-amber-400">
                      {siteConfig.whop.plans.deposit.priceDisplay}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-amber-300 group-hover:underline">
                      Reserve &rarr;
                    </span>
                  </div>
                </button>

                {/* Plan 3 */}
                <button
                  type="button"
                  onClick={() => onOpenCheckout("tuneUp")}
                  className="w-full text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-950 transition-all cursor-pointer group flex items-center justify-between focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {siteConfig.whop.plans.tuneUp.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{siteConfig.whop.plans.tuneUp.description}</p>
                  </div>
                  <div className="text-right pl-3 shrink-0">
                    <div className="text-base font-bold text-amber-400">
                      {siteConfig.whop.plans.tuneUp.priceDisplay}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-amber-300 group-hover:underline">
                      Book &rarr;
                    </span>
                  </div>
                </button>
              </div>

              {/* Bottom security assurance */}
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                <span>Whop Payments • PCI-DSS Level 1</span>
                <span className="text-slate-400">Instant Receipt</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
