import React, { useState, useContext, useEffect } from "react";
import leadContext from "../context/leadContext";
import { useNavigate } from "react-router-dom";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq";
import { useFormTracking, trackFormAbandon } from "../hooks/useFormTracking";

const LandingPopupForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { sendLeadForm } = useContext(leadContext);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    debtAmount: "",
    filedAllTaxes: "",
    name: "",
    phone: "",
    email: "",
    bestTime: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // 🎯 Track form inputs (but don't restore)
  useFormTracking(formData, "landing-popup", !submitted);

  // 🎯 Track abandonment on close or page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only track if they entered something
      if (
        !submitted &&
        (formData.debtAmount || formData.name || formData.email)
      ) {
        trackFormAbandon("landing-popup", formData);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, submitted]);
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => setStep(2);

  const handleSubmit = (e) => {
    e.preventDefault();

    const { debtAmount, filedAllTaxes, name, phone, email, bestTime } =
      formData;

    // 🔹 Pixel: advanced lead form submitted

    sendLeadForm(formData);
    trackCustomEvent("LandingFormSubmitted", {
      source: "AdvancedLeadForm", // identify this specific form
      has_email: !!email,
      has_phone: !!phone,
      contact_type:
        phone && email ? "both" : phone ? "phone" : email ? "email" : "none",
      debt_amount: debtAmount || null,
      filed_all_taxes: filedAllTaxes || null,
      best_time: bestTime || null,
    });
    trackStandardEvent("Lead");
    navigate("/thank-you");
  };

  return (
    <div className="landing-popup-overlay">
      <div className="landing-popup-form">
        <button className="landing-popup-close" onClick={onClose}>
          ✕
        </button>
        {step === 1 && (
          <form onSubmit={(e) => e.preventDefault()}>
            <h2>How much do you owe?</h2>
            <select
              name="debtAmount"
              value={formData.debtAmount}
              onChange={handleChange}
              required
            >
              <option value="">Select an amount</option>
              <option value="<10000">Less than $10,000</option>
              <option value="10000-20000">$10,000 – $20,000</option>
              <option value="20000-50000">$20,000 – $50,000</option>
              <option value="50000-100000">$50,000 – $100,000</option>
              <option value=">100000">More than $100,000</option>
            </select>

            <h2>Have you filed all your taxes?</h2>
            <div className="landing-popup-radio-group">
              <label>
                <input
                  type="radio"
                  name="filedAllTaxes"
                  value="yes"
                  checked={formData.filedAllTaxes === "yes"}
                  onChange={handleChange}
                  required
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="filedAllTaxes"
                  value="no"
                  checked={formData.filedAllTaxes === "no"}
                  onChange={handleChange}
                  required
                />
                No
              </label>
            </div>

            <button
              type="button"
              className="landing-popup-next"
              onClick={handleNext}
            >
              Next
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h2>Your Contact Information</h2>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
            <input
              type="text"
              name="bestTime"
              value={formData.bestTime}
              onChange={handleChange}
              placeholder="Best Time to Contact"
            />
            <button type="submit" className="landing-popup-submit">
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LandingPopupForm;
