# PeakGuard Roofing Co. — Whop Website Template

A production-ready, reusable website template for US roofing contractors, built with **Vite + React + TypeScript + Tailwind CSS** and deployed as a Whop Website (`app_type: "website"`) on Whop's Cloudflare-powered hosting runtime.

---

## 🏗️ Implemented Whop Features Summary

PeakGuard Roofing deeply integrates with Whop's commerce and developer platform:
- **Whop Elements**: `<WhopElements>`, `<Payments>`, `<Checkout>`, `<PaymentElement>`, `<EmailElement>`, `<ExpressCheckoutElement>` (Apple Pay & Google Pay), and the mandatory `<BrandingElement>`.
- **Card-on-File Setup Intents**: Automatic `setupFutureUsage="off_session"` on the $500 Project Deposit checkout, saving customer payment methods for post-installation invoicing.
- **Whop Invoices API (`/api/v1/invoices`)**: Secure server-side endpoint (`/api/invoices/final-balance`) with both **Option A (Auto-charge stored method)** and **Option B (Send email link for manual settlement)** with deposit credit deduction.
- **Whop Visitor Tracking (`whop.track`)**: Real-time event dispatching for `estimate_requested`, `service_viewed`, and `deposit_started`, alongside standard `lead` and `view_content` events, paired with an in-browser dev debug inspector.
- **Whop Webhooks**: Cryptographic HMAC-SHA256 signature verification handling `payment.succeeded`, `setup_intent.succeeded`, and `invoice.paid`.
- **Whop Hosting Runtime**: Clean separation of client and server code via Cloudflare Workers (`ASSETS` binding, `WHOP_API_ORIGIN` proxying, zero exposed secrets).

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
git clone <repo-url> peakguard-roofing
cd peakguard-roofing
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your credentials:
```env
# Optional for local test mode (injected automatically in production runtime):
WHOP_API_ORIGIN=https://sandbox-api.whop.com
WHOP_ACCOUNT_ID=biz_xxxxxxxxxxxx
WHOP_API_KEY=your_sandbox_api_key

# Required for server-side invoice & webhook security:
WHOP_WEBHOOK_SECRET=ws_xxxxxxxxxxxx
ADMIN_SECRET=your_secure_admin_passphrase
```

### 4. Run Development Server
```bash
npm run dev
# Or run with full Whop hosting environment emulation:
whop apps dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 How to Swap Company, Services & Pricing (Reusability)

**CRITICAL ARCHITECTURE CONTRACT:**
All business data lives in **ONE file**: [`src/site.config.ts`](src/site.config.ts).
Rebranding this site for another roofing or trade company requires **ZERO edits to any React component**.

### 1. Change Company Details
Edit `siteConfig.company`:
```typescript
company: {
  name: "Apex Crest Roofing",
  tagline: "Commercial & Residential Roofing Specialists",
  phone: "+15559876543",
  phoneDisplay: "(555) 987-ROOF",
  email: "dispatch@apexcrest.com",
  license: "FL-CCC #1332091",
  insurance: "$2,000,000 Aggregate Coverage",
  // ...
}
```

### 2. Change Brand Colors
Edit `siteConfig.brand`:
```typescript
brand: {
  primaryColor: "#0f172a",   // Changes headers, buttons, dark themes
  accentColor: "#f59e0b",    // Changes accents, badges, highlights
  // ...
}
```
All components inherit these values via CSS variables automatically.

### 3. Change Services & Pricing Plans
Edit `siteConfig.services` and `siteConfig.whop.plans`:
```typescript
whop: {
  accountId: "biz_your_account_id",
  plans: {
    inspection: { id: "plan_your_inspection_id", price: 149, ... },
    deposit:    { id: "plan_your_deposit_id",    price: 500, ... },
    tuneUp:     { id: "plan_your_tuneup_id",     price: 299, ... },
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

### Option B: Via Whop SDK / API
```typescript
import { WhopClient } from "@whop/sdk";

const client = new WhopClient({ token: process.env.WHOP_API_KEY });

// 1. Create inspection plan
const inspection = await client.variants.create({
  account_id: process.env.WHOP_ACCOUNT_ID,
  product_id: "prod_xxxxxxxxxxxx",
  initial_price: 149.0,
  plan_type: "one_time",
});

// 2. Create deposit plan
const deposit = await client.variants.create({
  account_id: process.env.WHOP_ACCOUNT_ID,
  product_id: "prod_xxxxxxxxxxxx",
  initial_price: 500.0,
  plan_type: "one_time",
});
```

---

## 🚢 CLI Deployment to Whop Hosting

Deploying to Whop's globally distributed Edge runtime takes 3 steps:

### 1. Authenticate CLI
```bash
whop login
```

### 2. Initialize Website (if linking to a new domain)
```bash
whop apps init --app_type website --name "PeakGuard Roofing Co." --domain peakguard-roofing
```
This claims the `peakguard-roofing.whop.site` route and writes `whop.app.json`.

### 3. Set Runtime Secrets
```bash
whop apps secrets set --secret ADMIN_SECRET="your-32-char-random-secret"
whop apps secrets set --secret WHOP_WEBHOOK_SECRET="ws_your_webhook_secret"
```

### 4. Deploy Live
```bash
# Typechecks and builds worker + static bundle, then uploads and promotes:
whop apps deploy

# Or deploy as preview without going live immediately:
whop apps deploy --preview
```

### 5. Inspect Live Production Logs
```bash
whop apps logs app_peakguard_roofing --level info
```

---

## 🔍 How to Verify Features

### 1. Verify Leads
- Fill out the estimate form on `#estimate`.
- Client and server validate fields and check honeypot.
- Server logs lead creation to `whop apps logs`.
- Diagnostic check: GET `/api/leads` returns recent submission IDs.

### 2. Verify Tracking Events
- In dev mode, open the floating **Whop Pixel Debugger** toolbar in the bottom-right.
- View events as they trigger: `estimate_requested`, `service_viewed`, `deposit_started`.

### 3. Verify Final Balance Invoicing
- Visit `/admin/invoicing`.
- Enter your `ADMIN_SECRET`.
- Test **Option A (Auto-charge)** by passing customer email, estimate total, deposit credit, and stored `payt_...` ID.
- Test **Option B (Email send)** without a card on file to send a hosted invoice link.
- Or run the CLI test script:
  ```bash
  npx tsx scripts/test-invoice.ts send client@example.com 8500
  ```

---

## 🛡️ Security Guarantees
- **Zero Exposed Keys**: `WHOP_API_KEY` is never bundled into client JS or committed to git.
- **Runtime Injected Authentication**: Outbound calls use Whop's internal secure proxy (`WHOP_API_ORIGIN`).
- **Protected Admin Routes**: The invoicing endpoint rejects any request lacking a valid `x-admin-secret` header.
- **Honeypot + Timing Anti-Spam**: Prevents automated bot submissions on the lead generation form.
- **PCI-DSS Level 1**: All credit card processing occurs through Whop Payments iframe elements; card data never touches your application.
