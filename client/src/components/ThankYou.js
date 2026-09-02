import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PhoneLink from "./PhoneLink";
import SEO from "./SEO";
import {
  getSubmissionReceipt,
  hasTrackedSubmissionReceipt,
  markSubmissionReceiptTracked,
} from "../utils/submissionReceipt";

const ThankYou = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationReceipt = location.state?.submissionReceipt;

  useEffect(() => {
    const receipt =
      String(navigationReceipt || "").trim() || getSubmissionReceipt();
    if (!receipt) {
      navigate("/qualify-now", { replace: true });
      return undefined;
    }

    let attempts = 0;
    const sendConversion = () => {
      attempts += 1;
      if (window.gtag && !hasTrackedSubmissionReceipt(receipt)) {
        window.gtag("event", "conversion", {
          send_to: "AW-16728121004/alH8CODZhIEbEKy9y6g-",
          value: 1.0,
          currency: "USD",
          transaction_id: receipt,
        });
        markSubmissionReceiptTracked(receipt);
        return true;
      }
      return hasTrackedSubmissionReceipt(receipt) || attempts >= 20;
    };

    const conversionTimer = sendConversion()
      ? null
      : window.setInterval(() => {
          if (sendConversion()) window.clearInterval(conversionTimer);
        }, 250);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    return () => {
      if (conversionTimer) window.clearInterval(conversionTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [navigationReceipt, navigate]);

  return (
    <div className="landing-page-root">
      <SEO
        title="Request Received | Wynn Tax Solutions"
        description="Your consultation request was received by Wynn Tax Solutions."
        canonical="/thank-you"
        noindex
      />
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
            <h1>
              <span className="landing-hero-company-name">
                Wynn Tax Solutions
              </span>{" "}
              — Thank You For Your Submission
            </h1>
            <p className="landing-hero-subtitle">
              Someone Will Be Calling You Shortly.
            </p>

            <div className="hero-buttons">
              <PhoneLink rawNumber="18449966829" />
              <Link
                to="/"
                className="phone-button"
                style={{ background: "#333" }}
              >
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
                alt="Legal representation icon"
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
                alt="Guaranteed compliance icon"
              />
              <h3 className="step-title">Compliance Review</h3>
              <p className="step-description">
                If you engage us, we review filing requirements and explain the
                work needed to become current.
              </p>
            </div>
            <div className="step">
              <img
                className="step-icon"
                src="https://d9hhrg4mnvzow.cloudfront.net/hire.wynntaxsolutions.com/consultation/a9bbfa4e-frame-15031-1.svg"
                alt="Best resolution icon"
              />
              <h3 className="step-title">Resolution Options</h3>
              <p className="step-description">
                We evaluate the resolution paths available for your specific
                facts and explain the tradeoffs.
              </p>
            </div>
          </section>
        </div>
        <section className="features-section">
          <div className="features-header">
            <h2 className="features-title">What makes Wynn Tax Different?</h2>
            <p className="features-subtitle">
              Our tax professionals review each matter based on its individual
              facts and available options.
            </p>
          </div>

          <div className="features-grid">
            {/* Image Side */}
            <div className="features-image">
              <img src="/images/wynn-gilf.png" alt="Feature visual" />
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
                  <h4 className="feature-title">Prompt Case Review</h4>
                  <p className="feature-description">
                    We help you understand the next steps for state and federal
                    tax matters.
                  </p>
                </div>
              </div>
              <div className="feature-box">
                <span className="feature-icon">✔</span>
                <div className="feature-text">
                  <h4 className="feature-title">Clear Engagement Terms</h4>
                  <p className="feature-description">
                    Before paid work begins, we explain the proposed scope and
                    fees in writing.
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
              Our team is ready to review your IRS tax matter and explain the
              available next steps.
            </p>
            <PhoneLink
              rawNumber="18449966829"
              className="landing-callout-button"
            />
          </div>
        </section>

        {/* Footer */}
      </div>
    </div>
  );
};

export default ThankYou;
