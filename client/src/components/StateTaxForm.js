import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * StateTaxForm — Multi-step state-specific intake form
 *
 * Steps:
 *   1. Name + Phone + Email
 *   2. What are you dealing with? (checkboxes)
 *   3. Amount owed + description
 *   4. Consent + submit
 */
const StateTaxForm = ({ stateName, stateAbbr, taxAuthority }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    state: stateName || "",
    problemTypes: [],
    owedAmount: "",
    description: "",
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const problemOptions = [
    { id: "back-taxes", label: "Back Taxes / Unfiled Returns" },
    { id: "wage-garnishment", label: "Wage Garnishment" },
    { id: "bank-levy", label: "Bank Levy / Account Freeze" },
    { id: "tax-lien", label: "Tax Lien" },
    { id: "payment-plan", label: "Need a Payment Plan" },
    { id: "oic", label: "Offer in Compromise / Settlement" },
    { id: "penalty", label: "Penalties & Interest" },
    { id: "audit", label: "State Tax Audit" },
    { id: "license-hold", label: "License / Registration Hold" },
    { id: "other", label: "Other / Not Sure" },
  ];

  const owedRanges = [
    "Under $5,000",
    "$5,000 – $10,000",
    "$10,000 – $25,000",
    "$25,000 – $50,000",
    "$50,000 – $100,000",
    "Over $100,000",
    "Not sure",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (id) => {
    setForm((prev) => ({
      ...prev,
      problemTypes: prev.problemTypes.includes(id)
        ? prev.problemTypes.filter((p) => p !== id)
        : [...prev.problemTypes, id],
    }));
  };

  const canAdvance = () => {
    switch (step) {
      case 1:
        return form.name.trim() !== "" && form.email.trim() !== "";
      case 2:
        return form.problemTypes.length > 0;
      case 3:
        return true;
      case 4:
        return consentChecked;
      default:
        return false;
    }
  };

  const next = () => {
    if (canAdvance() && step < totalSteps) setStep(step + 1);
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentChecked) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/state-tax-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: `State Tax Guide — ${stateName} (${stateAbbr})`,
          problemTypes: form.problemTypes.join(", "),
          consent: true,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        window.location.href = `mailto:info@wynntaxsolutions.com?subject=State Tax Help — ${stateName}&body=${encodeURIComponent(
          `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nState: ${form.state}\nIssues: ${form.problemTypes.join(", ")}\nAmount Owed: ${form.owedAmount}\n\n${form.description}`,
        )}`;
        setSubmitted(true);
      }
    } catch {
      window.location.href = `mailto:info@wynntaxsolutions.com?subject=State Tax Help — ${stateName}&body=${encodeURIComponent(
        `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nState: ${form.state}\nIssues: ${form.problemTypes.join(", ")}\nAmount Owed: ${form.owedAmount}\n\n${form.description}`,
      )}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="stf__success">
        <i className="fas fa-check-circle"></i>
        <h3>We've Got Your Info</h3>
        <p>
          A Wynn Tax Solutions specialist familiar with {stateName} tax issues
          will reach out within 1 business day.
        </p>
        <p className="stf__urgent">
          Need help now? Call <a href="tel:+18449966829">(844) 996-6829</a>
        </p>
      </div>
    );
  }

  return (
    <form className="stf" onSubmit={handleSubmit}>
      <div className="stf__header">
        <h3>
          Get Help With {stateAbbr ? `${stateName}` : "State"} Tax Problems
        </h3>
        <p>
          Tell us what's going on and we'll map out your options
          {taxAuthority ? ` with the ${taxAuthority}` : ""}.
        </p>
      </div>

      {/* Progress bar */}
      <div className="stf__progress">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`stf__progress-step${i + 1 <= step ? " stf__progress-step--active" : ""}${i + 1 < step ? " stf__progress-step--done" : ""}`}
          >
            <div className="stf__progress-dot">
              {i + 1 < step ? <i className="fas fa-check"></i> : i + 1}
            </div>
          </div>
        ))}
        <div className="stf__progress-bar">
          <div
            className="stf__progress-fill"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* ── STEP 1: Contact Info ── */}
      {step === 1 && (
        <div className="stf__step">
          <p className="stf__step-label">Step 1 — Your Information</p>
          <div className="stf__field">
            <label htmlFor="stf-name">Full Name *</label>
            <input
              id="stf-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="John Smith"
              autoFocus
            />
          </div>
          <div className="stf__field">
            <label htmlFor="stf-email">Email *</label>
            <input
              id="stf-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
            />
          </div>
          <div className="stf__field">
            <label htmlFor="stf-phone">Phone</label>
            <input
              id="stf-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      )}

      {/* ── STEP 2: Problem Types ── */}
      {step === 2 && (
        <div className="stf__step">
          <p className="stf__step-label">Step 2 — What are you dealing with?</p>
          <div className="stf__checkboxes">
            {problemOptions.map((opt) => (
              <label key={opt.id} className="stf__checkbox">
                <input
                  type="checkbox"
                  checked={form.problemTypes.includes(opt.id)}
                  onChange={() => handleCheckbox(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Amount + Details ── */}
      {step === 3 && (
        <div className="stf__step">
          <p className="stf__step-label">Step 3 — A Few More Details</p>
          <div className="stf__field">
            <label htmlFor="stf-owed">Approximate Amount Owed</label>
            <select
              id="stf-owed"
              name="owedAmount"
              value={form.owedAmount}
              onChange={handleChange}
            >
              <option value="">Select a range...</option>
              {owedRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
          <div className="stf__field">
            <label htmlFor="stf-desc">
              Anything else we should know? (optional)
            </label>
            <textarea
              id="stf-desc"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder={`E.g., "I got a garnishment notice from ${taxAuthority || "the state"} last week..."`}
            />
          </div>
        </div>
      )}

      {/* ── STEP 4: Consent + Submit ── */}
      {step === 4 && (
        <div className="stf__step">
          <p className="stf__step-label">Step 4 — Almost Done</p>

          {/* Summary */}
          <div className="stf__summary">
            <div className="stf__summary-row">
              <span>Name</span>
              <span>{form.name}</span>
            </div>
            <div className="stf__summary-row">
              <span>Email</span>
              <span>{form.email}</span>
            </div>
            {form.phone && (
              <div className="stf__summary-row">
                <span>Phone</span>
                <span>{form.phone}</span>
              </div>
            )}
            <div className="stf__summary-row">
              <span>Issues</span>
              <span>
                {form.problemTypes
                  .map((id) => problemOptions.find((o) => o.id === id)?.label)
                  .join(", ")}
              </span>
            </div>
            {form.owedAmount && (
              <div className="stf__summary-row">
                <span>Amount</span>
                <span>{form.owedAmount}</span>
              </div>
            )}
          </div>

          {/* Consent */}
          <div className="stf__consent">
            <label className="stf__consent-label">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                required
              />
              <span className="stf__consent-checkmark"></span>
              <span className="stf__consent-text">
                I agree to be contacted by Wynn Tax Solutions via phone, email,
                or text (including autodialed or prerecorded calls).
                Message/data rates may apply. Consent is not required to
                purchase. View our{" "}
                <Link to="/legal/privacy">Privacy Policy</Link>.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── Navigation Buttons ── */}
      <div className="stf__nav">
        {step > 1 && (
          <button type="button" className="stf__back" onClick={back}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
        )}
        {step < totalSteps && (
          <button
            type="button"
            className="stf__next"
            onClick={next}
            disabled={!canAdvance()}
          >
            Next <i className="fas fa-arrow-right"></i>
          </button>
        )}
        {step === totalSteps && (
          <button
            type="submit"
            className="stf__submit"
            disabled={submitting || !consentChecked}
          >
            {submitting ? (
              "Sending..."
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Get My Free Consultation
              </>
            )}
          </button>
        )}
      </div>

      <p className="stf__disclaimer">
        Free, no-obligation consultation. Your information is confidential.
      </p>
    </form>
  );
};

export default StateTaxForm;
