import React, { useState, useEffect } from "react";
import { Activity, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface LoggedEvent {
  id: string;
  name: string;
  params?: Record<string, unknown>;
  time: string;
}

export const DevTrackingToolbar: React.FC = () => {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Intercept console.groupCollapsed calls from tracking logger
    const handleStorageEvent = (event: CustomEvent<LoggedEvent>) => {
      setEvents((prev) => [event.detail, ...prev.slice(0, 19)]);
    };

    window.addEventListener("whop-debug-event" as any, handleStorageEvent as any);
    return () => {
      window.removeEventListener("whop-debug-event" as any, handleStorageEvent as any);
    };
  }, []);

  // Also hook into window.whop if mock injected
  useEffect(() => {
    const originalTrack = window.whop?.track;
    if (typeof window !== "undefined") {
      window.whop = window.whop || {
        track: (name: string, params?: Record<string, unknown>) => {
          const newEvent: LoggedEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name,
            params,
            time: new Date().toLocaleTimeString(),
          };
          setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
          if (originalTrack) originalTrack(name, params);
        },
      };
    }
  }, []);

  return (
    <aside aria-label="Whop tracking debug" className="fixed bottom-4 right-4 z-50 font-sans text-xs">
      <div className="bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden w-80 sm:w-96 transition-all">
        
        {/* Toolbar Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Whop Pixel Debugger</span>
            </span>
            <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px]">
              {events.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEvents([]);
                }}
                className="p-1 text-slate-400 hover:text-white"
                title="Clear events"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Toolbar Body */}
        {isExpanded && (
          <div className="p-3 max-h-80 overflow-y-auto space-y-2 text-[11px] bg-slate-950">
            {events.length === 0 ? (
              <div className="py-6 text-center text-slate-500 space-y-1">
                <div>No events fired yet</div>
                <div className="text-[10px] text-slate-600">
                  Submit estimate, select a service, or click a plan to trigger
                </div>
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400">{evt.name}</span>
                    <span className="text-[10px] text-slate-500">{evt.time}</span>
                  </div>
                  {evt.params && Object.keys(evt.params).length > 0 && (
                    <pre className="text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded overflow-x-auto font-mono">
                      {JSON.stringify(evt.params, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
              <span>Auto-tracked: page views & checkouts</span>
              <span className="text-amber-400">Dev Mode Only</span>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};
