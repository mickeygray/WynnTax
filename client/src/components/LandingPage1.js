// components/LandingPage1.jsx
import React, { useState, useContext, useEffect } from "react";
import leadContext from "../context/leadContext";
import { useNavigate, Link } from "react-router-dom";
import { trackCustomEvent, trackStandardEvent } from "../utils/fbq";
import { useFormTracking, trackFormAbandon } from "../hooks/useFormTracking";
import SEO from "./SEO";
import { Helmet } from "react-helmet-async";
import { useTrustedForm } from "../hooks/useTrustedForm";

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
const LeadForm = ({ variant = "hero" }) => {
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
      console.log("[AFFILIATE] Captured click ID from URL:", incomingClickId);
    } else {
      const storedClickId = getStoredAffiliateClickId();
      if (storedClickId) {
        setAffiliateClickId(storedClickId);
        console.log("[AFFILIATE] Loaded click ID from storage:", storedClickId);
      }
    }

    if (incomingNid) {
      persistAffiliateNid(incomingNid);
      setAffiliateNid(incomingNid);
      console.log("[AFFILIATE] Captured nid from URL:", incomingNid);
    } else {
      const storedNid = getStoredAffiliateNid();
      if (storedNid) {
        setAffiliateNid(storedNid);
        console.log("[AFFILIATE] Loaded nid from storage:", storedNid);
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
      console.log("[AFFILIATE] Pre-filling form from URL params:", prefill);
      setFormData((prev) => ({ ...prev, ...prefill }));

      if (prefill.debtAmount && prefill.filedAllTaxes) {
        setStep(2);
      }
    }
  }, []);
  const navigate = useNavigate();
  const { sendLeadForm } = useContext(leadContext);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
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
  const [affiliateSub1, setAffiliateSub1] = useState("");
  const [affiliateSub2, setAffiliateSub2] = useState("");
  useFormTracking(formData, `landing-${variant}`, !submitted);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!submitted && (formData.debtAmount || formData.email)) {
        trackFormAbandon(`landing-${variant}`, formData);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, submitted, variant]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consentChecked) return;

    setSubmitted(true);
    sendLeadForm({
      ...formData,
      consentGiven: true,
      affiliateClickId: affiliateClickId || getStoredAffiliateClickId(),
      affiliateNid: affiliateNid || getStoredAffiliateNid(),
      affiliateSub1: affiliateSub1,
      affiliateSub2: affiliateSub2,
      trustedFormCertUrl: certUrl, // ← ADD THIS
    });
    trackCustomEvent("LandingFormSubmitted", {
      source: "LandingPage1",
      has_email: !!formData.email,
      has_phone: !!formData.phone,
      debt_amount: formData.debtAmount || null,
    });
    trackStandardEvent("Lead");
    navigate("/thank-you");
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
              I agree to be contacted by Wynn Tax Solutions via phone, email, or
              text. Message/data rates may apply. Consent not required to
              purchase.
            </span>
          </label>
          <input {...tfInputProps} />
          <button
            type="submit"
            className="lp-form__btn lp-form__btn--submit"
            disabled={!isStep2Valid}
          >
            Get My Free Consultation
          </button>

          <button
            type="button"
            className="lp-form__back"
            onClick={() => setStep(1)}
          >
            ← Back
          </button>
        </form>
      )}

      <div className="lp-form__trust">
        <span>🔒 256-bit Encryption</span>
        <span>✓ No Obligation</span>
      </div>
    </div>
  );
};

/**
 * LandingPage1 - High-Converting Sales Landing Page
 * No navigation, no chatbot, focused on conversion
 */
const LandingPage1 = () => {
  return (
    <div className="lp">
      <SEO
        title="IRS Tax Debt Relief | Free Consultation | Wynn Tax Solutions"
        description="Owe the IRS $10,000+? You may qualify for tax relief programs. Get a free, confidential consultation with our tax experts today."
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
          <img src="/images/wynn-landing-hero.png" alt="" aria-hidden="true" />
          <div className="lp__hero-overlay" />
        </div>

        <div className="lp__hero-wrapper">
          {/* Full-width headline above the grid */}
          <div className="lp__hero-header">
            <div className="lp__urgency-badge">
              <span className="lp__urgency-dot" />
              Limited Time: IRS Fresh Start Program Available
            </div>

            <h1 className="lp__headline">
              Owe The IRS <span className="lp__highlight">$10,000+</span>? You
              May Qualify For Relief.
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
                Our tax attorneys have helped 2,000+ Americans resolve over $50
                million in IRS debt. Find out if you qualify in under 60
                seconds.
              </p>

              <div className="lp__hero-proof">
                <div className="lp__proof-item">
                  <span className="lp__proof-number">$50M+</span>
                  <span className="lp__proof-label">Tax Debt Resolved</span>
                </div>
                <div className="lp__proof-divider" />
                <div className="lp__proof-item">
                  <span className="lp__proof-number">98%</span>
                  <span className="lp__proof-label">Success Rate</span>
                </div>
                <div className="lp__proof-divider" />
                <div className="lp__proof-item">
                  <span className="lp__proof-number">A+</span>
                  <span className="lp__proof-label">BBB Rating</span>
                </div>
              </div>

              <div className="lp__hero-trust">
                <div className="lp__trust-item">
                  <span className="lp__trust-icon">⚖️</span>
                  <span>Licensed Tax Attorneys</span>
                </div>
                <div className="lp__trust-item">
                  <span className="lp__trust-icon">🛡️</span>
                  <span>100% Money-Back Guarantee</span>
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
              <p>The IRS is taking money directly from your paycheck</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">🏦</div>
              <h3>Bank Levy</h3>
              <p>Your bank account has been frozen or seized</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">🏠</div>
              <h3>Tax Lien</h3>
              <p>There's a lien on your home or property</p>
            </div>
            <div className="lp__problem">
              <div className="lp__problem-icon">📬</div>
              <h3>IRS Letters</h3>
              <p>You're receiving threatening notices from the IRS</p>
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
            <strong>You're not alone.</strong> Millions of Americans face IRS
            problems every year. The good news? There are legitimate programs
            that can help.
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
                We Fight The IRS <em>For</em> You
              </h2>
              <p className="lp__solution-text">
                When you work with Wynn Tax Solutions, you're not just getting
                tax help—you're getting a dedicated team of tax attorneys and
                enrolled agents who will go head-to-head with the IRS on your
                behalf.
              </p>

              <ul className="lp__benefits">
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Stop IRS Collections</strong>
                    <p>
                      We can halt wage garnishments, bank levies, and liens
                      while we work your case
                    </p>
                  </div>
                </li>
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Reduce What You Owe</strong>
                    <p>
                      Many clients settle for a fraction of their original tax
                      debt
                    </p>
                  </div>
                </li>
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>Get Current & Stay Current</strong>
                    <p>
                      We file any missing returns and set you up for ongoing
                      compliance
                    </p>
                  </div>
                </li>
                <li>
                  <span className="lp__benefit-check">✓</span>
                  <div>
                    <strong>100% Satisfaction Guarantee</strong>
                    <p>
                      If you're not satisfied with our services, we'll refund
                      your money
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
          <h2 className="lp__section-title">How We Resolve Your Tax Debt</h2>

          <div className="lp__steps">
            <div className="lp__step">
              <div className="lp__step-number">1</div>
              <div className="lp__step-content">
                <h3>Free Consultation</h3>
                <p>
                  We review your situation, call the IRS on your behalf, and
                  determine exactly what programs you qualify for—at no cost or
                  obligation.
                </p>
              </div>
            </div>

            <div className="lp__step-arrow">→</div>

            <div className="lp__step">
              <div className="lp__step-number">2</div>
              <div className="lp__step-content">
                <h3>Investigation & Strategy</h3>
                <p>
                  We file a Power of Attorney, pull your tax records, and build
                  a comprehensive strategy to minimize your liability.
                </p>
              </div>
            </div>

            <div className="lp__step-arrow">→</div>

            <div className="lp__step">
              <div className="lp__step-number">3</div>
              <div className="lp__step-content">
                <h3>Resolution</h3>
                <p>
                  We negotiate with the IRS to settle your debt, set up a
                  manageable payment plan, or achieve penalty abatement.
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
          <span className="lp__eyebrow lp__eyebrow--center">Real Results</span>
          <h2 className="lp__section-title">What Our Clients Say</h2>

          <div className="lp__testimonials-grid">
            <div className="lp__testimonial">
              <div className="lp__testimonial-stars">★★★★★</div>
              <blockquote>
                "I owed the IRS over $47,000. Wynn Tax got it reduced to under
                $8,000. I couldn't believe it. They saved my business and my
                sanity."
              </blockquote>
              <div className="lp__testimonial-author">
                <strong>Michael R.</strong>
                <span>Small Business Owner, Texas</span>
              </div>
            </div>

            <div className="lp__testimonial">
              <div className="lp__testimonial-stars">★★★★★</div>
              <blockquote>
                "After years of ignoring IRS letters, I was terrified. Wynn Tax
                handled everything. They filed my back taxes and negotiated a
                payment plan I can actually afford."
              </blockquote>
              <div className="lp__testimonial-author">
                <strong>Sarah K.</strong>
                <span>Freelance Designer, California</span>
              </div>
            </div>

            <div className="lp__testimonial">
              <div className="lp__testimonial-stars">★★★★★</div>
              <blockquote>
                "The IRS was garnishing my wages. Within 2 weeks of hiring Wynn
                Tax, the garnishment stopped. They gave me my life back."
              </blockquote>
              <div className="lp__testimonial-author">
                <strong>David M.</strong>
                <span>Sales Manager, Florida</span>
              </div>
            </div>
          </div>

          <div className="lp__trust-logos">
            <img
              src="/images/bbb-accredited-business.png"
              alt="BBB Accredited Business A+"
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
              <h3>Licensed Tax Attorneys</h3>
              <p>
                Our team includes attorneys with decades of IRS negotiation
                experience
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
              <h3>Money-Back Guarantee</h3>
              <p>We stand behind our work with a 100% satisfaction guarantee</p>
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
            <h2>Don't Wait Until It's Too Late</h2>
            <p>
              The IRS won't stop until they collect. Every day you wait,
              penalties and interest keep growing. Take the first step toward
              tax relief today.
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
              100% confidential
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
