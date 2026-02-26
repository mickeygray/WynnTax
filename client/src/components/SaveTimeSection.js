import React from "react";
import { Link } from "react-router-dom";

const SaveTimeSection = () => {
  return (
    <section className="save-time-section">
      <div className="save-time-container">
        {/* Left Column - Image */}
        <div className="save-time-image">
          <img src="/images/download.jpg" alt="Tax Debt Solutions Provider" />
        </div>

        {/* Right Column - Text Content */}
        <div className="save-time-content">
          <h2>Save Money, Save Time and Sleep Well</h2>
          <p className="subtitle">
            <strong>Who's Representing Your Interests?</strong>
          </p>
          <p>
            We work with clients from all over the U.S., providing comprehensive
            and exhaustive solutions to thousands of satisfied clients. Let us
            help you make the transition to freedom. Get back what is important:
            your time and peace of mind.
          </p>
          <Link to="/contact-us" className="contact-button">
            Contact us today to get help{" "}
            <i className="fas fa-angle-double-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SaveTimeSection;
