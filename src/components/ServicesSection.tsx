import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { Wrench, Home, ShieldCheck, Check, ArrowRight, Shield, Clock } from "lucide-react";
import { trackServiceViewed } from "../lib/tracking";

interface ServicesSectionProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenEstimate,
  onOpenCheckout,
}) => {
  // Featured 3-card grid: Repair, Replacement, Inspection
  const coreServices = siteConfig.services.slice(0, 3);
  const [selectedService, setSelectedService] = useState<string>(coreServices[0].id);

  const handleLearnMore = (service: (typeof siteConfig.services)[0]) => {
    setSelectedService(service.id);
    const planKey = service.hasPlanCheckout;
    const variantId = planKey ? siteConfig.whop.plans[planKey]?.id : undefined;
    trackServiceViewed({
      id: service.id,
      title: service.title,
      variantId,
    });
  };

  const active = coreServices.find((s) => s.id === selectedService) || coreServices[0];
  const activePlanKey = active.hasPlanCheckout;
  const activePlan = activePlanKey ? siteConfig.whop.plans[activePlanKey] : null;

  return (
    <section id="services" className="py-20 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
            Roofing Services Built to Last
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Emergency leak repairs, complete shingle tear-offs, and diagnostic drone inspections tailored for US homeowners.
          </p>
        </div>

        {/* 3-Card Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-10">
          {coreServices.map((service) => {
            const isSelected = selectedService === service.id;
            return (
              <div
                key={service.id}
                className={`rounded-2xl p-7 transition-all flex flex-col justify-between border ${
                  isSelected
                    ? "bg-slate-50 border-amber-500 shadow-md"
                    : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-900 text-amber-400"
                    }`}
                  >
                    {iconMap[service.icon] || <Shield className="w-5 h-5" />}
                  </div>

                  <h3 className="text-lg font-display font-bold text-slate-950 tracking-tight">
                    {service.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {service.shortDesc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleLearnMore(service)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-600 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-1 py-0.5"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-500">
                    {service.hasPlanCheckout ? "Flat-rate available" : "Custom scope"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Service Scope Drawer */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-9 shadow-sm">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Service Breakdown
              </span>
              <h3 className="text-2xl font-display font-bold text-slate-950">
                {active.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {active.fullDesc}
              </p>

              <div className="grid sm:grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm text-slate-700">
                {active.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap gap-3 text-xs text-slate-700">
                <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <strong>Turnaround:</strong> {active.turnaround}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <strong>Warranty:</strong> {active.warranty}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-slate-900 text-white p-6 sm:p-7 space-y-4 shadow-lg border border-slate-800">
              {activePlan && activePlanKey ? (
                <>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Direct Whop Checkout
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-lg font-display font-bold text-white">
                      {activePlan.name}
                    </h4>
                    <span className="text-2xl font-display font-extrabold text-amber-400 tabular-nums">
                      {activePlan.priceDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activePlan.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenCheckout(activePlanKey)}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    <span>Book {activePlan.priceDisplay} Online</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    On-Site Scope Assessment
                  </div>
                  <h4 className="text-lg font-display font-bold text-white">
                    Get an Itemized Estimate
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Request a free estimate or start with a $149 diagnostic inspection credited toward qualified work.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenEstimate}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    <span>Request Free Estimate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
