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
        <span className="form-badge">Free Consultation</span>
        <h3>Get Your Tax Analysis</h3>
        <p>Tell us about your situation and we'll reach out immediately.</p>
      </div>

      {/* Progress indicator */}
      <div className="form-progress">
        <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
          <span>1</span>
        </div>
        <div className={`progress-line ${step >= 2 ? "active" : ""}`}></div>
        <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
          <span>2</span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={(e) => e.preventDefault()} className="form-step">
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
              <label
                className={`radio-card ${
                  formData.filedAllTaxes === "yes" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="filedAllTaxes"
                  value="yes"
                  checked={formData.filedAllTaxes === "yes"}
                  onChange={handleChange}
                />
                <span>Yes</span>
              </label>
              <label
                className={`radio-card ${
                  formData.filedAllTaxes === "no" ? "selected" : ""
                }`}
              >
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
            Continue <span className="btn-arrow">→</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="form-step">
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

      <div className="form-trust">
        <span>🔒 Secure & Confidential</span>
        <span>✓ No Obligation</span>
      </div>
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
      {/* ========== MOBILE VERSION ========== */}
      <section className="hero hero-mobile-version">
        <div className="hero__media">
          <img
            src="/images/hero-8.png"
            alt=""
            className="hero__image"
            aria-hidden="true"
          />
          <div className="hero__overlay"></div>
        </div>

        <div className="hero__content hero__content--mobile">
          <div className="hero__text">
            <span className="hero__badge">Tax Relief Experts</span>
            <h1 className="hero__title">
              <span className="hero__title-line">Wynn Tax</span>
              <span className="hero__title-line hero__title-accent">
                Solutions
              </span>
            </h1>
            <p className="hero__subtitle">
              Individual and Business Tax Consulting
            </p>
          </div>

          <EmbeddedLeadForm variant="mobile-hero" />

          <Link to="/our-tax-services" className="hero__link">
            <span>View Our Services</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ========== DESKTOP VERSION ========== */}
      <section className="hero hero-desktop-version">
        <div className="hero__media">
          <video autoPlay muted loop playsInline className="hero__video">
            <source src="/images/Wynn-Hero-01.mp4" type="video/mp4" />
          </video>
          <div className="hero__overlay"></div>
        </div>

        <div className="hero__content">
          <div className="hero__grid">
            {/* Left side - Text content */}
            <div className="hero__text">
              <span className="hero__badge">
                <span className="badge-dot"></span>
                Trusted Tax Relief Experts
              </span>

              <h1 className="hero__title">
                <span className="hero__title-line">Wynn Tax</span>
                <span className="hero__title-line hero__title-accent">
                  Solutions
                </span>
              </h1>

              <p className="hero__subtitle">
                Individual and Business Tax Consulting
              </p>

              <p className="hero__description">
                We work with businesses and individuals from all over the U.S.,
                providing comprehensive and tailored solutions to resolve your
                tax challenges.
              </p>

              {/* Stats row */}
              <div className="hero__stats">
                <div className="hero__stat">
                  <span className="hero__stat-value">$50M+</span>
                  <span className="hero__stat-label">Tax Debt Resolved</span>
                </div>
                <div className="hero__stat">
                  <span className="hero__stat-value">2,000+</span>
                  <span className="hero__stat-label">Clients Helped</span>
                </div>
                <div className="hero__stat">
                  <span className="hero__stat-value">98%</span>
                  <span className="hero__stat-label">Success Rate</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="hero__buttons">
                <Link
                  to="/our-tax-services"
                  className="hero__btn hero__btn--primary"
                >
                  Our Services
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/qualify-now"
                  className="hero__btn hero__btn--secondary"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Free Consultation
                </Link>
              </div>

              {/* Trust badges */}
              <div className="hero__trust">
                <div className="hero__trust-badge">
                  <span className="trust-icon">BBB</span>
                  <span>A+ Rated</span>
                </div>
                <div className="hero__trust-badge">
                  <span className="trust-icon">IRS</span>
                  <span>Licensed</span>
                </div>
                <div className="hero__trust-badge">
                  <span>✓ All 50 States</span>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="hero__form-wrapper">
              <EmbeddedLeadForm variant="desktop-hero" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
