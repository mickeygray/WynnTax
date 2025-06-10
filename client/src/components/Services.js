import React from "react";
import { Link } from "react-router-dom";

const services = [
  {
    title: "Tax Relief",
    hoverText:
      "Tax relief programs help individuals and businesses reduce their tax burden through deductions, credits, or settlements.",
    link: "/tax-relief",
  },
  {
    title: "Tax Resolution",
    hoverText:
      "Tax resolution is the process of negotiating with tax authorities to resolve unpaid taxes, audits, liens, or levies.",
    link: "/tax-resolution",
  },
  {
    title: "Tax Negotiation",
    hoverText:
      "Tax negotiation involves working with tax agencies to secure reduced payments, extended deadlines, or settlements.",
    link: "/tax-negotiation",
  },
  {
    title: "Protection Plans",
    hoverText:
      "Tax protection plans safeguard individuals and businesses from future tax issues while optimizing their financial outcomes.",
    link: "/tax-protection-plans",
  },
];

const Services = () => {
  return (
    <section className="services-section">
      <div className="parallax-background"></div>
      <div className="services-content">
        <h2 className="services-title">Business and Personal Tax Services</h2>
        <p className="services-description">
          We will keep you informed and support you throughout the entire
          process, shouldering most of the work and guiding your tax situation
          to a positive resolution.
        </p>
        <div className="services-grid">
          {services.map((service, index) => (
            <Link to={service.link} key={index} className="service-card">
              {service.title}
              <div className="hover-overlay">
                <p>{service.hoverText}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
