import React from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <div className="hero-container">
      {/* Background Video */}
      <video autoPlay muted loop className="hero-video">
        <source
          src="images/Cover-Video-by-Shutterstock-1111048265-compressed.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Content */}
      <div className="hero-content">
        <h1 className="hero-title">Wynn Tax Solutions</h1>
        <p className="hero-subtitle">
          We work with clients from all over the U.S. providing comprehensive
          and exhaustive solutions to thousands of satisfied clients.
        </p>

        {/* Call to Action Buttons */}
        <div className="hero-buttons">
          <Link to="/our-tax-services" className="hero-btn">
            Our Tax Services
          </Link>

          <Link to="/contact-us" className="hero-btn">
            Free Consultation
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
