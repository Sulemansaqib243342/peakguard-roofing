import React, { useState } from "react";
import { siteConfig } from "../site.config";
import { Send, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Lock } from "lucide-react";
import { trackEstimateRequested } from "../lib/tracking";

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  serviceType: string;
  notes: string;
  honeypot: string; // Spam trap: invisible to humans
}

interface FormErrors {
  [key: string]: string;
}

export const EstimateForm: React.FC = () => {
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    address: "",
    zipCode: "",
    serviceType: "roof-repair",
    notes: "",
    honeypot: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [mountedAt] = useState<number>(Date.now()); // For time-to-fill spam check

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!values.name.trim() || values.name.trim().length < 2) {
      errs.name = "Please enter your full name (minimum 2 characters)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.email.trim() || !emailRegex.test(values.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    const phoneClean = values.phone.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      errs.phone = "Please enter a valid 10-digit phone number";
    }

    if (!values.address.trim() || values.address.trim().length < 5) {
      errs.address = "Please enter your property street address";
    }

    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!values.zipCode.trim() || !zipRegex.test(values.zipCode.trim())) {
      errs.zipCode = "Please enter a valid 5-digit US ZIP code";
    }

    if (!values.serviceType) {
      errs.serviceType = "Please select a service type";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Prevent double-submit

    setSubmitError(null);

    // Client-side validation
    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      // 1. Submit to server-side endpoint (/api/estimate)
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          email: values.email,
          address: values.address,
          zipCode: values.zipCode,
          serviceType: values.serviceType,
          message: values.notes,
          notes: values.notes,
          honeypot: values.honeypot,
          timestamp: mountedAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit estimate request. Please try again.");
      }

      // 2. Fire Whop Tracking Events (estimate_requested + standard lead)
      trackEstimateRequested({
        serviceType: values.serviceType,
        zipCode: values.zipCode,
        eventId: data.leadId,
      });

      setLeadId(data.whopLeadId || data.whopEventId || data.leadId || "");
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("[Estimate Form Submit Error]", err);
      setSubmitError(err.message || "An unexpected error occurred. Please call our office directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <section
      id="estimate"
      className="py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800"
    >
      <div id="contact" className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Estimate Form */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-200">
            {submitSuccess ? (
              <div className="py-12 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-slate-950">
                    Estimate Request Received
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Thank you, <strong>{values.name}</strong>. Reference ID:{" "}
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {leadId}
                    </span>
                    .
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Our team will review <strong>{values.address}, {values.zipCode}</strong> and follow up at{" "}
                    <strong>{values.phone}</strong>.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setValues({
                        name: "",
                        email: "",
                        phone: "",
                        address: "",
                        zipCode: "",
                        serviceType: "roof-repair",
                        notes: "",
                        honeypot: "",
                      });
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-display font-bold text-slate-950">
                    Request a Free Estimate
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Property &amp; project details — all fields required unless marked optional
                  </p>
                </div>

                {/* Honeypot field */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="hp_field">Do not fill this</label>
                  <input
                    type="text"
                    id="hp_field"
                    name="honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.honeypot}
                    onChange={handleChange}
                  />
                </div>

                {/* Name & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="est-name"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="est-name"
                      type="text"
                      name="name"
                      placeholder="e.g. John Miller"
                      value={values.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium focus:outline-none focus-visible:ring-2 ${
                        errors.name
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus-visible:ring-rose-500"
                          : "border-slate-300 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label
                      htmlFor="est-phone"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="est-phone"
                      type="tel"
                      name="phone"
                      placeholder="(555) 000-0000"
                      value={values.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium focus:outline-none focus-visible:ring-2 ${
                        errors.phone
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus-visible:ring-rose-500"
                          : "border-slate-300 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="est-email"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    id="est-email"
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={values.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl text-sm border font-medium focus:outline-none focus-visible:ring-2 ${
                      errors.email
                        ? "border-rose-400 bg-rose-50/50 text-rose-900 focus-visible:ring-rose-500"
                        : "border-slate-300 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900"
                    }`}
                  />
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                </div>

                {/* Street Address & ZIP */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="est-address"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Property Street Address *
                    </label>
                    <input
                      id="est-address"
                      type="text"
                      name="address"
                      placeholder="1234 Maple Creek Dr"
                      value={values.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium focus:outline-none focus-visible:ring-2 ${
                        errors.address
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus-visible:ring-rose-500"
                          : "border-slate-300 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="est-zip"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      ZIP Code *
                    </label>
                    <input
                      id="est-zip"
                      type="text"
                      name="zipCode"
                      placeholder="75201"
                      maxLength={5}
                      value={values.zipCode}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium focus:outline-none focus-visible:ring-2 ${
                        errors.zipCode
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus-visible:ring-rose-500"
                          : "border-slate-300 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.zipCode && (
                      <p className="text-xs text-rose-600 mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <label
                    htmlFor="est-service"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Service Required *
                  </label>
                  <select
                    id="est-service"
                    name="serviceType"
                    value={values.serviceType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900 font-medium bg-white"
                  >
                    <option value="roof-repair">Roof Repair &amp; Emergency Leak Stop</option>
                    <option value="roof-replacement">Full Roof Replacement &amp; Restoration</option>
                    <option value="roof-inspection">21-Point Drone &amp; Physical Roof Inspection</option>
                    <option value="roof-tuneup">Roof Tune-Up &amp; Storm Prep Flat Rate</option>
                    <option value="emergency-storm">Active Storm Damage Emergency</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="est-notes"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Describe Symptoms / Leaks (Optional)
                  </label>
                  <textarea
                    id="est-notes"
                    name="notes"
                    rows={3}
                    placeholder="e.g. Ceiling stain in bedroom after recent hail storm; missing shingles visible on south slope."
                    value={values.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus:border-amber-500 text-slate-900 font-medium"
                  />
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Estimate Request</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: Direct Contact Details & Guarantees */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <span>Contact &amp; Dispatch</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              Speak Directly With Our Local Team
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Prefer to call or email? Reach our local dispatch desk for storm tarping, written project scopes, or crew scheduling.
            </p>

            {/* Contact Details Card */}
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-6 space-y-4 text-sm">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Phone Dispatch
                </span>
                <a
                  href={`tel:${siteConfig.company.phone}`}
                  className="text-lg font-bold text-amber-400 hover:underline mt-0.5 inline-block focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
                >
                  {siteConfig.company.phoneDisplay}
                </a>
                <p className="text-xs text-slate-400 mt-0.5">{siteConfig.company.emergencyHours}</p>
              </div>

              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Email
                </span>
                <a
                  href={`mailto:${siteConfig.company.email}`}
                  className="text-sm font-semibold text-white hover:text-amber-400 mt-0.5 inline-block focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
                >
                  {siteConfig.company.email}
                </a>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Headquarters &amp; Hours
                </span>
                <p className="text-sm text-slate-200 font-medium mt-0.5">
                  {siteConfig.company.address.formatted}
                </p>
                <p className="text-xs text-slate-400 mt-1">{siteConfig.company.hours}</p>
              </div>
            </div>

            {/* Guarantees */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 pt-1">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>Line-item pricing covering labor, materials, cleanup, and disposal.</span>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>Private homeowner inquiry — zero third-party lead reselling.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

