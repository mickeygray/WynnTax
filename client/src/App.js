import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
// Example for internal linking
import Footer from "./components/Footer"; // Import Footer Component
import Navbar from "./components/Navbar"; // Import Navbar
import "./App.css";
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
import LeadState from "./context/LeadState";

const App = () => {
  return (
    <LeadState>
      <Router>
        <Navbar />
        <div className="page-wrapper">
          {" "}
          {/* Controls spacing */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tax-faqs" element={<TaxFaqs />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/our-tax-services" element={<OurTaxServices />} />
            <Route path="/tax-relief" element={<TaxRelief />} />
            <Route path="/tax-resolution" element={<TaxResolution />} />
            <Route path="/tax-negotiation" element={<TaxNegotiation />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/:category/:slug" element={<SubPageWrapper />} />{" "}
            <Route path="/tax-news" element={<TaxNews />} />
            <Route path="/tax-news/:id" element={<TaxNewsArticle />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route
              path="/tax-protection-plans"
              element={<TaxProtectionPlans />}
            />
          </Routes>
        </div>
        <Footer /> {/* Footer Appears on All Pages */}
      </Router>
    </LeadState>
  );
};

export default App;
