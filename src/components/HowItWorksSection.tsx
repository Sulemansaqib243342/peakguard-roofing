import React from "react";
import { Search, FileText, CreditCard, Hammer, ArrowRight } from "lucide-react";

interface HowItWorksProps {
  onOpenCheckout: (planKey: "inspection" | "deposit" | "tuneUp") => void;
  onOpenEstimate: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({
  onOpenCheckout,
  onOpenEstimate,
}) => {
  const steps = [
    {
      number: "01",
      icon: <Search className="w-5 h-5 text-amber-600" />,
      title: "Inspect",
      subtitle: "21-Point Drone Scan",
      description:
        "Book a $149 forensic inspection online or request a property evaluation with full photographic documentation.",
      actionLabel: "Book Inspection",
      action: () => onOpenCheckout("inspection"),
    },
    {
      number: "02",
      icon: <FileText className="w-5 h-5 text-amber-600" />,
      title: "Quote",
      subtitle: "Line-Item Scope",
      description:
        "Receive a transparent, itemized written quote covering tear-off, underlayment, shingles, and cleanup.",
      actionLabel: "Free Estimate",
      action: onOpenEstimate,
    },
    {
      number: "03",
      icon: <CreditCard className="w-5 h-5 text-amber-600" />,
      title: "Deposit",
      subtitle: "$500 Card-on-File",
      description:
        "Lock your installation date with a $500 Whop deposit. Your card is saved on file with zero extra fees.",
      actionLabel: "Reserve Date ($500)",
      action: () => onOpenCheckout("deposit"),
    },
    {
      number: "04",
      icon: <Hammer className="w-5 h-5 text-amber-600" />,
      title: "Install + Final Invoice",
      subtitle: "Deposit Credited 100%",
      description:
        "After installation and magnetic nail sweep, your $500 deposit is deducted from the final Whop invoice.",
      actionLabel: "Get Started",
      action: onOpenEstimate,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <span>4-Step Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
            How PeakGuard Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Clear milestones from roof inspection and itemized quote to deposit booking and final invoice settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="font-display font-extrabold text-2xl text-slate-300 tabular-nums">
                    {step.number}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-display font-bold text-slate-950">{step.title}</h3>
                  <p className="text-xs font-semibold text-amber-700 mt-0.5">{step.subtitle}</p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={step.action}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-amber-600 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-1 py-0.5"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
