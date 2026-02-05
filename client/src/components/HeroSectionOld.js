// components/HeroSection.jsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import leadContext from "../context/leadContext";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq";
import { useFormTracking, trackFormAbandon } from "../hooks/useFormTracking";

/**
 * EmbeddedLeadForm - Reusable form component
 */
export const EmbeddedLeadForm = ({ variant = "default" }) => {
  const navigate = useNavigate();
  const { sendLeadForm } = useContext(leadContext);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    debtAmount: "",
    filedAllTaxes: "",
    name: "",
    phone: "",
    email: "",
    bestTime: "",
  });

  useFormTracking(formData, "embedded-hero", !submitted);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!submitted && (formData.debtAmount || formData.email)) {
        trackFormAbandon("embedded-hero", formData);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, submitted]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => setStep(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    sendLeadForm(formData);
    trackCustomEvent("LandingFormSubmitted", {
      source: "EmbeddedHeroForm",
      has_email: !!formData.email,
      has_phone: !!formData.phone,
      debt_amount: formData.debtAmount || null,
    });
    trackStandardEvent("Lead");
    navigate("/thank-you");
  };

  return (
    <div className={`embedded-lead-form ${variant}`}>
      <div className="embedded-form-header">
        <h3>Do you have a tax liability?</h3>
        <p>Tell us about it and we'll contact you immediately.</p>
      </div>

      {step === 1 ? (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label>How much do you owe?</label>
            <select
              name="debtAmount"
              value={formData.debtAmount}
              onChange={handleChange}
              required
            >
              <option value="">Select an amount</option>
              <option value="<10000">Less than $10,000</option>
              <option value="10000-20000">$10,000 – $20,000</option>
              <option value="20000-50000">$20,000 – $50,000</option>
              <option value="50000-100000">$50,000 – $100,000</option>
              <option value=">100000">More than $100,000</option>
            </select>
          </div>

          <div className="form-group">
            <label>Have you filed all your taxes?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="filedAllTaxes"
                  value="yes"
                  checked={formData.filedAllTaxes === "yes"}
                  onChange={handleChange}
                />
                <span>Yes</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="filedAllTaxes"
                  value="no"
                  checked={formData.filedAllTaxes === "no"}
                  onChange={handleChange}
                />
                <span>No</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            className="form-btn"
            onClick={handleNext}
            disabled={!formData.debtAmount || !formData.filedAllTaxes}
          >
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="bestTime"
              value={formData.bestTime}
              onChange={handleChange}
              placeholder="Best Time to Contact (optional)"
            />
          </div>
          <button type="submit" className="form-btn form-btn-submit">
            Get Free Consultation
          </button>
          <button
            type="button"
            className="form-btn-back"
            onClick={() => setStep(1)}
          >
            ← Back
          </button>
        </form>
      )}
    </div>
  );
};

/**
 * HeroSection - Home page hero
 * Renders BOTH mobile and desktop versions, CSS handles visibility
 * This prevents hydration mismatch and flash
 */
const HeroSection = () => {
  return (
    <>
      {/* ========== MOBILE VERSION - CSS shows only on mobile ========== */}
      <div className="hero-container hero-mobile-version">
        <img
          src="/images/hero-8.png"
          alt="Wynn Tax Solutions"
          className="hero-image"
        />
        <div className="hero-overlay-dark"></div>

        <div className="hero-content-mobile">
          <h1 className="hero-title-mobile">Wynn Tax Solutions</h1>
          <p className="hero-tagline-mobile">
            Individual and Business Tax Consulting
          </p>

          <EmbeddedLeadForm variant="mobile-hero" />

          <Link to="/our-tax-services" className="hero-services-link">
            <i className="fa-solid fa-folder"></i> View Our Services
          </Link>
        </div>
      </div>

      {/* ========== DESKTOP VERSION - CSS shows only on desktop ========== */}
      <div className="hero-container hero-desktop-version">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src="/images/Wynn-Hero-01.mp4" type="video/mp4" />
          Your browser does not support the video tag!
        </video>

        <div className="hero-content">
          <h1 className="hero-title">Wynn Tax Solutions</h1>
          <h3 className="hero-subtitle">
            <strong>Individual and Business Tax Consulting</strong>
            <br />
            <br />
            We work with businesses and individuals from all over the U.S.
            providing comprehensive and tailored solutions.
          </h3>

          <div className="hero-buttons">
            <Link to="/our-tax-services" className="hero-btn">
              <i className="fa-solid fa-folder"></i> OUR TAX SERVICES
            </Link>
            <Link to="/qualify-now" className="hero-btn hero-consultation-btn">
              <i className="fa-solid fa-phone"></i> FREE CONSULTATION
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
