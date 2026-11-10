import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { Wrench, Home, ShieldCheck, Sparkles, Check, ArrowRight, Shield, Clock } from "lucide-react";
import { trackServiceViewed } from "../lib/tracking";

interface ServicesSectionProps {
  onOpenEstimate: () => void;
  onOpenCheckout: (planKey: keyof typeof siteConfig.whop.plans) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
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
    <section id="services" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wide uppercase">
            <span>Specialized Craftsmanship</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Complete Roofing Solutions, Uncompromising Standards
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            From single-shingle emergency leak stops to complete commercial and residential roof replacements.
            Every project is managed by certified installers.
          </p>
        </div>

        {/* Services Grid (4 items) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {siteConfig.services.map((service) => {
            const isSelected = selectedService === service.id;
            return (
              <div
                key={service.id}
                onClick={() => handleSelectService(service)}
                className={`rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? "bg-white border-amber-500 shadow-xl ring-2 ring-amber-500/20 -translate-y-1"
                    : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {iconMap[service.icon] || <Shield className="w-6 h-6" />}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {service.shortDesc}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-700">
                    {service.hasPlanCheckout ? "Instant Checkout Available" : "Estimate Required"}
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? "translate-x-1 text-amber-600" : "text-slate-400"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Service Spotlight Card for currently selected service */}
        {(() => {
          const active = siteConfig.services.find((s) => s.id === selectedService) || siteConfig.services[0];
          const planKey = active.hasPlanCheckout;
          const plan = planKey ? siteConfig.whop.plans[planKey] : null;

          return (
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl p-8 sm:p-12 transition-all">
              <div className="grid lg:grid-cols-12 gap-8 items-center">
                
                {/* Left: Description & Features */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                    <span>Spotlight Details</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {active.title}
                  </h3>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {active.fullDesc}
                  </p>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      What is included in this service:
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
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span><strong>Turnaround:</strong> {active.turnaround}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span><strong>Warranty:</strong> {active.warranty}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Booking / Action Card */}
                <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                  {plan ? (
                    <>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div>
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                            Direct Booking Plan
                          </span>
                          <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-white">{plan.priceDisplay}</div>
                          <span className="text-[10px] text-slate-400">One-time flat rate</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="space-y-2">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button
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
                        className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <span>Book Now with Whop Payments</span>
                        <ArrowRight className="w-4 h-4" />
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
                        <h4 className="text-lg font-bold text-white mt-1">
                          Schedule On-Site Inspection & Estimate
                        </h4>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          Because roof repairs vary based on pitch, square footage, decking condition, and shingle manufacturer, we provide guaranteed firm-quote estimates after our physical assessment.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-1">
                        <div className="font-semibold text-white">Need an inspection right now?</div>
                        <div>You can book our $149 comprehensive inspection — credited 100% toward any subsequent repair.</div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={onOpenEstimate}
                          className="w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                        >
                          <span>Request Free Estimate</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenCheckout("inspection")}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all text-center"
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
