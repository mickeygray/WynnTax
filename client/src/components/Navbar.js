import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen width changes for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="logo">
          <a href="/">
            <img
              src="/images/logo-wynn.png"
              alt="Wynn Tax Solutions Logo"
              width="166"
              height="93"
            />
          </a>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="nav-menu">
            <ul className="nav-list">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li
                className="dropdown"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => {
                  setIsDropdownOpen(false);
                  setActiveSubmenu(null);
                }}
              >
                <Link to="/our-tax-services">Services ▼</Link>
                {isDropdownOpen && (
                  <ul className="dropdown-menu">
                    <li
                      className="has-submenu"
                      onMouseEnter={() => setActiveSubmenu("tax-relief")}
                      onMouseLeave={() => setActiveSubmenu(null)}
                    >
                      <Link to="/tax-relief">
                        Tax Relief <span className="arrow">▶</span>
                      </Link>
                      {activeSubmenu === "tax-relief" && (
                        <ul className="submenu">
                          <li>
                            <Link to="/tax-relief/tax-consultation">
                              Tax Consultation
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-relief/tax-preparation">
                              Tax Preparation
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-relief/tax-settlement">
                              Tax Settlement
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>

                    <li
                      className="has-submenu"
                      onMouseEnter={() => setActiveSubmenu("tax-resolution")}
                      onMouseLeave={() => setActiveSubmenu(null)}
                    >
                      <Link to="/tax-resolution">
                        Tax Resolution <span className="arrow">▶</span>
                      </Link>
                      {activeSubmenu === "tax-resolution" && (
                        <ul className="submenu">
                          <li>
                            <Link to="/tax-resolution/tax-representation">
                              Tax Representation
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-resolution/dealing-with-the-irs">
                              Dealing with the IRS
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-resolution/irs-innocent-spouse">
                              Innocent Spouse Relief
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-resolution/state-tax-relief">
                              State Tax Relief
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-resolution/statute-of-limitations">
                              Statute of Limitations
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-resolution/tax-prep-and-planning">
                              Tax Preparation & Planning
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>

                    <li
                      className="has-submenu"
                      onMouseEnter={() => setActiveSubmenu("tax-negotiation")}
                      onMouseLeave={() => setActiveSubmenu(null)}
                    >
                      <Link to="/tax-negotiation">
                        Tax Negotiation <span className="arrow">▶</span>
                      </Link>
                      {activeSubmenu === "tax-negotiation" && (
                        <ul className="submenu">
                          <li>
                            <Link to="/tax-negotiation/offer-in-compromise">
                              Offer in Compromise
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-negotiation/currently-not-collectible">
                              Currently Not Collectible
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-negotiation/penalty-abatement">
                              Penalty Abatement
                            </Link>
                          </li>
                          <li>
                            <Link to="/tax-negotiation/installment-agreement">
                              Installment Agreement
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>

                    <li>
                      <Link to="/tax-protection-plans">
                        Tax Protection Plans
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li>
                <Link to="/tax-faqs">Tax FAQs</Link>
              </li>
              <li>
                <Link to="/about-us">About Us</Link>
              </li>
              <li>
                <Link to="/contact-us">Contact Us</Link>
              </li>
              <li>
                <Link to="/tax-news">Tax News</Link>
              </li>
              <li className="nav-phone">
                <a href="tel:+18663796253">Call: (844) 996-6829</a>
              </li>
            </ul>
          </nav>
        )}

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <>
            <div className="mobile-menu-icon" onClick={toggleMenu}>
              ☰
            </div>
            {isMenuOpen && (
              <div className="mobile-menu">
                <ul>
                  <li>
                    <Link to="/" onClick={toggleMenu}>
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/our-tax-services" onClick={toggleMenu}>
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link to="/tax-faqs" onClick={toggleMenu}>
                      Tax FAQs
                    </Link>
                  </li>
                  <li>
                    <Link to="/about-us" onClick={toggleMenu}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact-us" onClick={toggleMenu}>
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/tax-news" onClick={toggleMenu}>
                      Tax News
                    </Link>
                  </li>
                  <li className="nav-phone">
                    <a href="tel:+18663796253" onClick={toggleMenu}>
                      Call: (866) 379-6253
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
