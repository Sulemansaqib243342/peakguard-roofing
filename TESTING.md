# PeakGuard Roofing — Verification & Testing Checklist

This checklist verifies all required Whop integrations end-to-end:
1. **Whop Pixel Debugger** (rendered via `?debug=1`, static dot, events logged)
2. **Whop Payments Sandbox Checkout** (including card-on-file setup intent)
3. **Estimate Form & Whop Leads** (server-side validation, rate limiting, honeypot, Whop Leads API)
4. **Final Balance Invoicing** (Option A: `auto_charge` & Option B: `send_manual`)
5. **Custom Pixel Tracking Events** (`estimate_requested`, `service_viewed`, `deposit_started`)

---

## 1. Whop Pixel Debugger (`?debug=1`)
- [ ] Open `http://localhost:3000` directly.
  - Verify that the bottom-right debugger pill is **hidden by default**.
- [ ] Open `http://localhost:3000/?debug=1`.
  - Verify that the **Whop Pixel Debugger** pill appears in the bottom-right corner.
  - Verify the indicator dot is **static** (zero blinking, pulsing, or ping animations).
- [ ] Click to expand the drawer.
- [ ] Perform actions on the site and verify events populate in real time with parameters:
  - Click any service card -> `service_viewed`
  - Click "Reserve with $500 Deposit" -> `deposit_started`
  - Submit the estimate form -> `estimate_requested` & `lead`

---

## 2. Whop Payments Sandbox Checkout

### Test 2.1: Inspection Booking ($149)
- [ ] Navigate to `http://localhost:3000`.
- [ ] Click **"Book $149 Inspection"** in the Hero or navigation.
- [ ] Verify modal opens displaying:
  - Header with title: "Comprehensive Roof Inspection" and price: "$149".
  - Whop Express Checkout element (Apple Pay / Google Pay button).
  - Whop Payment element (`EmailElement`, `PaymentElement`, and required `BrandingElement`).
- [ ] In sandbox mode, complete checkout or click the test return link:
  - Verify redirect to `/checkout/return?status=succeeded&plan=plan_roof_inspection_149`.
  - Verify confirmation screen shows transaction ID and scheduling instructions.

### Test 2.2: Project Deposit ($500) with Card Saved on File (Setup Intent)
- [ ] On the pricing section, locate the **Project Deposit** card ($500).
- [ ] Click **"Reserve with $500 Deposit"**.
- [ ] Verify checkout modal displays the card-on-file notice explaining that the card is saved for post-job settlement.
- [ ] Elements mount with `setupFutureUsage="off_session"` (as specified in Whop Save Payment Methods guide).
- [ ] Complete payment / simulate return:
  - Verify return page displays: **"Card Saved on File for Final Balance"** callout.
  - Notice text confirming $500 will be credited against the final balance invoice.

### Test 2.3: Flat-Rate Roof Tune-Up ($299)
- [ ] Click **"Book $299 Tune-Up"**.
- [ ] Verify modal mounts with price $299.
- [ ] Complete flow and verify return receipt.

---

## 3. Estimate Form & Whop Leads Creation (`POST /api/estimate`)

### Test 3.1: Client-Side Validation
- [ ] Scroll to the **Request Your Detailed Roofing Estimate** section (`#estimate`).
- [ ] Click **"Submit Estimate Request"** with empty fields.
- [ ] Verify client-side error highlights on Name, Email, Phone, Address, and ZIP Code.

### Test 3.2: Spam Honeypot & Timing Trap
- [ ] The hidden field `honeypot` is omitted from user view (`aria-hidden="true"`).
- [ ] If filled (by bot automation), `/api/estimate` silently returns HTTP 200 without creating a record.
- [ ] If submitted in < 1,500ms, returns HTTP 400 rejection.

### Test 3.3: Rate Limiting
- [ ] Submit more than 5 requests within 60 seconds from the same IP.
- [ ] Verify returns HTTP 429 Too Many Requests: `"Too many requests. Please wait a minute before submitting again."`

### Test 3.4: Valid Submission & Server Verification
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
  - Reference ID displayed (`lead_...`).
  - Whop tracking events fire: `lead` and `estimate_requested`.

### Test 3.5: Server-Side Diagnostic
- [ ] Visit `http://localhost:3000/api/estimate` in your browser.
- [ ] Verify JSON returns the lead count and recent sanitized submissions:
  ```json
  {
    "status": "ok",
    "count": 1,
    "recent": [{ "id": "lead_...", "service": "roof-repair", "zip": "75205" }]
  }
  ```

---

## 4. Final Balance Invoicing API (`POST /api/invoice/final-balance`)

The endpoint `POST /api/invoice/final-balance` is protected by `x-admin-secret`.

### Test 4.1: Security Gate (Unauthorized Request)
- [ ] Run in terminal:
  ```bash
  curl -X POST http://localhost:3000/api/invoice/final-balance \
    -H "Content-Type: application/json" \
    -d '{"recipientEmail": "test@example.com"}'
  ```
- [ ] Verify returns **HTTP 401 Unauthorized**: `"Invalid or missing x-admin-secret header"`.

### Test 4.2: Option A — Auto-Charge Saved Card on File (`mode: "auto_charge"`)
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
  - Audit breakdown: Original $8,500 - Deposit $500 = $8,000 billed.

### Test 4.3: Option B — Send Email Invoice for Manual Payment (`mode: "send_manual"`)
- [ ] On `/admin/invoicing`, select **Option B: Send Email**.
- [ ] Click **"Create & Email Invoice Link"**.
- [ ] Verify response indicates invoice sent to customer with hosted payment URL.

### Test 4.4: CLI Test Script
- [ ] Run:
  ```bash
  npx tsx scripts/test-invoice.ts send_manual client@example.com 9500
  ```
- [ ] Verify terminal outputs formatted invoice dispatch with HTTP 200 result.

---

## 5. Mobile & Responsive Layout
- [ ] At 360px width:
  - Verify sticky bottom bar is visible with **"Call Now"** and **"Book Inspection"**.
  - Header navigation collapses into a clean hamburger menu.
  - Heading clamp adapts smoothly without overflow.
- [ ] At 768px (Tablet):
  - 2-column service card layout renders cleanly.
- [ ] At 1200px+ (Desktop):
  - Sticky mobile bar hides (`md:hidden`).
  - Container stays centered at max 1200px.
