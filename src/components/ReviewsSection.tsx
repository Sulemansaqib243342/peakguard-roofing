import React from "react";
import { siteConfig } from "../site.config";
import { Star } from "lucide-react";

export const ReviewsSection: React.FC = () => {
  const displayedReviews = siteConfig.reviews.slice(0, 3);

  return (
    <section id="reviews" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>Sample Reviews</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
            Trusted by Local Homeowners
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Template notice: These are <strong>sample reviews</strong> provided for preview purposes. Update{" "}
            <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">
              src/site.config.ts
            </code>{" "}
            with verified client testimonials before launch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {displayedReviews.map((rev, idx) => (
            <article
              key={idx}
              className="rounded-2xl bg-white border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex text-amber-400" aria-label={`${rev.rating} out of 5 stars`}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Sample Review
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-950">{rev.author}</div>
                  <div className="text-slate-500">
                    {rev.location} • {rev.date}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-500">{rev.service}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
