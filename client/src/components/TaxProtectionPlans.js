import React from "react";

const TaxProtectionPlans = () => {
  return (
    <div className="tax-protection-page">
      {/* Hero Section */}
      <section
        className="tax-protection-hero"
        style={{
          backgroundImage: `url("/images/hero-6.png")`,
        }}
      >
        <div className="tax-protection-overlay"></div>
        <div className="tax-protection-content">
          <h1>Tax Protection Plans</h1>
          <nav className="tax-protection-breadcrumbs">
            <a href="/">Home</a> <span>/</span>{" "}
            <span>Tax Protection Plans</span>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="tax-protection-main">
        <section className="tax-protection-intro">
          <h1 className="tax-protection-title">Tax Protection Plans</h1>
          <p>
            At <strong>Wynn Tax Solutions</strong>, we believe proactive tax
            support is key to financial stability. Our Tax Protection Plans
            provide structured tax compliance, IRS communication, and resolution
            services. Whether you need essential assistance or comprehensive tax
            management, we have a plan that fits your needs.
          </p>
        </section>

        <section className="tax-protection-services">
          <h1 className="tax-protection-title">
            Choose the Right Plan for Your Needs
          </h1>

          {/* Standard Plan */}
          <h2 className="tax-protection-subtitle">
            ✔ Standard Plan – Essential Protection
          </h2>
          <p>
            The Standard Plan is designed for individuals and small businesses
            looking for foundational tax support. It includes:
          </p>
          <ul>
            <li>
              <strong>Basic IRS Representation</strong> – Assistance with
              responding to IRS notices and minor issues.
            </li>
            <li>
              <strong>General Consultation</strong> – Access to tax
              professionals for guidance on routine tax matters.
            </li>
            <li>
              <strong>Tax Return Filing for Active Years</strong> – We manage
              and file your tax returns while we are actively working with you.
            </li>
            <li>
              <strong>Basic Resolution Services</strong> – Help with minor tax
              concerns and compliance.
            </li>
          </ul>
          <p>
            This plan is ideal for those with straightforward tax situations who
            want basic protection and ongoing tax guidance.
          </p>

          {/* Premium Plan */}
          <h2 className="tax-protection-subtitle">
            ✔ Premium Plan – Advanced Tax Support
          </h2>
          <p>
            The Premium Plan is designed for individuals and small business
            owners with more complex tax needs. It includes everything in the
            Standard Plan, plus:
          </p>
          <ul>
            <li>
              <strong>Expanded IRS Representation</strong> – Support for audits
              and inquiries beyond basic notice responses.
            </li>
            <li>
              <strong>Advanced Consultation</strong> – In-depth tax planning
              discussions tailored to your situation.
            </li>
            <li>
              <strong>Ongoing Tax Return Handling</strong> – We manage and file
              your tax returns for up to three years after our active work with
              you concludes.
            </li>
            <li>
              <strong>Moderate Resolution Services</strong> – Assistance with
              resolving more complex tax matters and compliance challenges.
            </li>
          </ul>
          <p>
            This plan is ideal for business owners, investors, and those with
            multiple income sources who want proactive tax management.
          </p>

          {/* Professional Plan */}
          <h2 className="tax-protection-subtitle">
            ✔ Professional Plan – Full-Service Tax Protection
          </h2>
          <p>
            The Professional Plan is our most comprehensive level of service,
            designed for individuals and businesses with high-stakes tax
            situations. It includes everything in the Premium Plan, plus:
          </p>
          <ul>
            <li>
              <strong>Full Audit Representation</strong> – Comprehensive defense
              in case of an audit or major IRS dispute.
            </li>
            <li>
              <strong>Expert Consultation</strong> – Dedicated tax advisor
              providing personalized guidance.
            </li>
            <li>
              <strong>Unlimited Tax Return Handling</strong> – We continue to
              manage and file your tax returns until you choose to cancel the
              service.
            </li>
            <li>
              <strong>Comprehensive Resolution Services</strong> – Full-scale
              resolution assistance for complex tax issues, including legal tax
              protection.
            </li>
          </ul>
          <p>
            This plan is ideal for business owners, high-net-worth individuals,
            and those with complex tax obligations who need full IRS defense and
            high-level tax strategy.
          </p>

          {/* Final Call-to-Action */}
          <h2 className="tax-protection-subtitle">
            ✔ Protect Your Financial Future Today
          </h2>
          <p>
            No matter your tax situation, our Tax Protection Plans ensure you
            have the right level of support to handle IRS matters efficiently
            and minimize stress. Don’t wait until tax problems arise—take
            control of your financial future today.
          </p>
          <p className="tax-protection-cta">
            <i className="fas fa-calendar-alt"></i>{" "}
            <a href="/contact-us">Book an appointment</a> with us to discuss
            which plan is right for you!
          </p>
        </section>
      </main>
    </div>
  );
};

export default TaxProtectionPlans;
