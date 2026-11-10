import React, { useState, useEffect } from "react";
import { siteConfig } from "../site.config";
import { X, ShieldCheck, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import {
  WhopElements,
  Payments,
  Checkout,
  PaymentElement,
  EmailElement,
  BrandingElement,
  ExpressCheckoutElement,
} from "@whop/elements-react";
import { loadWhop } from "@whop/elements";

interface WhopCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planKey: keyof typeof siteConfig.whop.plans;
}

export const WhopCheckoutModal: React.FC<WhopCheckoutModalProps> = ({
  isOpen,
  onClose,
  planKey,
}) => {
  const plan = siteConfig.whop.plans[planKey] || siteConfig.whop.plans.inspection;
  const isDeposit = planKey === "deposit";

  const [elementsInstance, setElementsInstance] = useState<any>(null);
  const [isTestMode, setIsTestMode] = useState(true);

  // Initialize Whop Elements loader
  useEffect(() => {
    if (!isOpen) return;

    try {
      // Per Whop Elements Guide: elements={loadWhop()}
      const instance = loadWhop();
      setElementsInstance(instance);
    } catch (err: any) {
      console.warn("[Whop Elements Init Warning]", err);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const returnUrl = typeof window !== "undefined"
    ? `${window.location.origin}/checkout/return?plan=${plan.id}&key=${planKey}`
    : "https://peakguard-roofing.whop.site/checkout/return";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Whop Payments Checkout</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">{plan.name}</h2>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {plan.priceDisplay}
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {plan.description}
          </p>

          {/* Card-on-file callout for Deposit plan */}
          {isDeposit && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Card Saved on File via Setup Intent</strong>
                <span className="text-[11px] text-slate-300">
                  Your card will be authorized and securely saved for your final balance invoice upon project completion. 100% of this $500 is credited on your final bill.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Test / Sandbox Environment Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-800">
                Mode: {isTestMode ? "Sandbox / Test" : "Live Production"}
              </span>
            </div>
            <button
              onClick={() => setIsTestMode(!isTestMode)}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              Toggle Info
            </button>
          </div>

          {/* 1. Express Checkout (Apple Pay & Google Pay) */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Express Checkout
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              {elementsInstance ? (
                <WhopElements elements={elementsInstance}>
                  <Checkout
                    plan={plan.id}
                    returnUrl={returnUrl}
                    metadata={{
                      company: siteConfig.company.name,
                      plan_name: plan.name,
                      is_deposit: String(isDeposit),
                    }}
                    onComplete={(completion) => {
                      if (completion.result === "payment") {
                        console.log("[Whop Express Checkout] Completed payment ID:", completion.paymentId);
                        window.location.href = `${returnUrl}&payment=${completion.paymentId}&status=succeeded`;
                      }
                    }}
                  >
                    <ExpressCheckoutElement
                      layout="horizontal"
                      wallets={["apple_pay", "google_pay"]}
                    />
                  </Checkout>
                </WhopElements>
              ) : (
                <div className="h-11 rounded-lg bg-slate-200/60 animate-pulse flex items-center justify-center text-xs text-slate-500">
                  Loading Apple Pay & Google Pay...
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">Or pay with card</span>
            </div>
          </div>

          {/* 2. Whop Payment Form: EmailElement + PaymentElement + REQUIRED BrandingElement */}
          <div className="space-y-4">
            {elementsInstance ? (
              <WhopElements elements={elementsInstance}>
                <Payments
                  accountId={siteConfig.whop.accountId}
                  plan={plan.id}
                  returnUrl={returnUrl}
                  // Per Save Payment Methods guide: setupFutureUsage="off_session" saves card for final balance invoice
                  setupFutureUsage={isDeposit ? "off_session" : undefined}
                >
                  <div className="space-y-4">
                    {/* Buyer Email Element */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Receipt & Invoice Email *
                      </label>
                      <div className="border border-slate-300 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-amber-500 bg-white">
                        <EmailElement />
                      </div>
                    </div>

                    {/* PCI-Isolated Payment Element (Card) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Card Details *
                      </label>
                      <div className="border border-slate-300 rounded-xl p-3 focus-within:ring-2 focus-within:ring-amber-500 bg-white">
                        <PaymentElement />
                      </div>
                    </div>

                    {/* REQUIRED Whop BrandingElement per guidelines */}
                    <div className="pt-1">
                      <BrandingElement />
                    </div>
                  </div>
                </Payments>
              </WhopElements>
            ) : (
              <div className="space-y-3">
                <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-6 w-32 rounded bg-slate-100 animate-pulse" />
              </div>
            )}
          </div>

          {/* Fallback Sandbox Direct Action for Local / Demonstration Testing */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Sandbox Test Mode Instructions</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              When testing locally before deploying with a live Whop plan ID, you can simulate a successful return or link your test plan in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">src/site.config.ts</code>.
            </p>
            <a
              href={`${returnUrl}&status=succeeded&simulated=true`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline hover:text-amber-950 pt-1"
            >
              <span>Test complete checkout flow (Simulate Return State)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Whop Payments • PCI-DSS Level 1 Certified</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
