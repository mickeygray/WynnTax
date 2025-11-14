// utils/partialSubmissions.js

const PARTIAL_COOKIE = "ts_partial";
const PARTIAL_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Save partial form data to cookie as user progresses
 */
function savePartialProgress(res, formData) {
  try {
    // Sanitize and limit data size
    const partial = {
      // Intake data
      issues: formData.issues || [],
      balanceBand: formData.balanceBand || "",
      noticeType: formData.noticeType || "",
      taxScope: formData.taxScope || "",
      state: formData.state || "",
      filerType: formData.filerType || "",

      // Question/answer (if they got that far)
      question: (formData.question || "").slice(0, 500),
      answer: (formData.answer || "").slice(0, 1000),

      // Contact info (if they got that far)
      name: formData.name || "",
      email: formData.email || "",
      phone: formData.phone || "",
      contactPref: formData.contactPref || "",

      // Metadata
      lastPhase: formData.lastPhase || "intake_issues",
      lastUpdated: Date.now(),
      startedAt: formData.startedAt || Date.now(),
    };

    const payload = JSON.stringify(partial);

    res.cookie(PARTIAL_COOKIE, payload, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: PARTIAL_MAX_AGE,
      signed: true,
      path: "/",
    });

    console.log("[PARTIAL] Saved progress:", formData.lastPhase);
  } catch (error) {
    console.error("[PARTIAL] Error saving progress:", error);
  }
}

/**
 * Read partial form data from cookie
 */
function readPartialProgress(req) {
  try {
    const raw = req.signedCookies?.[PARTIAL_COOKIE];
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Check if too old (more than 7 days)
    if (
      parsed.lastUpdated &&
      Date.now() - parsed.lastUpdated > PARTIAL_MAX_AGE
    ) {
      console.log("[PARTIAL] Progress expired, clearing");
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[PARTIAL] Error reading progress:", error);
    return null;
  }
}

/**
 * Clear partial progress cookie
 */
function clearPartialProgress(res) {
  res.clearCookie(PARTIAL_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });
  console.log("[PARTIAL] Cleared partial progress");
}

/**
 * Get session duration in milliseconds
 */
function getSessionDuration(partialData) {
  if (!partialData || !partialData.startedAt) return null;
  return Date.now() - partialData.startedAt;
}

module.exports = {
  savePartialProgress,
  readPartialProgress,
  clearPartialProgress,
  getSessionDuration,
  PARTIAL_COOKIE,
};
