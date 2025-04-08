import React from "react";

const TaxNegotiation = () => {
  return (
    <div className="tax-negotiation-page">
      {/* Hero Section */}
      <section
        className="tax-negotiation-hero"
        style={{
          backgroundImage: `url("/images/hero-4.jpg")`,
        }}
      >
        <div className="tax-negotiation-overlay"></div>
        <div className="tax-negotiation-content">
          <h1>Tax Negotiation</h1>
          <nav className="tax-negotiation-breadcrumbs">
            <a href="/">Home</a> <span>/</span> <span>Tax Negotiation</span>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="tax-negotiation-main">
        <section className="tax-negotiation-intro">
          <h1 className="tax-negotiation-title">Tax Negotiation Services</h1>
          <p>
            Facing tax debt can be overwhelming, but{" "}
            <strong>Wynn Tax Solutions</strong> is here to provide the solutions
            you need. Our tax negotiation services are designed to help you
            resolve your tax issues and regain financial stability. Whether
            you’re dealing with unpaid taxes, penalties, or collection actions,
            our team works closely with the IRS to negotiate terms that work for
            you.
          </p>
        </section>

        <section className="tax-negotiation-services">
          <h1 className="tax-negotiation-title">
            Our Tax Negotiation Services
          </h1>
          <p>
            We offer a range of services to help you navigate tax issues,
            including:
          </p>

          {/* Currently Not Collectible */}
          <h2 className="tax-negotiation-subtitle">
            ✔ Currently Not Collectible
          </h2>
          <p>
            If you’re unable to pay your tax debt due to financial hardship, the
            IRS may grant you
            <a href="/tax-negotiation/currently-not-collectible">
              {" "}
              Currently Not Collectible
            </a>{" "}
            status. This means the IRS temporarily pauses collection efforts,
            giving you the breathing room you need. Our team can help you
            determine if you qualify and guide you through the process of
            securing this relief.
          </p>

          {/* IRS Installment Plans */}
          <h2 className="tax-negotiation-subtitle">✔ IRS Installment Plans</h2>
          <p>
            When paying your tax debt in full isn’t possible, an
            <a href="/tax-negotiation/irs-installment-plans">
              {" "}
              IRS installment plan
            </a>{" "}
            may be the right solution. These plans allow you to break your debt
            into manageable monthly payments. We’ll work with you to negotiate
            terms that fit your budget while keeping you compliant with IRS
            requirements.
          </p>

          {/* Penalty Abatement */}
          <h2 className="tax-negotiation-subtitle">✔ Penalty Abatement</h2>
          <p>
            IRS penalties can significantly increase your tax debt, but you may
            be eligible for
            <a href="/tax-negotiation/penalty-abatement">
              {" "}
              penalty abatement
            </a>{" "}
            under certain circumstances. Whether due to reasonable cause, a
            first-time offense, or other qualifying factors, we’ll help you
            petition the IRS to reduce or eliminate penalties, saving you money
            and reducing stress.
          </p>

          {/* Offer in Compromise */}
          <h2 className="tax-negotiation-subtitle">✔ Offer in Compromise</h2>
          <p>
            An
            <a href="/tax-negotiation/offer-in-compromise">
              {" "}
              Offer in Compromise
            </a>{" "}
            allows you to settle your tax debt for less than the full amount
            owed. This is an excellent option for those who cannot pay their
            full tax liability and meet specific IRS criteria. Our experts will
            evaluate your eligibility, prepare your application, and negotiate
            with the IRS on your behalf to secure the best possible outcome.
          </p>

          <p>
            <strong>Wynn Tax Solutions</strong> is here to simplify the
            negotiation process and help you achieve financial relief.
            <a href="/contact-us"> Reach out to us today</a> to learn more about
            our tax negotiation services and get a consultation to learn more
            about how we can help you and your business this tax season.
          </p>
        </section>
      </main>
    </div>
  );
};

export default TaxNegotiation;
