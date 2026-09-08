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
const TRUSTEDFORM_SCRIPT_ID = "trustedform-script";
const TRUSTEDFORM_SCRIPT_BASE_URL =
  "https://api.trustedform.com/trustedform.js";

function isTrustedFormCertificate(value) {
  return /^https:\/\/cert\.trustedform\.com\//i.test(String(value || "").trim());
}

export function useTrustedForm() {
  const [certUrl, setCertUrl] = useState("");
  const [token, setToken] = useState("");
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const inputRef = useRef(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Avoid loading script twice
    if (scriptLoaded.current) return;

    let existingScript = document.getElementById(TRUSTEDFORM_SCRIPT_ID);
    if (existingScript?.src?.startsWith("http://")) {
      // react-snap prerenders on an HTTP localhost origin. Older builds
      // serialized that protocol into the production HTTPS page, where the
      // browser blocked it as active mixed content. Replace any stale element
      // rather than treating its ID as proof that TrustedForm is available.
      existingScript.remove();
      existingScript = null;
    }

    if (existingScript) {
      scriptLoaded.current = true;
      return;
    }

    // Load TrustedForm script
    const script = document.createElement("script");
    script.id = TRUSTEDFORM_SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.src =
      `${TRUSTEDFORM_SCRIPT_BASE_URL}?field=${TRUSTEDFORM_FIELD_NAME}` +
      "&use_tagged_consent=true&l=" +
      new Date().getTime() +
      Math.random();

    document.body.appendChild(script);
    scriptLoaded.current = true;

  }, []);

  // Poll for the cert URL after script loads
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max

    const interval = setInterval(() => {
      attempts++;

      // TrustedForm can inject more than one matching field when a page has
      // multiple or dynamically replaced forms. Use the populated certificate
      // instead of assuming the first matching input is authoritative.
      const field = Array.from(
        document.querySelectorAll(`input[name="${TRUSTEDFORM_FIELD_NAME}"]`),
      ).find((candidate) => isTrustedFormCertificate(candidate.value));

      if (field) {
        const nextCertUrl = String(field.value).trim();
        setCertUrl(nextCertUrl);
        setHasTimedOut(false);

        // Extract token from cert URL
        // Format: https://cert.trustedform.com/TOKEN
        const match = nextCertUrl.match(/trustedform\.com\/([^/?#]+)/i);
        if (match) {
          setToken(match[1]);
        }

        clearInterval(interval);
        return;
      }

      if (attempts >= maxAttempts) {
        console.warn("[TRUSTEDFORM] ✗ Cert URL not available after 15s");
        setHasTimedOut(true);
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
    hasTimedOut,
    inputProps,
  };
}
