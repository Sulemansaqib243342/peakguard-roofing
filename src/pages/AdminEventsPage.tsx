import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  RefreshCw,
  Zap,
  ShieldAlert,
  Loader2,
  CreditCard,
  FileText,
  Eye,
  Users,
} from "lucide-react";
import { AdminNavTabs } from "../components/AdminNavTabs";
import { trackEvent } from "../lib/tracking";

interface TrackingEventItem {
  id: string;
  name: string;
  page: string;
  value?: string | number;
  params?: Record<string, unknown>;
  timestamp: number;
}

export default function AdminEventsPage() {
  const [adminSecret, setAdminSecret] = useState(() => {
    return sessionStorage.getItem("peakguard_admin_secret") || "";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Events Data
  const [events, setEvents] = useState<TrackingEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState("all");
  const [firingTest, setFiringTest] = useState(false);

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
      fetchEvents(secret);
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
    setEvents([]);
  };

  const fetchEvents = async (secret = adminSecret) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) {
        throw new Error(`Failed to load events (${res.status})`);
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "Could not retrieve tracking events");
    } finally {
      setLoading(false);
    }
  };

  const handleFireTestEvent = async () => {
    setFiringTest(true);
    try {
      trackEvent("service_viewed", {
        service_id: "roof-inspection",
        service_title: "100-Point Drone Inspection (Test)",
        value: 149,
        currency: "USD",
      });
      // Allow brief moment for beacon
      await new Promise((r) => setTimeout(r, 400));
      await fetchEvents();
    } finally {
      setFiringTest(false);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (eventFilter === "all") return true;
    return e.name.toLowerCase().includes(eventFilter.toLowerCase());
  });

  const getEventBadge = (name: string) => {
    switch (name) {
      case "estimate_requested":
      case "lead":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "service_viewed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "deposit_started":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "checkout_started":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "payment.succeeded":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-slate-700/30 text-slate-400 border-slate-700/50";
    }
  };

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
              <h1 className="text-xl font-black text-white">Events Tracking Access</h1>
              <p className="text-xs text-slate-400">
                Enter your <code className="text-amber-400 font-mono">ADMIN_SECRET</code> to view real-time pixel telemetry.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="events-secret-input"
                  className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Secret Key
                </label>
                <input
                  id="events-secret-input"
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
                  <span>Access Pixel Events</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Events Table View matching Reference Video */
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-amber-400" />
                  <span>Pixel & tracking events</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Last 24 hours, most recent first. Tracks <code className="text-amber-400 font-mono">window.whop.track</code> events in real time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/admin/leads"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>← Leads</span>
                </Link>

                <button
                  onClick={handleFireTestEvent}
                  disabled={firingTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${firingTest ? "animate-bounce" : ""}`} />
                  <span>Fire Test Event</span>
                </button>

                <button
                  onClick={() => fetchEvents()}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Events</span>
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-black text-white mt-1">{events.length}</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Estimates</span>
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {events.filter((e) => e.name.includes("estimate") || e.name === "lead").length}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Services Viewed</span>
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {events.filter((e) => e.name.includes("service")).length}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Checkouts</span>
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {events.filter((e) => e.name.includes("deposit") || e.name.includes("checkout") || e.name.includes("payment")).length}
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "All Events" },
                { id: "estimate_requested", label: "estimate_requested" },
                { id: "service_viewed", label: "service_viewed" },
                { id: "deposit_started", label: "deposit_started" },
                { id: "pixel.page", label: "pixel.page" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setEventFilter(pill.id)}
                  className={`px-3 py-1 rounded-lg font-mono font-medium border transition-colors whitespace-nowrap ${
                    eventFilter === pill.id
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => fetchEvents()}
                  className="underline font-bold hover:text-red-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Events Table matching Reference Video Frame 13 */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 font-mono">TIME</th>
                      <th className="py-3.5 px-4 font-mono">EVENT</th>
                      <th className="py-3.5 px-4 font-mono">PAGE</th>
                      <th className="py-3.5 px-4 font-mono">VALUE</th>
                      <th className="py-3.5 px-4 font-mono">DETAILS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-mono">
                    {loading && events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                          Streaming pixel events...
                        </td>
                      </tr>
                    ) : filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          No events recorded yet. Click "Fire Test Event" or browse the site to see events live.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => {
                        const dateStr = new Date(evt.timestamp).toLocaleString(undefined, {
                          month: "numeric",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          second: "2-digit",
                        });

                        return (
                          <tr
                            key={evt.id}
                            className="hover:bg-slate-900/40 transition-colors"
                          >
                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getEventBadge(
                                  evt.name
                                )}`}
                              >
                                {evt.name}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                              {evt.page}
                            </td>
                            <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-medium">
                              {evt.value || "—"}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                              {evt.params ? JSON.stringify(evt.params) : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
