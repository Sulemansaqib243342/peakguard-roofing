import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { Wrench, Home, ShieldCheck, Sparkles, Check, ArrowRight, Shield, Clock } from "lucide-react";
import { trackServiceViewed } from "../lib/tracking";

interface ServicesSectionProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenEstimate,
  onOpenCheckout,
}) => {
  const [selectedService, setSelectedService] = useState<string>(siteConfig.services[0].id);

  const handleSelectService = (service: (typeof siteConfig.services)[0]) => {
    setSelectedService(service.id);
    const planKey = service.hasPlanCheckout;
    const variantId = planKey ? siteConfig.whop.plans[planKey]?.id : undefined;
    trackServiceViewed({
      id: service.id,
      title: service.title,
      variantId,
    });
  };

  return (
    <section id="services" className="py-20 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            Complete Roofing Solutions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-[1.65]">
            From single-shingle emergency leak stops to complete tear-offs and replacements.
            Every project is backed by verified manufacturer warranties.
          </p>
        </div>

        {/* Services Grid (4 items) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {siteConfig.services.map((service) => {
            const isSelected = selectedService === service.id;
            return (
              <button
                type="button"
                key={service.id}
                onClick={() => handleSelectService(service)}
                className={`text-left rounded-2xl p-6 transition-all flex flex-col justify-between border focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                  isSelected
                    ? "bg-slate-50 border-amber-500 shadow-md -translate-y-0.5"
                    : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow"
                }`}
              >
                <div className="space-y-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {iconMap[service.icon] || <Shield className="w-5 h-5" />}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {service.shortDesc}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between text-xs w-full">
                  <span className="font-semibold text-amber-700">
                    {service.hasPlanCheckout ? "Direct Booking" : "Custom Scope"}
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? "translate-x-1 text-amber-600" : "text-slate-400"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Service Spotlight Card for currently selected service */}
        {(() => {
          const active = siteConfig.services.find((s) => s.id === selectedService) || siteConfig.services[0];
          const planKey = active.hasPlanCheckout;
          const plan = planKey ? siteConfig.whop.plans[planKey] : null;

          return (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 shadow-sm p-6 sm:p-10 transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                
                {/* Left: Description & Features */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    <span>Selected Service Scope</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                    {active.title}
                  </h3>

                  <p className="text-slate-600 text-sm sm:text-base leading-[1.65]">
                    {active.fullDesc}
                  </p>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 pt-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Standard Inclusions:
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                      {active.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Turnaround & Warranty Badges */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span><strong>Turnaround:</strong> {active.turnaround}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span><strong>Warranty:</strong> {active.warranty}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Booking / Action Card */}
                <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-lg border border-slate-800">
                  {plan ? (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                            Direct Booking Plan
                          </span>
                          <h4 className="text-base font-bold text-white">{plan.name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{plan.priceDisplay}</div>
                          <span className="text-[10px] text-slate-400">One-time payment</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="space-y-1.5">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (planKey) {
                            trackServiceViewed({
                              id: active.id,
                              title: active.title,
                              variantId: plan.id,
                            });
                            onOpenCheckout(planKey);
                          }
                        }}
                        className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                      >
                        <span>Book Now with Whop Payments</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <p className="text-[11px] text-center text-slate-400">
                        Apple Pay • Google Pay • Major Credit Cards
                      </p>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                          Custom Scope Assessment
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">
                          Schedule On-Site Inspection & Estimate
                        </h4>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          Because roof repairs vary based on pitch, square footage, decking condition, and shingle manufacturer, we provide guaranteed quotes after our physical assessment.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <div className="font-semibold text-white">Need an inspection first?</div>
                        <div className="text-[11px] text-slate-400">Our $149 comprehensive inspection fee is credited 100% toward any subsequent repair.</div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={onOpenEstimate}
                          className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          <span>Request Free Estimate</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCheckout("inspection")}
                          className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors text-center focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                        >
                          Or Book $149 Inspection Directly
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </section>
  );
};
