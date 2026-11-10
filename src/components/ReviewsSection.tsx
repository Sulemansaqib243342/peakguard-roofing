import React from "react";
import { siteConfig } from "../site.config";
import { Star, ShieldCheck, CheckCircle2, Award } from "lucide-react";

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wide uppercase">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Homeowner Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Rated 4.9 Stars Across DFW
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Real feedback from property owners who trusted PeakGuard with their emergency repairs, insurance claims, and complete roof replacements.
          </p>

          {/* Explicit Placeholder Notice (Mandated by Instructions) */}
          <div className="inline-block px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-500 font-mono">
            ℹ️ Template Note: The reviews below are realistic placeholder demonstrations for this company template.
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {siteConfig.reviews.map((rev, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8 space-y-4 relative flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Stars and Service Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {rev.service}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "{rev.text}"
                </p>
              </div>

              {/* Author & Verification Footer */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{rev.author}</div>
                  <div className="text-slate-500 text-[11px]">{rev.location} • {rev.date}</div>
                </div>

                {rev.verified && (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Homeowner</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contractor Credentials & Trust Strip */}
        <div className="pt-12 border-t border-slate-200">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Manufacturer Certified & Insured Industry Standards
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Award className="w-6 h-6 text-amber-500 mx-auto" />
              <div className="font-bold text-sm text-slate-900">GAF Master Elite</div>
              <div className="text-[11px] text-slate-500">Top 2% of US Roofers</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <ShieldCheck className="w-6 h-6 text-amber-500 mx-auto" />
              <div className="font-bold text-sm text-slate-900">Owens Corning</div>
              <div className="text-[11px] text-slate-500">Preferred Contractor</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Star className="w-6 h-6 text-amber-500 mx-auto fill-amber-500" />
              <div className="font-bold text-sm text-slate-900">BBB Accredited A+</div>
              <div className="text-[11px] text-slate-500">Zero Unresolved Complaints</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Award className="w-6 h-6 text-amber-500 mx-auto" />
              <div className="font-bold text-sm text-slate-900">$2M Insured</div>
              <div className="text-[11px] text-slate-500">General Liability + Comp</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
