// components/LandingPage1.jsx
import React, { useState, useContext, useEffect } from "react";
import leadContext from "../context/leadContext";
import { useNavigate } from "react-router-dom";
import PhoneLink from "./PhoneLink";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq";
import { useFormTracking, trackFormAbandon } from "../hooks/useFormTracking";

/**
 * EmbeddedLeadForm - Same form, no JS viewport detection
 */
const EmbeddedLeadForm = () => {
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

  useFormTracking(formData, "landing-embedded", !submitted);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!submitted && (formData.debtAmount || formData.email)) {
        trackFormAbandon("landing-embedded", formData);
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
    <div className="embedded-lead-form">
      <div className="embedded-form-header">
        <h3>Do you have a current tax liability?</h3>
        <p>Let us know and someone will contact you immediately.</p>
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
 * LandingPage1 - No JS viewport detection, CSS handles responsive
 */
const LandingPage1 = () => {
  return (
    <div className="landing-page-root">
      <div className="landing-page-content">
        {/* Hero Section - Form embedded, responsive via CSS */}
        <section className="landing-hero-embedded">
          <div className="hero-background">
            <img
              src="/images/wynn-landing-hero.png"
              alt=""
              className="hero-bg-image"
            />
            <div className="hero-overlay"></div>
          </div>

          <div className="hero-content-grid">
            {/* Left side - Company info */}
            <div className="hero-text-side">
              <h1 className="hero-company">Wynn Tax Solutions</h1>
              <h2 className="hero-headline">
                Reduce & Resolve Your IRS Tax Liability
              </h2>
              <p className="hero-subtext">
                Our professionals have saved taxpayers over $300 million in tax
                debt with comprehensive tax resolution services.
              </p>
              <PhoneLink rawNumber="18449966829" className="hero-phone-link" />
            </div>

            {/* Right side - Embedded Form */}
            <div className="hero-form-side">
              <EmbeddedLeadForm />
            </div>
          </div>
        </section>

        {/* Rest of page content stays the same... */}
        <div className="landing-container">
          <section className="steps-section">
            <div className="step">
              <img
                className="step-icon"
                src="https://d9hhrg4mnvzow.cloudfront.net/hire.wynntaxsolutions.com/consultation/a9bbfa4e-frame-15031-1.svg"
                alt="Step 1"
              />
              <h3 className="step-title">Legal Representation</h3>
              <p className="step-description">
                Our firm files a Power of Attorney to access your tax records
                and begin the case review.
              </p>
            </div>
            <div className="step">
              <img
                className="step-icon"
                src="https://d9hhrg4mnvzow.cloudfront.net/hire.wynntaxsolutions.com/consultation/a9bbfa4e-frame-15031-1.svg"
                alt="Step 2"
              />
              <h3 className="step-title">Guaranteed Compliance</h3>
              <p className="step-description">
                As part of our commitment to you we will make sure your filings
                are correct and current.
              </p>
            </div>
            <div className="step">
              <img
                className="step-icon"
                src="https://d9hhrg4mnvzow.cloudfront.net/hire.wynntaxsolutions.com/consultation/a9bbfa4e-frame-15031-1.svg"
                alt="Step 3"
              />
              <h3 className="step-title">Best Resolution</h3>
              <p className="step-description">
                Where possible we will reduce your liability by aggressive
                application of tax law.
              </p>
            </div>
          </section>
        </div>

        <section className="features-section">
          <div className="features-header">
            <h2 className="features-title">What makes Wynn Tax Different?</h2>
            <p className="features-subtitle">
              Our Attorneys are some of the best in the nation with decades of
              tax experience
            </p>
          </div>

          <div className="features-grid">
            <div className="features-image">
              <img src="/images/wynn-gilf.png" alt="Feature visual" />
            </div>

            <div className="features-boxes">
              <div className="feature-box">
                <span className="feature-icon">✔</span>
                <div className="feature-text">
                  <h4 className="feature-title">Free Consultation</h4>
                  <p className="feature-description">
                    We call the IRS with you, and if theres work we can do we
                    let you know for free.
                  </p>
                </div>
              </div>
              <div className="feature-box">
                <span className="feature-icon">✔</span>
                <div className="feature-text">
                  <h4 className="feature-title">Quick and Accurate Results</h4>
                  <p className="feature-description">
                    We will help you fix your state and federal tax liabilities
                    starting on day one.
                  </p>
                </div>
              </div>
              <div className="feature-box">
                <span className="feature-icon">✔</span>
                <div className="feature-text">
                  <h4 className="feature-title">100% Guarantee</h4>
                  <p className="feature-description">
                    We will provide a resolution to your case, and if you aren't
                    satisfied you can have your money back.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="landing-container">
          <section className="steps-section">
            <div className="step">
              <i className="fas fa-user-tie guarantee-icon"></i>
              <h3 className="step-title">Tailored Tax Guidance</h3>
              <p className="step-description">
                Whether you have business or personal tax issues we will provide
                you industry leading expert guidance.
              </p>
            </div>
            <div className="step">
              <i className="fas fa-handshake guarantee-icon"></i>
              <h3 className="step-title">Open And Honest Accountability</h3>
              <p className="step-description">
                We are available to speak with you during regular business hours
                and provide regular updates.
              </p>
            </div>
            <div className="step">
              <i className="fas fa-file-invoice-dollar guarantee-icon"></i>
              <h3 className="step-title">Ongoing Tax Preparation Services</h3>
              <p className="step-description">
                We offer account monitoring and complementary tax filing for
                some clients.
              </p>
            </div>
          </section>
        </div>

        <section className="landing-testimonials-section">
          <div className="landing-testimonials-cards">
            <div className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p className="landing-testimonial-text">
                "Wynn went above and beyond to help me through my tax debt."
              </p>
              <div className="landing-testimonial-author">Anedia R.</div>
            </div>
            <div className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p className="landing-testimonial-text">
                "They negotiated a payment plan and put me back in good
                standing."
              </p>
              <div className="landing-testimonial-author">Samantha A.</div>
            </div>
            <div className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p className="landing-testimonial-text">
                "Thank you for negotiating my balance and getting me filed!"
              </p>
              <div className="landing-testimonial-author">N.S.</div>
            </div>
          </div>
          <div className="landing-bbb-logo">
            <img
              src="images/bbb-accredited-business.png"
              alt="BBB Accredited"
            />
          </div>
        </section>

        <section
          className="landing-callout-section"
          style={{ backgroundImage: 'url("/images/hero-5.png")' }}
        >
          <div className="landing-callout-overlay"></div>
          <div className="landing-callout-content">
            <h2 className="landing-callout-title">
              Take the Next Step Toward Tax Relief
            </h2>
            <p className="landing-callout-subtitle">
              Our experts are ready to help you reduce and resolve your IRS tax
              liability.
            </p>
            <PhoneLink rawNumber="18449966829" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage1;
