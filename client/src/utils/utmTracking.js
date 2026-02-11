/**
 * utmTracking.js  — Client-side UTM capture
 *
 * 1. captureUtmParams()  → call once on app mount, stashes UTM from URL
 * 2. getUtmParams()      → returns { utmSource, utmMedium, utmCampaign, referrerUrl }
 */

const UTM_STORAGE_KEY = "wynn_utm";

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
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      referrerUrl: window.location.href,
    };

    // Auto-detect from click-IDs if utm_source is missing
    if (!utm.utmSource) {
      if (params.get("gclid")) utm.utmSource = "google";
      else if (params.get("fbclid")) utm.utmSource = "facebook";
      else if (params.get("ttclid")) utm.utmSource = "tiktok";
    }

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
