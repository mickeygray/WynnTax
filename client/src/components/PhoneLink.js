import React from "react";

export default function PhoneLink({ rawNumber = "", className = "" }) {
  const normalize = (v) => {
    if (!v) return "";
    const s = String(v).trim();
    if (s.startsWith("+")) return "+" + s.slice(1).replace(/\D+/g, "");
    return s.replace(/\D+/g, "");
  };

  const toE164 = (v) => {
    const n = normalize(v);
    if (!n) return "";
    if (n.startsWith("+")) return n;
    if (n.length === 11 && n.startsWith("1")) return `+${n}`;
    if (n.length === 10) return `+1${n}`;
    return n.startsWith("+") ? n : `+${n}`;
  };

  const formatUS = (v) => {
    const d = normalize(v).replace(/^1/, "");
    if (d.length >= 10) {
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    }
    return String(v);
  };

  const tel = `tel:${toE164(rawNumber)}`;
  const display = formatUS(rawNumber);

  const trackContact = () => {
    // Prefer sendBeacon to avoid losing the event on navigation
    try {
      const payload = JSON.stringify({
        event: "Contact",
        contact_method: "phone",
        label: "PhoneLink",
        ts: Date.now(),
      });

      // GA4 optional
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "contact", {
          method: "phone",
          event_label: "PhoneLink",
        });
      }

      // Meta Pixel
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "Contact", {
          contact_method: "phone",
          label: "PhoneLink",
        });
      }

      // Try to persist something even if fbq is blocked (analytics endpoint you own)
      if (navigator.sendBeacon) {
        // Replace with your own endpoint if you want server logs
        navigator.sendBeacon("/beacon/contact", payload);
      }
    } catch (_) {}
  };

  const handleClick = (e) => {
    // Strategy 1: fire and let the browser immediately open the dialer.
    // Works well with sendBeacon; keeps UX snappy.
    trackContact();

    // If you see drops on iOS, switch to Strategy 2 below:
    // e.preventDefault();
    // trackContact();
    // setTimeout(() => { window.location.href = tel; }, 200);
  };

  return (
    <a
      href={tel}
      className={`phone-button ${className}`}
      onClick={handleClick}
      aria-label={`Call ${display}`}
    >
      <i className="fa-solid fa-phone" aria-hidden="true"></i> CALL: {display}
    </a>
  );
}
