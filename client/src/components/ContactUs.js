import React, { useContext, useState, useEffect } from "react";
import leadContext from "../context/leadContext";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq";
import { useFormTracking, trackFormAbandon } from "../hooks/useFormTracking";
import SEO from "./SEO";

const ContactUs = () => {
  const { sendEmail } = useContext(leadContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  useFormTracking(formData, "contact-us", !submitted);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!submitted && formData.email) {
        trackFormAbandon("contact-us", formData);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, submitted]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailPayload = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
    };

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    });

    sendEmail(emailPayload);
    setSubmitted(true);
    trackStandardEvent("Lead", {
      source: "Contact Us",
      content_name: "Form Submitted",
    });
  };

  return (
    <div>
      <SEO
        title="Contact Us | Free Tax Consultation | Wynn Tax Solutions"
        description="Get in touch with Wynn Tax Solutions for a free, no-obligation tax consultation. Call (844) 996-6829 or fill out our secure form."
        canonical="/contact-us"
      />
      {/* Hero Section */}
      <section
        className="contact-hero"
        style={{
          backgroundImage: `url("/images/contact-hero.png")`,
        }}
      >
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <h1>Contact Us</h1>
          <nav className="contact-breadcrumbs">
            <a href="/">Home</a> <span>/</span> <span>Contact Us</span>
          </nav>
        </div>
      </section>

      <div className="contact-info-container">
        <div className="contact-info-box">
          <i className="fas fa-phone-alt"></i>
          <h3>Contacts</h3>
          <p>
            <a href="tel:+18449966829">(844) 996-6829</a>
          </p>
        </div>
        <div className="contact-info-box">
          <i className="fas fa-home"></i>
          <h3>Address</h3>
          <p>21625 Prairie Street, Suite #200</p>
          <p>Chatsworth, CA 91311</p>
        </div>
        <div className="contact-info-box">
          <i className="fas fa-business-time"></i>
          <h3>Business Hours</h3>
          <p>
            <strong>Mon to Fri:</strong> 7:00 AM – 5:00 PM
          </p>
          <p>
            <strong>Sat & Sun:</strong> Closed
          </p>
        </div>
      </div>

      <div className="contact-form-container">
        <div className="contact-form">
          <h2>Send Us a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                aria-label="First name"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                aria-label="Last name"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="E-mail"
                aria-label="Email address"
                required
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                aria-label="Phone number"
                required
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <textarea
              name="message"
              placeholder="Your Message"
              aria-label="Your message"
              required
              value={formData.message}
              onChange={handleChange}
            ></textarea>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
