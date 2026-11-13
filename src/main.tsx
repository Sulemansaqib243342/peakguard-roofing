import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import CheckoutReturnPage from "./pages/CheckoutReturnPage";
import AdminInvoicePage from "./pages/AdminInvoicePage";
import AdminLeadsPage from "./pages/AdminLeadsPage";
import AdminEventsPage from "./pages/AdminEventsPage";
import { siteConfig } from "./site.config";
import "./index.css";

function Root() {
  // Inject CSS custom properties from site.config.ts brand settings
  // This guarantees changing colors in site.config.ts takes immediate effect
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", siteConfig.brand.primaryColor);
    root.style.setProperty("--brand-primary-hover", siteConfig.brand.primaryHover);
    root.style.setProperty("--brand-accent", siteConfig.brand.accentColor);
    root.style.setProperty("--brand-accent-hover", siteConfig.brand.accentHover);
    root.style.setProperty("--brand-bg", siteConfig.brand.bgColor);
    root.style.setProperty("--brand-dark", siteConfig.brand.darkBg);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
        <Route path="/admin" element={<Navigate to="/admin/invoicing" replace />} />
        <Route path="/admin/invoicing" element={<AdminInvoicePage />} />
        <Route path="/admin/leads" element={<AdminLeadsPage />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

