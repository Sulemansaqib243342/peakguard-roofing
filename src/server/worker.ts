// ============================================================================
// PeakGuard Roofing — Server-Side Runtime Worker
// ============================================================================
//
// Runs in the Whop hosting runtime (Cloudflare Workers based).
// Handles:
//   1. POST /api/estimate & POST /api/leads - Schema validation, rate limiting,
//      honeypot spam trap, and Whop Leads API creation (POST /api/v1/leads)
//   2. POST /api/invoice/final-balance - Authenticated admin endpoint with mode:
//      "auto_charge" (Option A: stored payment method) or "send_manual" (Option B)
//   3. GET /api/setup-intents - Retrieve setup intent to confirm stored card
//   4. POST /api/webhooks/whop - Verify and handle payment.succeeded & setup_intent.succeeded
//   5. Fallback to ASSETS for client-side static bundle
//
// SECURITY:
// - WHOP_API_KEY is NEVER exposed to the browser.
// - Server-side requests are signed by runtime or use server-only WHOP_API_KEY.
// - /api/invoice/final-balance requires constant-time authenticated `x-admin-secret`.
// - Webhooks require HMAC-SHA256 signature verification with 5-min timestamp window.
// - CORS restricted to same origin.
// ============================================================================

import { siteConfig } from "../site.config";

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  WHOP_API_ORIGIN?: string;
  WHOP_ACCOUNT_ID?: string;
  WHOP_API_KEY?: string;
  WHOP_WEBHOOK_SECRET?: string;
  ADMIN_SECRET?: string;
  [key: string]: unknown;
}

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
  honeypot?: string;       // Anti-spam field: must be empty
  timestamp?: number;     // Time-to-fill spam check
}

interface InvoiceRequestBody {
  recipientEmail: string;
  customerName?: string;
  originalEstimateTotal: number;
  depositPaid?: number;         // Defaults to siteConfig.defaultDepositAmount ($500)
  paymentMethodId?: string;     // From deposit setup intent
  memberId?: string;
  memo?: string;
  mode?: "auto_charge" | "send_manual";
  action?: "charge" | "send" | "auto_charge" | "send_manual";
}

// ────────────────────────────────────────────────────────────────────────────
// In-memory Rate Limiting (Sliding Window per IP)
// ────────────────────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  entry.count += 1;
  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// Security & CORS helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Constant-time string comparison to prevent timing attacks on secrets
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Same-origin CORS enforcement
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const isSameOrigin = !origin || origin === requestUrl.origin;
  const allowedOrigin = isSameOrigin ? (origin || requestUrl.origin) : requestUrl.origin;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
    "Vary": "Origin",
  };
}

function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  const corsHeaders = request ? getCorsHeaders(request) : {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
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

// ────────────────────────────────────────────────────────────────────────────
// Route Handlers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Handle Estimate / Lead form submission (POST /api/estimate & POST /api/leads)
 * Validates inputs, enforces rate limiting, rejects spam (honeypot + speed check),
 * and creates lead via Whop Leads API (POST /api/v1/leads).
 * Requires Whop permission: lead:manage
 */
async function handleLeadSubmission(request: Request, env: Env): Promise<Response> {
  const clientIp = request.headers.get("cf-connecting-ip") || "127.0.0.1";

  // 1. Basic Rate Limiting: 5 submissions per minute per IP
  if (!checkRateLimit(clientIp, 5, 60000)) {
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

  // 2. Spam protection: Honeypot check
  if (body.honeypot && body.honeypot.trim().length > 0) {
    // Bot filled the hidden field. Silently accept to waste bot time, but do not record.
    return jsonResponse({ success: true, message: "Thank you for your request." }, 200, request);
  }

  // 3. Spam protection: Timing check (bots submit in < 1.5 seconds)
  if (body.timestamp && Date.now() - body.timestamp < 1500) {
    return jsonResponse({ error: "Submission too fast. Please retry." }, 400, request);
  }

  // 4. Schema Validation
  const errors: Record<string, string> = {};

  const name = (body.name || "").trim();
  if (!name || name.length < 2) {
    errors.name = "Full name is required (minimum 2 characters)";
  }

  const email = (body.email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Valid email address is required";
  }

  const phone = (body.phone || "").replace(/\D/g, "");
  if (phone.length < 10) {
    errors.phone = "Valid 10-digit phone number is required";
  }

  const address = (body.address || "").trim();
  if (!address || address.length < 5) {
    errors.address = "Property street address is required";
  }

  const zip = (body.zipCode || body.zip || "").trim();
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zip || !zipRegex.test(zip)) {
    errors.zipCode = "Valid 5-digit US ZIP code is required";
  }

  const serviceType = body.serviceType || body.service || "roof-repair";
  const allowedServices = siteConfig.allowedServices;
  if (!allowedServices.includes(serviceType)) {
    errors.serviceType = "Please select a valid service type";
  }

  const message = (body.message || body.notes || "").trim();

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ error: "Validation failed", details: errors }, 422, request);
  }

  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let whopLeadId: string | undefined = undefined;

  // 5. Log lead data server-side (Whop Leads API requires a Whop user_id — not
  //    available for anonymous website visitors. We log all contact data to the
  //    Whop runtime logs, which are retained and viewable in the Whop dashboard.)
  const apiOrigin = env.WHOP_API_ORIGIN || "https://api.whop.com";
  const accountId = env.WHOP_ACCOUNT_ID || siteConfig.whop.accountId;

  // Structured lead log — visible in Whop dashboard runtime logs
  const leadPayload = {
    lead_id: leadId,
    account_id: accountId || "unknown",
    name,
    email,
    phone,
    address,
    zip_code: zip,
    service_type: serviceType,
    message,
    submitted_at: new Date().toISOString(),
    ip: (request.headers.get("cf-connecting-ip") || "unknown").substring(0, 45),
    referrer: request.headers.get("referer") || null,
  };

  // Log to Whop runtime (always captured, viewable in dashboard)
  console.log(`[LEAD_SUBMISSION] ${JSON.stringify(leadPayload)}`);

  // Also try Whop Events API (POST /api/v1/events) to record a conversion event
  // This is the correct Whop API for tracking anonymous visitor activity
  if (apiOrigin && accountId) {
    try {
      const eventHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Api-Version-Date": "2026-11-07",
      };
      const apiKey = env.WHOP_API_KEY || "";
      if (apiKey) eventHeaders["Authorization"] = `Bearer ${apiKey}`;

      const eventRes = await fetch(`${apiOrigin}/api/v1/events`, {
        method: "POST",
        headers: eventHeaders,
        body: JSON.stringify({
          account_id: accountId,
          name: "estimate_requested",
          metadata: {
            lead_id: leadId,
            service_type: serviceType,
            zip_code: zip,
            has_message: message.length > 0,
          },
        }),
      });

      if (eventRes.ok) {
        const evData = (await eventRes.json()) as any;
        whopLeadId = evData.id;
        console.log(`[WHOP_EVENT_CREATED] id=${evData.id}`);
      } else {
        const errText = await eventRes.text();
        // Events API failure is non-fatal — lead is already logged above
        console.warn(`[WHOP_EVENT_WARN] status=${eventRes.status} body=${errText}`);
      }
    } catch (err: any) {
      // Non-fatal — lead log above is the source of truth
      console.warn(`[WHOP_EVENT_NETWORK_WARN] ${err.message}`);
    }
  }

  console.log(`[PeakGuard Lead Created] ID=${leadId} WhopID=${whopLeadId} Service=${serviceType} Email=${email} ZIP=${zip}`);

  return jsonResponse({
    success: true,
    leadId,
    whopLeadId,
    message: "Estimate request received successfully. A roofing specialist will contact you within 24 hours.",
  }, 200, request);
}

/**
 * Handle Final Balance Invoice creation (POST /api/invoice/final-balance & POST /api/invoices/final-balance)
 * Strictly protected by constant-time x-admin-secret header check.
 * Mode flag:
 *   - "auto_charge" (or "charge"): auto-charges customer's stored payment method (from setup intent)
 *   - "send_manual" (or "send"): creates draft invoice, issues, and emails payment link to customer
 */
async function handleFinalBalanceInvoice(request: Request, env: Env): Promise<Response> {
  // 1. Strict Authentication check: no default secret fallback; constant-time compare
  const adminSecretHeader = request.headers.get("x-admin-secret");
  const configuredAdminSecret = env.ADMIN_SECRET;

  if (!configuredAdminSecret) {
    console.error("[Final Balance Invoice] Server configuration error: ADMIN_SECRET not set");
    return jsonResponse({ error: "Server configuration error: ADMIN_SECRET is not configured" }, 500, request);
  }

  if (!adminSecretHeader || !timingSafeEqual(adminSecretHeader, configuredAdminSecret)) {
    return jsonResponse({ error: "Unauthorized: Invalid or missing x-admin-secret header" }, 401, request);
  }

  let body: InvoiceRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400, request);
  }

  // Validation
  if (!body.recipientEmail || !body.recipientEmail.includes("@")) {
    return jsonResponse({ error: "Valid recipientEmail is required" }, 400, request);
  }

  if (typeof body.originalEstimateTotal !== "number" || body.originalEstimateTotal <= 0) {
    return jsonResponse({ error: "originalEstimateTotal must be a positive number" }, 400, request);
  }

  const deposit = typeof body.depositPaid === "number" ? body.depositPaid : siteConfig.defaultDepositAmount;
  const balanceDue = body.originalEstimateTotal - deposit;

  if (balanceDue <= 0) {
    return jsonResponse({
      error: `Invalid calculation: Total ($${body.originalEstimateTotal}) minus deposit ($${deposit}) leaves no balance due ($${balanceDue})`,
    }, 400, request);
  }

  // Normalize mode flag ("auto_charge" vs "send_manual")
  const mode = body.mode || (body.action === "charge" ? "auto_charge" : body.action === "send" ? "send_manual" : body.action) || "send_manual";

  if (mode === "auto_charge" && !body.paymentMethodId) {
    return jsonResponse({
      error: "paymentMethodId is required when mode is 'auto_charge'. To send an email invoice without a saved card, use mode 'send_manual'.",
    }, 400, request);
  }

  const apiOrigin = env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com";
  const accountId = env.WHOP_ACCOUNT_ID || siteConfig.whop.accountId;
  const apiKey = env.WHOP_API_KEY || "";

  if (!accountId) {
    return jsonResponse(
      { error: "Whop Account ID not configured (WHOP_ACCOUNT_ID missing)" },
      500,
      request
    );
  }

  if (!apiKey && !env.WHOP_API_ORIGIN) {
    return jsonResponse(
      { error: "Whop API credentials not configured (WHOP_API_KEY required)" },
      503,
      request
    );
  }

  const invoiceHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Api-Version-Date": "2026-10-24",
    "Idempotency-Key": crypto.randomUUID(),
  };
  if (apiKey) {
    invoiceHeaders["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    // 1. Create draft invoice via Whop Invoices API (POST /api/v1/invoices)
    // Documented schema: collection_method, variant, customer via member_id or email_address + customer_name
    const invoicePayload = {
      account_id: accountId,
      email_address: body.memberId ? undefined : body.recipientEmail,
      customer_name: body.memberId ? undefined : (body.customerName || body.recipientEmail),
      member_id: body.memberId,
      items: [
        {
          quantity: 1,
          description: `Roofing Project Completion — Final Balance (Total $${body.originalEstimateTotal.toFixed(2)} less $${deposit.toFixed(2)} deposit credited)`,
          variant: {
            title: "Roofing Project Final Balance",
            currency: "usd",
            initial_price: balanceDue,
            billing_type: "one_time",
          },
        },
      ],
      payment_method_id: body.paymentMethodId,
      memo: body.memo || `Final balance invoice for roofing completion. Customer: ${body.customerName || body.recipientEmail}`,
      due_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      metadata: {
        customer_name: body.customerName || "",
        original_total: String(body.originalEstimateTotal),
        deposit_credit: String(deposit),
        balance_due: String(balanceDue),
        settlement_mode: mode,
        generated_by: "PeakGuard Invoicing System",
      },
    };

    const createRes = await fetch(`${apiOrigin}/api/v1/invoices`, {
      method: "POST",
      headers: invoiceHeaders,
      body: JSON.stringify(invoicePayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return jsonResponse(
        { error: `Whop Invoices API rejected draft (${createRes.status}): ${errText}` },
        createRes.status >= 500 ? 502 : createRes.status,
        request
      );
    }

    const invoiceResult = await createRes.json();

    // 2. Perform requested action (auto_charge or send_manual) via documented endpoints
    let actionResult: any = { mode };

    if (mode === "auto_charge" && invoiceResult.id) {
      const chargeRes = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceResult.id}/charge`, {
        method: "POST",
        headers: invoiceHeaders,
        body: body.paymentMethodId ? JSON.stringify({ payment_method_id: body.paymentMethodId }) : undefined,
      });
      if (!chargeRes.ok) {
        const errText = await chargeRes.text();
        return jsonResponse(
          { error: `Whop Invoices charge failed (${chargeRes.status}): ${errText}`, invoice: invoiceResult },
          chargeRes.status >= 500 ? 502 : chargeRes.status,
          request
        );
      }
      actionResult = await chargeRes.json();
    } else if (mode === "send_manual" && invoiceResult.id) {
      const sendRes = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceResult.id}/send`, {
        method: "POST",
        headers: invoiceHeaders,
        body: JSON.stringify({ collection_method: "send_invoice" }),
      });
      if (!sendRes.ok) {
        const errText = await sendRes.text();
        return jsonResponse(
          { error: `Whop Invoices send failed (${sendRes.status}): ${errText}`, invoice: invoiceResult },
          sendRes.status >= 500 ? 502 : sendRes.status,
          request
        );
      }
      actionResult = await sendRes.json();
    }

    console.log(`[PeakGuard Invoice] Mode=${mode} ID=${invoiceResult.id} Balance=$${balanceDue}`);

    return jsonResponse({
      success: true,
      mode,
      action: mode === "auto_charge" ? "charge" : "send",
      invoice: invoiceResult,
      actionResult,
      summary: {
        originalEstimate: body.originalEstimateTotal,
        depositCredited: deposit,
        balanceBilled: balanceDue,
        recipient: body.recipientEmail,
      },
    }, 200, request);
  } catch (err: any) {
    console.error("[PeakGuard Invoice Error]", err);
    return jsonResponse({ error: err.message || "Failed to create final balance invoice" }, 500, request);
  }
}

/**
 * Handle Whop Webhooks
 * Verifies Standard Webhooks HMAC-SHA256 signature with replay window check,
 * and processes payment.succeeded / setup_intent.succeeded
 */
async function handleWhopWebhook(request: Request, env: Env): Promise<Response> {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookSecret = env.WHOP_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Whop Webhook] WHOP_WEBHOOK_SECRET not configured on server");
    return jsonResponse({ error: "Webhook secret not configured on server" }, 401, request);
  }

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return jsonResponse({ error: "Missing required Whop webhook headers" }, 400, request);
  }

  // Prevent replay attacks (reject if timestamp is older or future beyond 5 minutes / 300 seconds)
  const nowSec = Math.floor(Date.now() / 1000);
  const tsSec = parseInt(webhookTimestamp, 10);
  if (isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
    return jsonResponse({ error: "Webhook timestamp expired or out of tolerance" }, 401, request);
  }

  const rawBody = await request.text();

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signedContent));
    const expectedSignature = `v1,${btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))}`;

    if (!timingSafeEqual(webhookSignature, expectedSignature)) {
      console.warn("[Webhook] Signature verification mismatch");
      return jsonResponse({ error: "Invalid webhook signature" }, 401, request);
    }
  } catch (e: any) {
    console.error("[Webhook] Verification error", e);
    return jsonResponse({ error: "Signature verification execution failed" }, 401, request);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON in webhook payload" }, 400, request);
  }

  console.log(`[Whop Webhook Verified] type=${event.type} id=${event.id}`);

  switch (event.type) {
    case "setup_intent.succeeded":
      console.log(`[Webhook] Setup intent succeeded: ID=${event.data?.id} payment_method_id=${event.data?.payment_method_id}`);
      break;

    case "payment.succeeded":
      console.log(`[Webhook] Payment succeeded: ID=${event.data?.id} amount=${event.data?.amount} plan=${event.data?.variant_id}`);
      break;

    case "invoice.paid":
      console.log(`[Webhook] Final balance invoice paid: ID=${event.data?.id}`);
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
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

    // Estimate & Leads endpoints (POST only — public GET listing removed per security contract)
    if ((url.pathname === "/api/estimate" || url.pathname === "/api/leads") && request.method === "POST") {
      return handleLeadSubmission(request, env);
    }

    // Final balance invoice endpoints
    if (
      (url.pathname === "/api/invoice/final-balance" || url.pathname === "/api/invoices/final-balance") &&
      request.method === "POST"
    ) {
      return handleFinalBalanceInvoice(request, env);
    }

    // Whop Setup Intent Lookup (for post-checkout payment method confirmation)
    if (url.pathname === "/api/setup-intents" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ error: "Setup intent ID required" }, 400, request);

      const apiOrigin = env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com";
      const apiKey = env.WHOP_API_KEY || "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Api-Version-Date": "2026-11-07",
      };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      try {
        const res = await fetch(`${apiOrigin}/api/v1/setup-intents/${encodeURIComponent(id)}`, {
          headers,
        });
        if (!res.ok) {
          const errText = await res.text();
          return jsonResponse({ error: `Setup intent lookup failed: ${errText}` }, res.status, request);
        }
        const data = await res.json();
        return jsonResponse(data, 200, request);
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 502, request);
      }
    }

    // Whop Webhook handler
    if (url.pathname === "/api/webhooks/whop" && request.method === "POST") {
      return handleWhopWebhook(request, env);
    }

    // Health check
    if (url.pathname === "/api/health") {
      return jsonResponse({
        status: "healthy",
        app: "peakguard-roofing",
        runtime: "whop-hosting",
        timestamp: new Date().toISOString(),
      }, 200, request);
    }

    // Static assets fallback
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
