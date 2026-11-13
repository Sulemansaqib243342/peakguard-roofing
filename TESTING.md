# PeakGuard Roofing — Verification & Testing Ledger

Every check below reflects **strictly observed** results from this repository build and live Whop Sandbox testing (`https://sandbox-api.whop.com`, account `biz_SoVdSxgQRBf3Vl`). Unverified or gated flows are explicitly marked **NOT VERIFIED**.

---

## Automated Local & Build Checks (Verified)

- [x] `npm run typecheck` (`tsc --noEmit`): Passed with exit code `0` after final code edits.
- [x] `npm run build` (`vite build && vite build --mode worker`): Passed with exit code `0`, emitting `dist/client/` and `dist/server/index.js`.
- [x] Responsive visual & DOM overflow audit (`http://localhost:3000/` via headless Chrome/Playwright):
  - [x] `1280x800`: `scrollWidth === innerWidth` (`1280`), `overflowX: false`, zero page errors.
  - [x] `768x1024`: `scrollWidth === innerWidth` (`768`), `overflowX: false`, zero page errors.
  - [x] `375x812`: `scrollWidth === innerWidth` (`375`), `overflowX: false`, zero page errors.
- [x] Direct SPA route navigation verification:
  - [x] `GET /checkout/return?key=deposit&plan=plan_JVuQdLG7P01O3&payment=pay_cLIyfcc5r5SJZj&status=succeeded` → HTTP `200`, renders confirmed status, payment ID, and verified Visa `•••• 4242` (`payt_OXKOSqV9cc19C`).
- [x] Secret leak check: `git grep` and `git log --all -S` confirmed zero `.env.local` secrets committed in working tree or git history.

---

## Live Whop Sandbox End-to-End Checks (`biz_SoVdSxgQRBf3Vl`)

### 1. Sandbox Plans & Checkout (`$149`, `$500`, `$299`)
- [x] **Phase 1 — 3 One-Time Sandbox Plans created & retrieved (`GET /api/v1/variants/:id` → `200`):**
  - `$149` Inspection: `prod_J21HMu9UTIroA` / `plan_UaHFI1wRcu06K` (`VITE_WHOP_SANDBOX_PLAN_INSPECTION`)
  - `$500` Deposit: `prod_CBe2qDVQmNPHE` / `plan_JVuQdLG7P01O3` (`VITE_WHOP_SANDBOX_PLAN_DEPOSIT`)
  - `$299` Tune-Up: `prod_aN4H7K827e3fU` / `plan_iot7pvi117pGc` (`VITE_WHOP_SANDBOX_PLAN_TUNEUP`)
- [x] **Modal Element Coexistence (`WhopCheckoutModal.tsx`):**
  - `$149`, `$299`, and `$500` modals open cleanly in the redesigned UI (`$149`/`$299` `elementCount=5`, `$500` `iframeOrElementCount=4`, zero `pageErrors`).
- [x] **Sandbox Card Checkouts (`4242 4242 4242 4242`, pre-redesign JSX pass):**
  - `$149` Inspection completed: payment `pay_e1a6p4xH8f274Y` (`status=succeeded`).
  - `$299` Roof Tune-Up completed: payment `pay_kCIi3tH92lOiZP` (`status=succeeded`).
  - `$500` Deposit completed (`sandbox.deposit.test@example.com`): payment `pay_cLIyfcc5r5SJZj` (`status=succeeded`), `GET /api/payments?id=pay_cLIyfcc5r5SJZj` → `200` returning `payment_method_id: "payt_OXKOSqV9cc19C"`, `card: {"brand":"visa","last4":"4242"}`.

### 2. Estimate / Lead Flow (`POST /api/estimate`) — **Verified via Whop Events API + Leads**
- [x] **Anonymous Visitor (`POST /api/v1/events`):** Verified live in Sandbox (`POST /api/v1/leads` without `user_id` rejected with `HTTP 400: user_id is required`). Per approved architecture, anonymous estimate submissions record via `POST /api/v1/events` (`event_name: "lead"`):
  - UI submission (`anon.homeowner.test@example.com`, `roof-inspection`) → **HTTP `200`**, `whopEventId: "biz_SoVdSxgQRBf3Vl:lead_1794410184920_ttc6re"`, renders `"Estimate Request Received"`, and fires `lead` + `estimate_requested` once via `?debug=1`.
- [x] **Returning Member (`POST /api/v1/leads` with resolved `user_id` + Events):**
  - Submission for `sandbox.deposit.test@example.com` resolved `mber_9wkLr8vMbFu2G` → created real Lead **`lead_4tB9gxhe9NQB7`** AND Event **`biz_SoVdSxgQRBf3Vl:lead_1794410187619_p8x3hl`** (**HTTP `200`**).
  - Note: `GET /api/v1/leads` list endpoint returned `403 You are not authorized` because the key has write `lead:manage` rather than read `lead:basic:read`.

### 3. Final-Balance Invoice (`/admin/invoicing`)
- [x] Admin gate (`POST /api/admin/verify` via `x-admin-secret`) unlocks workspace.
- [x] **Customer & Saved Card Lookup (`GET /api/admin/customer-lookup` → `200`):** Matched `sandbox.deposit.test@example.com` (`member.id: "mber_9wkLr8vMbFu2G"`, `payt_OXKOSqV9cc19C`, `VISA •••• 4242`, exp `12/2034`).
- [x] **Explicit Confirmation Guard:** Auto-charge submit button stays disabled until explicit confirmation checkbox is checked (`disabledBeforeCheck: true`, `disabledAfterCheck: false`).
- [x] **Draft Invoice Creation & Retrieval (`$500` deposit credited accurately):**
  - Mode B (`send_manual`, `$2,500 - $500 = $2,000.00`): draft `pay_dp6LtIjGxLhNez` (`#00000001`, retrieved via `GET /api/v1/invoices/pay_dp6LtIjGxLhNez` → `200`).
  - Mode A (`auto_charge`, `$1,500 - $500 = $1,000.00`, `payt_OXKOSqV9cc19C`): draft `pay_ps23k84O6BNtMi` (`#00000002`, retrieved via `GET /api/v1/invoices/pay_ps23k84O6BNtMi` → `200`).
- [ ] **NOT VERIFIED (`send` / `issue` / `charge` transition):** Calling `/send` and `/issue` on Sandbox account `biz_SoVdSxgQRBf3Vl` returns **HTTP `400`**: `"Complete account verification before issuing an invoice"` (`code: "invoice_account_verification_required"`). Full `sent`/`paid` status transition requires completing Sandbox business verification.

### 4. Custom Whop Tracking Events & Debugger (`?debug=1`)
- [x] `service_viewed`: Fires once per service CTA click (`variant_id: "plan_JVuQdLG7P01O3"`, `service_id: "roof-replacement"`).
- [x] `deposit_started`: Fires once per deposit CTA click (`value: 500`, `currency: "USD"`, `setup_future_usage: "off_session"`).
- [x] `estimate_requested`: Verified firing once on confirmed `POST /api/estimate` `200` (`?debug=1` captured `lead` + `estimate_requested`).

### 5. Production Setup & Live `whop.site` Deployment (`biz_U6yyBOj3Nsovqv`)
- [x] **3 One-Time Production Plans created & retrieved (`whop variants get`):**
  - `$149` Inspection: `prod_GZrvHR6oI6axq` / `plan_w5qRLZ3xdHyO5`
  - `$500` Project Deposit: `prod_ihwCgXdbOcBC1` / `plan_LGqPPEBKD3a9C`
  - `$299` Roof Tune-Up: `prod_GFkKOXFLJfpXU` / `plan_X2YKQiiIRfqFd`
- [x] **Deployed & Promoted (`npx whop apps deploy`):** Build `apbu_AFhm2ZaApn5rA` (`status: approved`, `is_production: true`) live at **`https://peakguard-roofing.whop.site`**.
- [x] **Live Production Secrets Configured via `whop apps secrets set`:**
  - `ADMIN_SECRET`: Configured securely, verified with `POST /api/admin/verify` → `200 {"authenticated":true}`.
  - `WHOP_WEBHOOK_SECRET`: Configured securely (`ws_...`).
- [x] **Live Production Webhook Verification (`POST /api/webhooks/whop`):**
  - Endpoint registered in Whop Developer Dashboard: `https://peakguard-roofing.whop.site/api/webhooks/whop`.
  - Valid HMAC-SHA256 signature (`payment.succeeded`, `$149.00 USD`) → **HTTP `200` `{"received":true}`**, appears live in `/admin/events`.
  - Replay / Tolerance guard: Expired timestamp (>300s) rejected with **HTTP `401` `{"error":"Webhook timestamp expired or out of tolerance"}`**.
  - Signature integrity guard: Forged signature rejected with **HTTP `401` `{"error":"Invalid webhook signature"}`**.
- [x] **Live Production Admin Views Matching Reference Video:**
  - `/admin/invoicing`: Final balance invoicing with customer & card-on-file lookup, auto-charge guard, and manual balance modes.
  - `/admin/leads`: Real-time dashboard pulling submissions from Whop Leads & Events API with search, service filters, and "Invoice Customer" action.
  - `/admin/events`: Real-time pixel & webhook telemetry table with live stats, event filters, and "Fire Test Event" action.
  - Direct SPA navigation across all admin routes (`/admin`, `/admin/invoicing`, `/admin/leads`, `/admin/events`) → HTTP `200`.
- [ ] **NOT VERIFIED (Live Invoice Issue / Auto-Charge on Production):** Blocked by Whop until merchant KYC is completed on account `biz_U6yyBOj3Nsovqv`. Attempting to issue/send live invoices returns HTTP `400` with code `invoice_account_verification_required`. Completing merchant onboarding in Whop dashboard unblocks live invoicing.
