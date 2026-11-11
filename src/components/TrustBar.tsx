import React from "react";
import { siteConfig } from "../site.config";

export const TrustBar: React.FC = () => {
  return (
    <section
      aria-label="Key Performance Metrics (Sample)"
      className="bg-[#faf7f2] border-b border-slate-200 py-10 sm:py-12"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {siteConfig.trustStats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 text-center shadow-sm"
            >
              <div className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950 tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-amber-700 mt-1">
                {stat.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stat.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
