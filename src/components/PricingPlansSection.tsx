import React from "react";
import { siteConfig } from "../site.config";
import { Check, ShieldCheck, Sparkles, CreditCard, Lock, ArrowRight } from "lucide-react";
import { trackDepositStarted, trackInspectionStarted, trackTuneUpStarted } from "../lib/tracking";

interface PricingPlansSectionProps {
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

export const PricingPlansSection: React.FC<PricingPlansSectionProps> = ({ onOpenCheckout }) => {
  const { inspection, deposit, tuneUp } = siteConfig.whop.plans;

  const handleSelectInspection = () => {
    trackInspectionStarted(inspection.id, inspection.price);
    onOpenCheckout("inspection");
  };

  const handleSelectDeposit = () => {
    trackDepositStarted(deposit.id, deposit.price);
    onOpenCheckout("deposit");
  };

  const handleSelectTuneUp = () => {
    trackTuneUpStarted(tuneUp.id, tuneUp.price);
    onOpenCheckout("tuneUp");
  };

  return (
    <section id="pricing" className="py-20 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Transparent Flat Rates</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            Book Instantly with Whop Payments
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-[1.65]">
            Transparent pricing without aggressive sales calls. Secure diagnostic reports, reserve crew install dates, or schedule preventative maintenance.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Inspection ($149) */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-7 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Diagnostic Scan
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Credited Back
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900">{inspection.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{inspection.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-4xl font-display font-bold text-slate-900">{inspection.priceDisplay}</span>
                <span className="text-xs text-slate-500">/ one-time flat rate</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Included in this inspection:
                </div>
                {inspection.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-7">
              <button
                type="button"
                onClick={handleSelectInspection}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <span>Book $149 Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Processed securely via Whop Payments
              </p>
            </div>
          </div>

          {/* Card 2: Project Deposit ($500) — Calm Dark Navy Card */}
          <div className="rounded-2xl bg-slate-900 text-white p-7 flex flex-col justify-between shadow-lg border border-slate-800 relative">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Project Reservation
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Card Saved on File</span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white">{deposit.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{deposit.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-4xl font-display font-bold text-amber-400">{deposit.priceDisplay}</span>
                <span className="text-xs text-slate-400">/ one-time deposit</span>
              </div>

              {/* Card-on-file explanation notice */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Whop Setup Intent Activated</span>
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Your payment method is tokenized via Whop Payments. 100% of this $500 is credited against your final balance invoice upon project completion.
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Deposit benefits:
                </div>
                {deposit.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-7">
              <button
                type="button"
                onClick={handleSelectDeposit}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Reserve with $500 Deposit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Apple Pay • Google Pay • Cards • Saved on file
              </p>
            </div>
          </div>

          {/* Card 3: Flat-Rate Tune-Up ($299) */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-7 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Preventative Maintenance
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Storm Prep</span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900">{tuneUp.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tuneUp.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-4xl font-display font-bold text-slate-900">{tuneUp.priceDisplay}</span>
                <span className="text-xs text-slate-500">/ one-time flat rate</span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Included in this tune-up:
                </div>
                {tuneUp.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-7">
              <button
                type="button"
                onClick={handleSelectTuneUp}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                <span>Book $299 Tune-Up</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Scheduled within 3–5 business days
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
