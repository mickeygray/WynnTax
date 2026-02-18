require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const axios = require("axios");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const connectDB = require("./config/db");
const OpenAI = require("openai");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { sendTextMessageAPI } = require("./utils/callrail");
const {
  generateCode,
  storeVerificationCode,
  verifyCode,
  isVerified,
  generateAISummary,
  cleanupExpiredCodes,
} = require("./utils/verification");
const { resolveUtm, SOURCE_NAMES } = require("./utils/irsLogicsService");

/* -------------------------------------------------------------------------- */
/*                           HANDLEBARS TEMPLATES                             */
/* -------------------------------------------------------------------------- */

const verificationTemplate = handlebars.compile(
  fs.readFileSync(
    path.join(__dirname, "library", "verification-email.hbs"),
    "utf8",
  ),
);

const welcomeTemplate = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "library", "welcome-email.hbs"), "utf8"),
);

const formLimiter = rateLimit({
  windowMs: 60 * 10000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many submissions. Please wait before trying again.",
    });
  },
});

const app = express();
app.use(express.json({ limit: "1mb" }));
const cookieParser = require("cookie-parser");
const questionCounter = require("./middleware/questionCounter");
app.use(cookieParser(process.env.COOKIE_SECRET));

const isProd = process.env.NODE_ENV === "production";

/* -------------------------------------------------------------------------- */
/*                       TAX STEWART HISTORY COOKIE                           */
/* -------------------------------------------------------------------------- */

const TS_HISTORY_COOKIE = "ts_history";
const TS_HISTORY_MAX_ITEMS = 4;
const TS_HISTORY_MAX_FIELD = 1200;

function clampText(s = "", limit = TS_HISTORY_MAX_FIELD) {
  const t = String(s)
    .replace(/\u0000/g, "")
    .trim();
  return t.length > limit ? t.slice(0, limit) + " …" : t;
}

function readHistory(req) {
  try {
    const raw = req.signedCookies?.[TS_HISTORY_COOKIE];
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === "object")
      .map(({ q, a }) => ({ q: clampText(q), a: clampText(a) }))
      .slice(-TS_HISTORY_MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeHistory(res, history) {
  const trimmed = (history || [])
    .filter((x) => x && typeof x === "object")
    .map(({ q, a }) => ({ q: clampText(q), a: clampText(a) }))
    .slice(-TS_HISTORY_MAX_ITEMS);

  res.cookie(TS_HISTORY_COOKIE, JSON.stringify(trimmed), {
    httpOnly: true,
    sameSite: "Lax",
    secure: isProd,
    signed: true,
    maxAge: 7 * 24 * 3600 * 1000,
    path: "/",
  });
}

/* -------------------------------------------------------------------------- */
/*                          TAX AREAS & SYSTEM PROMPT                         */
/* -------------------------------------------------------------------------- */

const TAX_AREAS = `
FEDERAL TAX TOPICS:
- Balance due / tax debt / back taxes / unpaid taxes
- IRS notices (CP501, CP503, CP504, CP90, CP91, LT11, 1058, 668A, etc.)
- Unfiled returns / non-filer / late filing / compliance
- Levy / lien / garnishment / wage garnishment / bank levy / seizure
- Audit / examination / correspondence audit
- Payment plans / installment agreements / currently not collectible (CNC)
- Offer in compromise (OIC) / tax settlement / penalty abatement
- Collection Due Process (CDP) hearings / appeals
- Innocent spouse relief / injured spouse
- Tax forms (1040, 941, 940, W-2, 1099, K-1, Schedule C, etc.)
- Withholding / estimated taxes / quarterly payments
- Self-employment tax / payroll tax / employment tax (FICA, Medicare)
- Business taxes / LLC / S-corp / C-corp / partnership / sole proprietor
- Deductions / credits / exemptions / dependents
- Capital gains / depreciation / basis
- Retirement accounts (IRA, 401k, RMD) / HSA
- Estate tax / gift tax / inheritance
- Identity theft / identity verification / IP PIN

STATE TAX TOPICS:
- State tax debt / state notices
- Franchise Tax Board (FTB - California)
- Department of Revenue (various states)
- State filing / state compliance
- Sales tax / use tax / excise tax / property tax

LIFE SITUATIONS THAT MAY RELATE TO TAX:
- Death of family member (estate tax, inheritance, final returns, deceased spouse)
- Divorce / separation (innocent spouse, filing status, alimony)
- Job loss / unemployment (income changes, estimated taxes, withholding)
- Starting a business (entity selection, self-employment tax, quarterly estimates)
- Received inheritance / sold property (capital gains, basis, reporting)
- Medical expenses (deductions, HSA)
- Education expenses (credits, student loan interest, 1098-T)
- Disability / hardship (currently not collectible, payment plans)
- Bankruptcy (discharge of tax debt, chapter 7 vs 13)
- Cryptocurrency / gig work / 1099 income
`;

const NON_TAX_REFUSAL =
  "I specialize in U.S. tax matters and can't provide guidance on that topic. However, if you have tax questions related to your situation, I'm here to help. Would you like to schedule a call with a Wynn Tax consultant to discuss your needs?";

const TAX_SYSTEM_PROMPT = `
You are Tax Stewart, a specialized U.S. tax education assistant for Wynn Tax Solutions.

CONTEXT AWARENESS:
You may have information about the user's tax situation from their intake selections. Use this context to provide personalized guidance. The user may ask follow-up questions that seem unrelated to tax (like "my mom died" or "I'm unemployed"), but you must connect their question back to their specific tax situation when there is a valid tax connection.

TAX AREAS YOU COVER:
${TAX_AREAS}

ROLE & SCOPE:
- Explain and interpret federal and state tax rules clearly and professionally
- Draw on the Internal Revenue Code (IRC), Treasury Regulations, IRS rulings and procedures, the Internal Revenue Manual (IRM), official IRS publications, and state or local tax guidance
- Your goal is to make these rules understandable in plain English for ordinary taxpayers, not professionals
- Connect life situations (death, unemployment, divorce, etc.) to tax implications when relevant

STYLE & OUTPUT:
- Write in smooth, conversational paragraphs—never in rigid sections like "Facts/Issues/Rules"
- Keep answers concise (usually 6–10 sentences or 150 words max)
- Use light formatting for clarity:
  ✅ checkmarks for "do" or compliant steps
  ⚠️ warnings for risks or deadlines
  ❌ for what to avoid
  • bullets or numbered lists for clarity
- When citing authorities, include short inline references such as (IRC §6331) or (IRM 5.14.1.2); never hyperlinks
- Never use markdown headers (#, ##, etc.)
- Professional, approachable, conversational tone similar to a knowledgeable tax consultant

CONTENT GUIDELINES:
- Address the user's situation factually: what it means, why it happens, what rules apply, and what reasonable next steps look like
- Mention deadlines, forms, or processes accurately, but never invent details
- If unsure, say what needs verification rather than guessing
- Stay strictly within U.S. federal or state tax matters

CRITICAL PROHIBITIONS:
- NEVER tell users to contact or visit the IRS or any government website
- NEVER include phone numbers, URLs, or external resources
- NEVER fabricate citations, numbers, or official forms
- NEVER discuss non-tax topics

NON-TAX QUESTION HANDLING:
If a question has NO connection to taxes (e.g., "Where do babies come from?", "What's the weather?"):
- Politely respond: "${NON_TAX_REFUSAL}"

CLOSING:
- Always end with: "Wynn Tax Solutions can help you review your situation and confirm the best next step. Educational information only—not legal or tax advice."

INTERACTION:
- Be calm, professional, reassuring, precise, and human
- Brief, accurate, aligned with Wynn's educational mission
- Ask clarifying questions only when essential (year, state, or income type)
`;

/* -------------------------------------------------------------------------- */
/*                          TAX KEYWORD DETECTION                             */
/* -------------------------------------------------------------------------- */

function isTaxRelated(text = "") {
  const s = (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const keywords = [
    "tax",
    "taxes",
    "taxation",
    "taxpayer",
    "tax return",
    "tax refund",
    "tax bill",
    "tax debt",
    "back taxes",
    "owe taxes",
    "owe the irs",
    "late taxes",
    "delinquent taxes",
    "unpaid taxes",
    "past due taxes",
    "tax relief",
    "tax resolution",
    "tax problem",
    "tax issue",
    "tax help",
    "tax notice",
    "tax letter",
    "irs letter",
    "irs notice",
    "notice of intent",
    "cp501",
    "cp503",
    "cp504",
    "cp90",
    "cp91",
    "lt11",
    "1058",
    "668a",
    "cp508c",
    "irs",
    "internal revenue",
    "internal revenue service",
    "treasury",
    "federal tax",
    "state tax",
    "franchise tax board",
    "ftb",
    "department of revenue",
    "revenue department",
    "taxing authority",
    "1040",
    "1040x",
    "1041",
    "1065",
    "1120",
    "1120s",
    "941",
    "940",
    "1099",
    "1099-misc",
    "1099k",
    "w2",
    "w-2",
    "k1",
    "k-1",
    "schedule c",
    "schedule e",
    "schedule f",
    "schedule a",
    "schedule b",
    "form 433a",
    "form 433b",
    "form 433f",
    "form 9465",
    "form 2848",
    "form 656",
    "form 8857",
    "form 8821",
    "form 4506",
    "form 4506-t",
    "ein",
    "itin",
    "ssn",
    "tax id",
    "filing",
    "file my taxes",
    "filed my taxes",
    "unfiled",
    "compliance",
    "non filer",
    "non-filer",
    "late filing",
    "amendment",
    "amend return",
    "audit",
    "examination",
    "amended return",
    "substitute for return",
    "income",
    "earned income",
    "gross income",
    "adjusted gross",
    "agi",
    "deduct",
    "deduction",
    "deductions",
    "itemized",
    "standard deduction",
    "credit",
    "tax credit",
    "child tax credit",
    "earned income credit",
    "dependency",
    "dependent",
    "exemption",
    "write off",
    "write-off",
    "capital gain",
    "capital gains",
    "basis",
    "depreciation",
    "withholding",
    "fica",
    "social security tax",
    "medicare tax",
    "payroll tax",
    "employment tax",
    "self employment tax",
    "estimated tax",
    "quarterly payment",
    "quarterly taxes",
    "levy",
    "lien",
    "garnishment",
    "garnish wages",
    "bank levy",
    "seizure",
    "payment plan",
    "installment agreement",
    "currently not collectible",
    "cnc",
    "offer in compromise",
    "oic",
    "fresh start",
    "settlement",
    "penalty abatement",
    "first time abatement",
    "hardship",
    "appeal",
    "cdp hearing",
    "collection due process",
    "innocent spouse",
    "llc",
    "s corp",
    "s-corp",
    "c corp",
    "c-corp",
    "partnership",
    "sole proprietor",
    "self employed",
    "business taxes",
    "penalty",
    "interest",
    "failure to file",
    "failure to pay",
    "extension",
    "deadline",
    "april 15",
    "due date",
    "ira",
    "roth ira",
    "401k",
    "hsa",
    "rmd",
    "estate tax",
    "gift tax",
    "i owe",
    "owe the irs",
    "owe money to the irs",
    "owe taxes",
    "received a letter",
    "got a letter",
    "irs sent me",
    "balance due",
  ];

  return keywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(s));
}

/* -------------------------------------------------------------------------- */
/*                               OPENAI & EMAIL SETUP                         */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 5000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const transporter = nodemailer.createTransport({
  host: process.env.SENDGRID_GATEWAY,
  port: process.env.SENDGRID_PORT,
  secure: false,
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_API_KEY,
  },
});

/* -------------------------------------------------------------------------- */
/*                         WEBHOOK HELPER                                     */
/* -------------------------------------------------------------------------- */

async function postToWebhook(fields, source = "website") {
  console.log(`[WEBHOOK] ========== START postToWebhook ==========`);
  console.log(`[WEBHOOK] Source: ${source}`);
  console.log(`[WEBHOOK] Fields:`, JSON.stringify(fields, null, 2));
  console.log(
    `[WEBHOOK] WEBHOOK_URL env: ${process.env.WEBHOOK_URL || "NOT SET"}`,
  );
  console.log(
    `[WEBHOOK] LEAD_WEBHOOK_SECRET env: ${process.env.LEAD_WEBHOOK_SECRET ? "SET (length: " + process.env.LEAD_WEBHOOK_SECRET.length + ")" : "NOT SET"}`,
  );

  try {
    if (!process.env.WEBHOOK_URL || !process.env.LEAD_WEBHOOK_SECRET) {
      console.warn("[WEBHOOK] ✗ Missing WEBHOOK_URL or LEAD_WEBHOOK_SECRET");
      return { ok: false, error: "Webhook not configured" };
    }

    const url = `${process.env.WEBHOOK_URL}/lead-contact`;
    console.log(`[WEBHOOK] Posting to URL: ${url}`);

    const response = await axios.post(
      url,
      { ...fields, source },
      {
        headers: {
          "Content-Type": "application/json",
          "x-webhook-key": process.env.LEAD_WEBHOOK_SECRET,
        },
        timeout: 15000,
      },
    );

    console.log(`[WEBHOOK] ✓ Response status: ${response.status}`);
    console.log(
      `[WEBHOOK] ✓ Response data:`,
      JSON.stringify(response.data, null, 2),
    );
    console.log(`[WEBHOOK] ========== END postToWebhook ==========`);
    return response.data;
  } catch (err) {
    console.error(`[WEBHOOK] ✗ Error: ${err.message}`);
    console.error(`[WEBHOOK] ✗ Error code: ${err.code || "N/A"}`);
    console.error(
      `[WEBHOOK] ✗ Response status: ${err.response?.status || "N/A"}`,
    );
    console.error(`[WEBHOOK] ✗ Response data:`, err.response?.data || "N/A");
    console.log(`[WEBHOOK] ========== END postToWebhook (ERROR) ==========`);
    return { ok: false, error: err.message };
  }
}

/* -------------------------------------------------------------------------- */
/*                               MIDDLEWARE                                   */
/* -------------------------------------------------------------------------- */

connectDB();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://www.wynntaxsolutions.com"],
    credentials: true,
  }),
);

/* -------------------------------------------------------------------------- */
/*                            FORM TRACKING                                   */
/* -------------------------------------------------------------------------- */

app.post("/api/track-form-input", async (req, res) => {
  try {
    const { formType, formData, abandoned, timestamp } = req.body;

    if (!formType || !formData) {
      return res
        .status(400)
        .json({ ok: false, error: "formType and formData required" });
    }

    const cookieName = `form_${formType}`;
    const cookieData = {
      formType,
      formData,
      abandoned: abandoned || false,
      timestamp: timestamp || Date.now(),
      lastUpdated: Date.now(),
    };

    res.cookie(cookieName, JSON.stringify(cookieData), {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      signed: true,
      path: "/",
    });

    if (abandoned) {
      const FormSubmission = require("./models/FormSubmission");
      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];

      let existing = null;
      if (formData.email) {
        existing = await FormSubmission.findOne({
          formType,
          "formData.email": formData.email,
          status: "abandoned",
        }).sort({ createdAt: -1 });
      }

      if (existing) {
        existing.formData = formData;
        existing.timestamp = new Date(timestamp || Date.now());
        existing.ipAddress = ipAddress;
        existing.userAgent = userAgent;
        await existing.save();
        console.log(
          `[TRACK-FORM] ${formType} - Updated abandoned:`,
          existing._id,
        );
      } else {
        const submission = new FormSubmission({
          formType,
          formData,
          status: "abandoned",
          ipAddress,
          userAgent,
          timestamp: new Date(timestamp || Date.now()),
        });
        await submission.save();
        console.log(
          `[TRACK-FORM] ${formType} - Saved abandoned:`,
          submission._id,
        );
      }
    }

    return res.json({ ok: true, message: "Form data tracked" });
  } catch (error) {
    console.error("[/track-form-input] error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to track form data" });
  }
});

function clearFormTrackingCookie(res, formType) {
  res.clearCookie(`form_${formType}`, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });
  console.log(`[TRACK-FORM] Cleared ${formType} tracking cookie`);
}

/* -------------------------------------------------------------------------- */
/*                     PHONE VERIFICATION FOR FORMS (DISABLED)                */
/* -------------------------------------------------------------------------- */

// NOTE: Phone verification disabled - CallRail doesn't allow 2FA codes
// and RingCentral TCP compliance pending. Keeping endpoint commented
// for future use when SMS provider is sorted.

/*
app.post("/api/send-form-verification", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ ok: false, error: "Phone required" });
    }

    const phoneCode = generateCode();
    storeVerificationCode(phone, phoneCode, "phone");

    const phoneNumber = String(phone).replace(/[()\-\s]/g, "");

    await sendTextMessageAPI({
      phoneNumber,
      content: `Your Wynn Tax Solutions verification code is: ${phoneCode}. Valid for 10 minutes.`,
    });

    console.log("[FORM-VERIFY] Code sent to:", phoneNumber);

    return res.json({ ok: true, message: "Verification code sent" });
  } catch (error) {
    console.error("[/send-form-verification] error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send code" });
  }
});
*/

/* -------------------------------------------------------------------------- */
/*                            CONTACT FORM                                    */
/* -------------------------------------------------------------------------- */

app.post("/api/contact-form", formLimiter, async (req, res) => {
  const { name, email, phone, message, utm } = req.body;

  console.log("[CONTACT-FORM] Submission:", { name, email, phone });

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required!" });
  }

  try {
    const resolvedUtm = resolveUtm(utm, req);

    // POST to webhook for CRM + outreach + dialing
    const webhookResult = await postToWebhook(
      { name, email, phone: phone || "", city: "", state: "", message },
      "contact-form",
    );

    // Internal notification
    const mailOptions = {
      from: "inquiry@WynnTaxSolutions.com",
      to: "inquiry@taxadvocategroup.com",
      subject: `New Contact Form — ${name}${webhookResult.caseId ? ` [Case #${webhookResult.caseId}]` : ""}`,
      text: `
NEW CONTACT FORM SUBMISSION
${"─".repeat(50)}

Name:       ${name}
Email:      ${email}
Phone:      ${phone || "Not provided"}
Message:    ${message}

${"─".repeat(50)}
UTM Source:  ${resolvedUtm.utmSource || "Direct/Organic"}
UTM Medium:  ${resolvedUtm.utmMedium || "N/A"}
Campaign:    ${resolvedUtm.utmCampaign || "N/A"}

Webhook:     ${webhookResult.ok ? "✓ Success" : `✗ ${webhookResult.error}`}
Logics Case: ${webhookResult.caseId || "N/A"}
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
    clearFormTrackingCookie(res, "contact-us");

    const FormSubmission = require("./models/FormSubmission");
    await FormSubmission.updateOne(
      { formType: "contact-us", "formData.email": email, status: "abandoned" },
      {
        $set: {
          status: "submitted",
          formData: { name, email, phone, message },
        },
      },
    );

    console.log("[CONTACT-FORM] ✓ Complete");
    res.status(200).json({ success: "Form submitted successfully!" });
  } catch (error) {
    console.error("[CONTACT-FORM] Error:", error);
    res.status(500).json({ error: "Error processing form. Try again later." });
  }
});

/* -------------------------------------------------------------------------- */
/*                              LEAD FORM                                     */
/* -------------------------------------------------------------------------- */

app.post("/api/lead-form", async (req, res) => {
  const { debtAmount, filedAllTaxes, name, phone, email, bestTime, utm } =
    req.body;

  console.log("[LEAD-FORM] Submission:", {
    name,
    email,
    phone,
    debtAmount,
    filedAllTaxes,
  });

  if (!debtAmount || !filedAllTaxes || !name || !phone || !email) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided!" });
  }

  try {
    const resolvedUtm = resolveUtm(utm, req);

    // POST to webhook for CRM + outreach + dialing
    const message = `Debt: ${debtAmount} | Filed All: ${filedAllTaxes}${bestTime ? ` | Best Time: ${bestTime}` : ""}`;
    const webhookResult = await postToWebhook(
      { name, email, phone, city: "", state: "", message },
      "lead-form",
    );

    // Internal notification
    const mailOptions = {
      from: "inquiry@WynnTaxSolutions.com",
      to: "inquiry@taxadvocategroup.com",
      subject: `New Lead Form — ${name}${webhookResult.caseId ? ` [Case #${webhookResult.caseId}]` : ""}`,
      text: `
NEW LEAD FORM SUBMISSION
${"─".repeat(50)}

Name:              ${name}
Phone:             ${phone}
Email:             ${email}
Best Time:         ${bestTime || "Not specified"}
Debt Amount:       ${debtAmount}
Filed All Taxes:   ${filedAllTaxes}

${"─".repeat(50)}
UTM Source:  ${resolvedUtm.utmSource || "Direct/Organic"}
Campaign:    ${resolvedUtm.utmCampaign || "N/A"}

Webhook:     ${webhookResult.ok ? "✓ Success" : `✗ ${webhookResult.error}`}
Logics Case: ${webhookResult.caseId || "N/A"}
      `.trim(),
    };

    await transporter.sendMail(mailOptions);
    clearFormTrackingCookie(res, "landing-popup");

    const FormSubmission = require("./models/FormSubmission");
    await FormSubmission.updateOne(
      {
        formType: "landing-popup",
        "formData.email": email,
        status: "abandoned",
      },
      {
        $set: {
          status: "submitted",
          formData: { debtAmount, filedAllTaxes, name, phone, email, bestTime },
        },
      },
    );

    console.log("[LEAD-FORM] ✓ Complete — CaseID:", webhookResult.caseId);
    res.status(200).json({ success: "Lead form submitted successfully!" });
  } catch (error) {
    console.error("[LEAD-FORM] Error:", error?.message || error);
    res
      .status(500)
      .json({ error: "Error processing lead form. Try again later." });
  }
});

/* -------------------------------------------------------------------------- */
/*                          TAX STEWART ROUTES                                */
/* -------------------------------------------------------------------------- */

app.post("/api/send-question", async (req, res) => {
  try {
    const { name, email, phone, message, utm } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required." });
    }

    let msgObj = {};
    if (typeof message === "string") {
      try {
        msgObj = JSON.parse(message);
      } catch {
        msgObj = { transcript: message };
      }
    } else if (typeof message === "object" && message !== null) {
      msgObj = message;
    }

    const nextQuestion =
      typeof msgObj.nextQuestion === "string" && msgObj.nextQuestion.trim()
        ? msgObj.nextQuestion.trim()
        : "No next question provided.";

    let transcript =
      typeof msgObj.transcript === "string"
        ? msgObj.transcript
        : JSON.stringify(msgObj.transcript ?? {}, null, 2);

    transcript = safeText(transcript, 8000);
    const nextQuestionText = safeText(nextQuestion, 2000);

    const resolvedUtm = resolveUtm(utm, req);

    // POST to webhook for CRM
    const webhookResult = await postToWebhook(
      { name, email, phone, city: "", state: "", message: nextQuestionText },
      "tax-stewart",
    );

    const mailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      replyTo: email,
      to: "inquiry@taxadvocategroup.com",
      subject: `New Tax Stewart Submission — ${email}${webhookResult.caseId ? ` [Case #${webhookResult.caseId}]` : ""}`,
      text: `
NEW TAX STEWART SUBMISSION
${"─".repeat(50)}

Name:   ${name || "Not provided"}
Email:  ${email}
Phone:  ${phone || "Not provided"}

${"─".repeat(50)}
User's Question:
${nextQuestionText}

${"─".repeat(50)}
Full Conversation & Details:
${transcript}

${"─".repeat(50)}
UTM Source:  ${resolvedUtm.utmSource || "Direct/Organic"}
Campaign:    ${resolvedUtm.utmCampaign || "N/A"}

Webhook:     ${webhookResult.ok ? "✓ Success" : `✗ ${webhookResult.error}`}
Logics Case: ${webhookResult.caseId || "N/A"}
      `.trim(),
      headers: { "X-App-Route": "send-question" },
    };

    await transporter.sendMail(mailOptions);
    console.log("[/send-question] ✓ Sent");

    return res.status(200).json({ success: "Question sent successfully!" });
  } catch (error) {
    console.error("[/send-question] error:", error?.stack || error);
    return res
      .status(500)
      .json({ error: "Error sending question. Please try again later." });
  }
});

app.post("/api/answer", questionCounter, async (req, res) => {
  try {
    const raw = req.body?.question;
    const question = (raw ?? "").toString().trim();

    if (!question) {
      return sendWithStamp(
        res,
        {
          ok: true,
          blocked: false,
          remaining: req.taxStewart.remaining,
          resetAt: req.taxStewart.resetAt,
          answer: NON_TAX_REFUSAL,
        },
        "early-empty",
      );
    }

    const history = readHistory(req);
    const prior = history.slice(-2).flatMap(({ q, a }) => [
      { role: "user", content: q },
      { role: "assistant", content: a },
    ]);

    const related = isTaxRelated(question);

    if (!related) {
      return sendWithStamp(
        res,
        {
          ok: true,
          blocked: false,
          remaining: req.taxStewart.remaining,
          resetAt: req.taxStewart.resetAt,
          answer: NON_TAX_REFUSAL,
        },
        "early-non-tax",
      );
    }

    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: TAX_SYSTEM_PROMPT,
      max_output_tokens: 600,
      input: [...prior, { role: "user", content: question }],
    });

    const answer = resp?.output_text ?? "";
    console.log("[/answer] model output (first 200):", answer.slice(0, 200));

    const newCount = (req.taxStewart.count ?? 0) + 1;
    await req.saveTaxStewart(newCount);
    writeHistory(res, [...history, { q: question, a: answer }]);

    return sendWithStamp(
      res,
      {
        ok: true,
        blocked: false,
        remaining: Math.max(0, req.taxStewart.max - newCount),
        resetAt: req.taxStewart.resetAt,
        answer,
      },
      "ok-openai",
    );
  } catch (err) {
    console.error("[/answer] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "OpenAI request failed", _trace: "catch" });
  }
});

app.get("/api/ts-status", questionCounter, (req, res) => {
  res.json({
    ok: true,
    count: req.taxStewart.count,
    remaining: req.taxStewart.remaining,
    resetAt: req.taxStewart.resetAt,
  });
});

/* -------------------------------------------------------------------------- */
/*                        VERIFICATION ROUTES (TAX STEWART)                   */
/* -------------------------------------------------------------------------- */

const resendLimiter = new Map();

function checkResendLimit(identifier) {
  const now = Date.now();
  const key = identifier.toLowerCase();

  if (!resendLimiter.has(key)) {
    resendLimiter.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 2, resetAt: now + 15 * 60 * 1000 };
  }

  const data = resendLimiter.get(key);

  if (now > data.resetAt) {
    resendLimiter.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 2, resetAt: now + 15 * 60 * 1000 };
  }

  if (data.count >= 3) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: data.resetAt,
      waitMinutes: Math.ceil((data.resetAt - now) / 60000),
    };
  }

  data.count++;
  resendLimiter.set(key, data);
  return { allowed: true, remaining: 3 - data.count, resetAt: data.resetAt };
}

setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of resendLimiter.entries()) {
      if (now > data.resetAt) resendLimiter.delete(key);
    }
  },
  30 * 60 * 1000,
);

app.post("/api/resend-verification-code", async (req, res) => {
  try {
    const { email, phone, contactPref, name, type } = req.body;

    const targetEmail = type === "email" || !type ? email : null;
    const targetPhone = type === "phone" || !type ? phone : null;

    if (!targetEmail && !targetPhone) {
      return res
        .status(400)
        .json({ ok: false, error: "Email or phone required" });
    }

    const results = { email: { sent: false }, phone: { sent: false } };

    if (targetEmail && (contactPref === "email" || contactPref === "both")) {
      const limit = checkResendLimit(targetEmail);
      if (!limit.allowed) {
        return res.json({
          ok: false,
          error: `Too many requests. Wait ${limit.waitMinutes} minutes.`,
          rateLimited: true,
          resetAt: limit.resetAt,
        });
      }

      const emailCode = generateCode();
      storeVerificationCode(targetEmail, emailCode, "email");

      const emailHtml = verificationTemplate({
        name: name || "there",
        verificationCode: emailCode,
        logoUrl: process.env.LOGO_URL || "",
        calendlyLink:
          process.env.CALENDLY_LINK || "https://calendly.com/wynntax",
        year: new Date().getFullYear(),
      });

      await transporter.sendMail({
        from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
        to: targetEmail,
        subject: "Your New Verification Code - Wynn Tax Solutions",
        html: emailHtml,
      });

      results.email = {
        sent: true,
        remaining: limit.remaining,
        resetAt: limit.resetAt,
      };
      console.log("[RESEND] Email code sent to:", targetEmail);
    }

    if (targetPhone && (contactPref === "phone" || contactPref === "both")) {
      const limit = checkResendLimit(targetPhone);
      if (!limit.allowed) {
        return res.json({
          ok: false,
          error: `Too many requests. Wait ${limit.waitMinutes} minutes.`,
          rateLimited: true,
          resetAt: limit.resetAt,
        });
      }

      const phoneCode = generateCode();
      storeVerificationCode(targetPhone, phoneCode, "phone");
      const phoneNumber = String(targetPhone).replace(/[()\-\s]/g, "");

      await sendTextMessageAPI({
        phoneNumber,
        content: `Your NEW Wynn Tax verification code is: ${phoneCode}. Valid for 10 minutes.`,
      });

      results.phone = {
        sent: true,
        remaining: limit.remaining,
        resetAt: limit.resetAt,
      };
      console.log("[RESEND] Phone code sent to:", phoneNumber);
    }

    return res.json({
      ok: true,
      codesSent: results,
      message: "New verification code sent",
    });
  } catch (error) {
    console.error("[/resend-verification-code] error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to resend verification code" });
  }
});

app.post("/api/send-verification-codes", async (req, res) => {
  try {
    const { email, phone, contactPref, name } = req.body;

    if (!email && !phone) {
      return res
        .status(400)
        .json({ ok: false, error: "Email or phone required" });
    }

    const codes = {};

    if (email && (contactPref === "email" || contactPref === "both")) {
      const emailCode = generateCode();
      storeVerificationCode(email, emailCode, "email");

      const emailHtml = verificationTemplate({
        name: name || "there",
        verificationCode: emailCode,
        logoUrl: process.env.LOGO_URL || "",
        calendlyLink:
          process.env.CALENDLY_LINK || "https://calendly.com/wynntax",
        year: new Date().getFullYear(),
      });

      await transporter.sendMail({
        from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
        to: email,
        subject: "Verify Your Email - Wynn Tax Solutions",
        html: emailHtml,
      });
      codes.email = "sent";
    }

    if (phone && (contactPref === "phone" || contactPref === "both")) {
      const phoneCode = generateCode();
      storeVerificationCode(phone, phoneCode, "phone");
      const phoneNumber = String(phone).replace(/[()\-\s]/g, "");

      await sendTextMessageAPI({
        phoneNumber,
        content: `Your Wynn Tax Solutions verification code is: ${phoneCode}. Valid for 10 minutes.`,
      });
      codes.phone = "sent";
      console.log("[VERIFY] SMS sent to:", phoneNumber);
    }

    return res.json({ ok: true, codesSent: codes });
  } catch (error) {
    console.error("[/send-verification-codes] error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send verification codes" });
  }
});

app.post("/api/verify-codes", async (req, res) => {
  try {
    const { email, phone, emailCode, phoneCode, contactPref } = req.body;

    const results = { emailVerified: false, phoneVerified: false };

    if (
      email &&
      emailCode &&
      (contactPref === "email" || contactPref === "both")
    ) {
      const emailResult = verifyCode(email, emailCode);
      if (!emailResult.ok) {
        return res.json({
          ok: false,
          error:
            emailResult.reason === "expired"
              ? "Email code expired."
              : "Invalid email code.",
          field: "email",
        });
      }
      results.emailVerified = true;
    }

    if (
      phone &&
      phoneCode &&
      (contactPref === "phone" || contactPref === "both")
    ) {
      const phoneResult = verifyCode(phone, phoneCode);
      if (!phoneResult.ok) {
        return res.json({
          ok: false,
          error:
            phoneResult.reason === "expired"
              ? "Phone code expired."
              : "Invalid phone code.",
          field: "phone",
        });
      }
      results.phoneVerified = true;
    }

    return res.json({ ok: true, ...results });
  } catch (error) {
    console.error("[/verify-codes] error:", error);
    return res.status(500).json({ ok: false, error: "Verification failed" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        FINALIZE SUBMISSION (TAX STEWART)                   */
/* -------------------------------------------------------------------------- */

app.post("/api/finalize-submission", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      contactPref,
      question,
      answer,
      issues,
      balanceBand,
      noticeType,
      taxScope,
      state,
      filerType,
      intakeSummary,
      utm,
    } = req.body;

    if (email && !isVerified(email)) {
      return res.status(400).json({ ok: false, error: "Email not verified" });
    }
    if (phone && !isVerified(phone)) {
      return res.status(400).json({ ok: false, error: "Phone not verified" });
    }

    const conversationHistory = readHistory(req);
    const questionCounterData = req.signedCookies?.ts_qc
      ? JSON.parse(req.signedCookies.ts_qc)
      : { count: 0 };
    const ipAddress =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const userData = {
      name,
      email,
      phone,
      issues,
      balanceBand,
      noticeType,
      taxScope,
      state,
      filerType,
    };
    const aiSummary = await generateAISummary(openai, userData);

    const TaxStewartSubmission = require("./models/TaxStewartSubmission");
    const submission = new TaxStewartSubmission({
      name,
      email,
      phone,
      contactPref,
      emailVerified: !!email,
      phoneVerified: !!phone,
      issues,
      balanceBand,
      noticeType,
      taxScope,
      state,
      filerType,
      intakeSummary,
      question,
      answer,
      conversationHistory: conversationHistory.map((item, idx) => ({
        q: item.q,
        a: item.a,
        timestamp: new Date(
          Date.now() - (conversationHistory.length - idx) * 60000,
        ),
      })),
      aiSummary,
      ipAddress,
      userAgent,
      questionsAsked: questionCounterData.count || 0,
    });

    await submission.save();
    console.log("[/finalize-submission] Saved to MongoDB:", submission._id);

    const resolvedUtm = resolveUtm(utm, req);

    // POST to webhook for CRM + outreach + dialing
    const webhookResult = await postToWebhook(
      { name, email, phone, city: "", state: state || "", message: aiSummary },
      "tax-stewart-verified",
    );

    if (webhookResult.caseId) {
      await TaxStewartSubmission.updateOne(
        { _id: submission._id },
        {
          $set: {
            logicsCaseId: String(webhookResult.caseId),
            leadSource: "VF Digital",
          },
        },
      ).catch((e) =>
        console.error("[FINALIZE] Logics ID save failed:", e.message),
      );
    }

    // Send welcome email with PDF
    const pdfPath = path.join(__dirname, "library", "wynn-tax-guide.pdf");
    if (
      email &&
      (contactPref === "email" || contactPref === "both") &&
      fs.existsSync(pdfPath)
    ) {
      const emailHtml = welcomeTemplate({
        name,
        aiSummary,
        logoUrl: process.env.LOGO_URL || "",
        calendlyLink:
          process.env.CALENDLY_LINK || "https://calendly.com/wynntax",
        year: new Date().getFullYear(),
      });

      await transporter.sendMail({
        from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
        to: email,
        subject: `Welcome to Wynn Tax Solutions, ${name}`,
        html: emailHtml,
        attachments: [
          { filename: "Wynn_Tax_Solutions_Guide.pdf", path: pdfPath },
        ],
      });
      console.log("[/finalize-submission] Welcome email sent to:", email);
    }

    // Send SMS with scheduling link
    if (phone && (contactPref === "phone" || contactPref === "both")) {
      const phoneNumber = String(phone).replace(/[()\-\s]/g, "");
      const calendlyLink =
        process.env.CALENDLY_LINK || "https://calendly.com/wynntax";

      await sendTextMessageAPI({
        phoneNumber,
        trackingNumber: process.env.CALL_RAIL_TRACKING_NUMBER,
        content: `Hi ${name}! Thanks for reaching out to Wynn Tax Solutions. ${email ? "We've sent your guide via email. " : ""}Ready to schedule? ${calendlyLink}`,
      });
      console.log("[/finalize-submission] SMS sent to:", phoneNumber);
    }

    // Internal notification
    const formattedHistory = conversationHistory
      .map((item, idx) => `Q${idx + 1}: ${item.q}\nA${idx + 1}: ${item.a}`)
      .join("\n\n");
    const intakeDetails = [
      issues?.length ? `Issues: ${issues.join(", ")}` : "",
      balanceBand ? `Amount Owed: ${balanceBand}` : "",
      noticeType ? `Notice Type: ${noticeType}` : "",
      taxScope ? `Tax Scope: ${taxScope}` : "",
      state ? `State: ${state}` : "",
      filerType ? `Filer Type: ${filerType}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      replyTo: email,
      to: "inquiry@taxadvocategroup.com",
      subject: `🎯 Verified Tax Stewart Lead - ${name} [${submission._id}]${webhookResult.caseId ? ` [Case #${webhookResult.caseId}]` : ""}`,
      text: `
VERIFIED TAX STEWART SUBMISSION
${"═".repeat(50)}

Name:    ${name}
Email:   ${email} ✓ VERIFIED
Phone:   ${phone || "N/A"}${phone ? " ✓ VERIFIED" : ""}
Pref:    ${contactPref}

${"─".repeat(50)}
INTAKE: ${intakeSummary || "N/A"}
${intakeDetails}

${"─".repeat(50)}
QUESTION: ${question || "N/A"}
ANSWER: ${answer || "N/A"}

${"─".repeat(50)}
HISTORY (${conversationHistory.length}):
${formattedHistory || "None"}

${"─".repeat(50)}
AI SUMMARY: ${aiSummary}

${"─".repeat(50)}
Webhook:     ${webhookResult.ok ? "✓ Success" : `✗ ${webhookResult.error}`}
Logics Case: ${webhookResult.caseId || "N/A"}
DB ID:       ${submission._id}
      `.trim(),
    });

    res.clearCookie("ts_qc", { path: "/" });
    res.clearCookie(TS_HISTORY_COOKIE, { path: "/" });

    return res.json({
      ok: true,
      message: "Submission finalized",
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("[/finalize-submission] error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to finalize submission" });
  }
});

/* -------------------------------------------------------------------------- */
/*                        PROGRESS & ABANDONMENT                              */
/* -------------------------------------------------------------------------- */

app.post("/api/save-progress", (req, res) => {
  try {
    const { savePartialProgress } = require("./utils/partialSubmissions");
    const formData = req.body;
    if (!formData || typeof formData !== "object") {
      return res.status(400).json({ ok: false, error: "Invalid form data" });
    }
    savePartialProgress(res, formData);
    return res.json({ ok: true, message: "Progress saved" });
  } catch (error) {
    console.error("[/save-progress] error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to save progress" });
  }
});

app.get("/api/restore-progress", (req, res) => {
  try {
    const { readPartialProgress } = require("./utils/partialSubmissions");
    const partial = readPartialProgress(req);
    return res.json({
      ok: true,
      hasProgress: !!partial,
      data: partial || null,
    });
  } catch (error) {
    console.error("[/restore-progress] error:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to restore progress" });
  }
});

const {
  sendAbandonedSessionsDigest,
  sendHighPriorityAbandonAlert,
} = require("./utils/abandonedSessionEmail");
const { saveAbandonedSession } = require("./utils/abandonedSessionCleanup");

app.get("/api/abandoned-digest", async (req, res) => {
  try {
    const result = await sendAbandonedSessionsDigest(transporter);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error("[/abandoned-digest] error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/track-abandon", async (req, res) => {
  try {
    const abandoned = await saveAbandonedSession(req);
    if (!abandoned) {
      return res.json({ ok: true, saved: false, message: "No data to save" });
    }
    if (
      abandoned.lastPhase === "verification" &&
      (abandoned.email || abandoned.phone)
    ) {
      await sendHighPriorityAbandonAlert(transporter, abandoned);
      console.log("[TRACK-ABANDON] High priority alert sent");
    }
    return res.json({
      ok: true,
      saved: true,
      id: abandoned._id,
      highPriority: abandoned.lastPhase === "verification",
    });
  } catch (error) {
    console.error("[/track-abandon] error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                            CRON JOBS                                       */
/* -------------------------------------------------------------------------- */

const cron = require("node-cron");

cron.schedule("0 9 * * *", async () => {
  console.log("[CRON] Running daily abandoned sessions digest...");
  try {
    await sendAbandonedSessionsDigest(transporter);
    console.log("[CRON] Digest sent successfully");
  } catch (error) {
    console.error("[CRON] Error sending digest:", error);
  }
});

console.log("[CRON] Daily abandoned sessions digest scheduled for 9:00 AM");

/* -------------------------------------------------------------------------- */
/*                                SITEMAP                                     */
/* -------------------------------------------------------------------------- */

app.get("/api/sitemap.xml", async (req, res) => {
  const links = [
    { url: "/", changefreq: "daily", priority: 1.0 },
    { url: "/about-us", changefreq: "monthly", priority: 0.7 },
    { url: "/our-tax-services", changefreq: "monthly", priority: 0.7 },
    { url: "/contact-us", changefreq: "yearly", priority: 0.5 },
    { url: "/tax-news", changefreq: "weekly", priority: 0.6 },
  ];

  const blogRoutes = ["understanding-tax-relief", "irs-negotiation-tips"];
  blogRoutes.forEach((slug) => {
    links.push({
      url: `/tax-news/${slug}`,
      changefreq: "monthly",
      priority: 0.6,
    });
  });

  const stream = new SitemapStream({
    hostname: "https://www.WynnTaxSolutions.com",
  });
  const xml = await streamToPromise(Readable.from(links)).then((data) => {
    links.forEach((link) => stream.write(link));
    stream.end();
    return data;
  });

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

/* -------------------------------------------------------------------------- */
/*                            HELPER FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

function safeText(s, max = 10000) {
  if (!s) return "(empty)";
  const cleaned = String(s)
    .replace(/\r/g, "")
    .replace(/\u0000/g, "");
  return cleaned.length > max
    ? cleaned.slice(0, max) + "\n\n[truncated]"
    : cleaned;
}

function sendWithStamp(res, payload, stamp) {
  const body = { ...payload, _trace: stamp };
  console.log("[/answer] RESP:", stamp, JSON.stringify(body).slice(0, 200));
  return res.json(body);
}

/* -------------------------------------------------------------------------- */
/*                              START SERVER                                  */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
