import React from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const isMobile = window.innerWidth <= 768;
  return (
    <div className="hero-container">
      {/* Background Video */}
      {!isMobile ? (
        <video autoPlay muted loop className="hero-video">
          <source src="images/Wynn-Hero-01.mp4" type="video/mp4" />
          Your browser does not support the video tag!
        </video>
      ) : (
        <img
          src="images/Cover-Video-by-Shutterstock-1111048265-compressed_9.jpeg"
          alt="Hero Background"
          className="hero-image"
        />
      )}

      {/* Overlay Content */}
      <div className="hero-content">
        <h1 className="hero-title">Wynn Tax Solutions</h1>
        <h3 className="hero-subtitle">
          <strong>Individual and Business Tax Consulting</strong>
          <br />
          <br />
          We work with businesses and individuals from all over the U.S.
          providing comprehensive and tailored solutions.
        </h3>

        {/* Call to Action Buttons */}
        <div className="hero-buttons">
          <Link to="/our-tax-services" className="hero-btn">
            <i className="fa-solid fa-folder"></i> OUR TAX SERVICES
          </Link>

          <Link to="/contact-us" className="hero-btn">
            <i className="fa-solid fa-phone"></i> FREE CONSULTATION
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
