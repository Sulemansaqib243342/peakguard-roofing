// ============================================================================
// PeakGuard Roofing — Server-Side Runtime Worker
// ============================================================================
//
// Runs in the Whop hosting runtime (Cloudflare Workers based).
// Handles:
//   1. POST /api/estimate - Schema validation, rate limiting, honeypot spam trap,
//      and Whop Leads API creation (POST /api/v1/leads)
//   2. POST /api/invoice/final-balance - Authenticated admin endpoint with mode:
//      "auto_charge" (Option A: stored payment method) or "send_manual" (Option B)
//   3. POST /api/webhooks/whop - Verify and handle payment.succeeded & setup_intent.succeeded
//   4. Fallback to ASSETS for client-side static bundle
//
// SECURITY:
// - WHOP_API_KEY is NEVER exposed to the browser.
// - All outbound Whop API calls use the hosting runtime's injected credentials.
// - /api/invoice/final-balance requires an `x-admin-secret` header.
// ============================================================================

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
  depositPaid: number;          // Typically $500
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
// In-memory lead store for the worker lifecycle (logs + inspection)
// ────────────────────────────────────────────────────────────────────────────
interface StoredLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  serviceType: string;
  message: string;
  createdAt: string;
  ip: string;
  whopLeadId?: string;
}

const memoryLeads: StoredLead[] = [];

// ────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ────────────────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
    },
  });
}

function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
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
 */
async function handleLeadSubmission(request: Request, env: Env): Promise<Response> {
  const clientIp = request.headers.get("cf-connecting-ip") || "127.0.0.1";

  // 1. Basic Rate Limiting: 5 submissions per minute per IP
  if (!checkRateLimit(clientIp, 5, 60000)) {
    return jsonResponse(
      { error: "Too many requests. Please wait a minute before submitting again." },
      429
    );
  }

  let body: LeadRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400);
  }

  // 2. Spam protection: Honeypot check
  if (body.honeypot && body.honeypot.trim().length > 0) {
    // Bot filled the hidden field. Silently accept to waste bot time, but do not record.
    return jsonResponse({ success: true, message: "Thank you for your request." }, 200);
  }

  // 3. Spam protection: Timing check (bots submit in < 1.5 seconds)
  if (body.timestamp && Date.now() - body.timestamp < 1500) {
    return jsonResponse({ error: "Submission too fast. Please retry." }, 400);
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
  const allowedServices = ["roof-repair", "roof-replacement", "roof-inspection", "roof-tuneup", "emergency-storm"];
  if (!allowedServices.includes(serviceType)) {
    errors.serviceType = "Please select a valid service type";
  }

  const message = (body.message || body.notes || "").trim();

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ error: "Validation failed", details: errors }, 422);
  }

  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let whopLeadId: string | undefined = undefined;

  // 5. Call Whop Leads API (POST /api/v1/leads) if configured
  const apiOrigin = env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com";
  const accountId = env.WHOP_ACCOUNT_ID || "biz_test_peakguard_roofing";
  const apiKey = env.WHOP_API_KEY || "";

  if (apiKey) {
    try {
      const whopLeadRes = await fetch(`${apiOrigin}/api/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Api-Version-Date": "2026-08-14",
        },
        body: JSON.stringify({
          account_id: accountId,
          metadata: {
            lead_id: leadId,
            name,
            email,
            phone,
            address,
            zip_code: zip,
            service_type: serviceType,
            message,
          },
        }),
      });

      if (whopLeadRes.ok) {
        const whopData = await whopLeadRes.json() as any;
        whopLeadId = whopData.id;
      } else {
        console.warn(`[Whop Leads API Non-Fatal Warning] status=${whopLeadRes.status}`);
      }
    } catch (err) {
      console.warn("[Whop Leads API Network Warning]", err);
    }
  }

  // 6. Record in memory
  const storedLead: StoredLead = {
    id: leadId,
    name,
    email,
    phone,
    address,
    zipCode: zip,
    serviceType,
    message,
    createdAt: new Date().toISOString(),
    ip: clientIp,
    whopLeadId,
  };
  memoryLeads.unshift(storedLead);
  if (memoryLeads.length > 100) memoryLeads.pop();

  console.log(`[PeakGuard Lead Created] ID=${leadId} Service=${serviceType} Email=${email} ZIP=${zip}`);

  return jsonResponse({
    success: true,
    leadId,
    whopLeadId,
    message: "Estimate request received successfully. A roofing specialist will contact you within 24 hours.",
  });
}

/**
 * Handle Final Balance Invoice creation (POST /api/invoice/final-balance & POST /api/invoices/final-balance)
 * Strictly protected by x-admin-secret header.
 * Mode flag:
 *   - "auto_charge" (or "charge"): auto-charges customer's stored payment method (from setup intent)
 *   - "send_manual" (or "send"): creates invoice and emails payment link to customer
 */
async function handleFinalBalanceInvoice(request: Request, env: Env): Promise<Response> {
  // 1. Authentication check
  const adminSecretHeader = request.headers.get("x-admin-secret");
  const configuredAdminSecret = env.ADMIN_SECRET || "development-secret-change-me";

  if (!adminSecretHeader || adminSecretHeader !== configuredAdminSecret) {
    return jsonResponse({ error: "Unauthorized: Invalid or missing x-admin-secret header" }, 401);
  }

  let body: InvoiceRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body" }, 400);
  }

  // Validation
  if (!body.recipientEmail || !body.recipientEmail.includes("@")) {
    return jsonResponse({ error: "Valid recipientEmail is required" }, 400);
  }

  if (typeof body.originalEstimateTotal !== "number" || body.originalEstimateTotal <= 0) {
    return jsonResponse({ error: "originalEstimateTotal must be a positive number" }, 400);
  }

  const deposit = typeof body.depositPaid === "number" ? body.depositPaid : 500;
  const balanceDue = body.originalEstimateTotal - deposit;

  if (balanceDue <= 0) {
    return jsonResponse({
      error: `Invalid calculation: Total ($${body.originalEstimateTotal}) minus deposit ($${deposit}) leaves no balance due ($${balanceDue})`,
    }, 400);
  }

  // Normalize mode flag ("auto_charge" vs "send_manual")
  const mode = body.mode || (body.action === "charge" ? "auto_charge" : body.action === "send" ? "send_manual" : body.action) || "send_manual";

  if (mode === "auto_charge" && !body.paymentMethodId) {
    return jsonResponse({
      error: "paymentMethodId is required when mode is 'auto_charge'. To send an email invoice without a saved card, use mode 'send_manual'.",
    }, 400);
  }

  const apiOrigin = env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com";
  const accountId = env.WHOP_ACCOUNT_ID || "biz_test_peakguard_roofing";
  const apiKey = env.WHOP_API_KEY || "";

  const lineItems = [
    {
      description: `Roofing Project Completion — Final Balance (Total $${body.originalEstimateTotal.toFixed(2)} less $${deposit.toFixed(2)} deposit credited)`,
      unit_amount: balanceDue,
      quantity: 1,
    },
  ];

  try {
    // 1. Create draft invoice via Whop Invoices API (POST /api/v1/invoices)
    const invoicePayload = {
      account_id: accountId,
      member_id: body.memberId,
      recipient_emails: [body.recipientEmail],
      memo: body.memo || `Final balance invoice for roofing completion. Customer: ${body.customerName || body.recipientEmail}`,
      currency: "usd",
      line_items: lineItems,
      payment_method_id: body.paymentMethodId,
      metadata: {
        customer_name: body.customerName || "",
        original_total: String(body.originalEstimateTotal),
        deposit_credit: String(deposit),
        balance_due: String(balanceDue),
        settlement_mode: mode,
        generated_by: "PeakGuard Invoicing System",
      },
    };

    let invoiceResult: any;

    if (apiKey) {
      const createRes = await fetch(`${apiOrigin}/api/v1/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Api-Version-Date": "2026-08-14",
        },
        body: JSON.stringify(invoicePayload),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Whop API error [${createRes.status}]: ${errText}`);
      }

      invoiceResult = await createRes.json();
    } else {
      // Simulation mode when testing without live key
      invoiceResult = {
        id: `pay_mock_inv_${Date.now()}`,
        account_id: accountId,
        status: "draft",
        total_amount: balanceDue,
        currency: "usd",
        recipient_emails: [body.recipientEmail],
        hosted_invoice_url: `https://whop.com/invoices/pay_mock_inv_${Date.now()}`,
        created_at: new Date().toISOString(),
        simulated: true,
      };
    }

    // 2. Perform requested action (auto_charge or send_manual)
    let actionResult: any = { mode };

    if (mode === "auto_charge" && invoiceResult.id && apiKey) {
      const chargeRes = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceResult.id}/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Api-Version-Date": "2026-08-14",
        },
      });
      actionResult = await chargeRes.json();
    } else if (mode === "send_manual" && invoiceResult.id && apiKey) {
      const sendRes = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceResult.id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Api-Version-Date": "2026-08-14",
        },
      });
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
    });
  } catch (err: any) {
    console.error("[PeakGuard Invoice Error]", err);
    return jsonResponse({ error: err.message || "Failed to create final balance invoice" }, 500);
  }
}

/**
 * Handle Whop Webhooks
 * Verifies HMAC-SHA256 signature and processes payment.succeeded / setup_intent.succeeded
 */
async function handleWhopWebhook(request: Request, env: Env): Promise<Response> {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return jsonResponse({ error: "Missing required Whop webhook headers" }, 400);
  }

  const rawBody = await request.text();
  const webhookSecret = env.WHOP_WEBHOOK_SECRET;

  if (webhookSecret && webhookSecret !== "ws_REPLACE_ME") {
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

      if (webhookSignature !== expectedSignature) {
        console.warn("[Webhook] Signature verification mismatch");
        return jsonResponse({ error: "Invalid webhook signature" }, 401);
      }
    } catch (e) {
      console.error("[Webhook] Verification error", e);
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON in webhook payload" }, 400);
  }

  console.log(`[Whop Webhook Received] type=${event.type} id=${event.id}`);

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

  return jsonResponse({ received: true });
}

// ────────────────────────────────────────────────────────────────────────────
// Main Worker Fetch Dispatcher
// ────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return corsPreflight();
    }

    // Estimate & Leads endpoints (both /api/estimate and /api/leads supported)
    if ((url.pathname === "/api/estimate" || url.pathname === "/api/leads") && request.method === "POST") {
      return handleLeadSubmission(request, env);
    }

    if ((url.pathname === "/api/estimate" || url.pathname === "/api/leads") && request.method === "GET") {
      return jsonResponse({
        status: "ok",
        count: memoryLeads.length,
        recent: memoryLeads.slice(0, 5).map((l) => ({
          id: l.id,
          service: l.serviceType,
          zip: l.zipCode,
          createdAt: l.createdAt,
        })),
      });
    }

    // Final balance invoice endpoints (both singular /api/invoice/... and plural /api/invoices/... supported)
    if (
      (url.pathname === "/api/invoice/final-balance" || url.pathname === "/api/invoices/final-balance") &&
      request.method === "POST"
    ) {
      return handleFinalBalanceInvoice(request, env);
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
      });
    }

    // Static assets fallback
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
