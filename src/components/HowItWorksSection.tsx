import React from "react";
import { Search, CreditCard, Receipt, ArrowRight } from "lucide-react";

interface HowItWorksProps {
  onOpenCheckout: (planKey: "inspection" | "deposit" | "tuneUp") => void;
  onOpenEstimate: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({ onOpenCheckout, onOpenEstimate }) => {
  const steps = [
    {
      number: "01",
      icon: <Search className="w-5 h-5 text-amber-600" />,
      title: "Inspect & Diagnose",
      price: "$149",
      creditNote: "Credited 100% toward repairs over $1,000",
      description:
        "Book a comprehensive 21-point physical and 4K aerial drone scan. Receive an unbiased photo-documented condition report within 24 hours.",
      actionLabel: "Book Inspection ($149)",
      planKey: "inspection" as const,
    },
    {
      number: "02",
      icon: <CreditCard className="w-5 h-5 text-amber-600" />,
      title: "Reserve Project Date",
      price: "$500 Deposit",
      creditNote: "Card saved on file via Whop Setup Intent",
      description:
        "Lock your installation date on our crew calendar and secure material allotments. Your card is securely stored on file with zero charge until final balance.",
      actionLabel: "Reserve Date ($500)",
      planKey: "deposit" as const,
    },
    {
      number: "03",
      icon: <Receipt className="w-5 h-5 text-amber-600" />,
      title: "Final Balance Invoiced",
      price: "Remaining Net Balance",
      creditNote: "Settled only after final walkthrough sign-off",
      description:
        "Upon full completion and magnetic ground sweep, your remaining balance (original quote less $500 deposit credit) is settled seamlessly via Whop Invoices API.",
      actionLabel: "Request Free Estimate",
      isEstimate: true,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <span>Seamless 3-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-[1.65]">
            From forensic diagnostic scan to project completion — fully transparent, milestone-based roofing with zero surprise additions.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow transition-shadow flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="font-display font-bold text-2xl text-slate-300">
                    {step.number}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  <div className="text-xs font-semibold text-amber-700 mt-0.5">
                    {step.price} • <span className="text-slate-500 font-normal">{step.creditNote}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-[1.65]">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {step.isEstimate ? (
                  <button
                    type="button"
                    onClick={onOpenEstimate}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenCheckout(step.planKey!)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
