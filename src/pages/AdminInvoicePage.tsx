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
  Search,
  UserCheck,
  ExternalLink,
} from "lucide-react";

interface MatchedPaymentMethod {
  id: string;
  type: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

interface CustomerLookupResult {
  found: boolean;
  member: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  paymentMethods: MatchedPaymentMethod[];
}

export default function AdminInvoicePage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [originalEstimate, setOriginalEstimate] = useState<number>(8500);
  const [depositPaid, setDepositPaid] = useState<number>(500);
  const [memberId, setMemberId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [action, setAction] = useState<"charge" | "send">("charge");
  const [confirmAutoCharge, setConfirmAutoCharge] = useState(false);
  const [memo, setMemo] = useState("");

  // Customer & Card-on-File Lookup State
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<CustomerLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balanceDue = Math.max(0, Number((originalEstimate - depositPaid).toFixed(2)));
  const selectedMethod = lookupResult?.paymentMethods.find((m) => m.id === paymentMethodId) || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) return;

    setAuthChecking(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Invalid ADMIN_SECRET.");
      }
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLookupCustomer = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      setLookupError("Enter a valid customer email first.");
      return;
    }

    setLookingUp(true);
    setLookupError(null);
    setLookupResult(null);
    setConfirmAutoCharge(false);

    try {
      const res = await fetch(
        `/api/admin/customer-lookup?email=${encodeURIComponent(recipientEmail.trim())}`,
        {
          headers: { "x-admin-secret": adminSecret },
        }
      );
      const data = (await res.json()) as CustomerLookupResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Lookup failed (${res.status})`);
      }

      setLookupResult(data);
      if (data.member) {
        setMemberId(data.member.id);
        if (!customerName.trim() && data.member.displayName) {
          setCustomerName(data.member.displayName);
        }
      } else {
        setMemberId("");
      }

      if (data.paymentMethods.length > 0) {
        setPaymentMethodId(data.paymentMethods[0].id);
      } else {
        setPaymentMethodId("");
      }
    } catch (err: any) {
      setLookupError(err.message || "Could not look up Whop customer.");
    } finally {
      setLookingUp(false);
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
          memberId: memberId.trim() || undefined,
          originalEstimateTotal: originalEstimate,
          depositPaid,
          paymentMethodId: action === "charge" ? paymentMethodId.trim() || undefined : undefined,
          confirmAutoCharge: action === "charge" ? confirmAutoCharge : undefined,
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
      setError(err.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const checkoutLink = result?.actionResult?.checkout_link || result?.invoice?.checkout_link;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to home"
              className="text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
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
                Enter your <code className="text-amber-400 font-mono">ADMIN_SECRET</code> configured via{" "}
                <code className="font-mono text-slate-300">whop apps secrets set</code> or{" "}
                <code className="font-mono text-slate-300">.env.local</code>.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-secret-input"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Secret Key
                </label>
                <input
                  id="admin-secret-input"
                  type="password"
                  required
                  placeholder="Enter server ADMIN_SECRET"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authChecking}
                className="w-full py-3 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {authChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Authenticate Session</span>
                )}
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
                  Credits the $500 project deposit against the contract total and bills or auto-charges the net balance through Whop Invoices.
                </p>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-5">
                {/* Customer Email & Whop Lookup */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="recipient-email"
                      className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Customer Email *
                    </label>
                    <input
                      id="recipient-email"
                      type="email"
                      required
                      placeholder="homeowner@example.com"
                      value={recipientEmail}
                      onChange={(e) => {
                        setRecipientEmail(e.target.value);
                        setConfirmAutoCharge(false);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Customer Full Name
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      placeholder="Robert Miller"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Lookup Button + Matched Customer & Saved Card Banner */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleLookupCustomer}
                    disabled={lookingUp}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors inline-flex items-center gap-2"
                  >
                    {lookingUp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking Whop Members &amp; Payment Methods...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Lookup Customer &amp; Saved Card on Whop</span>
                      </>
                    )}
                  </button>

                  {lookupError && (
                    <div
                      role="alert"
                      className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300"
                    >
                      {lookupError}
                    </div>
                  )}

                  {lookupResult && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-2.5">
                      {lookupResult.member ? (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                            <UserCheck className="w-4 h-4 shrink-0" />
                            <span>
                              Matched Customer: {lookupResult.member.displayName} ({lookupResult.member.email})
                            </span>
                          </div>
                          <code className="text-[11px] font-mono text-slate-400">
                            {lookupResult.member.id}
                          </code>
                        </div>
                      ) : (
                        <div className="text-amber-300">
                          No existing Whop member found for {recipientEmail}. Switch to manual send or verify the deposit checkout email.
                        </div>
                      )}

                      {lookupResult.paymentMethods.length > 0 ? (
                        <div className="space-y-1.5 pt-1 border-t border-slate-800">
                          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                            Saved Payment Methods ({lookupResult.paymentMethods.length})
                          </div>
                          {lookupResult.paymentMethods.map((pm) => (
                            <label
                              key={pm.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                                paymentMethodId === pm.id
                                  ? "bg-amber-500/10 border-amber-500/60 text-white"
                                  : "bg-slate-950 border-slate-800 text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="selectedPm"
                                  checked={paymentMethodId === pm.id}
                                  onChange={() => {
                                    setPaymentMethodId(pm.id);
                                    setConfirmAutoCharge(false);
                                  }}
                                  className="accent-amber-500"
                                />
                                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-semibold">
                                  {(pm.brand || pm.type).toUpperCase()}{" "}
                                  {pm.last4 ? `•••• ${pm.last4}` : ""}
                                </span>
                                {pm.expMonth && pm.expYear && (
                                  <span className="text-slate-400 text-[11px]">
                                    (Exp {String(pm.expMonth).padStart(2, "0")}/{pm.expYear})
                                  </span>
                                )}
                              </div>
                              <code className="text-[11px] font-mono text-slate-400">{pm.id}</code>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                          No saved payment method returned for this customer. Use <strong>Send Email</strong> mode or paste a verified <code className="font-mono">payt_</code> ID below.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Estimate Total & Deposit Credit */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="estimate-total"
                      className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Original Estimate Total ($) *
                    </label>
                    <input
                      id="estimate-total"
                      type="number"
                      required
                      min={501}
                      step={1}
                      value={originalEstimate}
                      onChange={(e) => setOriginalEstimate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deposit-credit"
                      className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                    >
                      Deposit Paid Credit ($) *
                    </label>
                    <input
                      id="deposit-credit"
                      type="number"
                      required
                      min={0}
                      step={1}
                      value={depositPaid}
                      onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Balance Due Summary */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Net Final Balance Due:</span>
                    <div className="text-xs text-slate-500">
                      Total (${originalEstimate.toFixed(2)}) − Deposit (${depositPaid.toFixed(2)})
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    ${balanceDue.toFixed(2)}
                  </div>
                </div>

                {/* Settlement Option: Auto-Charge vs Send Manual */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Settlement Mode *
                  </span>
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
                          onChange={() => {
                            setAction("charge");
                            setConfirmAutoCharge(false);
                          }}
                          className="accent-amber-500"
                        />
                        <span className="font-bold text-xs text-white">Mode A: Auto-Charge</span>
                      </div>
                      <span className="text-[11px] text-slate-400 pl-5">
                        Issues invoice and charges saved card (<code className="font-mono">payt_...</code>) off-session.
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
                          onChange={() => {
                            setAction("send");
                            setConfirmAutoCharge(false);
                          }}
                          className="accent-amber-500"
                        />
                        <span className="font-bold text-xs text-white">Mode B: Send Manual</span>
                      </div>
                      <span className="text-[11px] text-slate-400 pl-5">
                        Issues invoice and emails hosted payment link without auto-charging.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Payment Method ID & Explicit Auto-Charge Confirmation */}
                {action === "charge" && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
                    <div>
                      <label
                        htmlFor="payment-method-id"
                        className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        Stored Payment Method ID (<code className="font-mono">payt_...</code>) *
                      </label>
                      <input
                        id="payment-method-id"
                        type="text"
                        required
                        placeholder="payt_xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={paymentMethodId}
                        onChange={(e) => {
                          setPaymentMethodId(e.target.value);
                          setConfirmAutoCharge(false);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-amber-100 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={confirmAutoCharge}
                        onChange={(e) => setConfirmAutoCharge(e.target.checked)}
                        className="mt-0.5 accent-amber-500"
                      />
                      <span>
                        I confirm charging{" "}
                        <strong className="text-amber-400">${balanceDue.toFixed(2)}</strong> off-session to{" "}
                        <strong className="text-white">
                          {lookupResult?.member?.email || recipientEmail || "this customer"}
                        </strong>
                        {selectedMethod?.last4
                          ? ` (${(selectedMethod.brand || "Card").toUpperCase()} •••• ${selectedMethod.last4})`
                          : paymentMethodId
                            ? ` (${paymentMethodId})`
                            : ""}
                        .
                      </span>
                    </label>
                  </div>
                )}

                {/* Optional Custom Memo */}
                <div>
                  <label
                    htmlFor="invoice-memo"
                    className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Invoice Memo (Optional)
                  </label>
                  <input
                    id="invoice-memo"
                    type="text"
                    placeholder="e.g. Architectural shingle replacement completion balance"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || (action === "charge" && (!paymentMethodId.trim() || !confirmAutoCharge))}
                  className="w-full py-3.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Contacting Whop Invoices API...</span>
                    </>
                  ) : action === "charge" ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Confirm &amp; Auto-Charge Balance (${balanceDue.toFixed(2)})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Issue &amp; Email Invoice Link (${balanceDue.toFixed(2)})</span>
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
                    <span>Invoice Processed</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invoice ID:</span>
                      <span className="font-mono text-white">{result.invoice?.id}</span>
                    </div>
                    {result.invoice?.number && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Invoice Number:</span>
                        <span className="font-mono text-white">{result.invoice.number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-emerald-400 uppercase">{result.invoice?.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mode:</span>
                      <span className="font-bold text-amber-400 uppercase">{result.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Balance Billed:</span>
                      <span className="font-mono text-white font-bold">
                        ${Number(result.summary?.balanceBilled || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="text-white">{result.summary?.recipient}</span>
                    </div>
                  </div>

                  {checkoutLink && (
                    <a
                      href={checkoutLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2 text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Hosted Whop Invoice Payment Link</span>
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
                    <span>Whop Invoices API Workflow</span>
                  </div>
                  <p>
                    1. Click <strong>Lookup Customer &amp; Saved Card</strong> to match the Whop member and inspect any saved <code className="font-mono text-amber-300">payt_</code> card brand &amp; last4 via Whop APIs.
                  </p>
                  <p>
                    2. Choose <strong>Auto-Charge</strong> (issues then charges saved method after explicit confirmation) or <strong>Send Manual</strong> (issues and emails hosted <code className="font-mono text-amber-300">checkout_link</code>).
                  </p>
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <div><strong>POST</strong> <code className="text-amber-400">/api/invoice/final-balance</code></div>
                    <div><strong>GET</strong> <code className="text-amber-400">/api/admin/customer-lookup</code></div>
                    <div><strong>Auth:</strong> Header <code className="text-amber-400">x-admin-secret</code></div>
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
