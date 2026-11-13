import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  Loader2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Receipt,
  ArrowRight,
  Activity,
} from "lucide-react";
import { AdminNavTabs } from "../components/AdminNavTabs";

interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  zipCode?: string;
  serviceType: string;
  notes?: string;
  whopLeadId?: string;
  whopEventId?: string;
  createdAt: number | string;
}

export default function AdminLeadsPage() {
  const navigate = useNavigate();
  const [adminSecret, setAdminSecret] = useState(() => {
    return sessionStorage.getItem("peakguard_admin_secret") || "";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Leads Data
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");

  // Verify auth on mount if secret exists in sessionStorage
  useEffect(() => {
    if (adminSecret) {
      verifySecret(adminSecret);
    }
  }, []);

  const verifySecret = async (secret: string) => {
    setAuthChecking(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) {
        throw new Error("Invalid ADMIN_SECRET key");
      }
      setIsAuthenticated(true);
      sessionStorage.setItem("peakguard_admin_secret", secret);
      fetchLeads(secret);
    } catch (err: any) {
      setIsAuthenticated(false);
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) return;
    verifySecret(adminSecret.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem("peakguard_admin_secret");
    setIsAuthenticated(false);
    setAdminSecret("");
    setLeads([]);
  };

  const fetchLeads = async (secret = adminSecret) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads", {
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) {
        throw new Error(`Failed to load leads (${res.status})`);
      }
      const data = await res.json();
      
      // Combine local recorded leads with Whop API leads
      const localList: LeadItem[] = (data.localLeads || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        address: l.address,
        zipCode: l.zipCode,
        serviceType: l.serviceType,
        notes: l.notes,
        whopLeadId: l.whopLeadId,
        whopEventId: l.whopEventId,
        createdAt: l.createdAt,
      }));

      const whopList: LeadItem[] = (data.whopLeads || []).map((w: any) => {
        const meta = w.metadata || {};
        return {
          id: w.id || `lead_whop_${w.created_at}`,
          name: meta.customer_name || w.user?.name || "Whop Customer",
          email: meta.customer_email || w.user?.email || "—",
          phone: meta.customer_phone || "—",
          address: meta.property_address,
          zipCode: meta.zip_code,
          serviceType: meta.service_type || "roof-inspection",
          notes: meta.notes,
          whopLeadId: w.id,
          createdAt: (w.created_at ? w.created_at * 1000 : Date.now()),
        };
      });

      // Merge and deduplicate by email or id
      const combined = [...localList];
      for (const w of whopList) {
        if (!combined.some(c => c.whopLeadId === w.whopLeadId || (c.email && c.email.toLowerCase() === w.email.toLowerCase()))) {
          combined.push(w);
        }
      }

      setLeads(combined);
    } catch (err: any) {
      setError(err.message || "Could not retrieve leads");
    } finally {
      setLoading(false);
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.zipCode && item.zipCode.includes(searchQuery)) ||
      (item.address && item.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesService =
      serviceFilter === "all" ||
      item.serviceType.toLowerCase().includes(serviceFilter.toLowerCase());

    return matchesSearch && matchesService;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Admin Nav Tabs */}
      {isAuthenticated && (
        <AdminNavTabs adminSecret={adminSecret} onLogout={handleLogout} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {!isAuthenticated ? (
          /* Authentication Gate */
          <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl mt-12 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-white">Leads Tracking Access</h1>
              <p className="text-xs text-slate-400">
                Enter your <code className="text-amber-400 font-mono">ADMIN_SECRET</code> to view live estimate requests.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="leads-secret-input"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Secret Key
                </label>
                <input
                  id="leads-secret-input"
                  type="password"
                  required
                  placeholder="Enter server ADMIN_SECRET"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authChecking || !adminSecret.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Access Leads Dashboard</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="space-y-6">
            {/* Page Header matching Reference Video */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-400" />
                  <span>Leads</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Every estimate request submitted through this site, pulled live from the Whop Leads & Events API.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/admin/events"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tracking events →</span>
                </Link>

                <button
                  onClick={() => fetchLeads()}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by customer name, email, address, or zip..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Service Types</option>
                  <option value="repair">Roof Repair</option>
                  <option value="replacement">Roof Replacement</option>
                  <option value="inspection">Roof Inspection</option>
                  <option value="emergency">Emergency Tarping</option>
                </select>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => fetchLeads()}
                  className="underline font-bold hover:text-red-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && leads.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                <p className="text-xs">Querying Whop Leads API & isolate cache...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No Leads Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery || serviceFilter !== "all"
                      ? "No leads match your current search or service filters."
                      : "No estimate requests have been submitted yet. Test the estimate form on the homepage to see leads appear here live."}
                  </p>
                </div>
                <Link
                  to="/#estimate"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  <span>Open Estimate Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              /* Leads Cards matching the video frame layout */
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const dateStr = typeof lead.createdAt === "number"
                    ? new Date(lead.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : lead.createdAt;

                  return (
                    <div
                      key={lead.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-5 shadow-lg space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-base font-black text-white">
                              {lead.name}
                            </h3>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 capitalize">
                              {lead.serviceType.replace(/-/g, " ")}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5 flex-wrap">
                            <a
                              href={`mailto:${lead.email}`}
                              className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span>{lead.email}</span>
                            </a>
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>{lead.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 font-mono flex items-center sm:justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateStr}
                          </span>
                        </div>
                      </div>

                      {/* Property Address & Notes */}
                      {(lead.address || lead.zipCode || lead.notes) && (
                        <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {(lead.address || lead.zipCode) && (
                            <div className="flex items-start gap-1.5 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>
                                {lead.address}
                                {lead.zipCode ? `, ZIP ${lead.zipCode}` : ""}
                              </span>
                            </div>
                          )}
                          {lead.notes && (
                            <div className="text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                              "{lead.notes}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Whop API Badges & Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          {lead.whopLeadId ? (
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                              Whop Lead: {lead.whopLeadId}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                              Whop Event: {lead.whopEventId || lead.id}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            navigate(
                              `/admin/invoicing?email=${encodeURIComponent(
                                lead.email
                              )}&name=${encodeURIComponent(lead.name)}`
                            );
                          }}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 transition-colors border border-slate-700"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Invoice Customer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
