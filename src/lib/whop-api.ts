// ============================================================================
// PeakGuard Roofing — Whop API Helper Types & Client
// ============================================================================
//
// Adheres to docs.whop.com OpenAPI v1 (Api-Version-Date: 2026-11-10).
// Server-side only — NEVER expose WHOP_API_KEY to browser code.
// ============================================================================

const WHOP_API_VERSION = "2026-11-10";

export interface WhopInvoiceDraftInput {
  accountId: string;
  memberId?: string;
  emailAddress?: string;
  customerName?: string;
  recipientEmails?: string[];
  memo?: string;
  currency?: string;
  items: Array<{
    title: string;
    description?: string;
    initialPrice: number; // Dollars
    quantity?: number;
  }>;
  paymentMethodId?: string;
  dueAt?: string;
  metadata?: Record<string, string>;
}

export interface WhopInvoiceResponse {
  id: string; // pay_...
  object: "invoice";
  number: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  member_id: string | null;
  payment_method_id: string | null;
  recipient_emails: string[];
  checkout_link?: string | null;
  created_at: string;
}

export interface WhopSetupIntentResponse {
  id: string; // sint_...
  account_id?: string;
  client_secret?: string;
  member_id?: string | null;
  payment_method_id?: string | null;
  payment_instrument?: {
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  } | null;
  status: "processing" | "succeeded" | "canceled" | "requires_action";
  return_url?: string | null;
}

/**
 * Creates a draft invoice via POST /api/v1/invoices.
 */
export async function createWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  input: WhopInvoiceDraftInput
): Promise<WhopInvoiceResponse> {
  const body: Record<string, unknown> = {
    account_id: input.accountId,
    memo: input.memo,
    items: input.items.map((item) => ({
      quantity: item.quantity || 1,
      description: item.description,
      variant: {
        title: item.title,
        currency: (input.currency || "usd").toLowerCase(),
        initial_price: item.initialPrice,
        billing_type: "one_time",
      },
    })),
    metadata: input.metadata || {},
  };

  if (input.memberId) {
    body.member_id = input.memberId;
    if (input.recipientEmails) body.recipient_emails = input.recipientEmails;
  } else if (input.emailAddress) {
    body.email_address = input.emailAddress;
    if (input.customerName) body.customer_name = input.customerName;
  }

  if (input.paymentMethodId) body.payment_method_id = input.paymentMethodId;
  if (input.dueAt) body.due_at = input.dueAt;

  const response = await fetch(`${apiOrigin}/api/v1/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Api-Version-Date": WHOP_API_VERSION,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Invoices API failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Issues a draft invoice (required before POST /invoices/:id/charge).
 */
export async function issueWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  invoiceId: string
): Promise<WhopInvoiceResponse> {
  const response = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceId}/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Api-Version-Date": WHOP_API_VERSION,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Issue Invoice failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Charges an open invoice to a saved payment method (POST /api/v1/invoices/:id/charge).
 */
export async function chargeWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  invoiceId: string,
  paymentMethodId?: string
): Promise<WhopInvoiceResponse> {
  const response = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceId}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Api-Version-Date": WHOP_API_VERSION,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: paymentMethodId ? JSON.stringify({ payment_method_id: paymentMethodId }) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Charge Invoice failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Issues and emails a one-time invoice to recipients for manual payment (POST /api/v1/invoices/:id/send).
 */
export async function sendWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  invoiceId: string
): Promise<WhopInvoiceResponse> {
  const response = await fetch(`${apiOrigin}/api/v1/invoices/${invoiceId}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Api-Version-Date": WHOP_API_VERSION,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Send Invoice failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Retrieves a Setup Intent (GET /api/v1/setup_intents/:id).
 */
export async function retrieveWhopSetupIntent(
  apiOrigin: string,
  apiKey: string,
  setupIntentId: string
): Promise<WhopSetupIntentResponse> {
  const response = await fetch(`${apiOrigin}/api/v1/setup_intents/${setupIntentId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Api-Version-Date": WHOP_API_VERSION,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Retrieve Setup Intent failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}
