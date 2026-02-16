// utils/prospectWelcome.js
// ─────────────────────────────────────────────────────────────
// Automated welcome outreach for new website form submissions.
// Sends a branded welcome email (with PDF guide) + SMS with
// brochure link to every new prospect.
// ─────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { sendTextMessageAPI } = require("./callrail");

/* -------------------------------------------------------------------------- */
/*                          TEMPLATE SETUP                                    */
/* -------------------------------------------------------------------------- */

const TEMPLATE_PATH = path.join(
  __dirname,
  "..",
  "library",
  "prospect-welcome-email.hbs",
);

const LOGO_PATH = path.join(
  __dirname,
  "..",
  "library",
  "Wynn_Logo.png", // same logo used for website emails
);

const PDF_PATH = path.join(__dirname, "..", "library", "wynn-tax-guide.pdf");

// Compile template once at require-time
let welcomeTpl = null;
try {
  if (fs.existsSync(TEMPLATE_PATH)) {
    welcomeTpl = handlebars.compile(fs.readFileSync(TEMPLATE_PATH, "utf8"));
    console.log("[PROSPECT-WELCOME] ✓ Template compiled");
  } else {
    console.warn("[PROSPECT-WELCOME] ⚠ Template not found:", TEMPLATE_PATH);
  }
} catch (err) {
  console.error("[PROSPECT-WELCOME] Template compile error:", err.message);
}

/* -------------------------------------------------------------------------- */
/*                         SEND WELCOME EMAIL                                 */
/* -------------------------------------------------------------------------- */

/**
 * Send branded welcome email with PDF guide attached.
 *
 * @param {object} transporter - Nodemailer transporter instance
 * @param {{ email: string, name?: string }} fields
 * @returns {{ ok: boolean, error?: string }}
 */
async function sendWelcomeEmail(transporter, { email, name }) {
  try {
    if (!email) return { ok: false, error: "No email provided" };
    if (!welcomeTpl) return { ok: false, error: "Welcome template not loaded" };

    const scheduleUrl =
      process.env.WYNN_CALENDAR_SCHEDULE_URL ||
      process.env.TAG_CALENDAR_SCHEDULE_URL ||
      "https://calendly.com/wynntax";

    const html = welcomeTpl({
      name: name || "there",
      scheduleUrl,
      year: new Date().getFullYear(),
    });

    const attachments = [];

    if (fs.existsSync(LOGO_PATH)) {
      attachments.push({
        filename: "Wynn_Logo.png",
        path: LOGO_PATH,
        cid: "emailLogo",
      });
    }

    if (fs.existsSync(PDF_PATH)) {
      attachments.push({
        filename: "Wynn_Tax_Solutions_Guide.pdf",
        path: PDF_PATH,
        contentType: "application/pdf",
      });
    } else {
      console.warn("[PROSPECT-WELCOME] PDF not found:", PDF_PATH);
    }

    const info = await transporter.sendMail({
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      to: email,
      subject: `Welcome to Wynn Tax Solutions, ${name || "there"}!`,
      html,
      attachments,
    });

    console.log(
      "[PROSPECT-WELCOME-EMAIL] ✓ Sent to:",
      email,
      "id:",
      info?.messageId,
    );
    return { ok: true, messageId: info?.messageId };
  } catch (err) {
    console.error("[PROSPECT-WELCOME-EMAIL] ✗ Failed:", err.message);
    return { ok: false, error: err.message };
  }
}

/* -------------------------------------------------------------------------- */
/*                          SEND WELCOME TEXT                                 */
/* -------------------------------------------------------------------------- */

/**
 * Send welcome SMS with brochure link via CallRail.
 *
 * @param {{ phone: string, name?: string }} fields
 * @returns {{ ok: boolean, error?: string }}
 */
async function sendWelcomeText({ phone, name }) {
  try {
    if (!phone) return { ok: false, error: "No phone provided" };

    const cleanPhone = String(phone).replace(/[()\-\s]/g, "");

    const content =
      `Hi ${name || "there"}! Thanks for contacting Wynn Tax Solutions. ` +
      `Learn about how we can help resolve your tax situation: ` +
      `https://www.wynntaxsolutions.com/services-brochure\n\n` +
      `Questions? Call us: 310-561-1009`;

    await sendTextMessageAPI({
      phoneNumber: cleanPhone,
      trackingNumber: process.env.CALL_RAIL_TRACKING_NUMBER,
      content,
    });

    console.log("[PROSPECT-WELCOME-SMS] ✓ Sent to:", cleanPhone);
    return { ok: true };
  } catch (err) {
    const errMsg = err.response?.data?.error || err.message;
    console.error("[PROSPECT-WELCOME-SMS] ✗ Failed:", errMsg);
    return { ok: false, error: errMsg };
  }
}

/* -------------------------------------------------------------------------- */
/*                      COMBINED OUTREACH FUNCTION                            */
/* -------------------------------------------------------------------------- */

/**
 * Send welcome text + email in parallel.
 * Safe to call fire-and-forget — errors are caught internally.
 *
 * @param {object} transporter - Nodemailer transporter
 * @param {{ name: string, email: string, phone: string }} fields
 * @returns {{ emailResult: object, smsResult: object }}
 */
async function sendProspectWelcomeOutreach(transporter, fields) {
  const { name, email, phone } = fields;

  const [emailSettled, smsSettled] = await Promise.allSettled([
    email
      ? sendWelcomeEmail(transporter, { email, name })
      : Promise.resolve({ ok: false, error: "No email" }),
    phone
      ? sendWelcomeText({ phone, name })
      : Promise.resolve({ ok: false, error: "No phone" }),
  ]);

  const emailResult =
    emailSettled.status === "fulfilled"
      ? emailSettled.value
      : { ok: false, error: emailSettled.reason?.message };

  const smsResult =
    smsSettled.status === "fulfilled"
      ? smsSettled.value
      : { ok: false, error: smsSettled.reason?.message };

  console.log("[PROSPECT-WELCOME] Results:", {
    email: emailResult.ok ? "✓" : `✗ ${emailResult.error}`,
    sms: smsResult.ok ? "✓" : `✗ ${smsResult.error}`,
  });

  return { emailResult, smsResult };
}

module.exports = {
  sendWelcomeEmail,
  sendWelcomeText,
  sendProspectWelcomeOutreach,
};
