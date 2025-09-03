import React, { useContext, useState } from "react";
import leadContext from "../context/leadContext";
const ContactUs = () => {
  const { sendEmail } = useContext(leadContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

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
    console.log(emailPayload);
    sendEmail(emailPayload);

    // Only this form counts as a "Lead"
    window.fbq?.("track", "Lead", {
      value: 0,
      currency: "USD",
      lead_type: "Contact Form",
    });
  };
  return (
    <div>
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

      {/* Floating Contact Info Boxes */}
      <div className="contact-info-container">
        <div className="contact-info-box">
          <i className="fas fa-phone-alt"></i>
          <h3>Contacts</h3>
          <p>
            <a href="tel:+18449966829">(844) 996-6829</a>
          </p>
          <p>
            <a href="mailto:inquiry@WynnTaxSolutions.com">
              inquiry@WynnTaxSolutions.com
            </a>
          </p>
        </div>
        <div className="contact-info-box">
          <i className="fas fa-home"></i>
          <h3>Address</h3>
          <p>21625 Prairie Street, Suite #200</p>
          <p>Chatsworth, CA 91331</p>
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

      {/* Form and Image Section */}
      <div className="contact-form-container">
        <div className="contact-form">
          <h3>Send Us a Message</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
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
                required
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <textarea
              name="message"
              placeholder="Your Message"
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
