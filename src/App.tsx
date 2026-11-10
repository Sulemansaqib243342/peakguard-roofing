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
import { ContactSection } from "./components/ContactSection";
import { Footer } from "./components/Footer";
import { StickyMobileBar } from "./components/StickyMobileBar";
import { WhopCheckoutModal } from "./components/WhopCheckoutModal";
import { DevTrackingToolbar } from "./components/DevTrackingToolbar";

export default function App() {
  const [checkoutPlan, setCheckoutPlan] = useState<keyof typeof siteConfig.whop.plans | null>(null);

  const handleOpenEstimate = () => {
    const el = document.getElementById("estimate");
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
      {/* Sticky Header */}
      <Navbar
        onOpenEstimate={handleOpenEstimate}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* Real sections in the exact required order:
          1. Hero
          2. Trust bar
          3. Services (Repair / Replacement / Inspection)
          4. How it works (3 steps: Inspect -> Deposit -> Final invoice)
          5. Pricing cards
          6. Financing callout
          7. Service Area
          8. Reviews
          9. FAQ
          10. Request Estimate form
          11. Contact
          12. Footer */}
      <main className="flex-1">
        {/* 1. Hero */}
        <Hero
          onOpenEstimate={handleOpenEstimate}
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 2. Trust Bar */}
        <TrustBar />

        {/* 3. Services Grid (Repair, Replacement, Inspection, Tune-Up) */}
        <ServicesSection
          onOpenEstimate={handleOpenEstimate}
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 4. How It Works (3 Steps: Inspect -> Deposit -> Final invoice) */}
        <HowItWorksSection
          onOpenCheckout={handleOpenCheckout}
          onOpenEstimate={handleOpenEstimate}
        />

        {/* 5. Pricing Cards (Inspection $149, Deposit $500, Tune-Up $299) */}
        <PricingPlansSection onOpenCheckout={handleOpenCheckout} />

        {/* 6. Financing Callout */}
        <FinancingCallout onOpenEstimate={handleOpenEstimate} />

        {/* 7. Service Area & Interactive ZIP code availability checker */}
        <ServiceAreaSection />

        {/* 8. Reviews & Trust Credentials (Clearly marked template placeholder content) */}
        <ReviewsSection />

        {/* 9. FAQ Accordion */}
        <FAQSection />

        {/* 10. Request Estimate Form (Server-side validation, rate limiting, spam prevention, Whop Leads) */}
        <EstimateForm />

        {/* 11. Contact & 24/7 Dispatch Details */}
        <ContactSection />
      </main>

      {/* 12. Footer */}
      <Footer />

      {/* Sticky Mobile Bottom Bar ("Call" & "Book Inspection") */}
      <StickyMobileBar onOpenCheckout={handleOpenCheckout} />

      {/* Whop Checkout Modal with Elements & Card-on-file Setup Intent */}
      {checkoutPlan && (
        <WhopCheckoutModal
          isOpen={true}
          onClose={handleCloseCheckout}
          planKey={checkoutPlan}
        />
      )}

      {/* Dev-only event tracking toolbar for recording & inspection (renders only with ?debug=1) */}
      <DevTrackingToolbar />
    </div>
  );
}
