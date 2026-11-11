import { useState } from "react";
import { siteConfig } from "./site.config";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { TrustBar } from "./components/TrustBar";
import { ServicesSection } from "./components/ServicesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { PricingPlansSection } from "./components/PricingPlansSection";
import { FinancingCallout } from "./components/FinancingCallout";
import { ServiceAreaSection } from "./components/ServiceAreaSection";
import { ReviewsSection } from "./components/ReviewsSection";
import { FAQSection } from "./components/FAQSection";
import { EstimateForm } from "./components/EstimateForm";
import { Footer } from "./components/Footer";
import { StickyMobileBar } from "./components/StickyMobileBar";
import { WhopCheckoutModal } from "./components/WhopCheckoutModal";
import { DevTrackingToolbar } from "./components/DevTrackingToolbar";

export default function App() {
  const [checkoutPlan, setCheckoutPlan] = useState<keyof typeof siteConfig.whop.plans | null>(null);

  const handleOpenEstimate = () => {
    const el = document.getElementById("estimate") || document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleOpenCheckout = (planKey: keyof typeof siteConfig.whop.plans) => {
    setCheckoutPlan(planKey);
  };

  const handleCloseCheckout = () => {
    setCheckoutPlan(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Top Bar + Sticky Header */}
      <Navbar
        onOpenEstimate={handleOpenEstimate}
        onOpenCheckout={handleOpenCheckout}
      />

      <main className="flex-1">
        {/* 2. Hero */}
        <Hero
          onOpenEstimate={handleOpenEstimate}
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 3. Trust Bar (Sample) */}
        <TrustBar />

        {/* 4. Services (3-Card Grid: Repair, Replacement, Inspection) */}
        <ServicesSection
          onOpenEstimate={handleOpenEstimate}
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 5. How It Works (4 Numbered Steps) */}
        <HowItWorksSection
          onOpenCheckout={handleOpenCheckout}
          onOpenEstimate={handleOpenEstimate}
        />

        {/* 6. Pricing Plans ($149 Inspection, $500 Deposit Highlighted, $299 Tune-Up) */}
        <PricingPlansSection onOpenCheckout={handleOpenCheckout} />

        {/* 7. Financing Callout (Amber Banner) */}
        <FinancingCallout onOpenEstimate={handleOpenEstimate} />

        {/* 8. Service Area + Map Placeholder */}
        <ServiceAreaSection />

        {/* 9. Reviews (3 Sample Review Cards) */}
        <ReviewsSection />

        {/* 10. FAQ Accordion (5 Questions) */}
        <FAQSection />

        {/* 11. Split Estimate Form (Left) & Contact Details (Right) */}
        <EstimateForm />
      </main>

      {/* 12. 4-Column Footer */}
      <Footer />

      {/* Sticky Mobile Call Bar */}
      <StickyMobileBar onOpenCheckout={handleOpenCheckout} />

      {/* Whop Checkout Modal */}
      {checkoutPlan && (
        <WhopCheckoutModal
          isOpen={true}
          onClose={handleCloseCheckout}
          planKey={checkoutPlan}
        />
      )}

      {/* Pixel Debugger Overlay (?debug=1) */}
      <DevTrackingToolbar />
    </div>
  );
}
