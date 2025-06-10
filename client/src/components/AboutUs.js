import React from "react";
import { Link } from "react-router-dom";
const AboutUs = () => {
  return (
    <div className="about-page-container">
      {/* About Page Hero Section */}
      <section
        className="about-hero"
        style={{
          backgroundImage: `url("/images/contact-hero.png")`,
        }}
      >
        {" "}
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          {" "}
          <h1 className="about-hero-title">About Us</h1>{" "}
          <nav className="breadcrumb">
            <ol>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>/About Us</li>
            </ol>
          </nav>
        </div>{" "}
      </section>

      {/* Introduction */}
      <section className="about-intro">
        {" "}
        <h1 className="about-title">
          <i className="fa fa-check-circle" aria-hidden="true"></i> Protecting
          You from IRS and State Tax Collections
        </h1>
        <p>
          At Wynn Tax Solutions, we know that few things cause more stress than
          IRS wage garnishments, bank levies, and aggressive collection actions.
          If you’re worried about losing your paycheck or having your bank
          account frozen, you’re not alone. We’ve seen firsthand how devastating
          these actions can be—especially when they prevent you from covering
          essentials like rent, utilities, or groceries.
        </p>
        <p>
          Our mission is to protect you from these financial hardships and
          restore your peace of mind. With years of experience handling complex
          tax cases, we specialize in stopping garnishments, lifting levies, and
          negotiating directly with the IRS or state tax agencies to resolve
          your tax issues.
        </p>
      </section>

      {/* Stopping Wage Garnishments & Bank Levies */}
      <section className="about-section">
        <h2>Stopping Wage Garnishments & Bank Levies</h2>
        <p>
          The IRS and state tax agencies have broad collection powers, and when
          you owe back taxes, they can take money straight from your paycheck or
          freeze your bank account. If you’ve received a{" "}
          <strong>Notice of Intent to Levy</strong>, it’s critical to act fast.
        </p>
        <p>
          At Wynn Tax Solutions, we work quickly to lift IRS wage garnishments
          and release bank levies. Unlike firms that take a standard approach,
          we assess your unique situation and find the best strategy for your
          case. Whether that means negotiating directly with the IRS, proving
          financial hardship, or leveraging legal exemptions, we fight to
          protect your income and assets.
        </p>
      </section>

      {/* Smart & Creative Tax Resolution Strategies */}
      <section className="about-section">
        <h2>Smart & Creative Tax Resolution Strategies</h2>
        <p>
          Many firms take a one-size-fits-all approach to tax relief, but we
          know every case is different. We explore every possible option to
          reduce or eliminate your tax burden. Some of the solutions we use
          include:
        </p>
        <ul>
          <li>
            {" "}
            <strong>Challenging unfair IRS actions</strong> – If the IRS has
            overstepped, we push back.
          </li>
          <li>
            {" "}
            <strong>Financial Hardship Exemptions</strong> – If paying your tax
            debt would cause severe financial distress, we work to have your
            account placed in <em>Currently Not Collectible (CNC)</em> status.
          </li>
          <li>
            {" "}
            <strong>Offer in Compromise (OIC)</strong> – If eligible, we
            negotiate with the IRS to settle your debt for less than what you
            owe.
          </li>
          <li>
            {" "}
            <strong>Installment Agreements</strong> – We help set up a
            manageable payment plan that prevents further IRS enforcement.
          </li>
          <li>
            {" "}
            <strong>Innocent Spouse Relief</strong> – If you’re being held
            responsible for a spouse’s tax debt unfairly, we can help.
          </li>
        </ul>
      </section>

      {/* Preventing Future IRS Actions */}
      <section className="about-section">
        <h2>Preventing Future IRS Actions</h2>
        <p>
          While we’re experts at stopping IRS enforcement, we also focus on
          long-term solutions to prevent future tax troubles. We assist with:
        </p>
        <ul>
          <li>Filing past-due tax returns</li>
          <li>Reducing or eliminating penalties</li>
          <li>Keeping you compliant with the IRS</li>
        </ul>
        <p>
          Our goal is not just to fix today’s problem but to make sure you never
          face this stress again.
        </p>
      </section>

      {/* Why Choose Us? */}
      <section className="about-section">
        <h2>Why Choose Wynn Tax Solutions?</h2>
        <ul>
          <li>
            {" "}
            <strong>Proven Success</strong> – We’ve helped countless clients
            escape tax levies and garnishments.
          </li>
          <li>
            {" "}
            <strong>Aggressive & Creative Approach</strong> – We fight for you
            where others might give up.
          </li>
          <li>
            {" "}
            <strong>Personalized Service</strong> – No two cases are the same,
            and we tailor our solutions to fit your needs.
          </li>
          <li>
            <strong>Fast Action</strong> – The IRS won’t wait, and neither do
            we.
          </li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Take Action Today</h2>
        <p className="cta-text">
          If you’re facing IRS collections, garnishments, or levies, don’t
          wait—every day counts. The sooner you act, the better your chances of
          stopping the IRS before they take further action.
        </p>
        <a href="/contact-us" className="cta-button">
          Get Help Now
        </a>
      </section>
    </div>
  );
};

export default AboutUs;
