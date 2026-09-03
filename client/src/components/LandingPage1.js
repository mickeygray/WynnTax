// components/LandingPage1.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import leadContext from "../context/leadContext";
import { useNavigate, Link } from "react-router-dom";
import SEO from "./SEO";
import { Helmet } from "react-helmet-async";
import { useTrustedForm } from "../hooks/useTrustedForm";
import { storeSubmissionReceipt } from "../utils/submissionReceipt";
import "./LandingPage1.css";

const WYNN_PHONE_DISPLAY = "(844) 996-6829";
const WYNN_PHONE_HREF = "tel:18449966829";
const WYNN_BBB_PROFILE =
  "https://www.bbb.org/us/ca/chatsworth/profile/tax-consultant/wynn-tax-solutions-inc-1216-1000042121";

function trackPaidLandingEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;

  const eventParams = {
    event_category: "paid_landing",
    ...params,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...eventParams });
}

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
  const hasTrackedStart = useRef(false);

  const markFormStarted = () => {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackPaidLandingEvent("paid_form_start");
  };

  const handleChange = (e) => {
    markFormStarted();
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const chooseFiledStatus = (value) => {
    markFormStarted();
    setFormData((current) => ({ ...current, filedAllTaxes: value }));
  };

  const continueToContactDetails = () => {
    if (!isStep1Valid) return;
    trackPaidLandingEvent("paid_form_step_complete", { step: 1 });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentChecked || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    trackPaidLandingEvent("paid_lead_submit_attempt");

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
      trackPaidLandingEvent("generate_lead", { method: "web_form" });

      navigate("/thank-you", {
        replace: true,
        state: { submissionReceipt: receipt },
      });
    } catch {
      trackPaidLandingEvent("paid_lead_submit_error");
      setSubmitError(
        `We could not confirm your request. Please try again or call ${WYNN_PHONE_DISPLAY}.`,
      );
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.debtAmount && formData.filedAllTaxes;
  const phoneDigits = formData.phone.replace(/\D/g, "");
  const isPhoneValid =
    phoneDigits.length === 10 ||
    (phoneDigits.length === 11 && phoneDigits.startsWith("1"));
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    formData.email.trim(),
  );
  const isStep2Valid =
    formData.name.trim().length >= 2 &&
    isPhoneValid &&
    isEmailValid &&
    consentChecked;

  return (
    <div className="lp-form">
      <div className="lp-form__header">
        <h3 className="lp-form__title" id="paid-lead-form-title">
          Talk to a Tax Pro About Your Lien
        </h3>
        <p className="lp-form__subtitle">Two short steps · No obligation</p>
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
        <form
          className="lp-form__step"
          aria-labelledby="paid-lead-form-title"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="lp-form__field">
            <label>Approximate balance shown on the notice or lien</label>
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
            <label>Are your required tax returns filed?</label>
            <div className="lp-form__options">
              <button
                type="button"
                className={`lp-form__option ${formData.filedAllTaxes === "yes" ? "selected" : ""}`}
                onClick={() => chooseFiledStatus("yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`lp-form__option ${formData.filedAllTaxes === "no" ? "selected" : ""}`}
                onClick={() => chooseFiledStatus("no")}
              >
                No
              </button>
            </div>
          </div>

          <button
            type="button"
            className="lp-form__btn"
            onClick={continueToContactDetails}
            disabled={!isStep1Valid}
          >
            Continue →
          </button>
        </form>
      ) : (
        <form
          className="lp-form__step"
          aria-labelledby="paid-lead-form-title"
          onSubmit={handleSubmit}
        >
          <div className="lp-form__field">
            <label htmlFor="paid-lead-name">Full name</label>
            <input
              id="paid-lead-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              minLength={2}
              required
            />
          </div>
          <div className="lp-form__field">
            <label htmlFor="paid-lead-phone">Best phone number</label>
            <input
              id="paid-lead-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-1234"
              aria-describedby="paid-lead-phone-help"
              required
            />
            <span className="lp-form__field-help" id="paid-lead-phone-help">
              We’ll use this number to contact you about your request.
            </span>
          </div>
          <div className="lp-form__field">
            <label htmlFor="paid-lead-email">Email address</label>
            <input
              id="paid-lead-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="lp-form__next-step">
            <strong>What happens next?</strong>
            <span>
              A Wynn Tax professional will contact you to discuss the lien or
              notice, identify what needs attention, and explain how we can act
              on your behalf.
            </span>
          </div>

          <label className="lp-form__consent">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => {
                markFormStarted();
                setConsentChecked(e.target.checked);
              }}
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
            {isSubmitting ? "Submitting…" : "Have a Tax Pro Call Me"}
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

      <div className="lp-form__trust" aria-label="Wynn Tax Solutions trust information">
        <a
          className="lp-form__trust-badge"
          href={WYNN_BBB_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Wynn Tax Solutions BBB profile"
        >
          <img src="/images/bbb-accredited-business.png" alt="BBB Accredited Business" />
        </a>
        <div className="lp-form__trust-copy">
          <strong>BBB Accredited Business</strong>
          <span>Secure form · No obligation</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Paid-search landing page for state and federal tax-lien representation.
 * The form, attribution, consent, receipt, and Logics delivery path are shared
 * with the existing paid funnel; this component only changes presentation.
 */
const LandingPage1 = () => {
  return (
    <div className="lp lien-page" id="top">
      <SEO
        title="State & Federal Tax Lien Representation | Wynn Tax Solutions"
        description="Speak with Wynn Tax Solutions about professional representation involving state or federal tax liens, back taxes, unfiled returns, and related notices."
        canonical="/tax-lien-help"
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <header className="lp__header lien-topbar">
        <a href="/" className="lp__brand lien-topbar__brand" aria-label="Wynn Tax Solutions home">
          <img
            src="/images/logo-wynn.png"
            alt=""
            className="lp__logo"
          />
          <span className="lp__brand-name">
            Wynn Tax <strong>Solutions</strong>
          </span>
        </a>
        <a
          href={WYNN_PHONE_HREF}
          className="lp__header-phone lien-topbar__phone"
          onClick={() =>
            trackPaidLandingEvent("contact", {
              method: "phone",
              placement: "header",
            })
          }
        >
          <span className="lp__header-phone-label">Speak with our team</span>
          <span className="lp__header-phone-number">{WYNN_PHONE_DISPLAY}</span>
        </a>
      </header>

      <main>
        <section className="lien-hero" aria-labelledby="lien-page-title">
          <div className="lien-page__shell lien-hero__grid">
            <div className="lien-hero__copy">
              <p className="lien-page__eyebrow">State &amp; federal tax lien representation</p>
              <h1 id="lien-page-title">
                If a tax lien has been filed, act now to protect what matters.
              </h1>
              <p className="lien-hero__lead">
                A filed tax lien can put your property, credit, and ability to
                move forward at risk. Wynn Tax Solutions represents individuals
                and businesses before the IRS and state taxing authorities—answering
                notices, addressing back taxes and unfiled returns, and taking
                action on your behalf.
              </p>

              <div className="lien-hero__actions">
                <a
                  href={WYNN_PHONE_HREF}
                  className="lien-button lien-button--solid"
                  onClick={() =>
                    trackPaidLandingEvent("contact", {
                      method: "phone",
                      placement: "hero",
                    })
                  }
                >
                  Call {WYNN_PHONE_DISPLAY}
                </a>
                <a href="#case-review" className="lien-button lien-button--text">
                  Request a call <span aria-hidden="true">↓</span>
                </a>
              </div>

            </div>

            <div className="lien-hero__form" id="case-review">
              <LeadForm />
            </div>
          </div>
        </section>

        <section className="lien-matter-bar" aria-label="Matters we review">
          <div className="lien-page__shell lien-matter-bar__grid">
            <span>Federal tax liens</span>
            <span>State tax liens</span>
            <span>Back taxes &amp; unfiled returns</span>
            <span>Collection notices</span>
          </div>
        </section>

        <section className="lien-section lien-section--paper">
          <div className="lien-page__shell">
            <div className="lien-section__intro lien-section__intro--representation">
              <h2>Protect. Respond. Resolve.</h2>
              <figure className="lien-action-image">
                <img
                  src="/images/tax-representation-handshake.webp"
                  alt="An older client meeting with a professional tax representative"
                  width="1400"
                  height="651"
                  loading="lazy"
                />
              </figure>
              <p>
                Representation gives you an authorized advocate between you and
                the taxing authority. We organize the facts, answer notices,
                communicate on your behalf, and work to protect what matters as
                we pursue the appropriate resolution.
              </p>
            </div>

            <div className="lien-capabilities">
              <article className="lien-capability">
                <span className="lien-capability__number">01</span>
                <h3>Protect your position</h3>
                <p>
                  We assess the agency, deadlines, balance, filing history, and
                  active collection action so the response starts from a clear
                  picture of the risk.
                </p>
              </article>
              <article className="lien-capability">
                <span className="lien-capability__number">02</span>
                <h3>Respond with authority</h3>
                <p>
                  We organize the required information and filings, answer the
                  notice, and communicate directly with the IRS or state agency.
                </p>
              </article>
              <article className="lien-capability">
                <span className="lien-capability__number">03</span>
                <h3>Pursue resolution</h3>
                <p>
                  We carry out the agreed strategy, manage the follow-through,
                  and keep the matter moving toward an available resolution.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="lien-section lien-section--ink">
          <div className="lien-page__shell lien-expectations">
            <div>
              <p className="lien-page__eyebrow lien-page__eyebrow--light">Put representation to work</p>
              <h2>The government has acted. You do not have to answer alone.</h2>
            </div>
            <ol className="lien-expectations__list">
              <li>
                <span>1</span>
                <div>
                  <strong>We review the notice with you</strong>
                  <p>We identify the agency, deadlines, filing status, and any immediate collection pressure.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>We set the priorities together</strong>
                  <p>We explain what requires attention and shape the response around your circumstances.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>We carry the work forward</strong>
                  <p>Once retained, we handle the agreed work and communicate with the taxing authority on your behalf.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="lien-section lien-section--trust">
          <div className="lien-page__shell lien-trust">
            <div className="lien-trust__seal">
              <a
                href={WYNN_BBB_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Wynn Tax Solutions BBB profile"
              >
                <img src="/images/bbb-accredited-business.png" alt="BBB Accredited Business" />
              </a>
            </div>
            <div className="lien-trust__copy">
              <p className="lien-page__eyebrow">Representation tailored to your needs</p>
              <h2>A clear plan for moving forward.</h2>
              <p>
                We review your tax history, gather the relevant facts, and lay
                out a clear course of action tailored to your needs. From
                personal and business tax matters to audits, unfiled returns,
                tax preparation, liens, and collections, Wynn Tax Solutions is
                your front line of defense with the IRS and state taxing
                authorities.
              </p>
            </div>
            <div className="lien-trust__facts">
              <span>Personal and business tax matters</span>
              <span>Audit representation and tax preparation</span>
              <span>IRS and state collection matters</span>
            </div>
          </div>
        </section>

        <section className="lien-closing">
          <div className="lien-page__shell lien-closing__inner">
            <div>
              <p className="lien-page__eyebrow lien-page__eyebrow--light">Start with the document in front of you</p>
              <h2>Talk To A Tax Pro Today</h2>
            </div>
            <div className="lien-closing__actions">
              <a
                href={WYNN_PHONE_HREF}
                className="lien-button lien-button--gold"
                onClick={() =>
                  trackPaidLandingEvent("contact", {
                    method: "phone",
                    placement: "final_cta",
                  })
                }
              >
                Call {WYNN_PHONE_DISPLAY}
              </a>
              <a href="#case-review" className="lien-closing__form-link">
                Have a Tax Pro Call Me
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lien-footer">
        <div className="lien-page__shell lien-footer__grid">
          <div>
            <strong>Wynn Tax Solutions</strong>
            <p>21625 Prairie Street, Suite 200, Chatsworth, CA 91311</p>
          </div>
          <div className="lien-footer__links">
            <a href={WYNN_BBB_PROFILE} target="_blank" rel="noopener noreferrer">BBB profile</a>
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms-of-service">Terms</Link>
          </div>
        </div>
        <p className="lien-footer__copyright">
          © {new Date().getFullYear()} Wynn Tax Solutions. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage1;
