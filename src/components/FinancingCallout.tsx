import React from "react";
import { BadgeDollarSign, ArrowRight } from "lucide-react";

interface FinancingCalloutProps {
  onOpenEstimate: () => void;
}

export const FinancingCallout: React.FC<FinancingCalloutProps> = ({ onOpenEstimate }) => {
  return (
    <section
      id="financing"
      className="py-12 sm:py-16 bg-amber-500 text-slate-950 border-y border-amber-600/20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950 tracking-tight">
                Flexible Monthly Roof Payment Plans
              </h2>
              <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                Don&apos;t wait on urgent storm repairs. Financing options appear at checkout for
                approved merchants through Whop Payments, with clear terms shown before you confirm.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEstimate}
            className="px-6 py-4 rounded-xl text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 shrink-0 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500 focus-visible:outline-none"
          >
            <span>Request Free Estimate</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
