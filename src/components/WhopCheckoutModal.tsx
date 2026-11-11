import React, { useState, useEffect } from "react";
import { siteConfig } from "../site.config";
import { X, ShieldCheck, Lock, AlertTriangle, Loader2 } from "lucide-react";
import {
  WhopElements,
  Payments,
  EmailElement,
  PaymentElement,
  BrandingElement,
  Checkout,
  ExpressCheckoutElement,
  usePayments,
  useWhop,
} from "@whop/elements-react";
import { loadWhop } from "@whop/elements";

interface WhopCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planKey: keyof typeof siteConfig.whop.plans;
}

interface PublicRuntimeConfig {
  environment: "sandbox" | "production";
  accountId: string;
  plans: Record<keyof typeof siteConfig.whop.plans, string>;
}

const isPlaceholderPlan = (id: string) =>
  !id || id.includes("SANDBOX_") || id.includes("PROD_") || id.startsWith("plan_roof_") || id.startsWith("plan_project_");

interface PaymentFormBodyProps {
  planKey: keyof typeof siteConfig.whop.plans;
  planId: string;
  planName: string;
  priceDisplay: string;
  isDeposit: boolean;
  returnUrl: string;
}

const PaymentFormBody: React.FC<PaymentFormBodyProps> = ({
  planKey,
  planId,
  planName,
  priceDisplay,
  isDeposit,
  returnUrl,
}) => {
  const payments = usePayments();
  const whop = useWhop();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payments || !whop || !ready || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { confirmationToken } = await payments.createConfirmationToken({});

      const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationToken,
          planKey,
          planId,
          returnUrl,
        }),
      });

      const payment = (await response.json()) as {
        id?: string;
        status?: string;
        client_secret?: string;
        error?: string;
      };

      if (!response.ok || !payment.id) {
        setError(payment.error || "Payment could not be started. Please check your details and try again.");
        setSubmitting(false);
        return;
      }

      if (payment.status === "paid" || payment.status === "succeeded") {
        window.location.assign(
          `${returnUrl}&payment=${encodeURIComponent(payment.id)}&status=succeeded`
        );
        return;
      }

      if (!payment.client_secret) {
        setError("Missing payment verification token from server response.");
        setSubmitting(false);
        return;
      }

      const result = await whop.payments.handleNextAction({
        clientSecret: payment.client_secret,
        returnUrl,
      });

      if (result.redirected) {
        return;
      }

      if (result.status === "succeeded") {
        window.location.assign(
          `${returnUrl}&payment=${encodeURIComponent(payment.id)}&status=succeeded`
        );
        return;
      }

      if (result.status === "processing") {
        window.location.assign(
          `${returnUrl}&payment=${encodeURIComponent(payment.id)}&status=processing`
        );
        return;
      }

      setError(
        result.lastPaymentError?.message ||
          "The payment authorization was not completed. No charge was finalized."
      );
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj?.code === "payment_request_cancelled") {
        setError("Wallet sheet closed before completion. Select a payment method to try again.");
      } else {
        setError(errObj?.message || "Payment failed. Please review your payment details and retry.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="space-y-3">
        <EmailElement />
        <PaymentElement
          wallets={{ applePay: "auto", googlePay: "auto", payPal: "never" }}
          onChange={(event) => setReady(event.complete)}
        />
      </div>

      {/* Required Whop BrandingElement — visible on every payment form */}
      <div className="pt-1 flex items-center justify-between">
        <BrandingElement />
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!ready || submitting || !payments || !whop}
        className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authorizing {priceDisplay}...</span>
          </>
        ) : (
          <span>
            {isDeposit
              ? `Pay ${priceDisplay} Deposit & Save Card — ${planName}`
              : `Pay ${priceDisplay} — ${planName}`}
          </span>
        )}
      </button>
    </form>
  );
};

export const WhopCheckoutModal: React.FC<WhopCheckoutModalProps> = ({
  isOpen,
  onClose,
  planKey,
}) => {
  const plan = siteConfig.whop.plans[planKey] || siteConfig.whop.plans.inspection;
  const isDeposit = planKey === "deposit";

  const [elementsInstance, setElementsInstance] = useState<ReturnType<typeof loadWhop> | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<PublicRuntimeConfig>({
    environment: siteConfig.whop.environment,
    accountId: siteConfig.whop.accountId,
    plans: {
      inspection: siteConfig.whop.plans.inspection.id,
      deposit: siteConfig.whop.plans.deposit.id,
      tuneUp: siteConfig.whop.plans.tuneUp.id,
    },
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    try {
      setElementsInstance(loadWhop());
    } catch (err) {
      console.warn("[Whop Elements Init Warning]", err);
    }

    let active = true;
    fetch("/api/public-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Partial<PublicRuntimeConfig> | null) => {
        if (!active || !data) return;
        setRuntimeConfig((prev) => ({
          environment: data.environment === "sandbox" || data.environment === "production"
            ? data.environment
            : prev.environment,
          accountId: data.accountId || prev.accountId,
          plans: {
            inspection: data.plans?.inspection || prev.plans.inspection,
            deposit: data.plans?.deposit || prev.plans.deposit,
            tuneUp: data.plans?.tuneUp || prev.plans.tuneUp,
          },
        }));
      })
      .catch(() => {
        // Fallback cleanly to static site.config values
      })
      .finally(() => {
        if (active) setConfigLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedPlanId = runtimeConfig.plans[planKey] || plan.id;
  const resolvedAccountId = runtimeConfig.accountId;
  const hasValidConfig =
    resolvedAccountId.startsWith("biz_") && !isPlaceholderPlan(resolvedPlanId);

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/return?key=${planKey}&plan=${encodeURIComponent(resolvedPlanId)}`
      : `https://${siteConfig.whop.websiteRoute}.whop.app/checkout/return?key=${planKey}&plan=${encodeURIComponent(resolvedPlanId)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whop-checkout-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            aria-label="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>
              Secure Whop Payments ({runtimeConfig.environment === "sandbox" ? "Sandbox" : "Live"})
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 pt-1 pr-8">
            <h2 id="whop-checkout-title" className="text-xl sm:text-2xl font-bold text-white">
              {plan.name}
            </h2>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 shrink-0">
              {plan.priceDisplay}
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">{plan.description}</p>

          {isDeposit && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">
                  Off-Session Card Save Enabled (<code className="font-mono text-[11px]">setupFutureUsage="off_session"</code>)
                </strong>
                <span className="text-[11px] text-slate-300">
                  Your payment method is securely authorized via Whop Payment Elements so the remaining balance can be invoiced after job completion. 100% of this $500 deposit is credited.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold">Whop Payment Elements • Card / Apple Pay / Google Pay</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 uppercase">
              {runtimeConfig.environment}
            </span>
          </div>

          {!configLoaded || !elementsInstance ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading Whop Payment Elements">
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          ) : !hasValidConfig ? (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2"
            >
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Whop Sandbox / Account Configuration Incomplete</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                This checkout requires a real <code className="font-mono">biz_...</code> account ID
                and a real <code className="font-mono">plan_...</code> ID in{" "}
                <code className="font-mono">src/site.config.ts</code> or runtime environment
                variables (<code className="font-mono">WHOP_ACCOUNT_ID</code>,{" "}
                <code className="font-mono">VITE_WHOP_PLAN_*</code>). Current plan:{" "}
                <code className="font-mono">{resolvedPlanId}</code>.
              </p>
            </div>
          ) : (
            <WhopElements
              elements={elementsInstance}
              environment={runtimeConfig.environment}
              appearance={{
                theme: {
                  appearance: "light",
                  accentColor: "amber",
                  grayColor: "slate",
                },
              }}
            >
              {/* Express Checkout (Apple Pay / Google Pay) for non-deposit one-time plans */}
              {!isDeposit && (
                <div className="space-y-2">
                  <Checkout
                    key={`express-${resolvedPlanId}-${runtimeConfig.environment}`}
                    plan={resolvedPlanId}
                    returnUrl={returnUrl}
                    metadata={{
                      company: siteConfig.company.name,
                      plan_key: planKey,
                      plan_name: plan.name,
                      channel: "express_checkout",
                    }}
                    onComplete={(completion) => {
                      if (completion.result === "payment") {
                        window.location.assign(
                          `${returnUrl}&payment=${encodeURIComponent(completion.paymentId)}&status=succeeded`
                        );
                      }
                    }}
                  >
                    <ExpressCheckoutElement
                      wallets={{ applePay: "auto", googlePay: "auto", payPal: "never" }}
                      layout="auto"
                    />
                  </Checkout>
                </div>
              )}

              {/* Primary Payment Elements Surface (Email + Payment + Required Branding) */}
              <Payments
                key={`payments-${resolvedAccountId}-${resolvedPlanId}-${runtimeConfig.environment}`}
                accountId={resolvedAccountId}
                plan={resolvedPlanId}
                returnUrl={returnUrl}
                setupFutureUsage={isDeposit ? "off_session" : undefined}
              >
                <PaymentFormBody
                  planKey={planKey}
                  planId={resolvedPlanId}
                  planName={plan.name}
                  priceDisplay={plan.priceDisplay}
                  isDeposit={isDeposit}
                  returnUrl={returnUrl}
                />
              </Payments>
            </WhopElements>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Encrypted Checkout • Financing options appear at checkout for approved merchants</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
