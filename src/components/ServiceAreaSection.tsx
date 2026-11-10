import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { MapPin, Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export const ServiceAreaSection: React.FC = () => {
  const [zipQuery, setZipQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    area?: (typeof siteConfig.serviceAreas)[0];
    searched: boolean;
  }>({ found: false, searched: false });

  const handleZipCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = zipQuery.trim();
    if (!clean) return;

    const matchedArea = siteConfig.serviceAreas.find((area) =>
      area.zipCodes.includes(clean)
    );

    if (matchedArea) {
      setSearchResult({ found: true, area: matchedArea, searched: true });
    } else {
      // General DFW check (all 75xxx and 76xxx are typically serviced)
      const isDfwGeneral = clean.startsWith("75") || clean.startsWith("76");
      if (isDfwGeneral && clean.length === 5) {
        setSearchResult({
          found: true,
          area: {
            name: "Extended DFW Service Region",
            counties: ["North Texas"],
            zipCodes: [clean],
            responseTime: "Scheduled service within 24–48 hours",
          },
          searched: true,
        });
      } else {
        setSearchResult({ found: false, searched: true });
      }
    }
  };

  return (
    <section id="service-area" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Regional Coverage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            Dallas-Fort Worth Metroplex Coverage
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-[1.65]">
            Roofing crews positioned across Dallas, Collin, Tarrant, and Denton counties for rapid emergency dispatch and scheduled installations.
          </p>
        </div>

        {/* Interactive ZIP Code Checker Bar */}
        <div className="max-w-xl mx-auto mb-16">
          <form
            onSubmit={handleZipCheck}
            className="p-2 bg-white rounded-2xl border border-slate-300 shadow-sm flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter 5-digit ZIP code (e.g. 75201)"
                value={zipQuery}
                onChange={(e) => setZipQuery(e.target.value)}
                maxLength={5}
                aria-label="ZIP Code Availability Search"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border-0 focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              Check Availability
            </button>
          </form>

          {/* Search Result Feedback */}
          {searchResult.searched && (
            <div
              className={`mt-4 p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 transition-all ${
                searchResult.found
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border border-amber-200 text-amber-900"
              }`}
            >
              {searchResult.found ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Great news! ZIP code {zipQuery} is in our primary coverage zone.</span>
                    <p className="mt-1 text-xs text-emerald-800">
                      Region: <strong>{searchResult.area?.name}</strong> • Expected Response:{" "}
                      <strong>{searchResult.area?.responseTime}</strong>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ZIP code {zipQuery} is outside our automated primary radius.</span>
                    <p className="mt-1 text-xs text-amber-800">
                      We frequently accommodate projects across adjacent North Texas counties. Submit an estimate request or call{" "}
                      <a href={`tel:${siteConfig.company.phone}`} className="underline font-bold">
                        {siteConfig.company.phoneDisplay}
                      </a>{" "}
                      to confirm dispatch.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4 Regional Hub Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteConfig.serviceAreas.map((area, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-4"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">{area.name}</h3>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Counties Covered
                </span>
                <p className="text-xs text-slate-700 font-medium">
                  {area.counties.join(", ")}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Key ZIP Codes
                </span>
                <p className="text-xs text-slate-600 font-mono">
                  {area.zipCodes.slice(0, 5).join(", ")}...
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>{area.responseTime}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
