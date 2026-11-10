# PeakGuard Roofing — Verification & Testing Checklist

This checklist verifies all required Whop integrations end-to-end:
1. **Whop Payments Sandbox Checkout** (including card-on-file setup intent)
2. **Lead Form Creation** (server-side validation + honeypot + timing + Whop tracking)
3. **Final Balance Invoicing** (Option A auto-charge & Option B email dispatch)
4. **Custom Pixel Tracking Events** (`estimate_requested`, `service_viewed`, `deposit_started`)

---

## 1. Whop Payments Sandbox Checkout

### Test 1.1: Inspection Booking ($149)
- [ ] Navigate to `http://localhost:3000` (or your live `<domain>.whop.site`).
- [ ] Scroll to **Transparent Flat-Rate Pricing** or click **"Book Inspection ($149)"** in the top navigation.
- [ ] Click **"Book $149 Inspection"**.
- [ ] Verify modal opens displaying:
  - Header with title: "Comprehensive Roof Inspection" and price: "$149".
  - Whop Express Checkout element (Apple Pay / Google Pay button).
  - Whop Payment element (`EmailElement`, `PaymentElement`, and required `BrandingElement`).
- [ ] In sandbox mode, complete checkout or click the test return link:
  - Verify redirect to `/checkout/return?status=succeeded&plan=plan_roof_inspection_149`.
  - Verify confirmation screen shows:
    - Order Confirmed banner.
    - Transaction ID (`pay_...`).
    - Schedule next-step instructions.

### Test 1.2: Project Deposit ($500) with Card Saved on File (Setup Intent)
- [ ] On the pricing section, locate the highlighted **Project Deposit** card ($500).
- [ ] Notice the banner: **"Setup Intent Activated — Card Saved on File"**.
- [ ] Click **"Reserve with $500 Deposit"**.
- [ ] Verify checkout modal displays the card-on-file notice explaining that the card is saved for post-job settlement.
- [ ] Elements mount with `setupFutureUsage="off_session"` (as specified in Whop Save Payment Methods guide).
- [ ] Complete payment / simulate return:
  - Verify return page displays: **"Card Saved on File for Final Balance"** callout.
  - Notice text confirming $500 will be credited against the final balance invoice.

### Test 1.3: Flat-Rate Roof Tune-Up ($299)
- [ ] Click **"Book $299 Tune-Up"**.
- [ ] Verify modal mounts with price $299.
- [ ] Complete flow and verify return receipt.

---

## 2. Estimate Form & Whop Leads Creation

### Test 2.1: Client-Side Validation
- [ ] Scroll to the **Request Your Detailed Roofing Estimate** section (`#estimate`).
- [ ] Click **"Submit Estimate Request"** with empty fields.
- [ ] Verify client-side error highlights on Name, Email, Phone, Address, and ZIP Code.

### Test 2.2: Spam Honeypot & Timing Trap
- [ ] The hidden field `honeypot` is omitted from user view (`aria-hidden="true"`).
- [ ] If filled (by bot automation), `/api/leads` silently returns HTTP 200 without creating a record.
- [ ] If submitted in < 1,500ms, returns HTTP 400 rejection.

### Test 2.3: Valid Submission & Server Verification
- [ ] Enter valid details:
  - Name: `Robert Miller`
  - Phone: `555-732-5482`
  - Email: `rmiller.dfw@example.com`
  - Address: `4520 Preston Road`
  - ZIP: `75205`
  - Service: `Roof Repair & Emergency Leak Stop`
- [ ] Click **"Submit Estimate Request"**.
- [ ] Verify:
  - Button transitions to **"Validating & Submitting..."** with spinner (double-submit prevented).
  - Form transitions to the green **"Estimate Request Received!"** state.
  - Reference ID displayed (e.g. `lead_1731...`).
  - Server log shows: `[PeakGuard Lead Created] ID=... Email=rmiller.dfw@example.com`.
  - Whop tracking events fire: `lead` and `estimate_requested`.

### Test 2.4: Server-Side API Diagnostic
- [ ] Visit `http://localhost:3000/api/leads` in your browser.
- [ ] Verify JSON returns the lead count and recent sanitized leads:
  ```json
  {
    "status": "ok",
    "count": 1,
    "recent": [{ "id": "lead_...", "service": "roof-repair", "zip": "75205" }]
  }
  ```

---

## 3. Final Balance Invoicing API

The endpoint `POST /api/invoices/final-balance` is protected by `x-admin-secret`.

### Test 3.1: Security Gate (Unauthorized Request)
- [ ] Run in terminal:
  ```bash
  curl -X POST http://localhost:3000/api/invoices/final-balance \
    -H "Content-Type: application/json" \
    -d '{"recipientEmail": "test@example.com"}'
  ```
- [ ] Verify returns **HTTP 401 Unauthorized**: `"Invalid or missing x-admin-secret header"`.

### Test 3.2: Option A — Auto-Charge Saved Card on File
- [ ] Visit `/admin/invoicing`.
- [ ] Authenticate with `development-secret-change-me` (or your configured `ADMIN_SECRET`).
- [ ] Fill form:
  - Recipient Email: `homeowner@example.com`
  - Original Estimate: `$8,500`
  - Deposit Paid: `$500`
  - Net Balance Calculated: **`$8,000.00`**
  - Select: **Option A: Auto-Charge**
  - Stored Payment Method ID: `payt_test_stored_card_4242`
- [ ] Click **"Create & Auto-Charge Balance ($8,000.00)"**.
- [ ] Verify success response:
  - Whop invoice created (`pay_...`).
  - Invoice charge called (`/invoices/:id/charge`).
  - Audit log shows breakdown: Original $8,500 - Deposit $500 = $8,000 billed.

### Test 3.3: Option B — Send Email Invoice for Manual Payment
- [ ] On `/admin/invoicing`, select **Option B: Send Email**.
- [ ] No payment method ID required.
- [ ] Click **"Create & Email Invoice Link"**.
- [ ] Verify response indicates invoice sent to customer with hosted payment URL.

### Test 3.4: CLI Test Script
- [ ] Run:
  ```bash
  npx tsx scripts/test-invoice.ts send client@example.com 9500
  ```
- [ ] Verify terminal outputs formatted invoice dispatch with HTTP 200 result.

---

## 4. Custom Pixel Tracking Events

The Whop tracking pixel is auto-injected by Whop hosting runtime. In local development and recording, events are visible in:
1. The **Whop Pixel Debugger** toolbar in the bottom-right corner.
2. The browser dev tools console (with color-coded groups).

| Required Event | Trigger Action | Verified |
|----------------|----------------|:--------:|
| `estimate_requested` | Submit the estimate form with valid data | [ ] |
| `service_viewed` | Click any service card (Repair, Replacement, Inspection, Tune-Up) | [ ] |
| `deposit_started` | Click "Reserve with $500 Deposit" on the pricing card | [ ] |
| `lead` (Whop standard) | Fired alongside `estimate_requested` with ZIP and service | [ ] |
| `inspection_started` | Click "Book $149 Inspection" | [ ] |
| `tuneup_started` | Click "Book $299 Tune-Up" | [ ] |

### How to demo events in video recording:
1. Open the site with `?debug=track` in the URL (or simply in development mode).
2. Click the floating **"Whop Pixel Debugger"** pill in the lower-right corner to expand it.
3. Click through services, trigger the deposit checkout, and submit an estimate.
4. Watch events appear in real-time inside the debugger drawer with their exact parameters!
