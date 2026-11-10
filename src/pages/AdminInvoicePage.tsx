import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Lock,
  Receipt,
  CreditCard,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

export default function AdminInvoicePage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form State
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [originalEstimate, setOriginalEstimate] = useState<number>(8500);
  const [depositPaid, setDepositPaid] = useState<number>(500);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [action, setAction] = useState<"charge" | "send">("charge");
  const [memo, setMemo] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balanceDue = Math.max(0, originalEstimate - depositPaid);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminSecret.trim().length > 0) {
      setIsAuthenticated(true);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/invoice/final-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          recipientEmail,
          customerName,
          originalEstimateTotal: originalEstimate,
          depositPaid,
          paymentMethodId: paymentMethodId.trim() || undefined,
          mode: action === "charge" ? "auto_charge" : "send_manual",
          action,
          memo: memo || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Invoice creation failed [${response.status}]`);
      }

      setResult(data);
    } catch (err: any) {
      console.error("[Admin Invoice Error]", err);
      setError(err.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm">
                PeakGuard Admin • Final Balance Invoicing
              </span>
            </div>
          </div>
          <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-mono">
            Whop Invoices API v1
          </span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {!isAuthenticated ? (
          /* Secret Gate Form */
          <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-white">Restricted Admin Access</h1>
              <p className="text-xs text-slate-400">
                Enter your <code className="text-amber-400 font-mono">ADMIN_SECRET</code> to create and charge final balance invoices.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Secret Key
                </label>
                <input
                  type="password"
                  placeholder="Enter secret configured in runtime"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default dev secret: <code className="text-slate-400">development-secret-change-me</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 transition-colors shadow-md"
              >
                Authenticate Session
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Invoicing Workspace */
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Post-Installation Settlement
                </span>
                <h1 className="text-2xl font-black text-white mt-1">
                  Create Final Balance Invoice
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Automatically credits the $500 project deposit and invoices the remaining contract amount via Whop.
                </p>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-5">
                {/* Customer Email & Name */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="homeowner@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Robert Miller"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Estimate Total & Deposit Credit */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Original Estimate Total ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      step={50}
                      value={originalEstimate}
                      onChange={(e) => setOriginalEstimate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Deposit Paid Credit ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={50}
                      value={depositPaid}
                      onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Balance Due Calculation Pill */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Net Final Balance Due:</span>
                    <div className="text-xs text-slate-500">Total (${originalEstimate}) − Deposit (${depositPaid})</div>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    ${balanceDue.toFixed(2)}
                  </div>
                </div>

                {/* Settlement Option: Option A vs Option B */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Settlement Method *
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                        action === "charge"
                          ? "bg-amber-500/10 border-amber-500/60 text-white"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="action"
                          value="charge"
                          checked={action === "charge"}
                          onChange={() => setAction("charge")}
                          className="accent-amber-500"
                        />
                        <span className="font-bold text-xs text-white">Option A: Auto-Charge</span>
                      </div>
                      <span className="text-[11px] text-slate-400 pl-5">
                        Charges saved card on file (from setup intent) immediately.
                      </span>
                    </label>

                    <label
                      className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                        action === "send"
                          ? "bg-amber-500/10 border-amber-500/60 text-white"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="action"
                          value="send"
                          checked={action === "send"}
                          onChange={() => setAction("send")}
                          className="accent-amber-500"
                        />
                        <span className="font-bold text-xs text-white">Option B: Send Email</span>
                      </div>
                      <span className="text-[11px] text-slate-400 pl-5">
                        Issues invoice and emails payment link to homeowner.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Payment Method ID (Required for Option A) */}
                {action === "charge" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Stored Payment Method ID (`payt_...`) *
                    </label>
                    <input
                      type="text"
                      required={action === "charge"}
                      placeholder="payt_xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Received from the <code className="text-amber-400 font-mono">setup_intent.succeeded</code> webhook when the customer paid the $500 deposit.
                    </p>
                  </div>
                )}

                {/* Optional Custom Memo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Invoice Memo (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3,200 sq ft architectural shingle replacement completed 11/10"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Contacting Whop Invoices API...</span>
                    </>
                  ) : action === "charge" ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Create & Auto-Charge Balance (${balanceDue.toFixed(2)})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Create & Email Invoice Link (${balanceDue.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Response & Audit Column */}
            <div className="lg:col-span-5 space-y-6">
              {result ? (
                <div className="bg-slate-950 border border-emerald-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Invoice Successfully Processed</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invoice ID:</span>
                      <span className="font-mono text-white">{result.invoice?.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Action:</span>
                      <span className="font-bold text-amber-400 uppercase">{result.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Balance Billed:</span>
                      <span className="font-mono text-white font-bold">${result.summary?.balanceBilled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="text-white">{result.summary?.recipient}</span>
                    </div>
                  </div>

                  {result.invoice?.hosted_invoice_url && (
                    <a
                      href={result.invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2 text-center"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Hosted Invoice Link &rarr;</span>
                    </a>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Whop API Response Payload
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-900 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-56">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Whop Invoices API Reference</span>
                  </div>
                  <p>
                    This secure endpoint is called post-job by your dispatch software, CRM, or billing administrator.
                  </p>
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <div><strong>POST</strong> <code className="text-amber-400">/api/invoice/final-balance</code></div>
                    <div><strong>Modes:</strong> <code className="text-slate-300 font-mono">auto_charge</code> (saved card) or <code className="text-slate-300 font-mono">send_manual</code> (email link)</div>
                    <div><strong>Auth:</strong> Header <code className="text-amber-400">x-admin-secret</code></div>
                    <div><strong>API Path:</strong> Injected automatically by Whop hosting runtime to <code className="text-amber-400">WHOP_API_ORIGIN</code></div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
