// utils/abandonedSessionEmail.js
const nodemailer = require("nodemailer");
const AbandonedSubmission = require("../models/AbandonedSubmission");

/**
 * Send daily digest email with abandoned sessions
 * Run this via cron job daily (e.g., every morning at 9am)
 */
async function sendAbandonedSessionsDigest(transporter) {
  try {
    console.log("[ABANDONED DIGEST] Starting...");

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all abandoned sessions from yesterday
    const abandonedSessions = await AbandonedSubmission.find({
      lastUpdated: {
        $gte: yesterday,
        $lt: today,
      },
    }).sort({ lastUpdated: -1 });

    if (abandonedSessions.length === 0) {
      console.log("[ABANDONED DIGEST] No abandoned sessions yesterday");
      return;
    }

    // Group by phase
    const byPhase = abandonedSessions.reduce((acc, session) => {
      const phase = session.lastPhase || "unknown";
      if (!acc[phase]) acc[phase] = [];
      acc[phase].push(session);
      return acc;
    }, {});

    // Calculate stats
    const stats = {
      total: abandonedSessions.length,
      withEmail: abandonedSessions.filter((s) => s.email).length,
      withPhone: abandonedSessions.filter((s) => s.phone).length,
      withBoth: abandonedSessions.filter((s) => s.email && s.phone).length,
      highValue: abandonedSessions.filter((s) =>
        ["gt50k", "10to50k"].includes(s.balanceBand)
      ).length,
      atVerification: abandonedSessions.filter(
        (s) => s.lastPhase === "verification"
      ).length,
    };

    // Format email body
    const emailBody = formatAbandonedDigest(
      abandonedSessions,
      byPhase,
      stats,
      yesterday
    );

    // Send email
    const mailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      to: "mgray@taxadvocategroup.com",
      subject: `📊 Abandoned Sessions Digest - ${
        abandonedSessions.length
      } leads from ${yesterday.toLocaleDateString()}`,
      text: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[ABANDONED DIGEST] Email sent:", info.messageId);

    return {
      sent: true,
      count: abandonedSessions.length,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("[ABANDONED DIGEST] Error:", error);
    return {
      sent: false,
      error: error.message,
    };
  }
}

/**
 * Send immediate notification for high-priority abandonment
 * Call this when someone abandons at verification with contact info
 */
async function sendHighPriorityAbandonAlert(transporter, session) {
  try {
    // Only send for high-priority: got to verification with contact info
    if (
      session.lastPhase !== "verification" ||
      (!session.email && !session.phone)
    ) {
      return;
    }

    const emailBody = formatHighPriorityAlert(session);

    const mailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      to: "mgray@taxadvocategroup.com",
      subject: `🚨 HIGH PRIORITY: Abandoned at Verification - ${
        session.name || session.email || "Lead"
      }`,
      text: emailBody,
    };

    await transporter.sendMail(mailOptions);
    console.log("[HIGH PRIORITY ALERT] Sent for:", session._id);
  } catch (error) {
    console.error("[HIGH PRIORITY ALERT] Error:", error);
  }
}

/**
 * Format daily digest email
 */
function formatAbandonedDigest(sessions, byPhase, stats, date) {
  const phaseLabels = {
    intake_issues: "Selected Issues",
    intake_questions: "Intake Questions",
    question: "Asked Question",
    name: "Entered Name",
    contact_offer: "Saw Contact Options",
    contact_details: "Entered Contact Info",
    verification: "⚠️ Got Verification Code",
  };

  let body = `
╔═════════════════════════════════════════════════════════════════╗
║                                                                 ║
║          ABANDONED TAX STEWART SESSIONS DIGEST                  ║
║          Date: ${date.toLocaleDateString()}                     ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Abandoned:           ${stats.total}
With Email:                ${stats.withEmail} (${Math.round(
    (stats.withEmail / stats.total) * 100
  )}%)
With Phone:                ${stats.withPhone} (${Math.round(
    (stats.withPhone / stats.total) * 100
  )}%)
With Both:                 ${stats.withBoth} (${Math.round(
    (stats.withBoth / stats.total) * 100
  )}%)
High Value (>$10k):        ${stats.highValue} (${Math.round(
    (stats.highValue / stats.total) * 100
  )}%)
⚠️ At Verification:        ${stats.atVerification} (${Math.round(
    (stats.atVerification / stats.total) * 100
  )}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📉 ABANDONMENT FUNNEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  // Add funnel breakdown
  Object.entries(byPhase).forEach(([phase, phaseSessions]) => {
    body += `${phaseLabels[phase] || phase}: ${phaseSessions.length}\n`;
  });

  body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 HIGH PRIORITY LEADS (Verification + Contact Info)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  const highPriority = sessions.filter(
    (s) => s.lastPhase === "verification" && (s.email || s.phone)
  );

  if (highPriority.length === 0) {
    body += "None today\n";
  } else {
    highPriority.forEach((session, idx) => {
      body += formatSessionSummary(session, idx + 1);
    });
  }

  body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 HIGH VALUE LEADS (>$10k Balance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  const highValue = sessions.filter(
    (s) => ["gt50k", "10to50k"].includes(s.balanceBand) && (s.email || s.phone)
  );

  if (highValue.length === 0) {
    body += "None today\n";
  } else {
    highValue.slice(0, 10).forEach((session, idx) => {
      body += formatSessionSummary(session, idx + 1);
    });
  }

  body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ALL ABANDONED SESSIONS (With Contact Info)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  const withContact = sessions.filter((s) => s.email || s.phone);

  if (withContact.length === 0) {
    body += "None with contact info\n";
  } else {
    withContact.forEach((session, idx) => {
      body += formatSessionSummary(session, idx + 1);
    });
  }

  body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 FOLLOW-UP RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. HIGH PRIORITY (${stats.atVerification} leads):
   - These people got verification codes but didn't verify
   - Email subject: "Complete Your Tax Consultation Request"
   - SMS: "Hi [name], we noticed you didn't finish. Reply YES to continue"
   
2. HIGH VALUE (${stats.highValue} leads):
   - Owe $10k+ and provided contact info
   - Personal outreach recommended
   - Offer direct consultation scheduling
   
3. EARLY ABANDONMENT:
   - Consider A/B testing the intake flow
   - May indicate friction in form design

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 MONGODB QUERIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// View all from yesterday
db.abandonedsubmissions.find({
  lastUpdated: { 
    $gte: ISODate("${yesterday.toISOString()}"),
    $lt: ISODate("${new Date().toISOString()}")
  }
})

// High priority (verification + contact)
db.abandonedsubmissions.find({
  lastPhase: "verification",
  $or: [
    { email: { $exists: true, $ne: "" } },
    { phone: { $exists: true, $ne: "" } }
  ],
  followedUp: false
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return body;
}

/**
 * Format individual session summary
 */
function formatSessionSummary(session, index) {
  const amountLabels = {
    lt10k: "Under $10k",
    "10to50k": "$10k–$50k",
    gt50k: "Over $50k",
    unsure: "Not sure",
  };

  const duration = session.sessionDuration
    ? Math.round(session.sessionDuration / 60000) + " min"
    : "N/A";

  const issueLabels = {
    balance_due: "Balance due",
    irs_notice: "IRS notice",
    unfiled: "Unfiled returns",
    levy_lien: "Levy/Lien",
    audit: "Audit",
  };

  const issues =
    session.issues?.map((id) => issueLabels[id] || id).join(", ") || "None";

  return `
┌─────────────────────────────────────────────────────────────────
│ Lead #${index} - ${session.name || "Unknown"}
├─────────────────────────────────────────────────────────────────
│ ID:          ${session._id}
│ Time:        ${new Date(session.lastUpdated).toLocaleTimeString()}
│ Phase:       ${session.lastPhase}
│ Duration:    ${duration}
│ 
│ Contact:
│   Email:     ${session.email || "Not provided"}
│   Phone:     ${session.phone || "Not provided"}
│ 
│ Tax Situation:
│   Issues:    ${issues}
│   Amount:    ${amountLabels[session.balanceBand] || "Not provided"}
│   Scope:     ${session.taxScope || "Not provided"}
│   Type:      ${session.filerType || "Not provided"}
│ 
│ Question:    ${session.question || "None asked"}
│ 
│ Conversation History: ${session.conversationHistory?.length || 0} exchanges
└─────────────────────────────────────────────────────────────────

`;
}

/**
 * Format high priority alert email
 */
function formatHighPriorityAlert(session) {
  const amountLabels = {
    lt10k: "Under $10k",
    "10to50k": "$10k–$50k",
    gt50k: "Over $50k",
    unsure: "Not sure",
  };

  return `
╔═════════════════════════════════════════════════════════════════╗
║                                                                 ║
║          🚨 HIGH PRIORITY ABANDONED SESSION ALERT 🚨            ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝

Someone got ALL THE WAY to verification but didn't complete!
This is a HOT lead that needs immediate follow-up.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 LEAD INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:        ${session.name || "Not provided"}
Email:       ${session.email || "Not provided"}
Phone:       ${session.phone || "Not provided"}
Preference:  ${session.contactPref || "Not specified"}

Time:        ${new Date(session.lastUpdated).toLocaleString()}
Duration:    ${
    session.sessionDuration
      ? Math.round(session.sessionDuration / 60000) + " minutes"
      : "N/A"
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TAX SITUATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues:      ${session.issues?.join(", ") || "None"}
Amount:      ${amountLabels[session.balanceBand] || "Not provided"}
Notice:      ${session.noticeType || "Not provided"}
Scope:       ${session.taxScope || "Not provided"}
State:       ${session.state || "Not applicable"}
Filer Type:  ${session.filerType || "Not provided"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 THEIR QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${session.question || "No question asked"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDED ACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 IMMEDIATE EMAIL:
Subject: "Complete Your Tax Consultation - Verification Expired"
Body: "Hi ${session.name || "there"}, we noticed your verification code 
expired. We've sent a new one. Click here to complete: [link]"

📱 IMMEDIATE SMS:
"Hi ${session.name || "there"}, your verification code expired. 
Reply YES and we'll send a new one, or call us at [number]"

☎️ PERSONAL OUTREACH:
This lead spent ${
    session.sessionDuration
      ? Math.round(session.sessionDuration / 60000)
      : "several"
  } minutes 
engaging with Tax Stewart. High intent. Call within 1 hour.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ID: ${session._id}

Mark as followed up:
db.abandonedsubmissions.updateOne(
  {_id: ObjectId("${session._id}")},
  {$set: {followedUp: true, followUpNotes: "Your notes here"}}
)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

module.exports = {
  sendAbandonedSessionsDigest,
  sendHighPriorityAbandonAlert,
  formatAbandonedDigest,
  formatHighPriorityAlert,
};
