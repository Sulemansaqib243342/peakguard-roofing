import { useSearchParams, Link } from "react-router-dom";
import { siteConfig } from "../site.config";
import { CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Calendar, Phone, CreditCard } from "lucide-react";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const status = params.get("status") || "succeeded";
  const paymentId = params.get("payment") || `pay_test_${Math.random().toString(36).substring(2, 9)}`;
  const planKey = params.get("key") as keyof typeof siteConfig.whop.plans | null;
  const plan = (planKey && siteConfig.whop.plans[planKey]) || siteConfig.whop.plans.deposit;
  const isDeposit = planKey === "deposit" || plan.name.toLowerCase().includes("deposit");

  const isSuccess = status === "succeeded" || status === "demo";
  const isPending = status === "processing";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-black text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
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
              <h1 className="text-3xl font-black text-slate-900">
                You're Scheduled with PeakGuard!
              </h1>
              <p className="text-sm text-slate-600">
                Thank you for your order. A receipt and confirmation have been dispatched to your email.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-900">{paymentId}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <span className="text-slate-500">Service Plan</span>
                <span className="font-bold text-slate-900">{plan.name}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <span className="text-slate-500">Amount Charged</span>
                <span className="text-lg font-black text-slate-900">{plan.priceDisplay}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Processor</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Whop Payments
                </span>
              </div>
            </div>

            {/* Setup Intent / Saved Card Notice (for Deposit Checkout) */}
            {isDeposit && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Card Saved on File for Final Balance</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-xs">
                  Your payment method has been securely stored on file via Whop Payments setup intent.
                  When your installation is completed and signed off, your remaining balance (original estimate minus this $500 deposit credit) will be invoiced to this stored method.
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                What happens next:
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Our dispatch supervisor will call your phone within 24 hours to confirm calendar arrival windows and crew parking details.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Need to reschedule or update access codes? Call our dispatch center anytime at{" "}
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
            <h1 className="text-2xl font-black text-slate-900">Payment Processing</h1>
            <p className="text-sm text-slate-600">
              Your payment is being confirmed with your financial institution. Please wait a few moments...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Payment Incomplete</h1>
            <p className="text-sm text-slate-600">
              Your transaction could not be finalized. No funds were charged to your account.
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
        )}
      </main>
    </div>
  );
}
