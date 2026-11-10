import React, { useState, useEffect } from "react";
import { siteConfig } from "../site.config";
import { X, ShieldCheck, Lock } from "lucide-react";
import {
  WhopElements,
  Checkout,
  CheckoutElement,
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
    ? `${window.location.origin}/checkout/return?key=${planKey}&plan=${plan.id}`
    : `https://${siteConfig.whop.websiteRoute}.whop.app/checkout/return?key=${planKey}&plan=${plan.id}`;

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
            <h2 className="text-xl sm:text-2xl font-bold text-white">{plan.name}</h2>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400">
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
                <strong className="text-white block font-semibold">Card Authorized on File via Setup Intent</strong>
                <span className="text-[11px] text-slate-300">
                  Your payment method will be securely authorized and saved on file. 100% of this $500 deposit is credited toward your final project invoice upon completion.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body: Single Unified Whop Checkout Context */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Environment Indicator */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">
              Whop Secure Payments (PCI-DSS Level 1)
            </span>
          </div>

          {elementsInstance ? (
            <WhopElements elements={elementsInstance}>
              <Checkout
                plan={plan.id}
                returnUrl={returnUrl}
                metadata={{
                  company: siteConfig.company.name,
                  plan_name: plan.name,
                  plan_key: planKey,
                  is_deposit: String(isDeposit),
                  setup_future_usage: isDeposit ? "off_session" : "none",
                }}
                onComplete={(completion) => {
                  if (completion.result === "payment") {
                    window.location.href = `${returnUrl}&payment=${encodeURIComponent(completion.paymentId)}&status=succeeded`;
                  } else if (completion.result === "setup") {
                    window.location.href = `${returnUrl}&setup_intent_id=${encodeURIComponent(completion.setupIntentId)}&status=succeeded`;
                  }
                }}
              >
                {/* 1. Express Checkout (Apple Pay & Google Pay) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Express Checkout
                  </div>
                  <div className="rounded-xl border border-slate-200 p-2 bg-slate-50">
                    <ExpressCheckoutElement
                      layout="horizontal"
                      wallets={["apple_pay", "google_pay"]}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold">Or card payment</span>
                  </div>
                </div>

                {/* 2. Full Hosted Checkout Surface (Includes Card inputs, live pricing, promo codes, branding & pay button) */}
                <div className="space-y-2">
                  <CheckoutElement />
                </div>
              </Checkout>
            </WhopElements>
          ) : (
            <div className="space-y-3">
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Whop Payments • SSL Encrypted</span>
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
