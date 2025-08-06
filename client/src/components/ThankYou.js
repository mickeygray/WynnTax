import React, { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import leadContext from "../context/leadContext";

const ThankYou = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    window.gtag &&
      window.gtag("event", "conversion", {
        send_to: "AW-16728121004/alH8CODZhIEbEKy9y6g-",
        value: 1.0,
        currency: "USD",
      });
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="landing-page-root">
      <div className="landing-page-content">
        {/* Hero Section */}
        <section className="landing-page-hero">
          <div className="hero-image-container">
            {!isMobile ? (
              <img src="/images/wynn-landing-hero.png" alt="Wynn Tax Hero" />
            ) : (
              <img src="/images/cropped-hero.png" alt="Wynn Tax Hero" />
            )}
          </div>
          <div className="hero-text-overlay">
            <h1 className="landing-hero-company-name">Wynn Tax Solutions</h1>
            <h1 className="landing-hero-title">
              Thank You For Your Submission, Someone Will Be Calling You
              Shortly.
            </h1>

            <div className="hero-buttons">
              <a href="tel:+18667163921" className="hero-call-button">
                CALL 866-716-3921
              </a>
              <Link to="/" className="hero-form-button">
                Learn More About Wynn Tax
              </Link>
            </div>
          </div>
          <div className="hero-overlay"></div>
        </section>

        {/* Steps */}
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
                alt="Step 1"
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
                alt="Step 1"
              />
              <h3 className="step-title">Best Resolution</h3>
              <p className="step-description">
                Where possible we will reduce your liability by aggressive
                application of tax law.
              </p>
            </div>
            {/* Add Step 2, Step 3 similarly */}
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
            {/* Image Side */}
            <div className="features-image">
              <img
                src="/images/wynn-gilf.png" /* Replace with actual image */
                alt="Feature visual"
              />
            </div>

            {/* Text Boxes */}
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
                you industry leading expert guidance. We help with state and
                federal taxes for individuals, payroll taxes
              </p>
            </div>
            <div className="step">
              <i className="fas fa-handshake guarantee-icon"></i>
              <h3 className="step-title">Open And Honest Accountability</h3>
              <p className="step-description">
                We are available to speak with you during regular business hours
                and provide regular updates via email and text and allow you to
                schedule appointments when you are available.
              </p>
            </div>
            <div className="step">
              <i className="fas fa-file-invoice-dollar guarantee-icon"></i>
              <h3 className="step-title">Ongoing Tax Preparation Services</h3>
              <p className="step-description">
                Long after we have completed the work of preparing resolution,
                we offer account monitoring and complementary tax filing for
                some clients.
              </p>
            </div>
            {/* Add Step 2, Step 3 similarly */}
          </section>
        </div>
        <section className="landing-testimonials-section">
          <div className="landing-testimonials-cards">
            <div className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p className="landing-testimonial-text">
                "They went above and beyond to help me through my IRS debt. I
                have and will continue to recommend your company to everyone."
              </p>
              <div className="landing-testimonial-author">Anedia R.</div>
            </div>

            <div className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p className="landing-testimonial-text">
                "Wynn Tax Solutions gave me peace of mind. They negotiated a
                payment plan and put me back in good standing with the IRS."
              </p>
              <div className="landing-testimonial-author">Samantha A.</div>
            </div>

            <div className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p className="landing-testimonial-text">
                "Thank you for negotiating my balance and getting me filed and
                up to date. I appreciate the help and quick response!"
              </p>
              <div className="landing-testimonial-author">N.S.</div>
            </div>
          </div>

          <div className="landing-bbb-logo">
            <img
              src="images/bbb-accredited-business.png"
              alt="BBB Accredited Business"
            />
          </div>
        </section>
        {/* CTA */}
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
            <a href="tel:+18667163921" className="landing-callout-button">
              CALL NOW
            </a>
          </div>
        </section>

        {/* Footer */}
      </div>
    </div>
  );
};

export default ThankYou;
