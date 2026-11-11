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

### 2. Lead Creation (`POST /api/estimate` → `POST /api/v1/leads`) — **BLOCKED BY WHOP API (`400`)**
- [ ] **NOT VERIFIED (Blocked as designed without `user_id`):**
  - Submitting `/api/estimate` (`roof-inspection`) to Sandbox returns exact Whop API **HTTP `400`**:
    `{"error":"user_id is required","whopStatus":400,"whopError":{"error":{"type":"bad_request","message":"user_id is required"}}}`.
  - UI surfaces the error honestly without faking success, without creating/voiding invoices, and without falsely firing `estimate_requested`.
  - Awaiting bounty-owner direction on OAuth `user_id` vs. Whop Events/CRM capture for anonymous visitors.

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
- [ ] **NOT VERIFIED (`estimate_requested`):** Intentionally suppressed when `POST /api/estimate` fails (`400 user_id is required`); awaits Leads resolution.

### 5. Webhooks & Live `whop.app` Deployment
- [ ] **NOT VERIFIED (Sandbox Webhook Delivery):** `GET /api/v1/webhooks` returned **HTTP `403`** (`Company API key is not authorized for the developer:manage_webhook scope`), `WHOP_WEBHOOK_SECRET` is unset in `.env.local`, and `http://localhost:3000` is not publicly reachable by Whop. (Worker HMAC-SHA256 verification and replay protection were verified locally in unit checks.)
- [ ] **NOT VERIFIED (`whop.app` Production Deploy — Phase 4):** Intentionally held pending Leads resolution and user approval before touching Production.
