// utils/sessionManagement.js

/**
 * Clear all Tax Stewart session cookies
 */
function clearTaxStewartSession(res) {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  };

  res.clearCookie("ts_qc", cookieOptions); // Question counter
  res.clearCookie("ts_history", cookieOptions); // Conversation history

  console.log("[SESSION] Cleared Tax Stewart cookies");
}

/**
 * Get full session data from cookies (useful for debugging)
 */
function getSessionSnapshot(req) {
  let questionCounter = {};
  let history = [];

  try {
    questionCounter = req.signedCookies?.ts_qc
      ? JSON.parse(req.signedCookies.ts_qc)
      : {};
  } catch (e) {
    console.error("[SESSION] Error parsing question counter:", e);
  }

  try {
    history = req.signedCookies?.ts_history
      ? JSON.parse(req.signedCookies.ts_history)
      : [];
  } catch (e) {
    console.error("[SESSION] Error parsing history:", e);
  }

  return {
    questionCounter,
    history,
    ipAddress:
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    timestamp: new Date(),
  };
}

/**
 * Format intake data for display/email
 */
function formatIntakeData(data) {
  const issueLabels = {
    balance_due: "I owe taxes",
    irs_notice: "I got an IRS notice",
    unfiled: "Unfiled returns",
    levy_lien: "Levy/Lien",
    audit: "Audit/Exam",
  };

  const amountLabels = {
    lt10k: "Under $10k",
    "10to50k": "$10k–$50k",
    gt50k: "Over $50k",
    unsure: "Not sure",
  };

  const noticeLabels = {
    none: "No notice",
    cp504: "CP504",
    levy: "Levy / Final notice",
    other: "Something else",
  };

  const taxScopeLabels = {
    federal: "Federal (IRS)",
    state: "State",
    both: "Both federal and state",
  };

  const filerTypeLabels = {
    individual: "Individual",
    business: "Business",
  };

  return {
    issues:
      data.issues?.map((id) => issueLabels[id] || id).join(", ") ||
      "None selected",
    amount:
      amountLabels[data.balanceBand] || data.balanceBand || "Not provided",
    notice: noticeLabels[data.noticeType] || data.noticeType || "Not provided",
    taxScope: taxScopeLabels[data.taxScope] || data.taxScope || "Not provided",
    state: data.state || "Not applicable",
    filerType:
      filerTypeLabels[data.filerType] || data.filerType || "Not provided",
  };
}

module.exports = {
  clearTaxStewartSession,
  getSessionSnapshot,
  formatIntakeData,
};
