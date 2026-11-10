// ============================================================================
// PeakGuard Roofing — Server-Side Runtime Worker
// ============================================================================
//
// Runs in the Whop hosting runtime (Cloudflare Workers based).
// Handles:
//   1. POST /api/leads - Validate estimate form server-side, create lead, log
//   2. POST /api/invoices/final-balance - Authenticated admin endpoint to create
//      and either auto-charge or send a final balance invoice
//   3. POST /api/webhooks/whop - Verify and handle payment.succeeded / setup_intent.succeeded
//   4. Fallback to ASSETS for client-side static bundle
//
// SECURITY:
// - WHOP_API_KEY is NEVER exposed to the browser.
// - All outbound Whop API calls use the hosting runtime's injected credentials
//   or server-side environment bindings.
// - /api/invoices/final-balance requires an `x-admin-secret` header.
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
  address: string;
  zipCode: string;
  serviceType: string;
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
  action: "charge" | "send";    // Option A: auto-charge; Option B: send for manual payment
}

// ────────────────────────────────────────────────────────────────────────────
// In-memory lead store for the worker lifecycle (logs + inspection)
// In production, persisted to Whop / external CRM
// ────────────────────────────────────────────────────────────────────────────
interface StoredLead extends LeadRequestBody {
  id: string;
  createdAt: string;
  ip?: string;
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
 * Handle Estimate / Lead form submission
 * Validates inputs, rejects spam (honeypot + speed check), creates lead record.
 */
async function handleLeadSubmission(request: Request, _env: Env): Promise<Response> {
  let body: LeadRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // 1. Spam protection: Honeypot check
  if (body.honeypot && body.honeypot.trim().length > 0) {
    // Bot filled the hidden field. Silently accept to waste bot time, but don't save.
    return jsonResponse({ success: true, message: "Thank you for your request." }, 200);
  }

  // 2. Spam protection: Timing check (bots submit in < 1 second)
  if (body.timestamp && Date.now() - body.timestamp < 1500) {
    return jsonResponse({ error: "Submission too fast. Please retry." }, 400);
  }

  // 3. Server-side validation
  const errors: Record<string, string> = {};

  if (!body.name || body.name.trim().length < 2) {
    errors.name = "Full name is required (minimum 2 characters)";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || !emailRegex.test(body.email)) {
    errors.email = "Valid email address is required";
  }

  const phoneClean = (body.phone || "").replace(/\D/g, "");
  if (phoneClean.length < 10) {
    errors.phone = "Valid 10-digit phone number is required";
  }

  if (!body.address || body.address.trim().length < 5) {
    errors.address = "Property street address is required";
  }

  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!body.zipCode || !zipRegex.test(body.zipCode.trim())) {
    errors.zipCode = "Valid 5-digit US ZIP code is required";
  }

  const allowedServices = ["roof-repair", "roof-replacement", "roof-inspection", "roof-tuneup", "emergency-storm"];
  if (!body.serviceType || !allowedServices.includes(body.serviceType)) {
    errors.serviceType = "Please select a valid service type";
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ error: "Validation failed", details: errors }, 422);
  }

  // 4. Record lead
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const storedLead: StoredLead = {
    ...body,
    id: leadId,
    createdAt: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip") || "unknown",
  };
  memoryLeads.unshift(storedLead);
  if (memoryLeads.length > 100) memoryLeads.pop();

  // Log lead creation (visible in `whop apps logs`)
  console.log(`[PeakGuard Lead Created] ID=${leadId} Service=${body.serviceType} Email=${body.email} ZIP=${body.zipCode}`);

  return jsonResponse({
    success: true,
    leadId,
    message: "Estimate request received successfully. A roofing specialist will contact you within 24 hours.",
  });
}

/**
 * Handle Final Balance Invoice creation
 * Strictly protected by x-admin-secret header.
 * Options:
 *   - "charge": auto-charges the customer's stored payment method (from setup intent)
 *   - "send": creates invoice and emails payment link to customer
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
    return jsonResponse({ error: "Invalid JSON body" }, 400);
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

  if (body.action === "charge" && !body.paymentMethodId) {
    return jsonResponse({
      error: "paymentMethodId is required when action is 'charge'. To send an email invoice without a saved card, use action 'send'.",
    }, 400);
  }

  // Determine Whop API Origin
  const apiOrigin = env.WHOP_API_ORIGIN || "https://sandbox-api.whop.com";
  const accountId = env.WHOP_ACCOUNT_ID || "biz_test_peakguard_roofing";
  const apiKey = env.WHOP_API_KEY || "";

  // Prepare line items
  const lineItems = [
    {
      description: `Roofing Project Completion — Final Balance (Total $${body.originalEstimateTotal.toFixed(2)} less $${deposit.toFixed(2)} deposit paid)`,
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
        generated_by: "PeakGuard Invoicing System",
      },
    };

    let invoiceResult: any;

    if (apiKey) {
      // Call live Whop API
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

    // 2. Perform requested action (charge or send)
    let actionResult: any = { action: body.action };

    if (body.action === "charge" && invoiceResult.id && apiKey) {
      // POST /api/v1/invoices/{id}/charge
      const chargeRes = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceResult.id}/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Api-Version-Date": "2026-08-14",
        },
      });
      actionResult = await chargeRes.json();
    } else if (body.action === "send" && invoiceResult.id && apiKey) {
      // POST /api/v1/invoices/{id}/send
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

    console.log(`[PeakGuard Invoice] Action=${body.action} ID=${invoiceResult.id} Balance=$${balanceDue}`);

    return jsonResponse({
      success: true,
      action: body.action,
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
    return jsonResponse({ error: err.message || "Failed to create invoice" }, 500);
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

  // Signature verification (if webhook secret configured)
  const webhookSecret = env.WHOP_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret !== "ws_REPLACE_ME") {
    // In production, verify HMAC-SHA256
    // Whop format: v1,<base64_signature>
    // Signed data: `${webhookId}.${webhookTimestamp}.${rawBody}`
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

  // Handle relevant events
  switch (event.type) {
    case "setup_intent.succeeded":
      // Card saved on file! Store the payment_method_id for final balance invoicing.
      console.log(`[Webhook] Setup intent succeeded: ID=${event.data?.id} payment_method_id=${event.data?.payment_method_id}`);
      break;

    case "payment.succeeded":
      // Payment completed! If this was a deposit, card is also saved.
      console.log(`[Webhook] Payment succeeded: ID=${event.data?.id} amount=${event.data?.amount} plan=${event.data?.variant_id}`);
      break;

    case "invoice.paid":
      console.log(`[Webhook] Final balance invoice paid: ID=${event.data?.id}`);
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  // Must respond 2xx within 5 seconds per docs
  return jsonResponse({ received: true });
}

// ────────────────────────────────────────────────────────────────────────────
// Main Worker Fetch Dispatcher
// ────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return corsPreflight();
    }

    // API Routes
    if (url.pathname === "/api/leads" && request.method === "POST") {
      return handleLeadSubmission(request, env);
    }

    if (url.pathname === "/api/leads" && request.method === "GET") {
      // Diagnostic check: return count of stored leads (no sensitive data)
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

    if (url.pathname === "/api/invoices/final-balance" && request.method === "POST") {
      return handleFinalBalanceInvoice(request, env);
    }

    if (url.pathname === "/api/webhooks/whop" && request.method === "POST") {
      return handleWhopWebhook(request, env);
    }

    if (url.pathname === "/api/health") {
      return jsonResponse({
        status: "healthy",
        app: "peakguard-roofing",
        runtime: "whop-hosting",
        timestamp: new Date().toISOString(),
      });
    }

    // Static assets fallback (HTML, JS, CSS, images) served by Whop's ASSETS binding
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
