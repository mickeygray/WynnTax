const crypto = require("crypto");

/* -------------------------------------------------------------------------- */
/*                          VERIFICATION CODE MANAGER                         */
/* -------------------------------------------------------------------------- */

// In-memory store for verification codes (consider Redis for production)
const verificationCodes = new Map();

const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a 6-digit verification code
 */
function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store verification code with expiry
 */
function storeVerificationCode(identifier, code, type) {
  verificationCodes.set(identifier, {
    code,
    type, // "email" or "phone"
    createdAt: Date.now(),
    verified: false,
  });
}

/**
 * Verify a code
 */
function verifyCode(identifier, code) {
  const stored = verificationCodes.get(identifier);

  if (!stored) {
    return { ok: false, reason: "no_code" };
  }

  if (Date.now() - stored.createdAt > CODE_EXPIRY) {
    verificationCodes.delete(identifier);
    return { ok: false, reason: "expired" };
  }

  if (stored.code !== code) {
    return { ok: false, reason: "invalid" };
  }

  // Mark as verified
  stored.verified = true;
  verificationCodes.set(identifier, stored);

  return { ok: true };
}

/**
 * Check if identifier is verified
 */
function isVerified(identifier) {
  const stored = verificationCodes.get(identifier);
  return stored?.verified === true;
}

/**
 * Clean up expired codes (run periodically)
 */
function cleanupExpiredCodes() {
  const now = Date.now();

  for (const [key, value] of verificationCodes.entries()) {
    const isExpired = now - value.createdAt > CODE_EXPIRY;
    const isUsed = value.verified === true;

    // Remove expired OR successfully used codes
    if (isExpired || isUsed) {
      verificationCodes.delete(key);
    }
  }
}
// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

/* -------------------------------------------------------------------------- */
/*                            PDF GENERATION                                  */
/* -------------------------------------------------------------------------- */

/**
 * Generate a unique AI-powered cover page for the user's tax situation
 */

/**
 * Generate AI summary for PDF cover page
 */
async function generateAISummary(openai, userData) {
  const prompt = `Based on the following tax situation, write a brief, encouraging 3-4 sentence summary that:
1. Acknowledges their specific situation
2. Highlights the key steps Wynn Tax can help with
3. Provides reassurance
4. Keeps a professional, warm tone

Tax Situation:
- Issues: ${userData.issues?.join(", ") || "Tax matters"}
- Amount: ${userData.balanceBand || "Undisclosed"}
- Tax Scope: ${userData.taxScope || "Federal"}
- Filer Type: ${userData.filerType || "Individual"}

Write the summary in 3-4 sentences, professional and encouraging tone:`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "You write brief, encouraging summaries for tax resolution clients. Be warm, professional, and reassuring. Keep it to 3-4 sentences.",
      max_output_tokens: 200,
      input: [{ role: "user", content: prompt }],
    });

    return (
      response?.output_text?.trim() ||
      "Wynn Tax Solutions is here to help you resolve your tax situation with personalized guidance and expert support. Our team will work with you every step of the way to find the best resolution for your unique circumstances."
    );
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return "Wynn Tax Solutions is here to help you resolve your tax situation with personalized guidance and expert support. Our team will work with you every step of the way to find the best resolution for your unique circumstances.";
  }
}

/**
 * Merge cover page with standard Wynn process PDF
 */

module.exports = {
  generateCode,
  storeVerificationCode,
  verifyCode,
  isVerified,
  cleanupExpiredCodes,
  generateAISummary,
};
