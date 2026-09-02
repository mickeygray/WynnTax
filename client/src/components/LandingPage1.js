// components/LandingPage1.jsx
import React, { useState, useContext, useEffect } from "react";
import leadContext from "../context/leadContext";
import { useNavigate, Link } from "react-router-dom";
import SEO from "./SEO";
import { Helmet } from "react-helmet-async";
import { useTrustedForm } from "../hooks/useTrustedForm";
import { storeSubmissionReceipt } from "../utils/submissionReceipt";

const AFFILIATE_CLICK_KEYS = [
  "source_id",
  "transaction_id",
  "TID",
  "click_id",
  "clickid",
  "cid",
];

function getAffiliateClickIdFromUrl() {
  const params = new URLSearchParams(window.location.search);

  for (const key of AFFILIATE_CLICK_KEYS) {
    const value = params.get(key);
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function persistAffiliateClickId(clickId) {
  if (!clickId) return;

  try {
    localStorage.setItem("affiliate_click_id", clickId);
    sessionStorage.setItem("affiliate_click_id", clickId);

    document.cookie = [
      `affiliate_click_id=${encodeURIComponent(clickId)}`,
      "Path=/",
      "Max-Age=2592000",
      "SameSite=Lax",
      window.location.protocol === "https:" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
  } catch (err) {
    console.error("[AFFILIATE] Failed to persist click ID:", err);
  }
}

function getStoredAffiliateClickId() {
  try {
    const fromSession = sessionStorage.getItem("affiliate_click_id");
    if (fromSession) return fromSession;

    const fromLocal = localStorage.getItem("affiliate_click_id");
    if (fromLocal) return fromLocal;

    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)affiliate_click_id=([^;]+)/,
    );
    if (cookieMatch?.[1]) {
      return decodeURIComponent(cookieMatch[1]);
    }
  } catch (err) {
    console.error("[AFFILIATE] Failed to read stored click ID:", err);
  }

  return "";
}

function getAffiliateNidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const nid = params.get("nid");
  return nid && String(nid).trim() ? String(nid).trim() : "";
}

function persistAffiliateNid(nid) {
  if (!nid) return;

  try {
    localStorage.setItem("affiliate_nid", nid);
    sessionStorage.setItem("affiliate_nid", nid);

    document.cookie = [
      `affiliate_nid=${encodeURIComponent(nid)}`,
      "Path=/",
      "Max-Age=2592000",
      "SameSite=Lax",
      window.location.protocol === "https:" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
  } catch (err) {
    console.error("[AFFILIATE] Failed to persist nid:", err);
  }
}

function getStoredAffiliateNid() {
  try {
    const fromSession = sessionStorage.getItem("affiliate_nid");
    if (fromSession) return fromSession;

    const fromLocal = localStorage.getItem("affiliate_nid");
    if (fromLocal) return fromLocal;

    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)affiliate_nid=([^;]+)/,
    );
    if (cookieMatch?.[1]) {
      return decodeURIComponent(cookieMatch[1]);
    }
  } catch (err) {
    console.error("[AFFILIATE] Failed to read stored nid:", err);
  }

  return "";
}
const LeadForm = () => {
  // ── Affiliate capture + form pre-fill from URL params ───────
  const { certUrl, inputProps: tfInputProps } = useTrustedForm();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // 1. Capture & persist affiliate tracking IDs
    const incomingClickId = getAffiliateClickIdFromUrl();
    const incomingNid = getAffiliateNidFromUrl();

    if (incomingClickId) {
      persistAffiliateClickId(incomingClickId);
      setAffiliateClickId(incomingClickId);
    } else {
      const storedClickId = getStoredAffiliateClickId();
      if (storedClickId) {
        setAffiliateClickId(storedClickId);
      }
    }

    if (incomingNid) {
      persistAffiliateNid(incomingNid);
      setAffiliateNid(incomingNid);
    } else {
      const storedNid = getStoredAffiliateNid();
      if (storedNid) {
        setAffiliateNid(storedNid);
      }
    }

    // 2. Pre-fill form fields from URL params
    const prefill = {};
    let hasAny = false;

    const paramMap = {
      name: "name",
      email: "email",
      phone: "phone",
      debtAmount: "debtAmount",
      debt_amount: "debtAmount",
      debt: "debtAmount",
      filedAllTaxes: "filedAllTaxes",
      filed_all_taxes: "filedAllTaxes",
      filed: "filedAllTaxes",
      state: "state",
    };

    for (const [paramKey, formKey] of Object.entries(paramMap)) {
      const value = params.get(paramKey);
      if (value && String(value).trim()) {
        prefill[formKey] = String(value).trim();
        hasAny = true;
      }
    }

    if (hasAny) {
      setFormData((prev) => ({ ...prev, ...prefill }));

      if (prefill.debtAmount && prefill.filedAllTaxes) {
        setStep(2);
      }
    }
  }, []);
  const navigate = useNavigate();
  const { sendLeadForm } = useContext(leadContext);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [formData, setFormData] = useState({
    debtAmount: "",
    filedAllTaxes: "",
    name: "",
    phone: "",
    email: "",
  });
  const [affiliateClickId, setAffiliateClickId] = useState("");
  const [affiliateNid, setAffiliateNid] = useState("");
  const [affiliateSub1] = useState("");
  const [affiliateSub2] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentChecked || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await sendLeadForm({
        ...formData,
        consentGiven: true,
        affiliateClickId: affiliateClickId || getStoredAffiliateClickId(),
        affiliateNid: affiliateNid || getStoredAffiliateNid(),
        affiliateSub1,
        affiliateSub2,
        trustedFormCertUrl: certUrl,
      });

      const receipt = String(result?.submissionReceipt || "").trim();
      if (!receipt) {
        throw new Error("Submission receipt was not available");
      }
      storeSubmissionReceipt(receipt);

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

  const isStep1Valid = formData.debtAmount && formData.filedAllTaxes;
  const isStep2Valid =
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.email.trim() &&
    consentChecked;

  return (
    <div className="lp-form">
      <div className="lp-form__header">
        <div className="lp-form__badge">Free Case Review</div>
        <h3 className="lp-form__title">See If You Qualify</h3>
        <p className="lp-form__subtitle">Takes less than 60 seconds</p>
      </div>

      {/* Progress */}
      <div className="lp-form__progress">
        <div className={`lp-form__progress-step ${step >= 1 ? "active" : ""}`}>
          1
        </div>
        <div className={`lp-form__progress-bar ${step >= 2 ? "active" : ""}`} />
        <div className={`lp-form__progress-step ${step >= 2 ? "active" : ""}`}>
          2
        </div>
      </div>

      {step === 1 ? (
        <form className="lp-form__step" onSubmit={(e) => e.preventDefault()}>
          <div className="lp-form__field">
            <label>How much do you owe the IRS?</label>
            <select
              name="debtAmount"
              value={formData.debtAmount}
              onChange={handleChange}
              required
            >
              <option value="">Select amount...</option>
              <option value="<10000">Less than $10,000</option>
              <option value="10000-25000">$10,000 – $25,000</option>
              <option value="25000-50000">$25,000 – $50,000</option>
              <option value="50000-100000">$50,000 – $100,000</option>
              <option value=">100000">More than $100,000</option>
            </select>
          </div>

          <div className="lp-form__field">
            <label>Are your tax returns up to date?</label>
            <div className="lp-form__options">
              <button
                type="button"
                className={`lp-form__option ${formData.filedAllTaxes === "yes" ? "selected" : ""}`}
                onClick={() =>
                  setFormData({ ...formData, filedAllTaxes: "yes" })
                }
              >
                Yes
              </button>
              <button
                type="button"
                className={`lp-form__option ${formData.filedAllTaxes === "no" ? "selected" : ""}`}
                onClick={() =>
                  setFormData({ ...formData, filedAllTaxes: "no" })
                }
              >
                No
              </button>
            </div>
          </div>

          <button
            type="button"
            className="lp-form__btn"
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
          >
            Continue →
          </button>
        </form>
      ) : (
        <form className="lp-form__step" onSubmit={handleSubmit}>
          <div className="lp-form__field">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Full Name"
              required
            />
          </div>
          <div className="lp-form__field">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
          </div>
          <div className="lp-form__field">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
          </div>

          <label className="lp-form__consent">
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
              artificial or prerecorded voice. Message and data rates may apply.
              Consent is not a condition of purchase. View our{" "}
              <Link to="/privacy-policy">Privacy Policy</Link> and{" "}
              <Link to="/terms-of-service">Terms of Service</Link>.
            </span>
          </label>
          <input {...tfInputProps} />
          <button
            type="submit"
            className="lp-form__btn lp-form__btn--submit"
            disabled={!isStep2Valid || isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Get My Free Consultation"}
          </button>

          {submitError && (
            <p className="lp-form__error" role="alert">
              {submitError}
            </p>
          )}

          <button
            type="button"
            className="lp-form__back"
            onClick={() => setStep(1)}
            disabled={isSubmitting}
          >
            ← Back
          </button>
        </form>
      )}

      <div className="lp-form__trust">
        <span>🔒 Secure Form</span>
        <span>✓ No Obligation</span>
      </div>
      <p className="lp-form__disclosure">
        Wynn Tax Solutions is a private tax resolution firm, not the IRS or a
        government agency. The consultation is free. If services are
        recommended, scope and fees are provided in writing before engagement.
        Results vary by circumstances.
      </p>
    </div>
  );
};

/**
 * LandingPage1 - High-Converting Sales Landing Page
 * No navigation, no chatbot, focused on conversion
 */
const LandingPage1 = () => {
  return (
    <div className="lp" id="top">
      <SEO
        title="IRS Tax Resolution Consultation | Wynn Tax Solutions"
        description="Discuss IRS tax debt, unfiled returns, liens, levies, and available resolution options with Wynn Tax Solutions. Start with a free, confidential consultation."
        canonical="/qualify-now"
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      {/* Minimal Header */}
      <header className="lp__header">
        <img
          src="/images/logo-wynn.png"
          alt="Wynn Tax Solutions"
          className="lp__logo"
        />
        <a href="tel:18449966829" className="lp__header-phone">
          <span className="lp__header-phone-label">Call Now:</span>
          <span className="lp__header-phone-number">(844) 996-6829</span>
        </a>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__hero">
        <div className="lp__hero-bg">
          <img
            src="/images/wynn-landing-hero.png"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
          />
          <div className="lp__hero-overlay" />
        </div>

        <div className="lp__hero-wrapper">
          {/* Full-width headline above the grid */}
          <div className="lp__hero-header">
            <div className="lp__urgency-badge">
              <span className="lp__urgency-dot" />
              Confidential IRS Tax Resolution Consultation
            </div>

            <h1 className="lp__headline">
              Owe The IRS <span className="lp__highlight">$10,000+</span>?
              Understand Your Resolution Options.
            </h1>
          </div>

          {/* Two-column grid: Form left, Info right */}
          <div className="lp__hero-grid">
            {/* LEFT - Form (shows first on mobile) */}
            <div className="lp__hero-left">
              <LeadForm variant="hero" />
            </div>

            {/* RIGHT - Supporting info */}
            <div className="lp__hero-right">
              <p className="lp__subheadline">
                Wynn Tax Solutions helps individuals and businesses review
                federal and state tax matters and understand the available next
                steps.
              </p>

              <div className="lp__hero-proof">
                <div className="lp__proof-item">
                  <span className="lp__proof-number">Federal</span>
                  <span className="lp__proof-label">IRS Tax Matters</span>
                </div>
                <div className="lp__proof-divider" />
                <div className="lp__proof-item">
                  <span className="lp__proof-number">State</span>
                  <span className="lp__proof-label">Tax Matters</span>
                </div>
                <div className="lp__proof-divider" />
                <div className="lp__proof-item">
                  <span className="lp__proof-number">Nationwide</span>
                  <span className="lp__proof-label">Consultations</span>
                </div>
              </div>

              <div className="lp__hero-trust">
                <div className="lp__trust-item">
                  <span className="lp__trust-icon">📋</span>
                  <span>Individual Case Review</span>
                </div>
                <div className="lp__trust-item">
                  <span className="lp__trust-icon">🛡️</span>
                  <span>Written Scope &amp; Fees</span>
                </div>
                <div className="lp__trust-item">
                  <span className="lp__trust-icon">🇺🇸</span>
                  <span>Serving All 50 States</span>
                </div>
              </div>

              <a href="tel:18449966829" className="lp__hero-phone">
                📞 Prefer to talk? Call <strong>(844) 996-6829</strong>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROBLEM AGITATION
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__problems">
        <div className="lp__container">
          <h2 className="lp__section-title">
            Are You Dealing With Any of These IRS Problems?
          </h2>

          <div className="lp__problems-grid">
            <div className="lp__problem">
              <div className="lp__problem-icon">⚠️</div>
              <h3>Wage Garnishment</h3>
              <p>You received notice of an IRS wage levy</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">🏦</div>
              <h3>Bank Levy</h3>
              <p>You received notice involving funds in a bank account</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">🏠</div>
              <h3>Tax Lien</h3>
              <p>There's a lien on your home or property</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">📬</div>
              <h3>IRS Letters</h3>
              <p>You're receiving collection or balance-due notices</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">📋</div>
              <h3>Unfiled Returns</h3>
              <p>You haven't filed taxes in one or more years</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">💰</div>
              <h3>Growing Balance</h3>
              <p>Penalties and interest keep adding up</p>
            </div>
          </div>

          <p className="lp__problems-cta">
            <strong>You have options.</strong> The appropriate path depends on
            filing status, finances, collection activity, and the facts of the
            case.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SOLUTION / HOW WE HELP
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__solution">
        <div className="lp__container">
          <div className="lp__solution-grid">
            <div className="lp__solution-content">
              <span className="lp__eyebrow">The Wynn Tax Difference</span>
              <h2 className="lp__section-title lp__section-title--left">
                We Represent Your Interests <em>Before</em> The IRS
              </h2>
              <p className="lp__solution-text">
                If you engage Wynn Tax Solutions, our tax professionals review
                your records, explain available paths, and represent you within
                the agreed scope of work.
              </p>

              <ul className="lp__benefits">
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Address Collection Action</strong>
                    <p>
                      We review notices, deadlines, and available responses to
                      levies, garnishments, and liens
                    </p>
                  </div>
                </li>
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Evaluate Resolution Options</strong>
                    <p>
                      We evaluate payment plans, penalty relief, offers in
                      compromise, and other options when applicable
                    </p>
                  </div>
                </li>
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Work Toward Compliance</strong>
                    <p>
                      We identify missing returns and other filing requirements
                      that may need to be addressed
                    </p>
                  </div>
                </li>
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Understand Scope &amp; Fees</strong>
                    <p>
                      Recommended services, scope, and fees are provided in
                      writing before engagement
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="lp__solution-image">
              <img src="/images/wynn-gilf.png" alt="Tax professional at work" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROCESS / HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__process">
        <div className="lp__container">
          <span className="lp__eyebrow lp__eyebrow--center">
            Simple 3-Step Process
          </span>
          <h2 className="lp__section-title">How The Review Process Works</h2>

          <div className="lp__steps">
            <div className="lp__step">
              <div className="lp__step-number">1</div>
              <div className="lp__step-content">
                <h3>Free Consultation</h3>
                <p>
                  We review the information you provide and discuss the tax
                  issue during a no-cost, no-obligation consultation.
                </p>
              </div>
            </div>

            <div className="lp__step-arrow">→</div>

            <div className="lp__step">
              <div className="lp__step-number">2</div>
              <div className="lp__step-content">
                <h3>Investigation & Strategy</h3>
                <p>
                  If you engage us, we obtain the authorized records needed to
                  evaluate the matter and develop a case strategy.
                </p>
              </div>
            </div>

            <div className="lp__step-arrow">→</div>

            <div className="lp__step">
              <div className="lp__step-number">3</div>
              <div className="lp__step-content">
                <h3>Resolution</h3>
                <p>
                  We pursue the agreed resolution path and keep you informed.
                  Available options and outcomes depend on your circumstances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SOCIAL PROOF / TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__testimonials">
        <div className="lp__container">
          <span className="lp__eyebrow lp__eyebrow--center">What To Expect</span>
          <h2 className="lp__section-title">A Clear, Case-Specific Review</h2>

          <div className="lp__testimonials-grid">
            <div className="lp__testimonial">
              <h3>Listen First</h3>
              <blockquote>
                We start with the facts of your tax matter, your filing status,
                and any active collection notices.
              </blockquote>
              <div className="lp__testimonial-author">
                <strong>No one-size-fits-all promises</strong>
              </div>
            </div>

            <div className="lp__testimonial">
              <h3>Explain The Options</h3>
              <blockquote>
                We explain which resolution paths may be available, what they
                require, and what the next steps would be.
              </blockquote>
              <div className="lp__testimonial-author">
                <strong>Plain-language guidance</strong>
              </div>
            </div>

            <div className="lp__testimonial">
              <h3>Put It In Writing</h3>
              <blockquote>
                If paid services are recommended, the proposed scope and fees
                are provided before you decide whether to proceed.
              </blockquote>
              <div className="lp__testimonial-author">
                <strong>No obligation to hire us</strong>
              </div>
            </div>
          </div>

          <div className="lp__trust-logos">
            <img
              src="/images/bbb-accredited-business.png"
              alt="BBB Accredited Business"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CREDENTIALS / WHY US
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__credentials">
        <div className="lp__container">
          <div className="lp__credentials-grid">
            <div className="lp__credential">
              <div className="lp__credential-icon">⚖️</div>
              <h3>Tax Resolution Team</h3>
              <p>
                Professionals focused on federal and state tax matters
              </p>
            </div>
            <div className="lp__credential">
              <div className="lp__credential-icon">🏛️</div>
              <h3>IRS Enrolled Agents</h3>
              <p>
                Federally licensed tax practitioners authorized to represent you
                before the IRS
              </p>
            </div>
            <div className="lp__credential">
              <div className="lp__credential-icon">🇺🇸</div>
              <h3>All 50 States</h3>
              <p>
                We help clients nationwide with both federal and state tax
                issues
              </p>
            </div>
            <div className="lp__credential">
              <div className="lp__credential-icon">🛡️</div>
              <h3>Written Engagement Terms</h3>
              <p>Review the proposed services and fees before work begins</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="lp__final-cta">
        <div className="lp__container">
          <div className="lp__final-cta-content">
            <h2>Start With A Clear Review</h2>
            <p>
              A consultation can help you understand notices, deadlines, and
              the resolution paths that may fit your circumstances.
            </p>

            <div className="lp__final-cta-actions">
              <a href="tel:18449966829" className="lp__cta-phone">
                📞 Call (844) 996-6829
              </a>
              <span className="lp__cta-or">or</span>
              <a href="#top" className="lp__cta-form">
                Get Your Free Consultation →
              </a>
            </div>

            <p className="lp__final-cta-reassurance">
              ✓ Free consultation &nbsp;&nbsp; ✓ No obligation &nbsp;&nbsp; ✓
              Confidential consultation
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          MINIMAL FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="lp__footer">
        <div className="lp__container">
          <p className="lp__footer-copy">
            © {new Date().getFullYear()} Wynn Tax Solutions. All rights
            reserved.
          </p>
          <p className="lp__footer-disclaimer">
            This is an advertisement for tax resolution services. Wynn Tax
            Solutions is a tax resolution firm and is not affiliated with the
            IRS or any government agency. Results vary based on individual
            circumstances.
          </p>
          <p className="lp__footer-disclaimer">
            21625 Prairie Street, Suite 200, Chatsworth, CA 91311 ·{" "}
            <a
              href="https://www.bbb.org/us/ca/chatsworth/profile/tax-consultant/wynn-tax-solutions-inc-1216-1000042121"
              target="_blank"
              rel="noopener noreferrer"
            >
              View our BBB profile
            </a>
          </p>
          <div className="lp__footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage1;
