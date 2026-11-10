// ============================================================================
// PeakGuard Roofing — Whop Visitor & Event Tracking
// ============================================================================
//
// Per Whop Docs (https://docs.whop.com/developer/websites/tracking.md):
// - Sites hosted on whop.site include the Whop pixel with AUTOMATIC page view
//   and checkout tracking. We DO NOT duplicate page views or checkout views.
// - Standard events: lead, schedule, submit_application, contact,
//   complete_registration, view_content, add_to_cart, initiate_checkout.
// - Required custom events for this project:
//   1. `estimate_requested` (via lead form submission)
//   2. `service_viewed` (when visitor views/expands a service)
//   3. `deposit_started` (when visitor begins deposit checkout)
// - Includes a dev-only debug logger so you can show events firing in recordings.
// ============================================================================

// Augment the window object with Whop's injected tracking global
declare global {
  interface Window {
    whop?: {
      track: (eventName: string, params?: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
  }
}

export type TrackingEventName =
  | "lead"
  | "estimate_requested"
  | "service_viewed"
  | "deposit_started"
  | "inspection_started"
  | "tuneup_started"
  | "view_content"
  | "contact";

export interface TrackingParams {
  value?: number;
  currency?: string;
  variant_id?: string;
  product_id?: string;
  service_id?: string;
  service_title?: string;
  event_id?: string;
  [key: string]: unknown;
}

/**
 * Dev-only logger that formats tracked events nicely in the console.
 * Helpful for demonstrating event tracking in recordings.
 */
function logDebugEvent(name: string, params?: TrackingParams) {
  if (
    import.meta.env.DEV ||
    (typeof window !== "undefined" &&
      (window.location.search.includes("debug=1") ||
        window.location.search.includes("debug=track")))
  ) {
    console.groupCollapsed(
      `%c[Whop Track] %c${name}%c @ ${new Date().toISOString()}`,
      "color: #f59e0b; font-weight: bold;",
      "color: #3b82f6; font-weight: bold;",
      "color: #94a3b8; font-weight: normal;"
    );
    console.table(params || {});
    console.trace("Triggered from:");
    console.groupEnd();
  }

  // Dispatch custom event for in-browser DevTrackingToolbar
  if (typeof window !== "undefined") {
    try {
      const customEvt = new CustomEvent("whop-debug-event", {
        detail: {
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name,
          params,
          time: new Date().toLocaleTimeString(),
        },
      });
      window.dispatchEvent(customEvt);
    } catch {
      // Ignore in non-browser or older environments
    }
  }
}

/**
 * Dispatches an event to the Whop tracking pixel.
 * Falls back gracefully if running outside Whop hosting (e.g. local dev).
 */
export function trackEvent(name: TrackingEventName | string, params?: TrackingParams): void {
  // Always log in development
  logDebugEvent(name, params);

  // Send to Whop tracking pixel if available (injected by Whop hosting runtime)
  if (typeof window !== "undefined" && window.whop && typeof window.whop.track === "function") {
    try {
      window.whop.track(name, params);
    } catch (err) {
      console.warn(`[Whop Track] Error emitting event "${name}":`, err);
    }
  } else {
    // In local development outside Whop hosting, the pixel isn't auto-injected.
    // We log that it would have fired so developers can verify instrumentation.
    if (import.meta.env.DEV) {
      // Pixel not present locally (normal in Vite dev server outside `whop apps dev`)
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Specific event helpers matching the project requirements
// ────────────────────────────────────────────────────────────────────────────

/**
 * Fired when a visitor submits the "Request an Estimate" form.
 * Calls both standard `lead` and specific `estimate_requested`.
 */
export function trackEstimateRequested(details: {
  serviceType: string;
  zipCode: string;
  eventId?: string;
}) {
  const eventId = details.eventId || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Whop standard lead event
  trackEvent("lead", {
    service_type: details.serviceType,
    zip_code: details.zipCode,
    event_id: eventId,
  });

  // Project-specified custom event
  trackEvent("estimate_requested", {
    service_type: details.serviceType,
    zip_code: details.zipCode,
    event_id: `${eventId}_est`,
  });
}

/**
 * Fired when a visitor views or expands details on a specific roofing service.
 */
export function trackServiceViewed(service: {
  id: string;
  title: string;
  variantId?: string;
}) {
  trackEvent("service_viewed", {
    service_id: service.id,
    service_title: service.title,
    variant_id: service.variantId,
  });

  // Also standard Whop view_content if plan is attached
  if (service.variantId) {
    trackEvent("view_content", {
      variant_id: service.variantId,
      service_id: service.id,
    });
  }
}

/**
 * Fired when a customer starts the $500 Project Deposit checkout flow.
 * (Where card-on-file setup intent is activated).
 */
export function trackDepositStarted(planId: string, amount: number = 500) {
  trackEvent("deposit_started", {
    variant_id: planId,
    value: amount,
    currency: "USD",
    setup_future_usage: "off_session",
    event_id: `dep_${Date.now()}`,
  });
}

/**
 * Fired when a customer starts inspection checkout ($149).
 */
export function trackInspectionStarted(planId: string, amount: number = 149) {
  trackEvent("inspection_started", {
    variant_id: planId,
    value: amount,
    currency: "USD",
    event_id: `insp_${Date.now()}`,
  });
}

/**
 * Fired when a customer starts tune-up checkout ($299).
 */
export function trackTuneUpStarted(planId: string, amount: number = 299) {
  trackEvent("tuneup_started", {
    variant_id: planId,
    value: amount,
    currency: "USD",
    event_id: `tune_${Date.now()}`,
  });
}

