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
    <section id="areas" className="py-20 lg:py-24 bg-white border-b border-slate-200">
      <div id="service-area" className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Cities, ZIP Checker & List */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Service Areas</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-950 tracking-tight">
                Serving Greater Dallas–Fort Worth
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Local roofing crews stationed across North Texas for fast emergency dispatch and scheduled replacements.
              </p>
            </div>

            {/* Interactive ZIP Checker */}
            <form
              onSubmit={handleZipCheck}
              className="p-2 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2 shadow-sm"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter 5-digit ZIP code (e.g. 75201)"
                  value={zipQuery}
                  onChange={(e) => setZipQuery(e.target.value)}
                  maxLength={5}
                  aria-label="ZIP Code Availability Search"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              >
                Check ZIP
              </button>
            </form>

            {searchResult.searched && (
              <div
                role="status"
                className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 ${
                  searchResult.found
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border border-amber-200 text-amber-900"
                }`}
              >
                {searchResult.found ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ZIP {zipQuery} is in our coverage zone.</span>
                      <p className="mt-1 text-xs text-emerald-800">
                        Region: <strong>{searchResult.area?.name}</strong> •{" "}
                        <strong>{searchResult.area?.responseTime}</strong>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ZIP {zipQuery} is outside our primary radius.</span>
                      <p className="mt-1 text-xs text-amber-800">
                        Call{" "}
                        <a href={`tel:${siteConfig.company.phone}`} className="underline font-bold">
                          {siteConfig.company.phoneDisplay}
                        </a>{" "}
                        to confirm dispatch availability.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* City & County List */}
            <div className="grid sm:grid-cols-2 gap-4">
              {siteConfig.serviceAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <h3 className="font-bold text-sm text-slate-950">{area.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{area.counties.join(", ")}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    ZIPs: {area.zipCodes.slice(0, 4).join(", ")}
                  </p>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{area.responseTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Stylized Service Coverage Map Placeholder */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Coverage Map Preview
                  </span>
                  <h3 className="text-lg font-display font-bold text-white mt-0.5">
                    North Texas Dispatch Radius
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Sample Zone Map
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-hidden">
                <svg
                  viewBox="0 0 420 290"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Sample map placeholder showing DFW roofing service coverage hubs"
                  className="w-full h-auto"
                >
                  {/* Subtle Map Grid */}
                  <g stroke="#1e293b" strokeWidth="1">
                    <line x1="0" y1="70" x2="420" y2="70" />
                    <line x1="0" y1="145" x2="420" y2="145" />
                    <line x1="0" y1="220" x2="420" y2="220" />
                    <line x1="105" y1="0" x2="105" y2="290" />
                    <line x1="210" y1="0" x2="210" y2="290" />
                    <line x1="315" y1="0" x2="315" y2="290" />
                  </g>
                  {/* Coverage Radius Rings */}
                  <circle cx="220" cy="150" r="115" fill="rgba(245,158,11,0.06)" stroke="#f59e0b" strokeOpacity="0.35" strokeDasharray="5 5" />
                  <circle cx="220" cy="150" r="68" fill="rgba(245,158,11,0.09)" stroke="#f59e0b" strokeOpacity="0.55" />
                  {/* Highway Connectors */}
                  <path d="M110 165 L245 155 L265 85" stroke="#475569" strokeWidth="2" />
                  <path d="M195 75 L245 155" stroke="#475569" strokeWidth="2" />
                  {/* Hub Pins */}
                  <g>
                    <circle cx="245" cy="155" r="8" fill="#f59e0b" />
                    <text x="260" y="160" fill="#f8fafc" fontSize="12" fontWeight="700">Dallas HQ</text>
                  </g>
                  <g>
                    <circle cx="265" cy="85" r="6" fill="#34d399" />
                    <text x="278" y="89" fill="#cbd5e1" fontSize="11" fontWeight="600">Collin / Plano</text>
                  </g>
                  <g>
                    <circle cx="110" cy="165" r="6" fill="#34d399" />
                    <text x="58" y="190" fill="#cbd5e1" fontSize="11" fontWeight="600">Fort Worth</text>
                  </g>
                  <g>
                    <circle cx="195" cy="75" r="6" fill="#34d399" />
                    <text x="148" y="60" fill="#cbd5e1" fontSize="11" fontWeight="600">Denton</text>
                  </g>
                </svg>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Replace this illustrative placeholder with your preferred live map embed or update cities &amp; ZIP codes directly in{" "}
                <code className="text-amber-300 font-mono">src/site.config.ts</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
