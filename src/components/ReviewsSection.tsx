import React from "react";
import { siteConfig } from "../site.config";
import { Star, ShieldCheck, Award } from "lucide-react";

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Customer Testimonials (Sample Content)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            Homeowner Experiences
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-[1.65]">
            Demonstrating how homeowner reviews, project details, and service feedback render in this template.
          </p>

          {/* Explicit Placeholder Notice (Mandated by Instructions) */}
          <div className="inline-block px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
            Template Note: All testimonials below are sample content placeholders. Configure your actual reviews in <code className="font-mono text-amber-950 font-semibold">src/site.config.ts</code>.
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-7 mb-16">
          {siteConfig.reviews.map((rev, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-7 space-y-4 relative flex flex-col justify-between hover:shadow-sm transition-shadow"
            >
              <div className="space-y-3">
                {/* Stars and Service Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
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

                <div className="flex items-center gap-1 text-slate-600 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
                  <span>Sample Review</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contractor Credentials & Trust Strip (Sample Placeholders) */}
        <div className="pt-10 border-t border-slate-200">
          <div className="text-center mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sample Contractor Credentials & Insurance Disclaimers
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Award className="w-5 h-5 text-amber-500 mx-auto" />
              <div className="font-bold text-sm text-slate-900">GAF Certified (Sample)</div>
              <div className="text-[11px] text-slate-500">Contractor Tier Placeholder</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <ShieldCheck className="w-5 h-5 text-amber-500 mx-auto" />
              <div className="font-bold text-sm text-slate-900">Owens Corning (Sample)</div>
              <div className="text-[11px] text-slate-500">Preferred Status Placeholder</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Star className="w-5 h-5 text-amber-500 mx-auto fill-amber-500" />
              <div className="font-bold text-sm text-slate-900">BBB Accredited (Sample)</div>
              <div className="text-[11px] text-slate-500">Rating Placeholder</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Award className="w-5 h-5 text-amber-500 mx-auto" />
              <div className="font-bold text-sm text-slate-900">$2M Liability (Sample)</div>
              <div className="text-[11px] text-slate-500">General Liability Placeholder</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
