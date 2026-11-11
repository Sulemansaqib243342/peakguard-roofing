const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

async function recordDemo() {
  const videoDir = path.resolve(__dirname, "../demo-videos");
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log("🚀 Launching Chrome to record full professional demo...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5, // Crisp retina-like rendering
  });

  const page = await context.newPage();

  // Helper for smooth cinematic scrolling
  async function smoothScrollBy(deltaY, durationMs = 1800) {
    await page.evaluate(
      async ({ deltaY, durationMs }) => {
        await new Promise((resolve) => {
          const startY = window.scrollY;
          const targetY = startY + deltaY;
          const diff = targetY - startY;
          const startTime = performance.now();
          function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            window.scrollTo(0, startY + diff * ease);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(step);
        });
      },
      { deltaY, durationMs }
    );
    await page.waitForTimeout(durationMs + 400);
  }

  async function smoothScrollToElement(selector, durationMs = 1800) {
    await page.evaluate(
      async ({ selector, durationMs }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const startY = window.scrollY;
        const targetY = startY + rect.top - 80;
        const diff = targetY - startY;
        const startTime = performance.now();
        await new Promise((resolve) => {
          function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            window.scrollTo(0, startY + diff * ease);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(step);
        });
      },
      { selector, durationMs }
    );
    await page.waitForTimeout(durationMs + 400);
  }

  try {
    console.log("🌐 Navigating to PeakGuard Roofing live site...");
    await page.goto("https://peakguard-roofing.whop.site", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 1. Hero Showcase
    console.log("🎬 Scene 1: Hero Section & Credentials...");
    await page.mouse.move(300, 250);
    await page.waitForTimeout(1000);
    await page.mouse.move(500, 420); // hover on CTA
    await page.waitForTimeout(1200);

    // 2. Trust Bar
    console.log("🎬 Scene 2: Performance Indicators & Trust Stats...");
    await smoothScrollBy(500, 1500);
    await page.waitForTimeout(2000);

    // 3. Core Services
    console.log("🎬 Scene 3: Core Roofing Services...");
    await smoothScrollToElement("#services", 1800);
    await page.waitForTimeout(1500);

    // Hover through service cards
    await page.mouse.move(400, 450);
    await page.waitForTimeout(800);
    await page.mouse.move(750, 450);
    await page.waitForTimeout(800);
    await page.mouse.move(1100, 450);
    await page.waitForTimeout(1200);

    // 4. How It Works
    console.log("🎬 Scene 4: How It Works & Whop Payments Integration...");
    await smoothScrollToElement("#how-it-works", 1800);
    await page.waitForTimeout(2500);

    // 5. Pricing Cards & Whop Checkout Modal
    console.log("🎬 Scene 5: Interactive Pricing & Whop Checkout Modal...");
    await smoothScrollToElement("#pricing", 1800);
    await page.waitForTimeout(1800);

    // Open $149 Inspection Checkout Modal
    console.log("💳 Opening $149 Inspection Whop Checkout Modal...");
    const inspectionBtn = await page.$("button:has-text('Book $149 Inspection')");
    if (inspectionBtn) {
      await inspectionBtn.click();
      await page.waitForTimeout(3000); // Wait for modal & Whop elements iframe to render
      // Hover inside modal
      await page.mouse.move(720, 400);
      await page.waitForTimeout(2500);

      // Close modal
      const closeBtn = await page.$("button[aria-label='Close Checkout']");
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(1500);
    }

    // Open $500 Deposit Modal (demonstrate card-on-file)
    console.log("💳 Opening $500 Project Deposit Modal...");
    const depositBtn = await page.$("button:has-text('Reserve with $500 Deposit')");
    if (depositBtn) {
      await depositBtn.click();
      await page.waitForTimeout(3000);
      await page.mouse.move(720, 380);
      await page.waitForTimeout(2500);
      const closeBtn = await page.$("button[aria-label='Close Checkout']");
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(1500);
    }

    // 6. Financing Callout
    console.log("🎬 Scene 6: Financing Callout...");
    await smoothScrollToElement("#financing", 1600);
    await page.waitForTimeout(2000);

    // 7. Service Areas
    console.log("🎬 Scene 7: Service Areas...");
    await smoothScrollToElement("#service-area", 1600);
    await page.waitForTimeout(2000);

    // 8. Reviews
    console.log("🎬 Scene 8: Verified Homeowner Reviews...");
    await smoothScrollToElement("#reviews", 1600);
    await page.waitForTimeout(2000);

    // 9. FAQ Accordion Interaction
    console.log("🎬 Scene 9: FAQ Section & Interactive Accordion...");
    await smoothScrollToElement("#faq", 1600);
    await page.waitForTimeout(1500);
    // Click first FAQ to expand
    const faqBtn = await page.$("#faq button");
    if (faqBtn) {
      await faqBtn.click();
      await page.waitForTimeout(2000);
    }

    // 10. Estimate Form Live Submission
    console.log("🎬 Scene 10: Real Estimate Request Form Submission...");
    await smoothScrollToElement("#estimate", 1800);
    await page.waitForTimeout(1500);

    // Fill form fields with typing simulation
    console.log("📝 Typing customer details...");
    await page.fill("input[name='name']", "Michael Vance");
    await page.waitForTimeout(300);
    await page.fill("input[name='phone']", "(214) 555-0198");
    await page.waitForTimeout(300);
    await page.fill("input[name='email']", "michael.vance@example.com");
    await page.waitForTimeout(300);
    await page.fill("input[name='address']", "742 Evergreen Terrace");
    await page.waitForTimeout(300);
    await page.fill("input[name='zipCode']", "75201");
    await page.waitForTimeout(300);
    await page.selectOption("select[name='serviceType']", "roof-repair");
    await page.waitForTimeout(300);
    await page.fill("textarea[name='notes']", "Hail damage assessment needed after recent North Texas storm.");
    await page.waitForTimeout(1000);

    // Submit form
    console.log("📤 Submitting estimate request...");
    const submitBtn = await page.$("#estimate button[type='submit']");
    if (submitBtn) {
      await submitBtn.click();
      // Wait for submission response
      await page.waitForTimeout(3000);
      console.log("✅ Live form submission completed!");
      await page.waitForTimeout(2500);
    }

    // 11. Whop Return Page Showcase
    console.log("🎬 Scene 11: Whop Checkout Return Page (Success State)...");
    await page.goto(
      "https://peakguard-roofing.whop.site/checkout/return?status=succeeded&payment=pay_demo_success_8932",
      { waitUntil: "networkidle" }
    );
    await page.waitForTimeout(4000);

    console.log("✨ Demo recording finished successfully!");
  } catch (err) {
    console.error("❌ Recording error:", err);
  } finally {
    await context.close();
    await browser.close();
  }

  // Find and rename the generated video
  const files = fs.readdirSync(videoDir);
  const webmFile = files.find((f) => f.endsWith(".webm") && f.startsWith("page@"));
  if (webmFile) {
    const finalPath = path.join(videoDir, "peakguard-roofing-demo.webm");
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    fs.renameSync(path.join(videoDir, webmFile), finalPath);
    console.log(`🎉 Demo video saved to: ${finalPath}`);
  }
}

recordDemo();
