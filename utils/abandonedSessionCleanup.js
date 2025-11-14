// utils/abandonedSessionCleanup.js
const AbandonedSubmission = require("../models/AbandonedSubmission");

/**
 * Called when session cookies are about to expire or user abandons
 * Saves partial progress to AbandonedSubmission collection
 */
async function saveAbandonedSession(req) {
  try {
    const { readPartialProgress } = require("./partialSubmissions");
    const partialData = readPartialProgress(req);

    if (!partialData) {
      console.log("[ABANDONED] No partial data to save");
      return null;
    }

    // Don't save if they're already past verification (they'll complete normally)
    if (partialData.lastPhase === "done") {
      console.log("[ABANDONED] Session completed, skipping");
      return null;
    }

    // Read conversation history
    const history = require("./partialSubmissions").readHistory
      ? require("./partialSubmissions").readHistory(req)
      : [];

    // Get question counter
    let questionCounter = {};
    try {
      questionCounter = req.signedCookies?.ts_qc
        ? JSON.parse(req.signedCookies.ts_qc)
        : {};
    } catch (e) {}

    const sessionDuration = partialData.startedAt
      ? Date.now() - partialData.startedAt
      : null;

    const ipAddress =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Check if we already have this session (by email or phone)
    let existing = null;
    if (partialData.email) {
      existing = await AbandonedSubmission.findOne({
        email: partialData.email,
        converted: false,
      }).sort({ lastUpdated: -1 });
    } else if (partialData.phone) {
      existing = await AbandonedSubmission.findOne({
        phone: partialData.phone,
        converted: false,
      }).sort({ lastUpdated: -1 });
    }

    if (existing) {
      // Update existing abandoned session
      existing.issues = partialData.issues || existing.issues;
      existing.balanceBand = partialData.balanceBand || existing.balanceBand;
      existing.noticeType = partialData.noticeType || existing.noticeType;
      existing.taxScope = partialData.taxScope || existing.taxScope;
      existing.state = partialData.state || existing.state;
      existing.filerType = partialData.filerType || existing.filerType;
      existing.question = partialData.question || existing.question;
      existing.answer = partialData.answer || existing.answer;
      existing.name = partialData.name || existing.name;
      existing.email = partialData.email || existing.email;
      existing.phone = partialData.phone || existing.phone;
      existing.contactPref = partialData.contactPref || existing.contactPref;
      existing.lastPhase = partialData.lastPhase;
      existing.lastUpdated = new Date();
      existing.sessionDuration = sessionDuration;
      existing.questionsAsked = questionCounter.count || 0;
      existing.conversationHistory = history.map((h) => ({ q: h.q, a: h.a }));

      await existing.save();
      console.log("[ABANDONED] Updated existing session:", existing._id);
      return existing;
    }

    // Create new abandoned session
    const abandoned = new AbandonedSubmission({
      issues: partialData.issues || [],
      balanceBand: partialData.balanceBand,
      noticeType: partialData.noticeType,
      taxScope: partialData.taxScope,
      state: partialData.state,
      filerType: partialData.filerType,
      question: partialData.question,
      answer: partialData.answer,
      name: partialData.name,
      email: partialData.email,
      phone: partialData.phone,
      contactPref: partialData.contactPref,
      lastPhase: partialData.lastPhase,
      startedAt: new Date(partialData.startedAt || Date.now()),
      lastUpdated: new Date(),
      sessionDuration,
      questionsAsked: questionCounter.count || 0,
      ipAddress,
      userAgent,
      conversationHistory: history.map((h) => ({ q: h.q, a: h.a })),
    });

    await abandoned.save();
    console.log("[ABANDONED] Saved new abandoned session:", abandoned._id);
    return abandoned;
  } catch (error) {
    console.error("[ABANDONED] Error saving:", error);
    return null;
  }
}

/**
 * Cleanup job - run daily to save abandoned sessions from cookies
 * This would be called by a cron job or scheduler
 */
async function cleanupExpiredSessions() {
  console.log("[CLEANUP] Starting abandoned session cleanup...");

  // This is a conceptual function - you'd need to implement
  // actual cookie expiration detection on the backend
  // For now, abandoned sessions are saved when:
  // 1. User closes tab (we can't detect this on backend)
  // 2. Cookie expires naturally (7 days)
  // 3. User clears cookies

  // In practice, you'd track this client-side with beforeunload
  // and send a final save request

  console.log("[CLEANUP] Cleanup complete");
}

module.exports = {
  saveAbandonedSession,
  cleanupExpiredSessions,
};
