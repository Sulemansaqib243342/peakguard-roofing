// ============================================================================
// PeakGuard Roofing — Server-Side Runtime Worker
// ============================================================================
//
// Runs in the Whop hosting runtime (Cloudflare Workers based).
// Handles:
//   1. GET  /api/public-config         - Public runtime accountId / environment / plan IDs (zero secrets)
//   2. POST /api/pay                   - Create Whop Payment from Payment Elements confirmation_token
//   3. GET  /api/payments              - Read payment & saved payment_method summary (no PII)
//   4. GET  /api/setup-intents         - Retrieve Whop Setup Intent (GET /api/v1/setup_intents/:id)
//   5. POST /api/estimate & /api/leads - Validation, honeypot, rate limit, POST /api/v1/leads (honest error on failure)
//   6. POST /api/admin/verify          - Constant-time ADMIN_SECRET verification
//   7. GET  /api/admin/customer-lookup - Lookup Whop member by email & saved payment methods (brand + last4)
//   8. POST /api/invoice/final-balance - Create + issue/charge (auto_charge) or send (send_manual) invoice
//   9. POST /api/webhooks/whop         - HMAC-SHA256 verification + 5-min replay check + cache sync
//  10. Fallback to ASSETS for client-side static bundle
//
// SECURITY:
// - WHOP_API_KEY and ADMIN_SECRET are NEVER exposed to browser code.
// - No raw card data is ever handled or stored; only non-sensitive metadata (`payt_` ID, brand, last4).
// - Same-origin CORS only; no unredacted PII in console logs.
// ============================================================================

import { siteConfig } from "../site.config";

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  WHOP_API_ORIGIN?: string;
  WHOP_ACCOUNT_ID?: string;
  WHOP_API_KEY?: string;
  WHOP_WEBHOOK_SECRET?: string;
  ADMIN_SECRET?: string;
  WHOP_ENVIRONMENT?: string;
  WHOP_PLAN_INSPECTION?: string;
  WHOP_PLAN_DEPOSIT?: string;
  WHOP_PLAN_TUNEUP?: string;
  CRM_WEBHOOK_URL?: string;
  [key: string]: unknown;
}

const WHOP_API_VERSION = "2026-11-10";

interface LeadRequestBody {
  name: string;
  email: string;
  phone: string;
  address?: string;
  zipCode?: string;
  zip?: string;
  serviceType: string;
  service?: string;
  message?: string;
  notes?: string;
  honeypot?: string;
  timestamp?: number;
}

interface PayRequestBody {
  confirmationToken: string;
  planKey: keyof typeof siteConfig.whop.plans;
  planId?: string;
  returnUrl?: string;
}

interface InvoiceRequestBody {
  recipientEmail: string;
  customerName?: string;
  originalEstimateTotal: number;
  depositPaid?: number;
  paymentMethodId?: string;
  memberId?: string;
  memo?: string;
  mode?: "auto_charge" | "send_manual";
  action?: "charge" | "send" | "auto_charge" | "send_manual";
  confirmAutoCharge?: boolean;
}

interface WebhookPaymentCacheEntry {
  paymentId?: string;
  setupIntentId?: string;
  paymentMethodId?: string;
  memberId?: string;
  status?: string;
  brand?: string;
  last4?: string;
  updatedAt: number;
}

// Ephemeral isolate caches (fast supplement to authoritative Whop server APIs — no KV/D1 required)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const processedWebhookIds = new Map<string, number>();
const webhookCacheByPaymentId = new Map<string, WebhookPaymentCacheEntry>();
const webhookCacheByEmail = new Map<string, WebhookPaymentCacheEntry>();

export interface RecordedLead {
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
  createdAt: number;
}

export interface RecordedTrackingEvent {
  id: string;
  name: string;
  page: string;
  value?: string | number;
  params?: Record<string, unknown>;
  timestamp: number;
}

const recordedLeads: RecordedLead[] = [];
const recordedEvents: RecordedTrackingEvent[] = [
  {
    id: `evt_init_${Date.now()}`,
    name: "pixel.page",
    page: "/",
    value: undefined,
    params: { note: "Whop runtime tracking initialized" },
    timestamp: Date.now(),
  },
];

function recordLead(lead: RecordedLead) {
  recordedLeads.unshift(lead);
  if (recordedLeads.length > 100) recordedLeads.pop();
}

function recordTrackingEvent(evt: RecordedTrackingEvent) {
  recordedEvents.unshift(evt);
  if (recordedEvents.length > 200) recordedEvents.pop();
}

function pruneBoundedMap<V>(map: Map<string, V>, maxEntries = 500) {
  if (map.size <= maxEntries) return;
  const oldestKey = map.keys().next().value;
  if (oldestKey !== undefined) map.delete(oldestKey);
}

function checkRateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    pruneBoundedMap(rateLimitMap, 1000);
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getCorsHeaders(request: Request): Record<string, string> {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const allowedOrigin = origin && origin === requestUrl.origin ? origin : requestUrl.origin;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
    Vary: "Origin",
  };
}

function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  const corsHeaders = request
    ? getCorsHeaders(request)
    : {
        "Access-Control-Allow-Origin": "null",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
      };

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders,
    },
  });
}

function corsPreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request),
      "Access-Control-Max-Age": "86400",
    },
  });
}

function resolveRuntimeConfig(env: Env) {
  const apiOrigin = (env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com").replace(/\/$/, "");
  const envFromOrigin: "sandbox" | "production" = apiOrigin.includes("sandbox")
    ? "sandbox"
    : "production";
  const environment: "sandbox" | "production" =
    env.WHOP_ENVIRONMENT === "sandbox" || env.WHOP_ENVIRONMENT === "production"
      ? env.WHOP_ENVIRONMENT
      : envFromOrigin;

  const envConfig = siteConfig.whop.environments[environment];
  const isSandbox = environment === "sandbox";
  const accountId =
    env.WHOP_ACCOUNT_ID ||
    String(
      (isSandbox ? env.VITE_WHOP_SANDBOX_ACCOUNT_ID : env.VITE_WHOP_PROD_ACCOUNT_ID) ||
        envConfig.accountId ||
        siteConfig.whop.accountId ||
        ""
    );

  const plans = {
    inspection: String(
      env.WHOP_PLAN_INSPECTION ||
        (isSandbox ? env.VITE_WHOP_SANDBOX_PLAN_INSPECTION : env.VITE_WHOP_PROD_PLAN_INSPECTION) ||
        envConfig.plans.inspection ||
        siteConfig.whop.plans.inspection.id
    ),
    deposit: String(
      env.WHOP_PLAN_DEPOSIT ||
        (isSandbox ? env.VITE_WHOP_SANDBOX_PLAN_DEPOSIT : env.VITE_WHOP_PROD_PLAN_DEPOSIT) ||
        envConfig.plans.deposit ||
        siteConfig.whop.plans.deposit.id
    ),
    tuneUp: String(
      env.WHOP_PLAN_TUNEUP ||
        (isSandbox ? env.VITE_WHOP_SANDBOX_PLAN_TUNEUP : env.VITE_WHOP_PROD_PLAN_TUNEUP) ||
        envConfig.plans.tuneUp ||
        siteConfig.whop.plans.tuneUp.id
    ),
  };

  return {
    apiOrigin,
    environment,
    accountId,
    apiKey: env.WHOP_API_KEY || "",
    hasAuth: Boolean(env.WHOP_API_KEY || env.APP_ID),
    plans,
  };
}

async function whopFetch(
  apiOrigin: string,
  apiKey: string,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    idempotencyKey?: string;
  } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Api-Version-Date": WHOP_API_VERSION,
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${apiOrigin}/api/v1${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

function requireAdminAuth(request: Request, env: Env): Response | null {
  const adminSecretHeader = request.headers.get("x-admin-secret");
  const configuredAdminSecret = env.ADMIN_SECRET;

  if (!configuredAdminSecret) {
    return jsonResponse(
      { error: "Server configuration error: ADMIN_SECRET is not configured" },
      500,
      request
    );
  }

  if (!adminSecretHeader || !timingSafeEqual(adminSecretHeader, configuredAdminSecret)) {
    return jsonResponse(
      { error: "Unauthorized: Invalid or missing x-admin-secret header" },
      401,
      request
    );
  }

  return null;
}

function extractSafeCardSummary(method: any): {
  id: string;
  type: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
} {
  return {
    id: String(method?.id || ""),
    type: String(method?.payment_method_type || "unknown"),
    brand: method?.card?.brand ?? null,
    last4: method?.card?.last4 ?? null,
    expMonth: method?.card?.exp_month ?? null,
    expYear: method?.card?.exp_year ?? null,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Public Runtime Config & Payment Elements Handlers
// ────────────────────────────────────────────────────────────────────────────

function handlePublicConfig(request: Request, env: Env): Response {
  const cfg = resolveRuntimeConfig(env);
  return jsonResponse(
    {
      environment: cfg.environment,
      accountId: cfg.accountId,
      plans: cfg.plans,
    },
    200,
    request
  );
}

async function handleCreatePayment(request: Request, env: Env): Promise<Response> {
  const clientIp = request.headers.get("cf-connecting-ip") || "127.0.0.1";
  if (!checkRateLimit(`pay:${clientIp}`, 15, 60000)) {
    return jsonResponse({ error: "Too many payment attempts. Please wait a minute." }, 429, request);
  }

  let body: PayRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400, request);
  }

  if (!body.confirmationToken || typeof body.confirmationToken !== "string") {
    return jsonResponse({ error: "confirmationToken is required" }, 400, request);
  }

  const validKeys: Array<keyof typeof siteConfig.whop.plans> = ["inspection", "deposit", "tuneUp"];
  if (!validKeys.includes(body.planKey)) {
    return jsonResponse({ error: "Invalid planKey" }, 400, request);
  }

  const cfg = resolveRuntimeConfig(env);
  if (!cfg.accountId || !cfg.hasAuth) {
    return jsonResponse(
      { error: "Server payment configuration missing (WHOP_ACCOUNT_ID / WHOP_API_KEY)" },
      503,
      request
    );
  }

  const variantId = cfg.plans[body.planKey] || body.planId;
  if (!variantId || !variantId.startsWith("plan_")) {
    return jsonResponse({ error: "Valid Whop plan_ ID is not configured for this service" }, 400, request);
  }

  const requestUrl = new URL(request.url);
  const returnUrl =
    body.returnUrl && body.returnUrl.startsWith(requestUrl.origin)
      ? body.returnUrl
      : `${requestUrl.origin}/checkout/return?key=${body.planKey}&plan=${encodeURIComponent(variantId)}`;

  try {
    const res = await whopFetch(cfg.apiOrigin, cfg.apiKey, "/payments", {
      method: "POST",
      idempotencyKey: crypto.randomUUID(),
      body: {
        account_id: cfg.accountId,
        variant_id: variantId,
        confirmation_token: body.confirmationToken,
        return_url: returnUrl,
        metadata: {
          plan_key: body.planKey,
          is_deposit: String(body.planKey === "deposit"),
          setup_future_usage: body.planKey === "deposit" ? "off_session" : "none",
        },
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return jsonResponse(
        { error: `Whop Payments API error (${res.status}): ${errText}` },
        res.status >= 500 ? 502 : res.status,
        request
      );
    }

    const payment = (await res.json()) as any;
    console.log(`[Whop Payment Created] id=${payment.id} planKey=${body.planKey} status=${payment.status}`);

    return jsonResponse(
      {
        id: payment.id,
        status: payment.status,
        client_secret: payment.client_secret,
      },
      200,
      request
    );
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Payment creation failed" }, 502, request);
  }
}

async function handleGetPayment(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const clientSecret = url.searchParams.get("client_secret");

  if (!id || !id.startsWith("pay_")) {
    return jsonResponse({ error: "Valid pay_ ID is required" }, 400, request);
  }

  const cfg = resolveRuntimeConfig(env);
  if (!cfg.hasAuth) {
    return jsonResponse({ error: "WHOP_API_KEY not configured" }, 503, request);
  }

  try {
    const res = await whopFetch(cfg.apiOrigin, cfg.apiKey, `/payments/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const errText = await res.text();
      return jsonResponse(
        { error: `Payment lookup failed (${res.status}): ${errText}` },
        res.status >= 500 ? 502 : res.status,
        request
      );
    }

    const payment = (await res.json()) as any;
    // If caller supplied client_secret from returnUrl, verify it matches when present on payment
    if (clientSecret && payment.client_secret && !timingSafeEqual(clientSecret, payment.client_secret)) {
      return jsonResponse({ error: "Payment client_secret mismatch" }, 403, request);
    }

    const cached = webhookCacheByPaymentId.get(id);
    const paymentMethodId: string | null = payment.payment_method_id || cached?.paymentMethodId || null;
    const memberId: string | null = payment.member_id || cached?.memberId || null;

    let brand: string | null = cached?.brand || null;
    let last4: string | null = cached?.last4 || null;

    if ((!brand || !last4) && memberId && paymentMethodId) {
      try {
        const pmRes = await whopFetch(
          cfg.apiOrigin,
          cfg.apiKey,
          `/payment_methods?member_id=${encodeURIComponent(memberId)}`
        );
        if (pmRes.ok) {
          const pmList = (await pmRes.json()) as { data?: any[] };
          const matched = (pmList.data || []).find((m) => m.id === paymentMethodId);
          if (matched?.card) {
            brand = matched.card.brand || null;
            last4 = matched.card.last4 || null;
          }
        }
      } catch {
        // Non-fatal: payment_method_id still confirms card storage
      }
    }

    // Never expose buyer PII (email/phone/address) on public return endpoint
    return jsonResponse(
      {
        id: payment.id,
        status: payment.status,
        payment_method_id: paymentMethodId,
        card: brand || last4 ? { brand, last4 } : null,
      },
      200,
      request
    );
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Payment lookup error" }, 502, request);
  }
}

async function handleGetSetupIntent(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "Setup intent ID required" }, 400, request);

  const cfg = resolveRuntimeConfig(env);
  if (!cfg.hasAuth) {
    return jsonResponse({ error: "WHOP_API_KEY not configured" }, 503, request);
  }

  try {
    // Fixed endpoint path: /api/v1/setup_intents/:id (underscore, per OpenAPI spec)
    const res = await whopFetch(cfg.apiOrigin, cfg.apiKey, `/setup_intents/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const errText = await res.text();
      return jsonResponse({ error: `Setup intent lookup failed: ${errText}` }, res.status, request);
    }
    const data = (await res.json()) as any;
    return jsonResponse(
      {
        id: data.id,
        status: data.status,
        payment_method_id: data.payment_method_id,
        payment_instrument: data.payment_instrument || null,
      },
      200,
      request
    );
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 502, request);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Leads / Estimate Form Handler
// ────────────────────────────────────────────────────────────────────────────

/** Lookup an existing Whop member record for this account by email (returns null on miss/error). */
async function findWhopMemberByEmail(
  apiOrigin: string,
  apiKey: string,
  accountId: string,
  email: string
): Promise<{ ok: boolean; status: number; errText?: string; member: any | null }> {
  const membersRes = await whopFetch(
    apiOrigin,
    apiKey,
    `/members?account_id=${encodeURIComponent(accountId)}&query=${encodeURIComponent(email)}`
  );

  if (!membersRes.ok) {
    return { ok: false, status: membersRes.status, errText: await membersRes.text(), member: null };
  }

  const membersData = (await membersRes.json()) as { data?: any[] };
  const membersList = membersData.data || [];
  const matchedMember =
    membersList.find(
      (m) =>
        String(m?.email || "").toLowerCase() === email ||
        String(m?.user?.email || "").toLowerCase() === email
    ) ||
    membersList[0] ||
    null;

  return { ok: true, status: 200, member: matchedMember };
}

async function handleLeadSubmission(request: Request, env: Env): Promise<Response> {
  const clientIp = request.headers.get("cf-connecting-ip") || "127.0.0.1";

  if (!checkRateLimit(`lead:${clientIp}`, 5, 60000)) {
    return jsonResponse(
      { error: "Too many requests. Please wait a minute before submitting again." },
      429,
      request
    );
  }

  let body: LeadRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400, request);
  }

  // Honeypot trap
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return jsonResponse({ success: true, message: "Thank you for your request." }, 200, request);
  }

  // Time-to-fill trap (< 1.5s)
  if (body.timestamp && Date.now() - body.timestamp < 1500) {
    return jsonResponse({ error: "Submission too fast. Please retry." }, 400, request);
  }

  // Schema Validation
  const errors: Record<string, string> = {};
  const name = (body.name || "").trim();
  if (!name || name.length < 2) errors.name = "Full name is required (minimum 2 characters)";

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Valid email address is required";
  }

  const phone = (body.phone || "").replace(/\D/g, "");
  if (phone.length < 10) errors.phone = "Valid 10-digit phone number is required";

  const address = (body.address || "").trim();
  if (!address || address.length < 5) errors.address = "Property street address is required";

  const zip = (body.zipCode || body.zip || "").trim();
  if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
    errors.zipCode = "Valid 5-digit US ZIP code is required";
  }

  const serviceType = body.serviceType || body.service || "roof-repair";
  if (!siteConfig.allowedServices.includes(serviceType)) {
    errors.serviceType = "Please select a valid service type";
  }

  const message = (body.message || body.notes || "").trim();
  if (Object.keys(errors).length > 0) {
    return jsonResponse({ error: "Validation failed", details: errors }, 422, request);
  }

  const cfg = resolveRuntimeConfig(env);
  if (!cfg.accountId || !cfg.hasAuth) {
    return jsonResponse(
      { error: "Lead service unavailable: WHOP_ACCOUNT_ID or WHOP_API_KEY is not configured." },
      503,
      request
    );
  }

  const leadRefId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const [firstName, ...restName] = name.split(/\s+/);
  const lastName = restName.join(" ") || undefined;
  const referer = request.headers.get("referer") || undefined;
  const formattedPhone = phone.length === 10 ? `+1${phone}` : `+${phone}`;

  try {
    // 1. Check if visitor email matches an existing Whop member carrying a user_id.
    let matchedMemberId: string | undefined;
    let matchedUserId: string | undefined;
    let whopLeadId: string | undefined;

    const lookup = await findWhopMemberByEmail(cfg.apiOrigin, cfg.apiKey, cfg.accountId, email).catch(
      () => ({ ok: false, status: 0, member: null })
    );
    if (lookup.ok && lookup.member) {
      matchedMemberId = lookup.member.id;
      matchedUserId = lookup.member.user?.id;
    }

    // 2. Only call POST /api/v1/leads when an authenticated Whop user_id exists (since Whop requires user_id).
    if (matchedUserId) {
      const leadRes = await whopFetch(cfg.apiOrigin, cfg.apiKey, "/leads", {
        method: "POST",
        body: {
          account_id: cfg.accountId,
          user_id: matchedUserId,
          referrer: referer,
          metadata: {
            lead_ref: leadRefId,
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            property_address: address,
            zip_code: zip,
            service_type: serviceType,
            notes: message,
            submitted_at: new Date().toISOString(),
          },
        },
      });
      if (leadRes.ok) {
        const leadData = (await leadRes.json().catch(() => null)) as { id?: string } | null;
        whopLeadId = leadData?.id;
      } else {
        console.warn(`[Whop Leads API Warning] status=${leadRes.status} ref=${leadRefId}`);
      }
    }

    // 3. Record quote submission in Whop Events API (POST /api/v1/events) for anonymous + returning visitors.
    const eventPayload = {
      account_id: cfg.accountId,
      event_name: "lead",
      event_id: leadRefId,
      url: referer || request.url,
      referrer_url: referer,
      user: {
        email,
        name,
        first_name: firstName,
        ...(lastName ? { last_name: lastName } : {}),
        phone: formattedPhone,
        postal_code: zip.slice(0, 5),
        country: "US",
        ...(matchedUserId ? { user_id: matchedUserId } : {}),
        ...(matchedMemberId ? { member_id: matchedMemberId } : {}),
      },
    };

    let eventRes = await whopFetch(cfg.apiOrigin, cfg.apiKey, "/events", {
      method: "POST",
      body: eventPayload,
    });

    // Per OpenAPI spec (`security: [ { bearerAuth: [event:create] }, {} ]`), fallback unauthenticated if key lacks event:create.
    if (eventRes.status === 401 || eventRes.status === 403) {
      eventRes = await fetch(`${cfg.apiOrigin}/api/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Version-Date": WHOP_API_VERSION,
          Accept: "application/json",
        },
        body: JSON.stringify(eventPayload),
      });
    }

    const eventText = await eventRes.text();
    let parsedEvent: any = null;
    try {
      parsedEvent = JSON.parse(eventText);
    } catch {
      parsedEvent = { raw: eventText };
    }

    // Optional external CRM webhook forward if configured
    let crmForwarded = false;
    if (env.CRM_WEBHOOK_URL && typeof env.CRM_WEBHOOK_URL === "string") {
      try {
        const crmRes = await fetch(env.CRM_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: leadRefId,
            whopLeadId,
            whopEventId: parsedEvent?.id,
            serviceType,
            customer: { name, email, phone: formattedPhone, address, zipCode: zip },
            notes: message,
            submittedAt: new Date().toISOString(),
          }),
        });
        crmForwarded = crmRes.ok;
      } catch {
        console.warn(`[CRM Webhook Forward Failed] ref=${leadRefId}`);
      }
    }

    if (!eventRes.ok && !whopLeadId && !crmForwarded) {
      console.warn(`[Whop Events API Rejected] status=${eventRes.status} ref=${leadRefId}`);
      return jsonResponse(
        {
          error:
            parsedEvent?.error?.message ||
            `Lead event recording failed (HTTP ${eventRes.status}). Please call our dispatch desk directly.`,
          whopStatus: eventRes.status,
          whopError: parsedEvent,
        },
        eventRes.status >= 500 ? 502 : eventRes.status,
        request
      );
    }

    console.log(
      `[Lead Recorded] eventId=${parsedEvent?.id || "none"} leadId=${whopLeadId || "anonymous"} ref=${leadRefId} service=${serviceType}`
    );

    recordLead({
      id: leadRefId,
      name,
      email,
      phone: formattedPhone,
      address,
      zipCode: zip,
      serviceType,
      notes: message,
      whopLeadId,
      whopEventId: parsedEvent?.id,
      createdAt: Date.now(),
    });

    recordTrackingEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "estimate_requested",
      page: "/",
      value: serviceType,
      params: { email, serviceType, zipCode: zip, whopLeadId, whopEventId: parsedEvent?.id },
      timestamp: Date.now(),
    });

    return jsonResponse(
      {
        success: true,
        leadId: leadRefId,
        whopLeadId: whopLeadId || undefined,
        whopEventId: parsedEvent?.id || undefined,
        crmForwarded,
        message: whopLeadId
          ? "Estimate request recorded in Whop Leads & Events. A roofing specialist will reach out within 24 hours."
          : "Estimate request received and logged via Whop Events. A roofing specialist will reach out within 24 hours.",
      },
      200,
      request
    );
  } catch (err: any) {
    console.error(`[Whop Lead/Event Network Error] ref=${leadRefId}`);
    return jsonResponse(
      { error: err.message || "Failed to record estimate request" },
      502,
      request
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Admin Customer Lookup & Final Balance Invoicing
// ────────────────────────────────────────────────────────────────────────────

async function handleAdminVerify(request: Request, env: Env): Promise<Response> {
  const authError = requireAdminAuth(request, env);
  if (authError) return authError;
  return jsonResponse({ authenticated: true }, 200, request);
}

async function handleAdminCustomerLookup(request: Request, env: Env): Promise<Response> {
  const authError = requireAdminAuth(request, env);
  if (authError) return authError;

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return jsonResponse({ error: "Valid email query parameter is required" }, 400, request);
  }

  const cfg = resolveRuntimeConfig(env);
  if (!cfg.accountId || !cfg.hasAuth) {
    return jsonResponse({ error: "Whop account credentials not configured" }, 503, request);
  }

  try {
    const lookup = await findWhopMemberByEmail(cfg.apiOrigin, cfg.apiKey, cfg.accountId, email);
    if (!lookup.ok) {
      return jsonResponse(
        { error: `Whop Members lookup failed (${lookup.status}): ${lookup.errText}` },
        lookup.status >= 500 ? 502 : lookup.status,
        request
      );
    }

    const matchedMember = lookup.member;

    if (!matchedMember) {
      const cached = webhookCacheByEmail.get(email);
      return jsonResponse(
        {
          found: Boolean(cached?.paymentMethodId),
          member: cached?.memberId
            ? { id: cached.memberId, displayName: email, email }
            : null,
          paymentMethods: cached?.paymentMethodId
            ? [
                {
                  id: cached.paymentMethodId,
                  type: "card",
                  brand: cached.brand || null,
                  last4: cached.last4 || null,
                  expMonth: null,
                  expYear: null,
                },
              ]
            : [],
        },
        200,
        request
      );
    }

    const pmRes = await whopFetch(
      cfg.apiOrigin,
      cfg.apiKey,
      `/payment_methods?member_id=${encodeURIComponent(matchedMember.id)}`
    );

    const paymentMethods: ReturnType<typeof extractSafeCardSummary>[] = [];
    if (pmRes.ok) {
      const pmData = (await pmRes.json()) as { data?: any[] };
      for (const method of pmData.data || []) {
        paymentMethods.push(extractSafeCardSummary(method));
      }
    }

    return jsonResponse(
      {
        found: true,
        member: {
          id: matchedMember.id,
          displayName: matchedMember.name || matchedMember.display_name || matchedMember.user?.name || email,
          email: matchedMember.email || matchedMember.user?.email || email,
        },
        paymentMethods,
      },
      200,
      request
    );
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Customer lookup error" }, 502, request);
  }
}

async function handleAdminLeads(request: Request, env: Env): Promise<Response> {
  const authError = requireAdminAuth(request, env);
  if (authError) return authError;

  const cfg = resolveRuntimeConfig(env);
  let whopLeads: any[] = [];

  if (cfg.accountId && cfg.hasAuth) {
    try {
      const res = await whopFetch(
        cfg.apiOrigin,
        cfg.apiKey,
        `/leads?account_id=${encodeURIComponent(cfg.accountId)}`
      );
      if (res.ok) {
        const data = (await res.json()) as { data?: any[] };
        whopLeads = data.data || [];
      }
    } catch (e) {
      console.warn("[Admin Leads] Failed fetching from Whop Leads API:", e);
    }
  }

  return jsonResponse(
    {
      success: true,
      localLeads: recordedLeads,
      whopLeads,
      totalCount: recordedLeads.length + whopLeads.length,
    },
    200,
    request
  );
}

async function handleAdminEvents(request: Request, env: Env): Promise<Response> {
  const authError = requireAdminAuth(request, env);
  if (authError) return authError;

  return jsonResponse(
    {
      success: true,
      events: recordedEvents,
      totalCount: recordedEvents.length,
    },
    200,
    request
  );
}

async function handleClientTrackEvent(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      name?: string;
      page?: string;
      value?: string | number;
      params?: Record<string, unknown>;
      timestamp?: number;
    };
    if (body.name) {
      recordTrackingEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: body.name,
        page: body.page || "/",
        value: body.value,
        params: body.params,
        timestamp: body.timestamp || Date.now(),
      });
    }
    return jsonResponse({ ok: true }, 200, request);
  } catch {
    return jsonResponse({ ok: false }, 400, request);
  }
}

async function handleFinalBalanceInvoice(request: Request, env: Env): Promise<Response> {
  const authError = requireAdminAuth(request, env);
  if (authError) return authError;

  let body: InvoiceRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400, request);
  }

  if (!body.recipientEmail || !body.recipientEmail.includes("@")) {
    return jsonResponse({ error: "Valid recipientEmail is required" }, 400, request);
  }

  if (typeof body.originalEstimateTotal !== "number" || body.originalEstimateTotal <= 0) {
    return jsonResponse({ error: "originalEstimateTotal must be a positive number" }, 400, request);
  }

  const deposit = typeof body.depositPaid === "number" ? body.depositPaid : siteConfig.defaultDepositAmount;
  const balanceDue = Number((body.originalEstimateTotal - deposit).toFixed(2));

  if (balanceDue <= 0) {
    return jsonResponse(
      {
        error: `Invalid calculation: Total ($${body.originalEstimateTotal}) minus deposit ($${deposit}) leaves no balance due ($${balanceDue})`,
      },
      400,
      request
    );
  }

  const mode =
    body.mode ||
    (body.action === "charge"
      ? "auto_charge"
      : body.action === "send"
        ? "send_manual"
        : body.action) ||
    "send_manual";

  if (mode === "auto_charge") {
    if (!body.paymentMethodId) {
      return jsonResponse(
        {
          error:
            "paymentMethodId is required when mode is 'auto_charge'. To send an email invoice without a saved card, use mode 'send_manual'.",
        },
        400,
        request
      );
    }
    if (!body.confirmAutoCharge) {
      return jsonResponse(
        {
          error:
            "Explicit admin confirmation (confirmAutoCharge: true) is required before charging a customer's stored payment method.",
        },
        400,
        request
      );
    }
  }

  const cfg = resolveRuntimeConfig(env);
  if (!cfg.accountId || !cfg.hasAuth) {
    return jsonResponse(
      { error: "Whop API credentials not configured (WHOP_ACCOUNT_ID / WHOP_API_KEY required)" },
      503,
      request
    );
  }

  try {
    // 1. Create draft invoice via POST /api/v1/invoices
    // Note: Send member_id OR email_address + customer_name, never both (per docs).
    // For auto_charge, issue first then call /charge so due_at doesn't defer collection.
    const invoicePayload: Record<string, unknown> = {
      account_id: cfg.accountId,
      items: [
        {
          quantity: 1,
          description: `${siteConfig.company.name} — Final Balance (Estimate $${body.originalEstimateTotal.toFixed(2)} less $${deposit.toFixed(2)} deposit credit)`,
          variant: {
            title: "Roofing Project Final Balance",
            currency: "usd",
            initial_price: balanceDue,
            billing_type: "one_time",
          },
        },
      ],
      memo:
        body.memo ||
        `Final balance after $${deposit.toFixed(2)} deposit credit. Estimate total: $${body.originalEstimateTotal.toFixed(2)}.`,
      metadata: {
        customer_name: body.customerName || "",
        original_total: String(body.originalEstimateTotal),
        deposit_credit: String(deposit),
        balance_due: String(balanceDue),
        settlement_mode: mode,
        generated_by: "PeakGuard Invoicing System",
      },
    };

    if (body.memberId) {
      invoicePayload.member_id = body.memberId;
      invoicePayload.recipient_emails = [body.recipientEmail.trim().toLowerCase()];
    } else {
      invoicePayload.email_address = body.recipientEmail.trim().toLowerCase();
      invoicePayload.customer_name = body.customerName || body.recipientEmail;
    }

    if (mode === "send_manual") {
      invoicePayload.due_at = new Date(Date.now() + 14 * 86400000).toISOString();
    } else if (body.paymentMethodId) {
      invoicePayload.payment_method_id = body.paymentMethodId;
    }

    const createRes = await whopFetch(cfg.apiOrigin, cfg.apiKey, "/invoices", {
      method: "POST",
      idempotencyKey: crypto.randomUUID(),
      body: invoicePayload,
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return jsonResponse(
        { error: `Whop Invoices API rejected draft (${createRes.status}): ${errText}` },
        createRes.status >= 500 ? 502 : createRes.status,
        request
      );
    }

    const draftInvoice = (await createRes.json()) as any;
    let actionResult: any = null;

    if (mode === "auto_charge" && draftInvoice.id) {
      // Step 2a: Issue draft first (POST /invoices/:id/charge refuses drafts)
      const issueRes = await whopFetch(cfg.apiOrigin, cfg.apiKey, `/invoices/${draftInvoice.id}/issue`, {
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: {},
      });

      if (!issueRes.ok) {
        const errText = await issueRes.text();
        return jsonResponse(
          { error: `Whop Invoice issue failed (${issueRes.status}): ${errText}`, invoice: draftInvoice },
          issueRes.status >= 500 ? 502 : issueRes.status,
          request
        );
      }

      const issuedInvoice = (await issueRes.json()) as any;
      actionResult = issuedInvoice;

      // Step 2b: If issuing did not immediately move to paid, explicitly trigger /charge
      if (issuedInvoice.status !== "paid") {
        const chargeRes = await whopFetch(cfg.apiOrigin, cfg.apiKey, `/invoices/${draftInvoice.id}/charge`, {
          method: "POST",
          idempotencyKey: crypto.randomUUID(),
          body: { payment_method_id: body.paymentMethodId },
        });
        if (!chargeRes.ok) {
          const errText = await chargeRes.text();
          return jsonResponse(
            { error: `Whop Invoice charge failed (${chargeRes.status}): ${errText}`, invoice: issuedInvoice },
            chargeRes.status >= 500 ? 502 : chargeRes.status,
            request
          );
        }
        actionResult = await chargeRes.json();
      }
    } else if (mode === "send_manual" && draftInvoice.id) {
      // For one-time invoices, send with {} (no collection_method, which is recurring-only)
      const sendRes = await whopFetch(cfg.apiOrigin, cfg.apiKey, `/invoices/${draftInvoice.id}/send`, {
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: {},
      });
      if (!sendRes.ok) {
        const errText = await sendRes.text();
        return jsonResponse(
          { error: `Whop Invoice send failed (${sendRes.status}): ${errText}`, invoice: draftInvoice },
          sendRes.status >= 500 ? 502 : sendRes.status,
          request
        );
      }
      actionResult = await sendRes.json();
    }

    const finalInvoice = actionResult || draftInvoice;
    console.log(`[PeakGuard Invoice] mode=${mode} id=${finalInvoice.id} status=${finalInvoice.status} balance=$${balanceDue}`);

    return jsonResponse(
      {
        success: true,
        mode,
        action: mode === "auto_charge" ? "charge" : "send",
        invoice: finalInvoice,
        actionResult,
        summary: {
          originalEstimate: body.originalEstimateTotal,
          depositCredited: deposit,
          balanceBilled: balanceDue,
          recipient: body.recipientEmail,
        },
      },
      200,
      request
    );
  } catch (err: any) {
    console.error("[PeakGuard Invoice Error]");
    return jsonResponse({ error: err.message || "Failed to create final balance invoice" }, 500, request);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Whop Webhook Handler (HMAC-SHA256 + 5-min Replay Tolerance + Deduplication)
// ────────────────────────────────────────────────────────────────────────────

async function handleWhopWebhook(request: Request, env: Env): Promise<Response> {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookSecret = env.WHOP_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return jsonResponse({ error: "Webhook secret not configured on server" }, 401, request);
  }

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return jsonResponse({ error: "Missing required Whop webhook headers" }, 400, request);
  }

  // 5-minute replay window check
  const nowSec = Math.floor(Date.now() / 1000);
  const tsSec = parseInt(webhookTimestamp, 10);
  if (isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
    return jsonResponse({ error: "Webhook timestamp expired or out of tolerance" }, 401, request);
  }

  const rawBody = await request.text();

  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signedContent));
    const expectedSignature = `v1,${btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))}`;

    const candidates = webhookSignature.trim().split(/\s+/);
    const signatureValid = candidates.some((sig) => timingSafeEqual(sig, expectedSignature));
    if (!signatureValid) {
      console.warn("[Webhook] Signature verification mismatch");
      return jsonResponse({ error: "Invalid webhook signature" }, 401, request);
    }
  } catch {
    return jsonResponse({ error: "Signature verification failed" }, 401, request);
  }

  // Idempotency / replay guard inside isolate
  if (processedWebhookIds.has(webhookId)) {
    return jsonResponse({ received: true, duplicate: true }, 200, request);
  }
  processedWebhookIds.set(webhookId, Date.now());
  pruneBoundedMap(processedWebhookIds, 500);

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON in webhook payload" }, 400, request);
  }

  const data = event?.data || {};
  console.log(`[Whop Webhook Verified] type=${event.type} webhookId=${webhookId}`);

  if (event.type === "setup_intent.succeeded" || event.type === "payment.succeeded") {
    const entry: WebhookPaymentCacheEntry = {
      paymentId: event.type === "payment.succeeded" ? data.id : undefined,
      setupIntentId: event.type === "setup_intent.succeeded" ? data.id : undefined,
      paymentMethodId: data.payment_method_id,
      memberId: data.member_id,
      status: data.status || "succeeded",
      brand: data.payment_instrument?.card?.brand,
      last4: data.payment_instrument?.card?.last4,
      updatedAt: Date.now(),
    };

    if (entry.paymentId) {
      webhookCacheByPaymentId.set(entry.paymentId, entry);
      pruneBoundedMap(webhookCacheByPaymentId, 500);
    }

    const emailKey = typeof data.customer_email === "string" ? data.customer_email.trim().toLowerCase() : "";
    if (emailKey && entry.paymentMethodId) {
      webhookCacheByEmail.set(emailKey, entry);
      pruneBoundedMap(webhookCacheByEmail, 500);
    }

    recordTrackingEvent({
      id: `evt_wh_${webhookId || Date.now()}`,
      name: event.type,
      page: "/api/webhooks/whop",
      value: data.amount ? `$${(data.amount / 100).toFixed(2)} USD` : undefined,
      params: { paymentId: data.id, customer: data.customer_email, status: data.status },
      timestamp: Date.now(),
    });
  }

  return jsonResponse({ received: true }, 200, request);
}

// ────────────────────────────────────────────────────────────────────────────
// Main Worker Fetch Dispatcher
// ────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return corsPreflight(request);
    }

    if (url.pathname === "/api/public-config" && request.method === "GET") {
      return handlePublicConfig(request, env);
    }

    if (url.pathname === "/api/pay" && request.method === "POST") {
      return handleCreatePayment(request, env);
    }

    if (url.pathname === "/api/payments" && request.method === "GET") {
      return handleGetPayment(request, env);
    }

    if (url.pathname === "/api/setup-intents" && request.method === "GET") {
      return handleGetSetupIntent(request, env);
    }

    if ((url.pathname === "/api/estimate" || url.pathname === "/api/leads") && request.method === "POST") {
      return handleLeadSubmission(request, env);
    }

    if (url.pathname === "/api/admin/verify" && request.method === "POST") {
      return handleAdminVerify(request, env);
    }

    if (url.pathname === "/api/admin/customer-lookup" && request.method === "GET") {
      return handleAdminCustomerLookup(request, env);
    }

    if (
      (url.pathname === "/api/invoice/final-balance" || url.pathname === "/api/invoices/final-balance") &&
      request.method === "POST"
    ) {
      return handleFinalBalanceInvoice(request, env);
    }

    if (url.pathname === "/api/webhooks/whop" && request.method === "POST") {
      return handleWhopWebhook(request, env);
    }

    if (url.pathname === "/api/track" && request.method === "POST") {
      return handleClientTrackEvent(request);
    }

    if (url.pathname === "/api/admin/leads" && request.method === "GET") {
      return handleAdminLeads(request, env);
    }

    if (url.pathname === "/api/admin/events" && request.method === "GET") {
      return handleAdminEvents(request, env);
    }

    if (url.pathname === "/api/health") {
      return jsonResponse(
        {
          status: "healthy",
          app: "peakguard-roofing",
          runtime: "whop-hosting",
          timestamp: new Date().toISOString(),
        },
        200,
        request
      );
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetResponse = await env.ASSETS.fetch(request);
      if (
        assetResponse.status === 404 &&
        (request.method === "GET" || request.method === "HEAD") &&
        !url.pathname.startsWith("/api/")
      ) {
        const indexRequest = new Request(new URL("/index.html", url.origin).toString(), request);
        return env.ASSETS.fetch(indexRequest);
      }
      return assetResponse;
    }

    return new Response("Not found", { status: 404 });
  },
};
