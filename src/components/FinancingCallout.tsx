import React from "react";
import { BadgeDollarSign, ShieldCheck, ArrowRight, HelpCircle } from "lucide-react";

interface FinancingCalloutProps {
  onOpenEstimate: () => void;
}

export const FinancingCallout: React.FC<FinancingCalloutProps> = ({ onOpenEstimate }) => {
  return (
    <section id="financing" className="py-20 lg:py-24 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Heading & Accurate Explanation */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <BadgeDollarSign className="w-3.5 h-3.5" />
              <span>Transparent Payment Terms</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Flexible Financing Options at Checkout
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-[1.65] max-w-2xl">
              We believe a secure roof should never be delayed by upfront capital. 
              <strong> Financing options appear directly at checkout for approved merchants</strong> through Whop Payments.
              Eligible homeowners can explore installment options, promotional low-interest terms, and split payments seamlessly without impacting their initial credit score check.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white">Transparent Merchant Financing Policy:</span>
                <p className="text-slate-400 leading-relaxed">
                  Financing availability, exact APR rates, and loan terms are determined directly by underwriting partners at checkout based on merchant authorization and applicant qualification. We do not advertise fictional rates — all checkout terms are transparent and real.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Card */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-4 text-center shadow-lg">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-display">Planning a Full Replacement?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Get an exact written scope and estimate first so you know your project numbers.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenEstimate}
              className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <span>Get Scope & Estimate</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
