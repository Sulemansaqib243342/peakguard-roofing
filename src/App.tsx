import { useState } from "react";
import { siteConfig } from "./site.config";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ServicesSection } from "./components/ServicesSection";
import { PricingPlansSection } from "./components/PricingPlansSection";
import { FinancingCallout } from "./components/FinancingCallout";
import { ServiceAreaSection } from "./components/ServiceAreaSection";
import { ReviewsSection } from "./components/ReviewsSection";
import { EstimateForm } from "./components/EstimateForm";
import { FAQSection } from "./components/FAQSection";
import { ContactSection } from "./components/ContactSection";
import { Footer } from "./components/Footer";
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

      <main className="flex-1">
        {/* 1. Hero with CTAs & Live stats */}
        <Hero
          onOpenEstimate={handleOpenEstimate}
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 2. Services Grid (Repair, Replacement, Inspection, Tune-Up) */}
        <ServicesSection
          onOpenEstimate={handleOpenEstimate}
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 3. Direct Whop Checkout Plans (Inspection $149, Deposit $500, Tune-Up $299) */}
        <PricingPlansSection onOpenCheckout={handleOpenCheckout} />

        {/* 4. Financing Callout (Transparent Whop Payments policy) */}
        <FinancingCallout onOpenEstimate={handleOpenEstimate} />

        {/* 5. Service Area & Interactive ZIP code availability checker */}
        <ServiceAreaSection />

        {/* 6. Reviews & Trust Credentials (Clearly marked template placeholder content) */}
        <ReviewsSection />

        {/* 7. Estimate Form (Server-side validation, spam prevention, Whop Leads) */}
        <EstimateForm />

        {/* 8. FAQ Accordion */}
        <FAQSection />

        {/* 9. Direct Contact Details & 24/7 Dispatch */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Whop Checkout Modal with Elements & Card-on-file Setup Intent */}
      {checkoutPlan && (
        <WhopCheckoutModal
          isOpen={true}
          onClose={handleCloseCheckout}
          planKey={checkoutPlan}
        />
      )}

      {/* Dev-only event tracking toolbar for recording & inspection */}
      <DevTrackingToolbar />
    </div>
  );
}
