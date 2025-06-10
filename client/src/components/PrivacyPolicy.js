import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page">
      {/* Hero Section */}
      <section
        className="privacy-hero"
        style={{
          backgroundImage: `url("/images/privacy-hero.png")`,
        }}
      >
        <div className="privacy-hero-overlay"></div>
        <div className="privacy-hero-content">
          <h1>Privacy Policy</h1>
          <nav className="privacy-breadcrumbs">
            <Link to="/">Home</Link> <span>/</span> <span>Privacy Policy</span>
          </nav>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <div className="privacy-content">
        <h2>Introduction</h2>
        <p>
          This Privacy Policy describes how your personal information is
          collected, used, and shared when you visit or make a purchase from{" "}
          <strong>Wynn Tax SolutionsTaxGroup.com</strong> (the “Site”).
        </p>

        <h2>Information We Collect</h2>
        <p>
          When you visit the Site, we automatically collect certain information
          about your device, including:
        </p>
        <ul>
          <li>Web browser type</li>
          <li>IP address</li>
          <li>Time zone</li>
          <li>Cookies installed on your device</li>
        </ul>
        <p>Additionally, we collect:</p>
        <ul>
          <li>Web pages or products viewed</li>
          <li>Referral sources (websites or search terms)</li>
          <li>Interaction details on the Site</li>
        </ul>

        <h2>How We Use Your Personal Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>
            Fulfill orders (payment processing, shipping, order confirmations)
          </li>
          <li>Communicate with you</li>
          <li>Screen for fraud and risk</li>
          <li>Improve and optimize our Site</li>
        </ul>

        <h2>Sharing Your Information</h2>
        <p>We share your Personal Information with third parties, including:</p>
        <ul>
          <li>
            <strong>Shopify</strong> for order processing (
            <a
              href="https://www.shopify.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Google Analytics</strong> for tracking (
            <a
              href="https://www.google.com/intl/en/policies/privacy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            )
          </li>
        </ul>
        <p>
          You can opt out of Google Analytics{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>

        <h2>Behavioral Advertising</h2>
        <p>We use targeted advertising. You can opt out via:</p>
        <ul>
          <li>
            <a
              href="https://www.facebook.com/settings/?tab=ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook Ads
            </a>
          </li>
          <li>
            <a
              href="https://www.google.com/settings/ads/anonymous"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads
            </a>
          </li>
          <li>
            <a
              href="https://advertise.bingads.microsoft.com/en-us/resources/policies/personalized-ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bing Ads
            </a>
          </li>
        </ul>
        <p>
          Additional opt-out options can be found{" "}
          <a
            href="http://optout.aboutads.info/"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>

        <h2>Do Not Track</h2>
        <p>
          We do not alter our data collection practices when we see a Do Not
          Track signal.
        </p>

        <h2>Your Rights</h2>
        <p>
          If you are a European resident, you have the right to access, update,
          or delete your personal data. Please contact us using the details
          below.
        </p>

        <h2>Data Retention</h2>
        <p>We retain your order information unless you request its deletion.</p>

        <h2>Changes</h2>
        <p>
          We may update this policy periodically to reflect operational, legal,
          or regulatory changes.
        </p>

        <h2>Contact Us</h2>
        <p>
          For questions or complaints, contact us via email at{" "}
          <a href="mailto:inquiry@WynnTaxSolutions.com">
            inquiry@Wynn Tax Solutionstaxgroup.com
          </a>{" "}
          or by mail:
        </p>
        <p>
          <strong>Wynn Tax Solutions</strong>
          <br />
          21625 Prairie Street, Suite #200
          <br />
          Chatsworth, CA 91331, United States
        </p>

        <p>© 2025 Wynn Tax Solutions. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
