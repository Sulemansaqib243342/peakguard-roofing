# PeakGuard Roofing Co. — Whop Website Template

A production-ready, reusable website template for US roofing contractors, built with **Vite + React + TypeScript + Tailwind CSS** and deployed as a Whop Website (`app_type: "website"`) on Whop's Cloudflare-powered hosting runtime at a live **`<route>.whop.app`** URL.

---

## 🏗️ Implemented Whop Features Summary

PeakGuard Roofing deeply integrates with Whop's developer and commerce platform:
- **Whop Elements**: `<WhopElements>`, `<Checkout>`, `<CheckoutElement>`, and `<ExpressCheckoutElement>` (Apple Pay & Google Pay) with complete PCI-DSS Level 1 isolation, live quotes, and embedded pay flow.
- **Card-on-File Tokenization (Setup Intents)**: Deposit checkout authorized and saved on file via Whop setup intent (`setup_future_usage: "off_session"`), with server-side retrieval (`GET /api/v1/setup-intents/:id`) confirming stored payment methods for final balance billing.
- **Whop Leads API (`POST /api/v1/leads`)**: Validated server-side handler (`POST /api/estimate`) creating customer leads in the Whop dashboard with full custom metadata (`lead:manage` scope, honeypot anti-spam, and sliding-window rate limiting).
- **Whop Invoices API (`POST /api/v1/invoices`)**: Secure server-side endpoint (`POST /api/invoice/final-balance`) with constant-time `x-admin-secret` authentication supporting both **Option A (Auto-charge stored method via `/invoices/:id/charge`)** and **Option B (Send manual invoice with hosted pay link via `/invoices/:id/send`)**, automatically deducting deposit credits.
- **Whop Visitor Tracking (`whop.track`)**: Real-time custom event dispatching for `estimate_requested`, `service_viewed`, and `deposit_started`, alongside standard conversion events, paired with an in-browser debugger visible only via `?debug=1`.
- **Whop Webhooks**: Standard Webhooks HMAC-SHA256 signature verification with 5-minute replay-window enforcement, handling `payment.succeeded`, `setup_intent.succeeded`, and `invoice.paid`.
- **Whop Hosting Runtime & Outbound Proxy**: Server runtime (`src/server/worker.ts`) built to `dist/server/index.js` and packed into `dist/whop-build.zip` via the `@whop/cli/vite` plugin, utilizing Whop's outbound signing proxy (`WHOP_API_ORIGIN`) with zero client-exposed secrets.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ (Node 24 recommended)
- npm or pnpm
- [Whop CLI](https://docs.whop.com/developer/websites/quickstart.md):
  ```bash
  npm install -g @whop/cli
  # or
  curl -fsSL https://whop.com/install.sh | sh
  ```

### 2. Install Dependencies
```bash
git clone https://github.com/Sulemansaqib243342/peakguard-roofing.git
cd peakguard-roofing
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your credentials:
```env
# Optional for local test mode (injected automatically in Whop production runtime):
WHOP_API_ORIGIN=https://sandbox-api.whop.com
WHOP_ACCOUNT_ID=biz_xxxxxxxxxxxx
WHOP_API_KEY=your_sandbox_api_key

# Required for server-side invoice & webhook security:
ADMIN_SECRET=your_secure_admin_passphrase_here
WHOP_WEBHOOK_SECRET=ws_your_webhook_secret_here
```

### 4. Run Development Server
```bash
npm run dev
# Or run with full Whop hosting environment emulation:
npx @whop/cli apps dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 How to Swap Company, Services & Pricing (Reusability)

**CRITICAL ARCHITECTURE CONTRACT:**
All business data lives in **ONE file**: [`src/site.config.ts`](src/site.config.ts).
Rebranding this site for another roofing or trade company requires **ZERO edits to any React component**.

### 1. Change Company Details
Edit `siteConfig.company` in [`src/site.config.ts`](src/site.config.ts):
```typescript
company: {
  name: "Apex Crest Roofing",
  tagline: "Commercial & Residential Roofing Specialists",
  phone: "+15559876543",
  phoneDisplay: "(555) 987-ROOF",
  email: "dispatch@apexcrest.com",
  license: "FL-CCC #1332091 (Sample License)",
  insurance: "$2,000,000 Aggregate Coverage (Sample)",
  // ...
}
```

### 2. Change Brand Colors
Edit `siteConfig.brand`:
```typescript
brand: {
  primaryColor: "#0f172a",   // Slate-900 (Headers, hero, nav)
  accentColor: "#f59e0b",    // Amber-500 (Contractor gold CTA)
  // ...
}
```

### 3. Change Services & Pricing Plans
Edit `siteConfig.services` and `siteConfig.whop.plans`:
```typescript
whop: {
  websiteRoute: "your-company-route",
  accountId: "", // Injected automatically by Whop hosting runtime
  plans: {
    inspection: { id: "plan_your_inspection_id", price: 149, priceDisplay: "$149", ... },
    deposit:    { id: "plan_your_deposit_id",    price: 500, priceDisplay: "$500", ... },
    tuneUp:     { id: "plan_your_tuneup_id",     price: 299, priceDisplay: "$299", ... },
  }
}
```

---

## 💳 How to Create Plans in Whop

To connect real checkout plans:

### Option A: Via Whop Dashboard
1. Go to [https://dash.whop.com](https://dash.whop.com) (or [sandbox.whop.com](https://sandbox.whop.com)).
2. Navigate to **Products** > **Create Product** (e.g. "Roofing Services").
3. Create 3 pricing plans:
   - **Roof Inspection**: One-time payment of **$149.00 USD**.
   - **Project Deposit**: One-time payment of **$500.00 USD**.
   - **Roof Tune-Up**: One-time payment of **$299.00 USD**.
4. Copy each plan's ID (`plan_xxxxxxxxxxxx`) and paste it into [`src/site.config.ts`](src/site.config.ts).

### Option B: Via Whop CLI / API
```bash
npx @whop/cli products create --name "Roofing Services"
npx @whop/cli variants create --product_id prod_xxxx --title "Roof Inspection" --initial_price 149 --billing_type one_time
npx @whop/cli variants create --product_id prod_xxxx --title "Project Deposit" --initial_price 500 --billing_type one_time
npx @whop/cli variants create --product_id prod_xxxx --title "Roof Tune-Up" --initial_price 299 --billing_type one_time
```

---

## 🚢 CLI Deployment to Whop Hosting

Deploying to Whop's globally distributed Edge runtime served at a live **`<route>.whop.app`** URL:

### 1. Authenticate CLI
```bash
npx @whop/cli auth login
```
*(Or interactive login with your business account selection).*

### 2. Initialize Website App
```bash
npx @whop/cli apps init --app_type website --name "PeakGuard Roofing Co." --domain peakguard-roofing
```
This claims your route (`peakguard-roofing.whop.app`) and writes `whop.app.json`.

### 3. Set Runtime Secrets (Encrypted at rest)
```bash
npx @whop/cli apps secrets set --secret ADMIN_SECRET="your-32-char-random-secret"
npx @whop/cli apps secrets set --secret WHOP_WEBHOOK_SECRET="ws_your_webhook_secret"
```

### 4. Deploy Live
```bash
# Typechecks, builds client + server worker, packs dist/whop-build.zip, uploads and promotes:
npx @whop/cli apps deploy

# Or deploy as preview without promoting:
npx @whop/cli apps deploy --preview
```

### 5. Inspect Live Production Logs
```bash
npx @whop/cli apps logs app_peakguard_roofing --level info
```

---

## 🔍 How to Verify Features

### 1. Verify Leads in Whop Dashboard
- Fill out the estimate form on `#estimate`.
- Submit the form (schema validated, honeypot checked, rate-limited to 5 req/min).
- Go to **Whop Dashboard > Leads**.
- Verify the lead appears with the name, email, phone, street address, ZIP code, and service requested.

### 2. Verify Tracking Events
- Open the site with `?debug=1` in the URL (e.g. `http://localhost:3000/?debug=1`).
- The floating **Whop Pixel Debugger** toolbar appears in the bottom-right corner with a static amber indicator.
- Click to expand and view the 3 custom events as they fire:
  - `estimate_requested` (upon estimate form submission)
  - `service_viewed` (upon clicking any service card)
  - `deposit_started` (upon clicking Project Deposit checkout)

### 3. Verify Final Balance Invoicing
- Visit `/admin/invoicing` with your `ADMIN_SECRET`.
- **Option A (Auto-charge)** (`mode: "auto_charge"`): Charges the customer's stored payment method (`payt_...`) off-session via `POST /invoices/:id/charge`.
- **Option B (Send manual invoice)** (`mode: "send_manual"`): Creates the invoice and emails a hosted payment link to the customer via `POST /invoices/:id/send`.
- View the issued invoice under **Whop Dashboard > Invoices**.

---

## 🛡️ Security Guarantees
- **Zero Exposed Keys**: `WHOP_API_KEY` is strictly server-side; never bundled in browser JS.
- **Runtime Signed Proxy**: Outbound calls use Whop's internal secure proxy (`WHOP_API_ORIGIN`).
- **Protected Admin Routes**: Constant-time comparison ensures timing-attack resistant authentication for invoicing.
- **Webhooks Verification**: Cryptographic HMAC-SHA256 signature verification with 5-minute replay window check.
- **Same-Origin CORS**: Restricts API calls to legitimate host origins.
- **PCI-DSS Level 1**: Card details are collected exclusively in Whop's hosted iframes.
