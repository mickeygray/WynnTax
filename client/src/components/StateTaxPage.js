import React from "react";
import { Link, useParams, useNavigate, Navigate } from "react-router-dom";
import SEO from "./SEO";
import { orgSchema, statePageSchema } from "../utils/structuredData";
import stateData, {
  getStateBySlug,
  getStateByAbbreviation,
} from "../data/stateData";
import USMapSVG from "./UsMapSvg";
import StateTaxForm from "./StateTaxForm";

/* ────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────── */

/** Difficulty badge color */
const difficultyMeta = {
  easy: { label: "Low Difficulty", className: "badge--easy" },
  moderate: { label: "Moderate Difficulty", className: "badge--moderate" },
  hard: { label: "High Difficulty", className: "badge--hard" },
  none: { label: "No Income Tax", className: "badge--none" },
};

/** Render a section only if content exists */
const Section = ({ show, title, children, className = "" }) =>
  show ? (
    <section className={`stp__section ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  ) : null;

/** Info pill for quick facts */
const InfoPill = ({ icon, label, value, href }) => (
  <div className="stp__pill">
    <i className={`fas ${icon}`}></i>
    <div>
      <span className="stp__pill-label">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="stp__pill-value"
        >
          {value} <i className="fas fa-external-link-alt"></i>
        </a>
      ) : (
        <span className="stp__pill-value">{value}</span>
      )}
    </div>
  </div>
);

/* ────────────────────────────────────────────
 *  Component
 * ──────────────────────────────────────────── */

const StateTaxPage = () => {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const state = getStateBySlug(stateSlug);

  if (!state) return <Navigate to="/state-tax-guide" replace />;

  const diff = difficultyMeta[state.difficulty] || difficultyMeta.moderate;
  const hasResolutionData =
    state.oic || state.installmentAgreement || state.garnishment;
  const incomeDisplay =
    state.incomeType === "none"
      ? "No State Income Tax"
      : `${state.incomeTaxRange} (${state.incomeType})`;

  // Navigate to another state from the map
  const handleMapClick = (abbr) => {
    const s = getStateByAbbreviation(abbr);
    if (s) navigate(`/state-tax-guide/${s.slug}`);
  };

  // Structured data
  const schema = statePageSchema
    ? [orgSchema, statePageSchema(state)]
    : [orgSchema];

  return (
    <div className="state-tax-page">
      <SEO
        title={
          state.seoTitle ||
          `${state.name} Tax Relief | ${state.abbreviation} Tax Help | Wynn Tax Solutions`
        }
        description={
          state.seoDescription ||
          state.summary ||
          `Get tax relief help in ${state.name}. Learn about the ${state.taxAuthority}, resolution options, and how Wynn Tax Solutions resolves ${state.abbreviation} tax problems.`
        }
        canonical={`/state-tax-guide/${state.slug}`}
        structuredData={schema}
      />

      {/* ═══════ HERO: STATE INFO + MAP + FORM ═══════ */}
      {/* ═══════ HERO: STATE INFO + MAP + FORM ═══════ */}
      <section className="stp__hero">
        <div className="stp__hero-inner">
          {/* Left: state info + map */}
          <div className="stp__hero-left">
            <div className="stp__hero-map">
              <USMapSVG
                activeState={state.abbreviation}
                onStateClick={handleMapClick}
                showLabels={false}
                interactive={true}
                compact={true}
              />
              <p className="stp__hero-map-hint">
                Click another state to explore
              </p>
            </div>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/state-tax-guide">State Tax Guide</Link>
                </li>
                <li aria-current="page">{state.name}</li>
              </ol>
            </nav>
            <h1>
              <span className="stp__hero-abbr">{state.abbreviation}</span>
              {state.name} Tax Relief
            </h1>
            <span className={`stp__badge ${diff.className}`}>{diff.label}</span>
            <p className="stp__hero-sub">
              {state.incomeType === "none"
                ? `${state.name} has no state income tax, but residents may still face federal tax issues and other state-level obligations.`
                : `The ${state.taxAuthority} enforces ${state.incomeType} income tax rates of ${state.incomeTaxRange}.${state.hasStateLevyPower ? " They have independent authority to levy, garnish wages, and place liens." : ""}`}
            </p>
          </div>
          {/* Right: multi-step form */}
          <div className="stp__hero-form">
            <StateTaxForm
              stateName={state.name}
              stateAbbr={state.abbreviation}
              taxAuthority={state.taxAuthority}
            />
          </div>
        </div>
      </section>

      {/* ═══════ QUICK INFO PILLS ═══════ */}
      <section className="stp__pills">
        <div className="stp__pills-inner">
          <InfoPill
            icon="fa-landmark"
            label="Tax Authority"
            value={state.taxAuthority}
            href={state.taxAuthorityUrl}
          />
          {state.phone && (
            <InfoPill
              icon="fa-phone-alt"
              label="Phone"
              value={state.phone}
              href={`tel:${state.phone.replace(/[^+\d]/g, "")}`}
            />
          )}
          <InfoPill
            icon="fa-percentage"
            label="Income Tax"
            value={incomeDisplay}
          />
          <InfoPill
            icon="fa-shopping-cart"
            label="Sales Tax"
            value={state.salesTaxRange}
          />
          {state.statute && (
            <InfoPill
              icon="fa-hourglass-half"
              label="Collection Statute"
              value={state.statute}
            />
          )}
        </div>
      </section>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="stp__main">
        <div className="stp__main-inner">
          {/* --- Summary --- */}
          <Section show={!!state.summary} title={`Tax Overview: ${state.name}`}>
            <p>{state.summary}</p>
          </Section>

          {/* --- Key Facts --- */}
          <Section show={state.keyFacts?.length > 0} title={`Key Tax Facts`}>
            <ul className="stp__fact-list">
              {state.keyFacts?.map((fact, i) => (
                <li key={i}>
                  <i className="fas fa-check-circle"></i>
                  {fact}
                </li>
              ))}
            </ul>
          </Section>

          {/* --- Common Issues --- */}
          <Section
            show={state.commonIssues?.length > 0}
            title="Common Tax Issues"
          >
            <div className="stp__issues">
              {state.commonIssues?.map((issue, i) => (
                <div key={i} className="stp__issue">
                  <span className="stp__issue-num">{i + 1}</span>
                  <p>{issue}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ═══ RESOLUTION OPTIONS (the meat) ═══ */}
          {hasResolutionData && (
            <div className="stp__resolution">
              <h2>Resolution Options in {state.name}</h2>

              {/* Installment Agreement */}
              {state.installmentAgreement && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-calendar-alt"></i>
                    <h3>Payment Plans (Installment Agreements)</h3>
                  </div>
                  <div className="stp__res-card-body">
                    {state.installmentAgreement.maxMonthsNoFinancials > 0 && (
                      <p>
                        <strong>Without financials:</strong> Up to{" "}
                        {state.installmentAgreement.maxMonthsNoFinancials}{" "}
                        months
                      </p>
                    )}
                    {state.installmentAgreement.maxMonthsWithFinancials > 0 && (
                      <p>
                        <strong>With financials:</strong> Up to{" "}
                        {state.installmentAgreement.maxMonthsWithFinancials}{" "}
                        months
                      </p>
                    )}
                    {state.installmentAgreement.notes && (
                      <p className="stp__res-notes">
                        {state.installmentAgreement.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Offer in Compromise */}
              {state.oic && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-handshake"></i>
                    <h3>Offer in Compromise (OIC)</h3>
                  </div>
                  <div className="stp__res-card-body">
                    <p>
                      <strong>Available:</strong>{" "}
                      {state.oic.available ? "Yes" : "No"}
                    </p>
                    {state.oic.available && state.oic.stopsCollections && (
                      <p className="stp__res-good">
                        <i className="fas fa-shield-alt"></i> Stops collections
                        while pending
                      </p>
                    )}
                    {state.oic.available && !state.oic.stopsCollections && (
                      <p className="stp__res-warn">
                        <i className="fas fa-exclamation-triangle"></i> Does NOT
                        stop collections while pending
                      </p>
                    )}
                    {state.oic.formNumber && (
                      <p>
                        <strong>Form:</strong> {state.oic.formNumber}
                      </p>
                    )}
                    {state.oic.notes && (
                      <p className="stp__res-notes">{state.oic.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Garnishment */}
              {state.garnishment && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-money-check-alt"></i>
                    <h3>Wage Garnishment</h3>
                  </div>
                  <div className="stp__res-card-body">
                    {state.garnishment.percentage && (
                      <p>
                        <strong>Rate:</strong> {state.garnishment.percentage}
                      </p>
                    )}
                    <p>
                      <strong>Can lift with payment plan:</strong>{" "}
                      {state.garnishment.canLift ? (
                        <span className="stp__res-yes">Yes</span>
                      ) : (
                        <span className="stp__res-no">No</span>
                      )}
                    </p>
                    <p>
                      <strong>Can reduce amount:</strong>{" "}
                      {state.garnishment.canReduce ? (
                        <span className="stp__res-yes">Yes</span>
                      ) : (
                        <span className="stp__res-no">No</span>
                      )}
                    </p>
                    {state.garnishment.notes && (
                      <p className="stp__res-notes">
                        {state.garnishment.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Penalty Abatement */}
              {state.penaltyAbatement?.available && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-eraser"></i>
                    <h3>Penalty Abatement</h3>
                  </div>
                  <div className="stp__res-card-body">
                    <p>
                      <strong>Available:</strong> Yes
                    </p>
                    {state.penaltyAbatement.notes && (
                      <p className="stp__res-notes">
                        {state.penaltyAbatement.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Levy */}
              {state.bankLevy && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-university"></i>
                    <h3>Bank Levy</h3>
                  </div>
                  <div className="stp__res-card-body">
                    <p>
                      <strong>Can release:</strong>{" "}
                      {state.bankLevy.canRelease ? (
                        <span className="stp__res-yes">Yes</span>
                      ) : (
                        <span className="stp__res-no">No</span>
                      )}
                    </p>
                    {state.bankLevy.notes && (
                      <p className="stp__res-notes">{state.bankLevy.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Collection Agency */}
              {state.collectionAgency && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-building"></i>
                    <h3>Third-Party Collection Agency</h3>
                  </div>
                  <div className="stp__res-card-body">
                    {state.collectionAgency.name && (
                      <p>
                        <strong>Agency:</strong> {state.collectionAgency.name}
                      </p>
                    )}
                    {state.collectionAgency.notes && (
                      <p className="stp__res-notes">
                        {state.collectionAgency.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Hardship */}
              {state.hardship?.available && (
                <div className="stp__res-card">
                  <div className="stp__res-card-header">
                    <i className="fas fa-life-ring"></i>
                    <h3>Hardship / Currently Not Collectible</h3>
                  </div>
                  <div className="stp__res-card-body">
                    <p>
                      <strong>Available:</strong> Yes
                    </p>
                    {state.hardship.notes && (
                      <p className="stp__res-notes">{state.hardship.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Auto-generated placeholder when no resolution data yet --- */}
          {!hasResolutionData && !state.summary && (
            <Section
              show={true}
              title={`${state.name} Tax Information`}
              className="stp__placeholder"
            >
              <p>
                The {state.taxAuthority} oversees tax collection and enforcement
                in {state.name}.{" "}
                {state.incomeType === "none"
                  ? `${state.name} does not impose a state income tax, but residents may still face federal tax obligations, sales tax issues, or other state-level tax matters.`
                  : `${state.name} imposes a ${state.incomeType} income tax ranging from ${state.incomeTaxRange}. Residents and businesses may face issues including back taxes, penalties, and state collection actions.`}
              </p>
              <p>
                {state.hasStateLevyPower
                  ? `The ${state.taxAuthority} has independent authority to levy wages, garnish bank accounts, and place liens on property for unpaid state taxes.`
                  : `While ${state.name} does not impose a state income tax, federal tax obligations still apply, and the IRS maintains full collection authority regardless of state tax policy.`}
              </p>
            </Section>
          )}

          {/* --- Recent Changes --- */}
          <Section
            show={state.recentChanges?.length > 0}
            title="Recent Tax Changes"
          >
            <ul className="stp__changes">
              {state.recentChanges?.map((change, i) => (
                <li key={i}>
                  <i className="fas fa-bolt"></i>
                  {change}
                </li>
              ))}
            </ul>
          </Section>

          {/* --- Official Links --- */}
          <Section
            show={state.officialLinks?.length > 0}
            title="Official Resources"
          >
            <div className="stp__links">
              {state.officialLinks?.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stp__link"
                >
                  <i className="fas fa-external-link-alt"></i>
                  {link.label}
                </a>
              ))}
            </div>
          </Section>

          {/* ═══ HOW WE HELP ═══ */}
          <section className="stp__section stp__help">
            <h2>How Wynn Tax Solutions Helps {state.name} Taxpayers</h2>
            <p>
              Whether you're dealing with the IRS, the {state.taxAuthority}, or
              both — we provide comprehensive tax resolution services to{" "}
              {state.name} residents and businesses.
            </p>
            <div className="stp__services">
              <Link to="/tax-relief" className="stp__service-card">
                <i className="fas fa-shield-alt"></i>
                <h4>Tax Relief</h4>
                <p>Consultation, preparation, and settlement services</p>
              </Link>
              <Link to="/tax-resolution" className="stp__service-card">
                <i className="fas fa-balance-scale"></i>
                <h4>Tax Resolution</h4>
                <p>IRS representation, innocent spouse relief, and more</p>
              </Link>
              <Link to="/tax-negotiation" className="stp__service-card">
                <i className="fas fa-handshake"></i>
                <h4>Tax Negotiation</h4>
                <p>Offers in compromise, payment plans, penalty abatement</p>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* ═══════ BROWSE OTHER STATES ═══════ */}
      <section className="stp__browse">
        <div className="stp__browse-inner">
          <h3>Browse Other States</h3>
          <div className="stp__browse-grid">
            {stateData
              .filter((s) => s.slug !== state.slug)
              .slice(0, 12)
              .map((s) => (
                <Link
                  key={s.slug}
                  to={`/state-tax-guide/${s.slug}`}
                  className="stp__browse-link"
                >
                  <span className="stp__browse-abbr">{s.abbreviation}</span>
                  {s.name}
                </Link>
              ))}
            <Link
              to="/state-tax-guide"
              className="stp__browse-link stp__browse-link--all"
            >
              View All 50 States →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StateTaxPage;
