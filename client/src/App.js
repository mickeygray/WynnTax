import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import PageViewTracker from "./components/PageViewTracker";
import ScrollToTop from "./hooks/scrollToTop";
import LeadState from "./context/LeadState";

const Navbar = lazy(() => import("./components/Navbar"));
const Footer = lazy(() => import("./components/Footer"));
const StewartWidget = lazy(() => import("./components/StewartWidget"));
const Home = lazy(() => import("./components/Home"));
const TaxFaqs = lazy(() => import("./components/TaxFaqs"));
const AboutUs = lazy(() => import("./components/AboutUs"));
const OurTaxServices = lazy(() => import("./components/OurTaxServices"));
const TaxRelief = lazy(() => import("./components/TaxRelief"));
const TaxResolution = lazy(() => import("./components/TaxResolution"));
const TaxNegotiation = lazy(() => import("./components/TaxNegotiation"));
const TaxProtectionPlans = lazy(() =>
  import("./components/TaxProtectionPlans"),
);
const SubPageWrapper = lazy(() => import("./components/SubPageWrapper"));
const ContactUs = lazy(() => import("./components/ContactUs"));
const TaxNews = lazy(() => import("./components/TaxNews"));
const TaxNewsArticle = lazy(() => import("./components/TaxNewsArticle"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/TermsOfService"));
const LandingPage1 = lazy(() => import("./components/LandingPage1"));
const ThankYou = lazy(() => import("./components/ThankYou"));
const PDFViewer = lazy(() => import("./components/PDFViewer"));
const StateTaxHub = lazy(() => import("./components/StateTaxHub"));
const StateTaxPage = lazy(() => import("./components/StateTaxPage"));

export default function App() {
  return (
    <LeadState>
      <Router>
        <PageViewTracker />
        <ScrollToTop />

        <Suspense
          fallback={
            <div className="route-loading" role="status" aria-live="polite">
              Loading…
            </div>
          }
        >
          <Routes>
          {/* ----------------------------- */}
          {/*   PDF ROUTE (no layout)       */}
          {/* ----------------------------- */}
          <Route path="/services-brochure" element={<PDFViewer />} />
          <Route path="/qualify-now" element={<LandingPage1 />} />
          <Route path="/thank-you" element={<ThankYou />} />
          {/* ----------------------------- */}
          {/*   STANDARD SITE ROUTES       */}
          {/* ----------------------------- */}
          <Route
            path="*"
            element={
              <>
                <Navbar />

                <div className="page-wrapper">
                  <Routes>
                    <Route path="/" element={<Home />} />

                    <Route path="/tax-faqs" element={<TaxFaqs />} />
                    <Route path="/about-us" element={<AboutUs />} />
                    <Route
                      path="/our-tax-services"
                      element={<OurTaxServices />}
                    />

                    <Route path="/tax-relief" element={<TaxRelief />} />
                    <Route path="/tax-resolution" element={<TaxResolution />} />
                    <Route
                      path="/tax-negotiation"
                      element={<TaxNegotiation />}
                    />
                    <Route path="/state-tax-guide" element={<StateTaxHub />} />
                    <Route
                      path="/state-tax-guide/:stateSlug"
                      element={<StateTaxPage />}
                    />

                    <Route
                      path="/tax-protection-plans"
                      element={<TaxProtectionPlans />}
                    />
                    <Route path="/contact-us" element={<ContactUs />} />
                    <Route path="/tax-news" element={<TaxNews />} />
                    <Route path="/tax-news/:id" element={<TaxNewsArticle />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route
                      path="/terms-of-service"
                      element={<TermsOfService />}
                    />

                    {/* Catch-all for any other two-segment sub-pages */}
                    <Route
                      path="/:category/:slug"
                      element={<SubPageWrapper />}
                    />
                  </Routes>

                  <StewartWidget />
                </div>

                <Footer />
              </>
            }
          />
          </Routes>
        </Suspense>
      </Router>
    </LeadState>
  );
}
