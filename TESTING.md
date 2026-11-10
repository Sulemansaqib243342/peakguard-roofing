# PeakGuard Roofing — Verification & Testing Checklist

This checklist verifies all required Whop integrations end-to-end:
1. **Real Sandbox Checkout** (Whop Elements, status verification, setup intent)
2. **Whop Leads Creation** (Visible in Whop Dashboard with metadata)
3. **Final Balance Invoicing** (Option A: `auto_charge` & Option B: `send_manual` via Whop Invoices API)
4. **Three Custom Tracking Events** (`estimate_requested`, `service_viewed`, `deposit_started`)
5. **Whop Pixel Debugger** (`?debug=1`, static dot, event inspection)

---

## 1. Whop Payments Sandbox Checkout

### Test 1.1: Inspection Booking ($149)
- [ ] Start dev server (`npm run dev`) and navigate to `http://localhost:3000`.
- [ ] Click **"Book $149 Inspection"** in the Hero section or header navigation.
- [ ] Verify checkout modal opens displaying:
  - Header: "Comprehensive Roof Inspection" and price: "$149".
  - Express Checkout element (Apple Pay / Google Pay button).
  - Full Whop Checkout element (`CheckoutElement`) with card input fields, live order summary, and pay button.
- [ ] Enter a test sandbox card in the element and complete payment:
  - Whop redirects to `/checkout/return?status=succeeded&plan=plan_xxx&payment=pay_xxx`.
  - Verify `CheckoutReturnPage` reads `status=succeeded` and renders the green confirmation card with the real `payment` ID.
  - Test negative query parameter states:
    - `/checkout/return?status=failed` -> Renders "Payment Unsuccessful".
    - `/checkout/return?status=canceled` -> Renders "Checkout Canceled".
    - `/checkout/return` (no status) -> Renders "Invalid Checkout State".

### Test 1.2: Project Deposit ($500) with Stored Payment Method (Setup Intent)
- [ ] In the pricing section, locate the **Project Deposit** card ($500).
- [ ] Click **"Reserve with $500 Deposit"**.
- [ ] Verify checkout modal displays the setup intent notice: "Card Authorized on File via Setup Intent".
- [ ] Complete payment in sandbox:
  - Redirects to `/checkout/return?status=succeeded&setup_intent_id=sint_xxx`.
  - Verify `CheckoutReturnPage` calls `GET /api/setup-intents?id=sint_xxx`.
  - Notice renders: **"Card Saved on File via Setup Intent"** with the setup intent ID or confirmed payment method ID.
  - Notice confirms $500 will be credited against the final balance invoice upon project completion.

### Test 1.3: Flat-Rate Roof Tune-Up ($299)
- [ ] Click **"Book $299 Tune-Up"**.
- [ ] Verify modal mounts with price $299.
- [ ] Complete payment and verify return receipt.

---

## 2. Lead Visible in Whop Dashboard (`POST /api/estimate`)

### Test 2.1: Client & Server Validation
- [ ] Scroll to the **Request Your Detailed Roofing Estimate** section (`#estimate`).
- [ ] Click **"Submit Estimate Request"** with blank fields.
- [ ] Verify client-side error states on Name, Email, Phone, Address, and ZIP Code.

### Test 2.2: Honeypot Anti-Spam & Rate Limiting
- [ ] Submit with the hidden `honeypot` field filled: verify server returns silent 200 without creating a lead.
- [ ] Submit 6 requests in under 60 seconds from the same IP: verify server returns HTTP 429 `"Too many requests"`.

### Test 2.3: Real Whop Dashboard Lead Creation
- [ ] Fill the form with valid homeowner data:
  - **Full Name**: `Marcus Vance`
  - **Phone**: `(555) 732-5482`
  - **Email**: `marcus.vance@example.com`
  - **Address**: `742 Evergreen Terrace`
  - **ZIP Code**: `75201`
  - **Service**: `Roof Replacement & Architectural Shingles`
  - **Notes**: `Hail damage assessment needed after recent spring storm.`
- [ ] Click **"Submit Estimate Request"**.
- [ ] Form transitions to the green **"Estimate Request Received!"** state.
- [ ] Verify in **Whop Dashboard** > **Leads**:
  - Open `https://whop.com/dashboard/leads` (or sandbox).
  - Verify a lead entry exists for `Marcus Vance`.
  - Inspect custom metadata: phone `5557325482`, address `742 Evergreen Terrace`, ZIP `75201`, and service type `roof-replacement`.

---

## 3. Final Balance Invoicing API (`POST /api/invoice/final-balance`)

Protected by `x-admin-secret` header using constant-time comparison.

### Test 3.1: Security Gate (Unauthorized Rejection)
- [ ] Send request without `x-admin-secret`:
  ```bash
  curl -X POST http://localhost:3000/api/invoice/final-balance \
    -H "Content-Type: application/json" \
    -d '{"recipientEmail": "homeowner@example.com", "originalEstimateTotal": 8500}'
  ```
- [ ] Verify server returns **HTTP 401 Unauthorized**: `"Invalid or missing x-admin-secret header"`.

### Test 3.2: Option A — Auto-Charge Saved Method (`mode: "auto_charge"`)
- [ ] Open `/admin/invoicing` in your browser.
- [ ] Enter your configured `ADMIN_SECRET`.
- [ ] Provide details:
  - **Recipient Email**: `marcus.vance@example.com`
  - **Original Estimate**: `$9,500.00`
  - **Deposit Paid**: `$500.00`
  - **Calculated Balance**: **`$9,000.00`**
  - **Mode**: Option A (Auto-Charge Saved Method)
  - **Stored Payment Method ID**: `payt_xxxxxxxxxxxx` (obtained from deposit setup intent)
- [ ] Click **"Create & Auto-Charge Balance ($9,000.00)"**.
- [ ] Verify server executes `POST /api/v1/invoices` followed by `POST /api/v1/invoices/:id/charge`.
- [ ] Open **Whop Dashboard > Invoices** to see the draft created and charge initiated.

### Test 3.3: Option B — Send Manual Invoice with Hosted Pay Link (`mode: "send_manual"`)
- [ ] On `/admin/invoicing`, select **Option B: Send Email**.
- [ ] Provide customer email and estimate total.
- [ ] Click **"Create & Email Invoice Link"**.
- [ ] Verify server executes `POST /api/v1/invoices` followed by `POST /api/v1/invoices/:id/send` with `collection_method: "send_invoice"`.
- [ ] Customer receives email with hosted invoice link (`https://whop.com/checkout/...`).

---

## 4. Custom Tracking Events (`whop.track`)

Verify the 3 required custom events:

### Test 4.1: `service_viewed`
- [ ] Click any service card on the homepage (e.g. Roof Repair, Roof Inspection, Roof Replacement).
- [ ] Verify `service_viewed` fires with `{ id, title, variantId }`.

### Test 4.2: `deposit_started`
- [ ] Click **"Reserve with $500 Deposit"** on the pricing card.
- [ ] Verify `deposit_started` fires with `{ planId, depositAmount: 500, savesCardOnFile: true }`.

### Test 4.3: `estimate_requested`
- [ ] Submit the estimate form on `#estimate`.
- [ ] Verify `estimate_requested` fires with `{ serviceType, zipCode, eventId }`.

---

## 5. Whop Pixel Debugger Toolbar

- [ ] Open `http://localhost:3000` (without query params): toolbar is **hidden**.
- [ ] Open `http://localhost:3000/?debug=1`:
  - Floating pill appears in the bottom-right corner.
  - Indicator dot is **static amber** (no pulsing or ping animations).
  - Click the pill to expand the event log.
  - Verify every triggered event (`service_viewed`, `deposit_started`, `estimate_requested`) appears with full JSON payloads in the inspector drawer.
