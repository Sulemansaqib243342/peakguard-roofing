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
    <section id="pricing" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Transparent Flat-Rate Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Book Instantly Online with Whop Payments
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            No guessing games, no high-pressure salesmen. Secure your inspection, reserve your installation crew date, or schedule seasonal maintenance right here.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Inspection ($149) */}
          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Diagnostic Scan
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                  Credited 100% Back
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">{inspection.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{inspection.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-5xl font-black text-slate-900">{inspection.priceDisplay}</span>
                <span className="text-xs text-slate-500">/ one-time payment</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included in this inspection:
                </div>
                {inspection.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={handleSelectInspection}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Book $149 Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Processed securely via Whop Payments
              </p>
            </div>
          </div>

          {/* Card 2: Project Deposit ($500) — HIGHLIGHTED CARD */}
          <div className="rounded-3xl bg-slate-900 text-white p-8 flex flex-col justify-between shadow-2xl relative ring-2 ring-amber-400 -translate-y-2 lg:-translate-y-4">
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
              Most Popular • Project Reservation
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Installation Lock
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Card Saved on File</span>
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{deposit.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{deposit.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-5xl font-black text-amber-400">{deposit.priceDisplay}</span>
                <span className="text-xs text-slate-400">/ one-time deposit</span>
              </div>

              {/* Card-on-file explanation notice */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-amber-400/30 text-xs text-amber-100 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Setup Intent Activated</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Your payment method is securely saved on file via Whop Payments. 100% of this $500 is credited toward your final balance invoice upon project completion.
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Deposit benefits & guarantees:
                </div>
                {deposit.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={handleSelectDeposit}
                className="w-full py-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
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
          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Preventative Maintenance
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Storm-Prep</span>
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">{tuneUp.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tuneUp.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-5xl font-black text-slate-900">{tuneUp.priceDisplay}</span>
                <span className="text-xs text-slate-500">/ one-time flat rate</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included in this tune-up:
                </div>
                {tuneUp.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={handleSelectTuneUp}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
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

        {/* Bottom Whop Payments Guarantee Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-100/80 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">
              Whop Buyer Protection & 256-Bit SSL Encryption
            </span>
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            <span>No hidden fees</span>
            <span>•</span>
            <span>Instant booking confirmation</span>
            <span>•</span>
            <span>Receipt emailed immediately</span>
          </div>
        </div>

      </div>
    </section>
  );
};
