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
          collected, used, and shared when you visit, request a consultation,
          or use services available through{" "}
          <strong>WynnTaxSolutions.com</strong> (the “Site”).
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
        <p>We may also collect:</p>
        <ul>
          <li>Web pages viewed and interactions with the Site</li>
          <li>Referral sources (websites or search terms)</li>
          <li>Advertising campaign and click identifiers</li>
          <li>
            Information you submit, such as your name, email address, phone
            number, and details you choose to provide about a tax matter
          </li>
        </ul>

        <h2>How We Use Your Personal Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Respond to consultation and service requests</li>
          <li>Communicate with you when you have provided consent</li>
          <li>Screen for fraud and risk</li>
          <li>Improve and optimize our Site</li>
          <li>Measure advertising and website performance</li>
        </ul>

        <h2>Sharing Your Information</h2>
        <p>
          We may share personal information with service providers that help us
          operate the Site, process consultation requests, maintain records,
          communicate with you, prevent fraud, and measure performance. These
          may include:
        </p>
        <ul>
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
          <li>Advertising platforms used for campaign measurement</li>
          <li>Customer relationship and communications providers</li>
          <li>Consent-certificate and website hosting providers</li>
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

        <h2>Advertising and Measurement</h2>
        <p>
          We use advertising and measurement tools to understand whether an ad
          led to a Site visit or consultation request. You can manage ad
          preferences through:
        </p>
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
        <h2>SMS & Electronic Marketing Communications</h2>
        <p>
          When you provide your phone number and consent via a form on this
          Site, we may use that information to send you marketing text messages
          (SMS/MMS), calls, and emails, including via automated systems. We do
          not sell or share your phone number with third parties for their own
          marketing purposes.
        </p>
        <p>
          You may opt out of SMS messages at any time by replying STOP to any
          message you receive from us. You may also opt out of email
          communications by clicking the unsubscribe link in any email. Opting
          out of one channel does not automatically unsubscribe you from others.
        </p>
        <p>
          For questions about your communication preferences, contact us at{" "}
          <a href="mailto:inquiry@WynnTaxSolutions.com">
            inquiry@WynnTaxSolutions.com
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
          Depending on where you live, you may have rights to request access,
          correction, or deletion of certain personal information. Please
          contact us using the details below. We may need to verify your request
          and may retain information when required by law.
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain personal information as reasonably necessary to provide
          services, meet legal obligations, resolve disputes, and enforce
          agreements, subject to applicable law.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy periodically to reflect operational, legal,
          or regulatory changes.
        </p>

        <h2>Contact Us</h2>
        <p>
          For questions or complaints, contact us via email at{" "}
          <a href="mailto:inquiry@WynnTaxSolutions.com">
            inquiry@WynnTaxSolutions.com
          </a>{" "}
          or by mail:
        </p>
        <p>
          <strong>Wynn Tax Solutions</strong>
          <br />
          21625 Prairie Street, Suite #200
          <br />
          Chatsworth, CA 91311, United States
        </p>

        <p>© 2025 Wynn Tax Solutions. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
