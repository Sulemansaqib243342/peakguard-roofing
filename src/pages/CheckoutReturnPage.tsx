import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { siteConfig } from "../site.config";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Phone,
  CreditCard,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const rawStatus = params.get("status");
  const paymentId = params.get("payment") || params.get("payment_id");
  const setupIntentId = params.get("setup_intent_id") || params.get("setup");
  const planKey = params.get("key") as keyof typeof siteConfig.whop.plans | null;
  const plan = (planKey && siteConfig.whop.plans[planKey]) || siteConfig.whop.plans.deposit;

  // Real status checking per Whop docs:
  // "The buyer returns to returnUrl with payment and status (succeeded, failed, canceled).
  // Branch on status before showing a success page."
  const isSuccess = rawStatus === "succeeded";
  const isPending = rawStatus === "processing";
  const isCanceled = rawStatus === "canceled";
  const isFailed = rawStatus === "failed";

  // Setup intent verification state (retrieved from backend if setupIntentId exists)
  const [setupDetails, setSetupDetails] = useState<{
    status?: string;
    paymentMethodId?: string;
    cardBrand?: string;
    cardLast4?: string;
  } | null>(null);
  const [verifyingSetup, setVerifyingSetup] = useState<boolean>(Boolean(setupIntentId));

  useEffect(() => {
    if (!setupIntentId) {
      setVerifyingSetup(false);
      return;
    }

    let isMounted = true;
    fetch(`/api/setup-intents?id=${encodeURIComponent(setupIntentId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        setSetupDetails({
          status: data.status,
          paymentMethodId: data.payment_method_id,
          cardBrand: data.payment_instrument?.brand,
          cardLast4: data.payment_instrument?.last4,
        });
      })
      .catch((err) => {
        console.warn("[Setup Intent Verification]", err);
      })
      .finally(() => {
        if (isMounted) setVerifyingSetup(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setupIntentId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
              {siteConfig.company.name}
            </span>
          </Link>
          <span className="text-xs text-slate-500">Checkout Confirmation</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {isSuccess ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl space-y-8 animate-fade-in">
            {/* Success Icon */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment Authorized & Confirmed
              </span>
              <h1 className="text-3xl font-bold text-slate-900">
                You're Scheduled with {siteConfig.company.name}!
              </h1>
              <p className="text-sm text-slate-600">
                Thank you for your order. Your transaction has completed successfully.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              {paymentId && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <span className="text-slate-500">Payment ID</span>
                  <span className="font-mono font-bold text-slate-900">{paymentId}</span>
                </div>
              )}

              {setupIntentId && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <span className="text-slate-500">Setup Intent ID</span>
                  <span className="font-mono font-bold text-slate-900">{setupIntentId}</span>
                </div>
              )}

              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <span className="text-slate-500">Service Plan</span>
                <span className="font-bold text-slate-900">{plan.name}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <span className="text-slate-500">Amount</span>
                <span className="text-lg font-bold text-slate-900">{plan.priceDisplay}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Payment System</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Whop Payments
                </span>
              </div>
            </div>

            {/* Setup Intent / Stored Payment Method Notice: ONLY shown when setup_intent_id exists */}
            {setupIntentId ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Card Saved on File via Setup Intent</span>
                </div>
                {verifyingSetup ? (
                  <div className="flex items-center gap-2 text-amber-800 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying stored payment method...</span>
                  </div>
                ) : setupDetails?.paymentMethodId ? (
                  <p className="text-amber-800 leading-relaxed text-xs">
                    Payment method <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{setupDetails.paymentMethodId}</code>
                    {setupDetails.cardLast4 ? ` (${setupDetails.cardBrand?.toUpperCase() ?? "Card"} •••• ${setupDetails.cardLast4})` : ""} has been securely authorized and stored for your final balance invoice upon project completion.
                  </p>
                ) : (
                  <p className="text-amber-800 leading-relaxed text-xs">
                    Setup intent <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{setupIntentId}</code> confirmed.
                    Your payment method is authorized on file for final settlement once work is signed off.
                  </p>
                )}
              </div>
            ) : null}

            {/* Next Steps */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What happens next:
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Our dispatch supervisor will contact your phone to confirm calendar arrival windows and crew parking details.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Need to reschedule or speak with dispatch? Call us anytime at{" "}
                    <strong>{siteConfig.company.phoneDisplay}</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Back Home Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Processing</h1>
            <p className="text-sm text-slate-600">
              Your payment is currently being processed by your bank. Your order will be confirmed once authorization completes.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : isCanceled ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Checkout Canceled</h1>
            <p className="text-sm text-slate-600">
              The checkout was canceled before completion. No funds have been charged to your payment method.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Return to Plans
              </Link>
            </div>
          </div>
        ) : isFailed ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Unsuccessful</h1>
            <p className="text-sm text-slate-600">
              The payment attempt was declined or could not be completed. Please review your payment details or try a different method.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Try Again
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Invalid Checkout State</h1>
            <p className="text-sm text-slate-600">
              No confirmed payment session was detected for this page request.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                to="/"
                className="px-6 py-3 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
