import React from "react";
import { Link } from "react-router-dom";

export default function ConsentNotice() {
  return (
    <p className="consent-notice" style={{ marginBottom: "0" }}>
      By clicking "Get Free Consultation", you authorize Wynn Tax Solutions and
      its subsidiaries to contact you at the email and phone number provided,
      including by text/SMS and autodialed or prerecorded calls (message/data
      rates may apply). Your consent is not a condition of purchase. You may opt
      out of texts at any time by replying STOP. See our{" "}
      <Link to="/privacy-policy" className="consent-notice__link">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
