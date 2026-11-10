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
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 lg:pt-20 lg:pb-32">
      {/* Subtle grid pattern background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#f59e0b 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-amber-400 text-xs font-semibold backdrop-blur-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>DFW Storm Damage Assessment Teams Dispatched Daily</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
              Roofing Built to Protect Your Home for the Next{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                50 Years.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
              Precision tear-offs, storm leak repairs, and 21-point forensic drone inspections.
              Clear flat-rate pricing, certified GAF craftsmanship, and instant secure payment via Whop.
            </p>

            {/* Bullet Highlights */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>$2,000,000 Liability Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>50-Year Non-Prorated Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Magnetic Ground Nail Sweep</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Financing Available at Checkout</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={onOpenEstimate}
                className="px-8 py-4 rounded-xl text-base font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>Request Free Estimate</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  trackServiceViewed({
                    id: "roof-inspection",
                    title: "Roof Inspection",
                    variantId: siteConfig.whop.plans.inspection.id,
                  });
                  onOpenCheckout("inspection");
                }}
                className="px-6 py-4 rounded-xl text-base font-bold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>Book $149 Drone Inspection</span>
              </button>
            </div>

            {/* Trust markers under CTAs */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-slate-200">4.9 / 5.0</span>
                <span>(450+ verified reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>GAF Master Elite Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>2-Hour Emergency Tarping</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card with Direct Booking Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700 p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Instant Online Booking</h2>
                    <p className="text-xs text-slate-400">Directly through Whop Payments</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  Verified Active
                </span>
              </div>

              {/* 3 Quick-Book Plans Showcase */}
              <div className="space-y-3">
                {/* Plan 1 */}
                <div
                  onClick={() => onOpenCheckout("inspection")}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all cursor-pointer group flex items-center justify-between"
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
                  <div className="text-right pl-3">
                    <div className="text-lg font-black text-amber-400">$149</div>
                    <span className="text-[10px] text-slate-400 group-hover:underline">Book &rarr;</span>
                  </div>
                </div>

                {/* Plan 2 */}
                <div
                  onClick={() => onOpenCheckout("deposit")}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        Project Deposit
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                        CARD SAVED
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Locks install date; card saved for final invoice</p>
                  </div>
                  <div className="text-right pl-3">
                    <div className="text-lg font-black text-amber-400">$500</div>
                    <span className="text-[10px] text-slate-400 group-hover:underline">Reserve &rarr;</span>
                  </div>
                </div>

                {/* Plan 3 */}
                <div
                  onClick={() => onOpenCheckout("tuneUp")}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        Roof Tune-Up Flat Rate
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Reseal boots & flashing + up to 5 shingles</p>
                  </div>
                  <div className="text-right pl-3">
                    <div className="text-lg font-black text-amber-400">$299</div>
                    <span className="text-[10px] text-slate-400 group-hover:underline">Book &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Bottom security assurance */}
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Whop Payments: Apple Pay, Google Pay, Cards</span>
                <span className="text-slate-500">256-bit SSL Encrypted</span>
              </div>
            </div>
          </div>

        </div>

        {/* Stats Strip at Bottom of Hero */}
        <div className="mt-16 pt-10 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {siteConfig.trustStats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white">{stat.value}</div>
              <div className="text-sm font-semibold text-amber-400">{stat.label}</div>
              <div className="text-xs text-slate-400">{stat.detail}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
