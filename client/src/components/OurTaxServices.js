import React from "react";
import { Link } from "react-router-dom";
const services = [
  {
    title: "Tax Relief",
    description:
      "Dealing with tax issues can feel overwhelming, but you’re not alone. We specialize in providing personalized tax relief services that help individuals and businesses resolve their tax challenges efficiently and effectively.",
    link: "/tax-relief/",
    image:
      "https://taxproblemassistance.com/wp-content/uploads/2025/01/shutterstock_25525225971.jpg",
  },
  {
    title: "Tax Resolution",
    description:
      "Dealing with tax challenges can feel like an uphill battle, but we are here to help. Our tax resolution services provide expert guidance and comprehensive solutions to help you regain financial peace of mind.",
    link: "/tax-resolution/",
    image:
      "https://taxproblemassistance.com/wp-content/uploads/2025/01/shutterstock_158232020.jpg",
  },
  {
    title: "Tax Negotiation",
    description:
      "Facing tax debt can be overwhelming, but we provide the solutions you need. Our tax negotiation services are designed to help you resolve your tax issues and regain financial stability.",
    link: "/tax-negotiation/",
    image:
      "https://taxproblemassistance.com/wp-content/uploads/2025/01/shutterstock_163940900.jpg",
  },
  {
    title: "Tax Protection Plans",
    description:
      "We believe in providing peace of mind through proactive support and protection. Our Tax Protection Plans are designed to safeguard your financial well-being with varying levels of service.",
    link: "https://taxproblemassistance.com/tax-protection-plans/",
    image:
      "https://taxproblemassistance.com/wp-content/uploads/2025/01/shutterstock_82390135.jpg",
  },
];

const OurTaxServices = () => {
  return (
    <>
      {/* Hero Section */}
      <section
        className="hero our-tax-services-hero"
        style={{
          backgroundImage: `url("/images/hero-3.png")`,
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="services-hero-title">Our Tax Services</h1>
          <nav className="breadcrumb">
            <ol>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>/ Our Tax Services</li>
            </ol>
          </nav>
        </div>
      </section>
      {/* Main Tax Services Section */}
      <section className="tax-services">
        <div className="container">
          <div className="row">
            {/* Left Column (Tagline) */}
            <div className="column one-third">
              <div className="service-tagline">
                <p>Tax solutions that protect your assets.</p>
              </div>
            </div>

            {/* Right Column (Description) */}
            <div className="column two-thirds">
              <h2 className="section-title">Our Tax Services</h2>
              <p className="section-description">
                We present you with the best in tax support and resolution.
              </p>
              <p className="section-description">
                We will keep you informed and support you throughout the entire
                process, shouldering most of the work and guiding your tax
                situation to a positive resolution.
              </p>
            </div>
          </div>
        </div>
      </section>{" "}
      <section className="tax-services-grid">
        <div className="grid-container">
          {services.map((service, index) => (
            <a
              href={service.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flip-box"
              key={index}
            >
              <div className="flip-box-inner">
                {/* Front Side */}
                <div
                  className="flip-box-front"
                  style={{ backgroundImage: `url(${service.image})` }}
                >
                  <div className="overlay"></div>
                  <div className="flip-box-icon">
                    <i className="fas fa-folder-open"></i>
                  </div>
                  <h3 className="flip-box-title">{service.title}</h3>
                </div>

                {/* Back Side */}
                <div className="flip-box-back">
                  <h3 className="flip-box-title">{service.title}</h3>
                  <p className="flip-box-text">{service.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>{" "}
      <section className="services-cta-section">
        <div className="services-cta-container">
          <p className="services-cta-text">Contact To Book an Appointment</p>
          <a href="tel:+18663796253" className="services-cta-button">
            <i className="fas fa-phone-alt"></i>(844) 996-6829
          </a>
        </div>
      </section>
    </>
  );
};

export default OurTaxServices;
