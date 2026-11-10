import React from "react";
import { BadgeDollarSign, ShieldCheck, ArrowRight, HelpCircle } from "lucide-react";

interface FinancingCalloutProps {
  onOpenEstimate: () => void;
}

export const FinancingCallout: React.FC<FinancingCalloutProps> = ({ onOpenEstimate }) => {
  return (
    <section id="financing" className="py-16 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Heading & Accurate Explanation */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <BadgeDollarSign className="w-4 h-4" />
              <span>Flexible Homeowner Payment Solutions</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Flexible Financing Options at Checkout
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              We believe a secure roof should never be delayed by upfront capital. 
              <strong> Financing options appear directly at checkout for approved merchants</strong> through Whop Payments.
              Eligible homeowners can explore installment options, promotional low-interest terms, and split payments seamlessly without impacting their initial credit score check.
            </p>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white">Transparent Merchant Financing Policy:</span>
                <p>
                  Financing availability, exact APR rates, and loan terms are determined directly by the underwriting partners at checkout based on your merchant authorization and applicant qualification. PeakGuard does not advertise fictional interest rates — what you see at Whop checkout is 100% real, transparent, and binding.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Card */}
          <div className="lg:col-span-4 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-5 text-center shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Planning a Full Replacement?</h3>
              <p className="text-xs text-slate-300 mt-1">
                Get an exact written scope and estimate first so you know your project numbers.
              </p>
            </div>

            <button
              onClick={onOpenEstimate}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Get Scope & Estimate</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400">
              Apply deposit ($500) online anytime to lock your project date.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
