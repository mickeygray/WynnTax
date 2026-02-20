import React from "react";
import { Link } from "react-router-dom";
import PhoneLink from "./PhoneLink";
import useBlogData from "./useBlogData";

const Footer = () => {
  const { blogs } = useBlogData();
  const recentPosts = blogs.slice(0, 10);

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Column 1: Menu Links */}
        <div className="footer-column">
          <h4>Menu Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/our-tax-services">Services</Link>
            </li>
            <li>
              <Link to="/tax-faqs">Tax FAQs</Link>
            </li>
            <li>
              <Link to="/about-us">About Us</Link>
            </li>
            <li>
              <Link to="/tax-news">Tax News</Link>
            </li>
            <li>
              <Link to="/contact-us">Contact Us</Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Logo & Address */}
        <div className="footer-column center">
          <img
            src="/images/logo-wynn-small.png"
            alt="Tax Advocate Group Logo"
            className="footer-logo"
          />

          <p>21625 Prairie Street, Suite #200</p>
          <p>Chatsworth, CA 91311</p>
          <p>
            <PhoneLink rawNumber="18449966829" />
          </p>
        </div>

        {/* Column 3: Recent Posts */}
        <div className="footer-column">
          <h4>Recent Posts</h4>
          <ul>
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link to={`/tax-news/${post.id}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Disclaimer */}
      <div className="footer-bottom">
        <p className="footer-disclaimer">
          By clicking "SUBSCRIBE" or "SUBMIT," I agree to be contacted by Wynn
          Tax Solutions and its affiliates via prerecorded and/or telemarketing
          calls and/or SMS/MMS text messages...
        </p>
        <p className="footer-copyright">
          © 2025 Wynn Tax Solutions, LLC. All Rights Reserved. |
          <Link to="/privacy-policy"> Privacy Policy</Link> |
          <Link to="/terms-of-service"> Terms of Service</Link> |
        </p>
      </div>
    </footer>
  );
};

export default Footer;
