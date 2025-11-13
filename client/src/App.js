import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageViewTracker from "./components/PageViewTracker";
import StewartWidget from "./components/StewartWidget";

import Home from "./components/Home";
import TaxFaqs from "./components/TaxFaqs";
import AboutUs from "./components/AboutUs";
import OurTaxServices from "./components/OurTaxServices";
import TaxRelief from "./components/TaxRelief";
import TaxResolution from "./components/TaxResolution";
import TaxNegotiation from "./components/TaxNegotiation";
import TaxProtectionPlans from "./components/TaxProtectionPlans";
import SubPageWrapper from "./components/SubPageWrapper";
import ContactUs from "./components/ContactUs";
import TaxNews from "./components/TaxNews";
import TaxNewsArticle from "./components/TaxNewsArticle";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import LandingPage1 from "./components/LandingPage1";
import ThankYou from "./components/ThankYou";
import PDFViewer from "./components/PDFViewer";

import LeadState from "./context/LeadState";

export default function App() {
  return (
    <LeadState>
      <Router>
        <PageViewTracker />

        <Routes>
          {/* ----------------------------- */}
          {/*   PDF ROUTE (no layout)       */}
          {/* ----------------------------- */}
          <Route
            path="/services-brochure"
            element={<PDFViewer />} // NO NAV, NO FOOTER, NO STEWART
          />

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
                    <Route path="/qualify-now" element={<LandingPage1 />} />
                    <Route path="/thank-you" element={<ThankYou />} />
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
                    <Route
                      path="/:category/:slug"
                      element={<SubPageWrapper />}
                    />
                  </Routes>

                  {/* Stewart only on standard layout */}
                  <StewartWidget />
                </div>

                <Footer />
              </>
            }
          />
        </Routes>
      </Router>
    </LeadState>
  );
}
