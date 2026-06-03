import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "./SEO";
import { orgSchema } from "../utils/structuredData";
import stateData, { getStateByAbbreviation } from "../data/stateData";
import USMapSVG from "./UsMapSvg";

const StateTaxHub = () => {
  const navigate = useNavigate();

  const handleStateClick = (abbr) => {
    const state = getStateByAbbreviation(abbr);
    if (state) {
      navigate(`/state-tax-guide/${state.slug}`);
    }
  };

  // Stats
  const noIncomeTax = stateData.filter((s) => s.incomeType === "none").length;
  const withIncomeTax = stateData.length - noIncomeTax;
  const hardStates = stateData.filter((s) => s.difficulty === "hard").length;

  // Group A-Z
  const grouped = stateData.reduce((acc, s) => {
    const letter = s.name[0];
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(s);
    return acc;
  }, {});

  return (
    <div className="state-hub">
      <SEO
        title="State Tax Guide | Tax Relief in All 50 States | Wynn Tax Solutions"
        description="Interactive guide to tax relief in every U.S. state. Find your state's tax authority, resolution options, and how Wynn Tax Solutions can help."
        canonical="/state-tax-guide"
        structuredData={[orgSchema]}
      />

      {/* ─── MAP HERO ─── */}
      <section className="state-hub__hero">
        <div className="state-hub__hero-inner">
          <h1>State Tax Relief Guide</h1>
          <p className="state-hub__subtitle">
            Click your state to see tax authority info, resolution options, and
            how we can help.
          </p>
          <USMapSVG
            onStateClick={handleStateClick}
            showLabels={true}
            interactive={true}
          />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="state-hub__stats">
        <div className="state-hub__stats-inner">
          <div className="state-hub__stat">
            <span className="state-hub__stat-num">50</span>
            <span className="state-hub__stat-label">States Covered</span>
          </div>
          <div className="state-hub__stat">
            <span className="state-hub__stat-num">{withIncomeTax}</span>
            <span className="state-hub__stat-label">
              States With Income Tax
            </span>
          </div>
          <div className="state-hub__stat">
            <span className="state-hub__stat-num">{noIncomeTax}</span>
            <span className="state-hub__stat-label">No Income Tax</span>
          </div>
          <div className="state-hub__stat">
            <span className="state-hub__stat-num">{hardStates}</span>
            <span className="state-hub__stat-label">
              High-Difficulty States
            </span>
          </div>
        </div>
      </section>

      {/* ─── A-Z DIRECTORY ─── */}
      <section className="state-hub__directory">
        <div className="state-hub__directory-inner">
          <h2>Browse by State</h2>
          <div className="state-hub__az">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, states]) => (
                <div key={letter} className="state-hub__letter-group">
                  <h3 className="state-hub__letter">{letter}</h3>
                  <ul>
                    {states.map((s) => (
                      <li key={s.slug}>
                        <Link to={`/state-tax-guide/${s.slug}`}>
                          <span className="state-hub__abbr">
                            {s.abbreviation}
                          </span>
                          {s.name}
                          {s.incomeType === "none" && (
                            <span className="state-hub__badge--none">
                              No Income Tax
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="state-hub__cta">
        <div className="state-hub__cta-inner">
          <h2>Need Help With State or Federal Taxes?</h2>
          <p>We resolve tax problems in all 50 states — IRS and state level.</p>
          <div className="state-hub__cta-buttons">
            <a href="tel:+18449966829" className="btn btn--phone">
              <i className="fas fa-phone-alt"></i> (844) 996-6829
            </a>
            <Link to="/contact-us" className="btn btn--primary">
              Free Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StateTaxHub;
