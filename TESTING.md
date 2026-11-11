# PeakGuard Roofing — Verification & Testing Ledger

Every check below reflects **strictly observed** results. Features that require live Sandbox credentials (`.env.local` with Sandbox `WHOP_API_KEY` and `WHOP_ACCOUNT_ID`) remain marked **NOT VERIFIED** until executed against `https://sandbox-api.whop.com`.

---

## Automated Local & Build Checks (Verified)

- [x] `npm run typecheck` (`tsc --noEmit`): Passed with exit code `0` after final code edits.
- [x] `npm run build` (`vite build && vite build --mode worker`): Passed with exit code `0`, emitting `dist/client/` and `dist/server/index.js`.
- [x] Worker unit verification against `dist/server/index.js`:
  - [x] `GET /api/health` (`200`) and `GET /api/public-config` (`200`, `environment: "sandbox"`, zero secrets exposed).
  - [x] Same-origin CORS policy (`Access-Control-Allow-Origin` locked to request origin).
  - [x] Estimate validation (`422`), honeypot suppression (`200` silent without creating lead), honest `503` failure when `WHOP_API_KEY` is missing (no fake success), and sliding-window rate limit (`429` on 6th attempt).
  - [x] Admin authentication (`401` on missing/bad `x-admin-secret`, `200` on match), zero-balance rejection (`400`), and `confirmAutoCharge: true` enforcement (`400` when false).
  - [x] Webhook HMAC-SHA256 verification (`401` expired timestamp > 300s, `401` bad signature, `200 { received: true }` valid signature including rotated space-delimited header, `200 { received: true, duplicate: true }` replay guard).

---

## Live Whop Sandbox End-to-End Checks

> Status: **NOT VERIFIED** — `.env.local` does not yet contain a Whop Sandbox Company API key (`WHOP_API_KEY`) or Sandbox account ID (`WHOP_ACCOUNT_ID`).

### 1. Sandbox Plans & Checkout (`$149`, `$500`, `$299`)
- [ ] **NOT VERIFIED:** Create 3 real one-time plans in Whop Sandbox (`$149` Inspection, `$500` Deposit, `$299` Tune-Up) and set IDs in [src/site.config.ts](src/site.config.ts) (`whop.environments.sandbox.plans`) or `.env.local`.
- [ ] **NOT VERIFIED:** `$149` Inspection Sandbox checkout completes via `<WhopElements environment="sandbox">` + `<Payments>` (`<EmailElement />`, `<PaymentElement />`, `<BrandingElement />` visible) and `<Checkout><ExpressCheckoutElement /></Checkout>`, landing on `/checkout/return?status=succeeded&payment=pay_...`.
- [ ] **NOT VERIFIED:** `$500` Project Deposit Sandbox checkout completes via `<Payments setupFutureUsage="off_session">` + `POST /api/pay` (`POST /api/v1/payments`), saving `payment_method_id` (`payt_...`) on the `member_` record and emitting `payment.succeeded`.
- [ ] **NOT VERIFIED:** `$299` Roof Tune-Up Sandbox checkout completes end-to-end and lands on `/checkout/return?status=succeeded`.

### 2. Lead Visible in Whop Sandbox Dashboard (`POST /api/estimate`)
- [ ] **NOT VERIFIED:** Live Sandbox test of `POST /api/v1/leads` **without `user_id`** via `/api/estimate`.
  - *Required action once `.env.local` is populated:* Submit `/api/estimate` against Sandbox and record exact HTTP response. If Whop rejects without `user_id`, report options before deciding whether/how to map users.
- [ ] **NOT VERIFIED:** Lead visible under **Whop Sandbox Dashboard > Leads** with customer metadata (`customer_name`, `customer_email`, `customer_phone`, `property_address`, `zip_code`, `service_type`).

### 3. Final-Balance Invoice (`/admin/invoicing`)
- [ ] **NOT VERIFIED:** Authenticate `/admin/invoicing` via `POST /api/admin/verify` (`x-admin-secret`).
- [ ] **NOT VERIFIED:** Click **Lookup Customer & Saved Card** (`GET /api/admin/customer-lookup`) and confirm matched member + saved card brand and `last4`.
- [ ] **NOT VERIFIED:** **Mode A (`auto_charge`)** with explicit confirmation checkbox: creates draft via `POST /api/v1/invoices` for `$OriginalTotal - $500`, calls `/issue` then `/charge`, and shows `paid` status in Whop Dashboard.
- [ ] **NOT VERIFIED:** **Mode B (`send_manual`)**: creates draft via `POST /api/v1/invoices` for `$OriginalTotal - $500`, calls `POST /invoices/:id/send`, and returns usable `checkout_link`.

### 4. Custom Whop Tracking Events & Debugger (`?debug=1`)
- [ ] **NOT VERIFIED (live browser session):** Open `?debug=1` in Chrome and verify all 3 custom events fire into the **Whop Pixel Debugger** and `window.whop.track`:
  - `service_viewed` (clicking a service card CTA)
  - `deposit_started` (clicking `$500` deposit booking CTA)
  - `estimate_requested` (after verified `/api/estimate` success)

### 5. Live `whop.app` Deployment
- [ ] **NOT VERIFIED:** Deploy updated build via `npx @whop/cli apps deploy` after Sandbox checks and Production secrets (`WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `ADMIN_SECRET`) are set.
