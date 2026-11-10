/**
 * PeakGuard Roofing — Final Balance Invoice CLI Test Script
 *
 * Usage:
 *   npx tsx scripts/test-invoice.ts [auto_charge|send_manual] [recipientEmail] [estimateTotal] [paymentMethodId]
 *
 * Examples:
 *   # Option B: Send invoice to customer via email for manual payment
 *   npx tsx scripts/test-invoice.ts send_manual homeowner@example.com 8500
 *
 *   # Option A: Auto-charge customer's stored payment method (from deposit setup intent)
 *   npx tsx scripts/test-invoice.ts auto_charge homeowner@example.com 8500 payt_xxxxxxxxxxxx
 */

const ENDPOINT = process.env.INVOICE_ENDPOINT || "http://localhost:3000/api/invoice/final-balance";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "development-secret-change-me";

async function main() {
  const args = process.argv.slice(2);
  const rawMode = (args[0] || "send_manual").toLowerCase();
  const mode = rawMode === "charge" || rawMode === "auto_charge" ? "auto_charge" : "send_manual";
  const recipientEmail = args[1] || "homeowner.test@peakguardroofing.com";
  const originalEstimateTotal = parseFloat(args[2] || "8500");
  const depositPaid = 500;
  const paymentMethodId = args[3] || (mode === "auto_charge" ? "payt_mock_card_on_file_4242" : undefined);

  console.log("=================================================");
  console.log("PeakGuard Roofing — Final Balance Invoice Dispatch");
  console.log("=================================================");
  console.log(`Endpoint:        ${ENDPOINT}`);
  console.log(`Mode:            ${mode} (${mode === "auto_charge" ? "Option A: Auto-charge saved card" : "Option B: Send email link"})`);
  console.log(`Recipient:       ${recipientEmail}`);
  console.log(`Original Total:  $${originalEstimateTotal}`);
  console.log(`Deposit Credit:  $${depositPaid}`);
  console.log(`Balance Due:     $${originalEstimateTotal - depositPaid}`);
  if (paymentMethodId) {
    console.log(`Payment Method:  ${paymentMethodId}`);
  }
  console.log("-------------------------------------------------");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        recipientEmail,
        customerName: "Valued DFW Homeowner",
        originalEstimateTotal,
        depositPaid,
        paymentMethodId,
        mode,
        action: mode === "auto_charge" ? "charge" : "send",
        memo: `Final settlement for completed roofing project at ${recipientEmail}. Total $${originalEstimateTotal} less $${depositPaid} deposit paid.`,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      console.error(`❌ Invoice creation failed [${res.status}]:`, body);
      process.exit(1);
    }

    console.log("✅ Invoice successfully dispatched!");
    console.log(JSON.stringify(body, null, 2));
  } catch (err: any) {
    console.error("❌ Error executing invoice request:", err.message);
    process.exit(1);
  }
}

main();
