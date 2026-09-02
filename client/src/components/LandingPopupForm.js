import React, { useState, useContext } from "react";
import leadContext from "../context/leadContext";
import { Link, useNavigate } from "react-router-dom";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq";
import { useTrustedForm } from "../hooks/useTrustedForm";
import { storeSubmissionReceipt } from "../utils/submissionReceipt";

const LandingPopupForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { sendLeadForm } = useContext(leadContext);
  const { certUrl, inputProps: tfInputProps } = useTrustedForm();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    debtAmount: "",
    filedAllTaxes: "",
    name: "",
    phone: "",
    email: "",
    bestTime: "",
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => setStep(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentChecked || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const result = await sendLeadForm({
        ...formData,
        consentGiven: true,
        trustedFormCertUrl: certUrl,
      });
      const receipt = String(result?.submissionReceipt || "").trim();
      if (!receipt) throw new Error("Submission receipt was not available");

      storeSubmissionReceipt(receipt);
      trackCustomEvent("LandingFormSubmitted", { source: "AdvancedLeadForm" });
      trackStandardEvent("Lead");
      onClose();
      navigate("/thank-you", {
        replace: true,
        state: { submissionReceipt: receipt },
      });
    } catch {
      setSubmitError(
        "We could not confirm your request. Please try again or call (844) 996-6829.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-popup-overlay">
      <div className="landing-popup-form">
        <button
          className="landing-popup-close"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close consultation form"
        >
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
            <label className="landing-popup-consent">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                required
              />
              <span>
                I consent to receive marketing calls, text messages, and emails
                from Wynn Tax Solutions at the contact information I provided,
                including via an automatic telephone dialing system and/or
                artificial or prerecorded voice. Message and data rates may
                apply. Consent is not a condition of purchase. View our{" "}
                <Link to="/privacy-policy">Privacy Policy</Link> and{" "}
                <Link to="/terms-of-service">Terms of Service</Link>.
              </span>
            </label>
            <input {...tfInputProps} />
            <button
              type="submit"
              className="landing-popup-submit"
              disabled={!consentChecked || isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
            {submitError && (
              <p className="landing-popup-error" role="alert">
                {submitError}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default LandingPopupForm;
