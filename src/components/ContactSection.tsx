import React from "react";
import { siteConfig } from "../site.config";
import { Phone, Mail, MapPin, AlertCircle } from "lucide-react";

export const ContactSection: React.FC = () => {
  const { company } = siteConfig;

  return (
    <section id="contact" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider">
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            <span>Direct Dispatch</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            Connect with Our Dispatch Center
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-[1.65]">
            Have questions regarding hail damage, insurance procedures, or crew scheduling? Contact our local team directly.
          </p>
        </div>

        {/* 4 Contact Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Phone */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3 shadow-sm hover:shadow transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Direct Phone</h3>
            <p className="text-xs text-slate-500">Live operator available Mon–Sat</p>
            <a
              href={`tel:${company.phone}`}
              className="text-sm font-bold text-slate-900 hover:text-amber-600 block pt-1 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
            >
              {company.phoneDisplay}
            </a>
          </div>

          {/* Emergency Line */}
          <div className="rounded-2xl bg-white border border-amber-300 p-6 space-y-3 shadow-sm hover:shadow transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Emergency Dispatch</h3>
            <p className="text-xs text-slate-600">{company.emergencyHours}</p>
            <a
              href={`tel:${company.phone}`}
              className="text-sm font-bold text-amber-700 hover:underline block pt-1 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
            >
              Call Priority Dispatch &rarr;
            </a>
          </div>

          {/* Email */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3 shadow-sm hover:shadow transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Email Inquiries</h3>
            <p className="text-xs text-slate-500">For documentation & scopes</p>
            <a
              href={`mailto:${company.email}`}
              className="text-xs font-semibold text-slate-900 hover:text-amber-600 block pt-1 truncate focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded"
            >
              {company.email}
            </a>
          </div>

          {/* Physical Address */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3 shadow-sm hover:shadow transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Headquarters</h3>
            <p className="text-xs text-slate-500">{company.hours}</p>
            <p className="text-xs text-slate-700 pt-1 font-medium leading-relaxed">
              {company.address.formatted}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
