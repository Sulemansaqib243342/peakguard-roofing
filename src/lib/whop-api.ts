// ============================================================================
// PeakGuard Roofing — Whop API Client
// ============================================================================
//
// Strictly adheres to docs.whop.com:
// - Endpoints: Current API under https://api.whop.com/api/v1 (or sandbox)
// - Authentication: Injected automatically by Whop hosting runtime via WHOP_API_ORIGIN,
//   or passed as Authorization: Bearer <API_KEY> server-side.
// - NEVER exposes WHOP_API_KEY to browser code.
// - Endpoints implemented:
//     - Invoices: POST /invoices, POST /invoices/:id/charge, POST /invoices/:id/send
//     - Setup Intents: POST /setup_intents, GET /setup_intents/:id
// ============================================================================

export interface WhopInvoiceDraftInput {
  accountId: string;
  memberId?: string;
  recipientEmails: string[];
  memo?: string;
  currency?: string;
  lineItems: Array<{
    description: string;
    amount: number;       // In dollars
    quantity?: number;
  }>;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

export interface WhopInvoiceResponse {
  id: string;               // pay_...
  account_id: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  total_amount: number;
  currency: string;
  payment_method_id?: string;
  recipient_emails: string[];
  hosted_invoice_url?: string;
  pdf_url?: string;
  created_at: string;
}

export interface WhopSetupIntentResponse {
  id: string;               // sint_...
  account_id: string;
  client_secret?: string;
  member_id?: string;
  payment_method_id?: string;
  payment_method_type?: string;
  payment_instrument?: {
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
    display_name?: string;
  };
  status: "processing" | "succeeded" | "canceled" | "requires_action";
  return_url?: string;
}

/**
 * Creates a draft invoice in Whop.
 * Per docs: POST /api/v1/invoices
 * Requires: invoice:create or payment:charge permission.
 */
export async function createWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  input: WhopInvoiceDraftInput
): Promise<WhopInvoiceResponse> {
  const url = `${apiOrigin}/api/v1/invoices`;

  const body = {
    account_id: input.accountId,
    member_id: input.memberId,
    recipient_emails: input.recipientEmails,
    memo: input.memo || "Final Balance Invoice — PeakGuard Roofing Co.",
    currency: (input.currency || "usd").toLowerCase(),
    line_items: input.lineItems.map((li) => ({
      description: li.description,
      unit_amount: li.amount,
      quantity: li.quantity || 1,
    })),
    payment_method_id: input.paymentMethodId,
    metadata: input.metadata || {},
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Api-Version-Date": "2026-08-14",
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
 * Charges an open invoice to a saved payment method.
 * Per docs: POST /api/v1/invoices/{id}/charge
 * Async charge to stored payment_method_id.
 */
export async function chargeWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  invoiceId: string
): Promise<{ status: string; invoice_id: string }> {
  const url = `${apiOrigin}/api/v1/invoices/${invoiceId}/charge`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Api-Version-Date": "2026-08-14",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Charge Invoice failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Issues and emails an invoice to recipients for manual payment.
 * Per docs: POST /api/v1/invoices/{id}/send
 */
export async function sendWhopInvoice(
  apiOrigin: string,
  apiKey: string,
  invoiceId: string
): Promise<{ status: string; invoice_id: string; sent_to: string[] }> {
  const url = `${apiOrigin}/api/v1/invoices/${invoiceId}/send`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "Api-Version-Date": "2026-08-14",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Send Invoice failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}

/**
 * Retrieves a Setup Intent to check card save status.
 * Per docs: GET /api/v1/setup_intents/{id}
 */
export async function retrieveWhopSetupIntent(
  apiOrigin: string,
  apiKey: string,
  setupIntentId: string
): Promise<WhopSetupIntentResponse> {
  const url = `${apiOrigin}/api/v1/setup_intents/${setupIntentId}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Api-Version-Date": "2026-08-14",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whop Retrieve Setup Intent failed [${response.status}]: ${errorText}`);
  }

  return response.json();
}
