import React from "react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="terms-page">
      {/* Hero Section */}
      <section className="terms-hero">
        <div className="terms-hero-overlay"></div>
        <div className="terms-hero-content">
          <h1>Terms of Service</h1>
          <nav className="terms-breadcrumbs">
            <Link to="/">Home</Link> <span>/</span>{" "}
            <span>Terms of Service</span>
          </nav>
        </div>
      </section>

      {/* Terms Content */}
      <div className="terms-content">
        <h2>Terms</h2>
        <p>
          By accessing the website at{" "}
          <a
            href="https://WynnTaxSolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            WynnTaxSolutions.com
          </a>
          , you agree to be bound by these terms of service, all applicable
          laws, and regulations, and acknowledge that you are responsible for
          compliance with applicable local laws. If you do not agree, you are
          prohibited from using or accessing this site. The materials on this
          website are protected by applicable copyright and trademark laws.
        </p>

        <h2>Use of License</h2>
        <p>
          Permission is granted to temporarily download one copy of the
          materials (information or software) on Wynn Tax Solutions’s website
          for personal, non-commercial transitory viewing only.
        </p>
        <p>This license does not permit you to:</p>
        <ul>
          <li>Modify or copy the materials</li>
          <li>
            Use the materials for any commercial purpose or public display
          </li>
          <li>Attempt to decompile or reverse engineer any website software</li>
          <li>Remove copyright or other proprietary notices</li>
          <li>Transfer materials or mirror them on another server</li>
        </ul>
        <p>
          This license shall automatically terminate if you violate any of these
          restrictions and may be terminated by Wynn Tax Solutions at any time.
        </p>

        <h2>Disclaimer</h2>
        <p>
          The materials on this website are provided “as is.” Tax Group
          Consultants makes no warranties, expressed or implied, and disclaims
          all other warranties, including but not limited to merchantability,
          fitness for a particular purpose, or non-infringement.
        </p>

        <h2>Limitations</h2>
        <p>
          In no event shall Wynn Tax Solutions or its suppliers be liable for
          any damages (including, but not limited to, loss of data or profit)
          arising out of the use or inability to use materials on this website.
        </p>

        <h2>Restrictions</h2>
        <p>You are specifically restricted from:</p>
        <ul>
          <li>Publishing website material in any media</li>
          <li>Selling or sublicensing website material</li>
          <li>Publicly performing and/or showing website material</li>
          <li>Using this website in a damaging or unlawful way</li>
          <li>Engaging in data mining, harvesting, or extraction</li>
          <li>Using this website for advertising or marketing</li>
        </ul>
        <p>
          Certain areas of this website are restricted, and Tax Group
          Consultants may further restrict access at its discretion.
        </p>

        <h2>Accuracy of Materials</h2>
        <p>
          The materials on this website may include technical, typographical, or
          photographic errors. Wynn Tax Solutions does not guarantee that
          materials on the site are accurate or current.
        </p>

        <h2>Links</h2>
        <p>
          Wynn Tax Solutions is not responsible for the content of any linked
          site. The inclusion of any link does not imply endorsement.
        </p>

        <h2>Modifications</h2>
        <p>
          Wynn Tax Solutions may revise these terms of service at any time
          without notice. By using this website, you agree to be bound by the
          current version of these terms.
        </p>

        <h2>Governing Law</h2>
        <p>
          These terms are governed by California law, and you submit to the
          jurisdiction of courts in California for dispute resolution.
        </p>

        <h2>Intellectual Property Rights</h2>
        <p>
          Other than content you own, Wynn Tax Solutions and its licensors own
          all intellectual property rights in this website. You are granted a
          limited license only for viewing the material.
        </p>

        <h2>Your Content</h2>
        <p>
          By displaying your content on this website, you grant Wynn Tax Group a
          non-exclusive, worldwide, irrevocable license to use, reproduce,
          publish, and distribute it.
        </p>
        <p>
          Your content must not be defamatory, infringe on third-party rights,
          or violate laws.
        </p>

        <h2>No Warranties</h2>
        <p>
          This website is provided “as is,” and Wynn Tax Solutions makes no
          representations or warranties of any kind related to this website.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Wynn Tax Solutions, its officers, and employees shall not be held
          liable for any damages related to your use of this website.
        </p>

        <h2>Indemnification</h2>
        <p>
          You agree to indemnify Wynn Tax Solutions against any liabilities,
          damages, or expenses arising from your breach of these terms.
        </p>

        <h2>Severability</h2>
        <p>
          If any provision is found to be invalid, it shall be deleted without
          affecting the remaining provisions.
        </p>

        <h2>Assignment</h2>
        <p>
          Wynn Tax Solutions may assign or subcontract its rights without
          notice, but you may not transfer your rights under these terms.
        </p>

        <h2>Entire Agreement</h2>
        <p>
          These terms constitute the entire agreement between you and Tax
          Advocate Group.
        </p>

        <h2>Contact Information</h2>
        <p>
          <strong>Wynn Tax Solutions</strong>
          <br />
          21625 Prairie Street, Suite #200
          <br />
          Chatsworth, CA 91331, United States
        </p>
        <p>© Wynn Tax Solutions. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default TermsOfService;
