import React from "react";

const Main = () => {
  return (
    <main className="main-container">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-text">
          <h2>We Help Our Clients Succeed</h2>
          <p>By delivering tax results that matter.</p>
        </div>
        <div className="consultation-box">
          <span className="call-text">Get a FREE Consultation Today</span>
          <br />
          <a href="tel:+18663796253" className="call-button">
            <i className="fa fa-phone-alt"></i> (866) 379-6253
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="main-about-section">
        <div className="about-text">
          <h1>
            Welcome to Wynn Tax Solutions <i className="fa fa-users"></i>
          </h1>
          <h3>How Wynn Tax Solutions Works for Your Protection?</h3>
          <p>
            We at Wynn Tax Solutions understand that few things cause more
            anxiety than the threat of wage garnishment or a bank account levy.
            We have witnessed firsthand the financial hardship that can arise
            from a missed bill due to a frozen account, which is why protecting
            our clients from these outcomes is our top priority.
          </p>
          <p>
            Our team specializes in lifting levies and garnishments imposed by
            the IRS or state taxing agencies. We employ innovative strategies to
            achieve these results, where other firms might give up. Our deep
            understanding of tax law and negotiation tactics allows us to
            intervene effectively, helping clients regain financial stability.
          </p>
          <p>
            At Wynn Tax Solutions, we take pride in crafting creative and
            effective solutions to shield our clients from the most severe IRS
            collection actions. Whether you are currently facing a levy or want
            to safeguard your financial future, our team is committed to finding
            the best path forward to provide you with peace of mind.
          </p>
        </div>
        <div className="about-image">
          <img
            src="/images/TAG-Home-Page-Image-1.png"
            alt="Wynn Tax Solutions"
          />
        </div>
      </section>
      <section>
        <div className="image-row">
          <div className="image-row-container">
            {/* Image 1 - BBB Accredited Business */}
            <img
              src="/images/bbb-accredited-business.png"
              alt="BBB Accredited Business"
              className="image-item"
            />

            {/* Image 2 - SuperMoney Best Rated Firm */}
            <img
              src="/images/trust-builder-supermoney.png"
              alt="SuperMoney Best Rated Firm"
              className="image-item"
            />

            {/* Image 3 - IRS Power of Attorney */}
            <img
              src="/images/trust-builder-IRS-power-of-atty-1.png"
              alt="IRS Power of Attorney"
              className="image-item"
            />

            {/* Image 4 - Approved IRS Provider */}
            <img
              src="/images/trust-builder-IRS-Provider.png"
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
