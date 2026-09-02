/**
 * utmTracking.js  — Client-side UTM capture
 *
 * 1. captureUtmParams()  → call once on app mount, stashes UTM from URL
 * 2. getUtmParams()      → returns the first-touch campaign and click IDs
 */

const UTM_STORAGE_KEY = "wynn_utm";

function clean(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

/**
 * Parse UTM + click-IDs from the current landing URL.
 * Stores in sessionStorage so it survives SPA navigation.
 * Only captures once per session — won't overwrite.
 */
export function captureUtmParams() {
  try {
    if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);

    const utm = {
      utmSource: clean(params.get("utm_source"), 120),
      utmMedium: clean(params.get("utm_medium"), 120),
      utmCampaign: clean(params.get("utm_campaign"), 240),
      utmTerm: clean(params.get("utm_term"), 240),
      utmContent: clean(params.get("utm_content"), 240),
      gclid: clean(params.get("gclid"), 256),
      gbraid: clean(params.get("gbraid"), 256),
      wbraid: clean(params.get("wbraid"), 256),
      fbclid: clean(params.get("fbclid"), 256),
      ttclid: clean(params.get("ttclid"), 256),
      landingPageUrl: clean(window.location.href, 2048),
      referrerUrl: clean(document.referrer, 2048),
    };

    // Auto-detect from click-IDs if utm_source is missing
    if (!utm.utmSource) {
      if (utm.gclid || utm.gbraid || utm.wbraid) utm.utmSource = "google";
      else if (utm.fbclid) utm.utmSource = "facebook";
      else if (utm.ttclid) utm.utmSource = "tiktok";
    }

    if (!utm.utmMedium && utm.utmSource === "google") utm.utmMedium = "cpc";

    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch (e) {
    console.warn("[UTM] capture failed:", e);
  }
}

/**
 * Return stored UTM object to include in API payloads.
 */
export function getUtmParams() {
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
