import React from "react";
import { siteConfig } from "../site.config";

export const TrustBar: React.FC = () => {
  return (
    <section className="bg-slate-50 border-b border-slate-200 py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Sample Performance & Credential Indicators
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {siteConfig.trustStats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-amber-600">
                {stat.label}
              </div>
              <div className="text-xs text-slate-500">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

