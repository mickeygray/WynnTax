// hooks/useTrustedForm.js
// ─────────────────────────────────────────────────────────────
// Loads the TrustedForm script and reads the generated cert URL.
//
// Usage:
//   const { certUrl, inputProps } = useTrustedForm();
//
//   // Add to your form:
//   <input {...inputProps} />
//
//   // Include in submission:
//   sendLeadForm({ ...formData, trustedFormCertUrl: certUrl });
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

const TRUSTEDFORM_FIELD_NAME = "xxTrustedFormCertUrl";
const TRUSTEDFORM_TOKEN_FIELD = "xxTrustedFormToken";

export function useTrustedForm() {
  const [certUrl, setCertUrl] = useState("");
  const [token, setToken] = useState("");
  const inputRef = useRef(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Avoid loading script twice
    if (scriptLoaded.current) return;
    if (document.getElementById("trustedform-script")) {
      scriptLoaded.current = true;
      return;
    }

    // Load TrustedForm script
    const script = document.createElement("script");
    script.id = "trustedform-script";
    script.type = "text/javascript";
    script.async = true;
    script.src =
      (document.location.protocol === "https:" ? "https" : "http") +
      "://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&use_tagged_consent=true&l=" +
      new Date().getTime() +
      Math.random();

    document.body.appendChild(script);
    scriptLoaded.current = true;

    console.log("[TRUSTEDFORM] Script loaded");
  }, []);

  // Poll for the cert URL after script loads
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max

    const interval = setInterval(() => {
      attempts++;

      // Check the hidden input that TrustedForm populates
      const field = document.querySelector(
        `input[name="${TRUSTEDFORM_FIELD_NAME}"]`,
      );

      if (field && field.value) {
        setCertUrl(field.value);

        // Extract token from cert URL
        // Format: https://cert.trustedform.com/TOKEN
        const match = field.value.match(/trustedform\.com\/([a-f0-9]+)/);
        if (match) {
          setToken(match[1]);
        }

        console.log("[TRUSTEDFORM] ✓ Cert URL captured:", field.value);
        clearInterval(interval);
        return;
      }

      if (attempts >= maxAttempts) {
        console.warn("[TRUSTEDFORM] ✗ Cert URL not available after 15s");
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Props to spread onto the hidden input in your form
  const inputProps = {
    type: "hidden",
    name: TRUSTEDFORM_FIELD_NAME,
    ref: inputRef,
    value: certUrl,
    readOnly: true,
  };

  return {
    certUrl,
    token,
    inputProps,
  };
}
