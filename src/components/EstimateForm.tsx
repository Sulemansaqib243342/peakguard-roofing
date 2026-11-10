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

      setLeadId(data.leadId || `lead_${Date.now()}`);
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
    <section id="estimate" className="py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Why Request an Estimate */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <span>Zero High-Pressure Sales</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              Request Your Detailed Roofing Estimate
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-[1.65]">
              Submit your property details for an itemized scope and estimate. A licensed roofing specialist will review your satellite footprint and reach out within 24 hours.
            </p>

            {/* Guarantees List */}
            <div className="space-y-4 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Accurate Line-Item Pricing</strong>
                  <span>Every quote includes labor, materials, cleanup, and disposal — no surprise additions.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Strict Privacy Protection</strong>
                  <span>We never sell or share your contact info. Your data is stored securely.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Insurance Claim Guidance</strong>
                  <span>Experienced with State Farm, Allstate, USAA, Travelers, and Texas windstorm claims.</span>
                </div>
              </div>
            </div>

            {/* Direct phone call alternative */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
              Need immediate assistance for an active leak? Call our 24/7 emergency dispatch:{" "}
              <a href={`tel:${siteConfig.company.phone}`} className="text-amber-400 font-bold hover:underline block sm:inline mt-1 sm:mt-0">
                {siteConfig.company.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Right Column: Form Container */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200">
            {submitSuccess ? (
              <div className="py-12 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Estimate Request Received!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Thank you, <strong>{values.name}</strong>. Your reference ID is{" "}
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {leadId}
                    </span>.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Our inspection team will review your property at <strong>{values.address}, {values.zipCode}</strong> and contact you at <strong>{values.phone}</strong>.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button
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
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="border-b border-slate-100 pb-4 mb-2">
                  <h3 className="text-xl font-black text-slate-900">Property & Project Details</h3>
                  <p className="text-xs text-slate-500">All fields required unless marked optional</p>
                </div>

                {/* Honeypot field (hidden from humans, traps automated bot spam) */}
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. John Miller"
                      value={values.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium ${
                        errors.name
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                          : "border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="(555) 000-0000"
                      value={values.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium ${
                        errors.phone
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                          : "border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={values.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl text-sm border font-medium ${
                      errors.email
                        ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                        : "border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
                    }`}
                  />
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                </div>

                {/* Street Address & ZIP Code */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Property Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      placeholder="1234 Maple Creek Dr"
                      value={values.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium ${
                        errors.address
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                          : "border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.address && <p className="text-xs text-rose-600 mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="75201"
                      maxLength={5}
                      value={values.zipCode}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl text-sm border font-medium ${
                        errors.zipCode
                          ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                          : "border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
                      }`}
                    />
                    {errors.zipCode && <p className="text-xs text-rose-600 mt-1">{errors.zipCode}</p>}
                  </div>
                </div>

                {/* Service Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Service Required *
                  </label>
                  <select
                    name="serviceType"
                    value={values.serviceType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-medium bg-white"
                  >
                    <option value="roof-repair">Roof Repair & Emergency Leak Stop</option>
                    <option value="roof-replacement">Full Roof Replacement & Restoration</option>
                    <option value="roof-inspection">21-Point Drone & Physical Roof Inspection</option>
                    <option value="roof-tuneup">Roof Tune-Up & Storm Prep Flat Rate</option>
                    <option value="emergency-storm">Active Storm Damage Emergency</option>
                  </select>
                </div>

                {/* Additional Notes (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Describe Any Symptoms / Leaks (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="e.g. Ceiling stain in second-floor bedroom after recent hail storm; missing shingles visible on south slope."
                    value={values.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-medium"
                  />
                </div>

                {/* General Submit Error */}
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Estimate Request</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  By submitting, you agree to receive follow-up contact regarding your estimate. Zero spam, ever.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

