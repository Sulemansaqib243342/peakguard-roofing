# PeakGuard Roofing Co. — Whop Website Template

A reusable, contractor-ready website template for US roofing companies built with **Vite + React + TypeScript + Tailwind CSS** and deployed on **Whop Websites** (`src/server/worker.ts` + `dist/client/`). All company branding, copy, services, service areas, reviews (clearly labeled sample), and per-environment Whop plan IDs live in [`src/site.config.ts`](src/site.config.ts) so rebranding requires zero component edits.

---

## Implemented Whop Architecture (Exact Element & API Mapping)

### 1. Whop Elements Used Where (`src/components/WhopCheckoutModal.tsx`)
All checkout surfaces run inside `<WhopElements elements={loadWhop()} environment={environment}>` with `payPal: "never"` (cards + Apple Pay + Google Pay only; no Stripe/PayPal/custom card forms):

- **All 3 Plans (`$149` Inspection, `$500` Deposit, `$299` Tune-Up) — Primary Payment Form (`<Payments>`):**
  - `<Payments accountId={biz_...} plan={plan_...} returnUrl={...} setupFutureUsage={isDeposit ? "off_session" : undefined}>`
  - `<EmailElement />` — buyer email collection.
  - `<PaymentElement wallets={{ applePay: "auto", googlePay: "auto", payPal: "never" }} />` — card and native wallet collection.
  - `<BrandingElement />` — **explicitly visible on every payment form** inside the modal.
  - Submit handler calls `payments.createConfirmationToken({})` -> `POST /api/pay` (`POST /api/v1/payments`) -> `whop.payments.handleNextAction({ clientSecret, returnUrl })`, then redirects to `/checkout/return` where `?status=`, `payment`, and card-save status (`GET /api/payments`) are verified.
- **Inspection (`$149`) & Tune-Up (`$299`) — Express Checkout Row (`<Checkout>`):**
  - Mounts an additional `<Checkout plan={plan_...} returnUrl={...}><ExpressCheckoutElement wallets={{ applePay: "auto", googlePay: "auto", payPal: "never" }} /></Checkout>` above the primary `<Payments>` form for one-press Apple Pay / Google Pay checkout.
  - Not mounted on the `$500` deposit because `setupFutureUsage="off_session"` requires the `<Payments>` confirmation-token flow (or a dedicated Checkout Configuration).
- **Apple Pay Domain Verification Note:**
  - Per Whop's `ExpressCheckoutElement` and `PaymentElement` docs, Apple Pay (and wallet express buttons on third-party/embedded origins) only renders when the page's serving domain is verified for Apple Pay through Whop's **Domains API** (first-party `whop.com` pages are pre-approved; on `localhost` or an unverified custom domain, `ExpressCheckoutElement` hides unavailable wallet buttons automatically while `<PaymentElement>` remains ready).

### 2. Card-on-File (`$500` Project Deposit) & Server-Side Lookup
- The `$500` project deposit mounts `<Payments setupFutureUsage="off_session" ...>` so Whop authorizes saving the payment method (`payt_...`) on the `member_` record without building custom card forms or storing any raw card data.
- `POST /api/webhooks/whop` verifies Standard Webhooks HMAC-SHA256 signatures (`webhook-id`, `webhook-timestamp`, `webhook-signature` against `WHOP_WEBHOOK_SECRET`), enforces a **5-minute (300s) replay window** and duplicate-ID guard, and caches `payment.succeeded` / `setup_intent.succeeded` method IDs in memory.
- Without KV/D1, `/admin/invoicing` queries Whop's authoritative server APIs (`GET /api/v1/members?account_id=...&query=...` and `GET /api/v1/payment_methods?member_id=...`) via `GET /api/admin/customer-lookup` to show the matched customer and saved card (**brand + last4** only).

### 3. Estimate Request / Whop Events & Leads (`POST /api/estimate` & `POST /api/leads`)
- Enforces IP rate limiting (5 requests/min), hidden honeypot field, 1.5s time-to-fill anti-bot check, and strict input validation.
- Checks `GET /api/v1/members?account_id=...&query={email}`: if an existing Whop member with a `user_id` matches the email, creates a **Whop Lead** via `POST /api/v1/leads`.
- For all visitors (anonymous and returning), records a **`lead` event** via `POST /api/v1/events` (`event_name: "lead"`, customer contact info inside `user: { email, name, first_name, last_name, phone, postal_code }`) and optionally forwards to `CRM_WEBHOOK_URL` if configured.
- Whop's `POST /api/v1/leads` requires a Whop `user_id`; using Whop Events (`POST /api/v1/events`) handles anonymous visitors without creating/voiding invoices or faking success (returns an honest error if recording fails).

### 4. Final-Balance Invoicing (`/admin/invoicing` -> `POST /api/invoice/final-balance`)
- Protected by constant-time `x-admin-secret` verification against `ADMIN_SECRET` (`/api/admin/verify` + all `/api/admin/*` and `/api/invoice/*` routes).
- Deducts `depositPaid` (default `$500`) from `originalEstimateTotal` and creates a draft invoice via `POST /api/v1/invoices` (`Api-Version-Date: 2026-11-10`) using inline one-time `items[].variant`:
  - **Mode A (`auto_charge`)**: Requires matching/selecting a `payt_...` method **and** explicit admin checkbox confirmation (`confirmAutoCharge: true`), then calls `POST /invoices/:id/issue` followed by `POST /invoices/:id/charge`.
  - **Mode B (`send_manual`)**: Calls `POST /invoices/:id/send` to issue and email the hosted `checkout_link` to the homeowner without auto-charging.

### 5. Whop Pixel Tracking (`src/lib/tracking.ts`)
- Custom events dispatched via `window.whop.track`:
  - `estimate_requested` (on verified `/api/estimate` success)
  - `service_viewed` (when inspecting service cards/CTAs)
  - `deposit_started` (when initiating the `$500` deposit checkout)
- Automatic page views and checkout views handled by Whop hosting are **not** duplicated.
- Append `?debug=1` to any URL to show the in-page **Whop Pixel Debugger** (`DevTrackingToolbar`).

---

## Single-File Rebranding & Environment Plan Switching

Edit only [`src/site.config.ts`](src/site.config.ts) to swap:
- `company` (name, phone, email, address, license/insurance placeholders)
- `brand` (primary/accent colors, logo text)
- `services`, `serviceAreas`, `reviews` (clearly marked sample), `faqs`, `trustStats`
- `whop.environments.sandbox` & `whop.environments.production` (`accountId` and `inspection` / `deposit` / `tuneUp` `plan_` IDs), or set `VITE_WHOP_ENVIRONMENT`, `VITE_WHOP_ACCOUNT_ID`, `VITE_WHOP_PLAN_INSPECTION`, `VITE_WHOP_PLAN_DEPOSIT`, `VITE_WHOP_PLAN_TUNEUP` without editing any React component.

---

## Local Setup & Minimum API Permissions

Copy `.env.example` to `.env.local` (gitignored; **never commit secrets**):

```bash
cp .env.example .env.local
```

Minimum scopes needed on your Whop Company API key (`WHOP_API_KEY`):
- `access_pass:basic:read`, `access_pass:create`, `plan:create`
- `payment:basic:read`, `payment:charge`
- `invoice:create`, `invoice:update`
- `member:basic:read`, `member:email:read`, `member:payment_methods:read`
- `lead:manage`, `event:create`

Run locally:
```bash
npm install
npm run dev          # Starts Vite + local Worker API middleware on http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run build        # Client build (dist/client) + Worker bundle (dist/server/index.js)
```

Production secrets (run interactively yourself; never commit):
```bash
npx @whop/cli apps secrets set --secret WHOP_API_KEY=...
npx @whop/cli apps secrets set --secret WHOP_WEBHOOK_SECRET=ws_...
npx @whop/cli apps secrets set --secret ADMIN_SECRET=...
npx @whop/cli apps deploy
```
