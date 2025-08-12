import React from "react";

const Main = () => {
  return (
    <main className="main-container">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-grid">
          <div className="welcome-text">
            <h2>We Help Businesses and Individuals Succeed</h2>
            <p>With tailored solutions from industry leading experts.</p>
          </div>
          <div className="consultation-card">
            <div className="consultation-content">
              <span className="call-text">Get a FREE Consultation Today</span>
              <a href="tel:+18449966829" className="call-button">
                <i className="fa-solid fa-phone"></i>(844) 996-6829
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="main-about-section">
        <div className="about-text">
          <h1>
            Wynn Tax Solutions <i className="fa fa-users"></i>
          </h1>
          <h3>
            How We Help You With Business And Personal Tax And Finance Issues.
          </h3>
          <p>
            Wynn Tax Solutions is a team of experienced professionals including
            Enrolled Agents, forensic tax accountants, and personal and business
            financial consultants dedicated to resolving complex tax issues.
            With decades of experience, we’ve built a reputation for strategic,
            results-driven consulting in all types of tax matters.
          </p>
          <p>
            For businesses, we offer comprehensive consulting services that
            support growth, streamline operations, and reduce administrative
            burdens. From entity formation and payroll setup to ongoing
            compliance and quarterly tax filings, our team helps businesses stay
            organized and efficent. We work closely with owners and management
            teams to establish sound processes, maintain accurate records, and
            navigate state and federal requirements—so you can stay focused on
            running your business.
          </p>
          <p>
            On the individual side, our team has helped thousands of clients
            overcome wage garnishments, frozen bank accounts, and mounting
            collection pressure. We know how devastating it can be to lose
            access to your income or savings, and we specialize in fast,
            strategic intervention. Whether you're currently facing enforcement
            or trying to prevent it, our goal is to restore stability and give
            you peace of mind.
          </p>
        </div>
        <div className="about-image">
          <img
            src="images/wynn-home-page-image-1.png"
            alt="Wynn Tax Solutions"
          />
        </div>
      </section>
      <section>
        <div className="image-row">
          <div className="image-row-container">
            {/* Image 1 - BBB Accredited Business */}
            <img
              src="images/bbb-accredited-business.png"
              alt="BBB Accredited Business"
              className="image-item"
            />

            {/* Image 2 - SuperMoney Best Rated Firm */}
            <img
              src="images/trust-builder-supermoney.png"
              alt="SuperMoney Best Rated Firm"
              className="image-item"
            />

            {/* Image 3 - IRS Power of Attorney */}
            <img
              src="images/trust-builder-IRS-power-of-atty-1.png"
              alt="IRS Power of Attorney"
              className="image-item"
            />

            {/* Image 4 - Approved IRS Provider */}
            <img
              src="images/trust-builder-IRS-Provider.png"
              alt="Approved IRS Provider"
              className="image-item"
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Main;
