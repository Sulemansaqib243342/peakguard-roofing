import { Link, useLocation } from "react-router-dom";
import {
  Lock,
  ArrowLeft,
  Receipt,
  Users,
  Activity,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface AdminNavTabsProps {
  adminSecret?: string;
  onLogout?: () => void;
}

export function AdminNavTabs({ adminSecret: _adminSecret, onLogout }: AdminNavTabsProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    {
      name: "Invoicing",
      path: "/admin/invoicing",
      icon: Receipt,
      description: "Auto-charge & manual balances",
    },
    {
      name: "Leads Tracking",
      path: "/admin/leads",
      icon: Users,
      description: "Live estimate requests",
    },
    {
      name: "Pixel Events",
      path: "/admin/events",
      icon: Activity,
      description: "Real-time tracking stream",
    },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950 px-4 sm:px-6 py-3.5 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to home"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm tracking-tight">
                    PeakGuard Admin
                  </span>
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    Authenticated
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Whop Websites Production Operations
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="md:hidden text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 p-1.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center / Right Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPath === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out of admin session"
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
