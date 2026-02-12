require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
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
const {
  resolveUtm,
  buildCasePayload,
  createLogicsCase,
  SOURCE_NAMES,
} = require("./utils/irsLogicsService");

/* -------------------------------------------------------------------------- */
/*                           HANDLEBARS TEMPLATES                             */
/* -------------------------------------------------------------------------- */

// Load and compile templates
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
  windowMs: 60 * 10000, // 15 minutes
  max: 1, // allow up to 1 submission in 15 minutes
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
const TS_HISTORY_MAX_FIELD = 1200; // cap each q/a to keep cookie < 4KB

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
    // Ensure shape and clamp fields defensively
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
    secure: isProd, // true in production (HTTPS)
    signed: true,
    maxAge: 7 * 24 * 3600 * 1000, // 7 days
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
    // General tax language
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

    // IRS and government references
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
    "tax commissioner",

    // Forms and documents
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
    "schedule se",
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
    "form 2210",
    "form 1040-es",
    "form 941x",
    "form w9",
    "form w-9",
    "ein",
    "itin",
    "ssn",
    "tax id",
    "employer id number",

    // Filings and compliance
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
    "correspondence audit",
    "field audit",
    "office audit",
    "amended return",
    "substitute for return",
    "sfr",

    // Income, deductions, and credits
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
    "education credit",
    "american opportunity",
    "lifetime learning credit",
    "dependency",
    "dependent",
    "exemption",
    "write off",
    "write-off",
    "business expense",
    "home office deduction",
    "charitable contribution",
    "medical deduction",
    "mortgage interest",
    "student loan interest",
    "capital gain",
    "capital gains",
    "loss carryforward",
    "loss carryover",
    "basis",
    "depreciation",
    "amortization",

    // Payroll, withholding, and employment taxes
    "withholding",
    "fica",
    "social security tax",
    "medicare tax",
    "payroll tax",
    "employment tax",
    "941 tax",
    "940 tax",
    "self employment tax",
    "estimated tax",
    "quarterly payment",
    "quarterly taxes",
    "1099 contractor",
    "gig worker",
    "freelancer",
    "independent contractor",

    // Collections and enforcement
    "levy",
    "lien",
    "garnishment",
    "garnish wages",
    "bank levy",
    "seizure",
    "offset",
    "passport revocation",
    "notice of federal tax lien",
    "final notice",
    "collection notice",
    "enforcement",
    "revenue officer",
    "revenue agent",
    "tax court",
    "collections",
    "enforcement action",

    // Payment and relief programs
    "payment plan",
    "installment agreement",
    "partial pay",
    "currently not collectible",
    "cnc",
    "offer in compromise",
    "oic",
    "fresh start",
    "settlement",
    "tax forgiveness",
    "penalty abatement",
    "first time abatement",
    "interest abatement",
    "hardship",
    "appeal",
    "cdp hearing",
    "collection due process",
    "cdp",
    "equivalency hearing",
    "reconsideration",
    "innocent spouse",
    "injured spouse",
    "spouse relief",

    // Business and entity topics
    "llc",
    "s corp",
    "s-corp",
    "c corp",
    "c-corp",
    "partnership",
    "sole proprietor",
    "self employed",
    "business taxes",
    "franchise tax",
    "sales tax",
    "excise tax",
    "use tax",
    "property tax",
    "payroll filings",
    "941 filing",
    "940 filing",
    "deposit schedule",
    "tax deposits",
    "federal tax deposit",

    // States and local
    "california tax",
    "new york state tax",
    "florida tax",
    "texas comptroller",
    "georgia department of revenue",
    "state return",
    "state refund",
    "state filing",
    "state notice",

    // Penalties and interest
    "penalty",
    "interest",
    "failure to file",
    "failure to pay",
    "late payment",
    "late filing",
    "underpayment",
    "accuracy penalty",
    "substantial understatement",
    "frivolous return",

    // Tax strategy and planning
    "tax planning",
    "tax strategy",
    "tax year",
    "year end tax",
    "quarterly estimates",
    "extension",
    "form 4868",
    "deadline",
    "october 15",
    "april 15",
    "due date",
    "file an extension",

    // Identification / compliance
    "verify identity",
    "id verify",
    "tax identity theft",
    "pin",
    "identity protection pin",
    "ippin",

    // Special tax situations
    "student loans",
    "education credit",
    "retirement account",
    "ira",
    "roth ira",
    "401k",
    "withdrawal penalty",
    "hsa",
    "health savings account",
    "1098t",
    "1098e",
    "mortgage interest statement",
    "capital loss",
    "rmd",
    "required minimum distribution",
    "inheritance tax",
    "estate tax",
    "gift tax",

    // Professional / communication
    "tax consultant",
    "tax preparer",
    "tax attorney",
    "accountant",
    "tax professional",
    "irs agent",
    "tax advocate",
    "taxpayer advocate",

    // Client phrases
    "i owe",
    "owe the irs",
    "owe money to the irs",
    "owe taxes",
    "owe federal",
    "owe state",
    "back owed",
    "unpaid balance",
    "received a letter",
    "got a letter",
    "received notice",
    "irs sent me",
    "tax bill",
    "balance due",
    "collection letter",
  ];

  return keywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(s));
}

/* -------------------------------------------------------------------------- */
/*                               OPENAI & EMAIL SETUP                         */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 5000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SENDGRID_GATEWAY,
  port: process.env.SENDGRID_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_API_KEY,
  },
});

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
/*                            EXISTING FORM ROUTES                            */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/track-form-input
 * Track form inputs from any form (ContactUs, LandingPopup, etc.)
 * Saves to cookie AND MongoDB for abandonment tracking
 */
app.post("/api/track-form-input", async (req, res) => {
  try {
    const { formType, formData, abandoned, timestamp } = req.body;

    if (!formType || !formData) {
      return res.status(400).json({
        ok: false,
        error: "formType and formData required",
      });
    }

    // Save to cookie
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      signed: true,
      path: "/",
    });

    // If abandoned flag is set, save to MongoDB
    if (abandoned) {
      const FormSubmission = require("./models/FormSubmission");

      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];

      // Check if we already have this submission (by email)
      let existing = null;
      if (formData.email) {
        existing = await FormSubmission.findOne({
          formType,
          "formData.email": formData.email,
          status: "abandoned",
        }).sort({ createdAt: -1 });
      }

      if (existing) {
        // Update existing
        existing.formData = formData;
        existing.timestamp = new Date(timestamp || Date.now());
        existing.ipAddress = ipAddress;
        existing.userAgent = userAgent;
        await existing.save();

        console.log(
          `[TRACK-FORM] ${formType} - Updated abandoned submission:`,
          existing._id,
        );
      } else {
        // Create new
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
          `[TRACK-FORM] ${formType} - Saved abandoned submission:`,
          submission._id,
        );
      }
    } else {
      console.log(`[TRACK-FORM] ${formType} - Data saved to cookie`);
    }

    return res.json({
      ok: true,
      message: "Form data tracked",
    });
  } catch (error) {
    console.error("[/track-form-input] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to track form data",
    });
  }
});

/**
 * Clear form tracking cookie when form is successfully submitted
 */
function clearFormTrackingCookie(res, formType) {
  const cookieName = `form_${formType}`;
  res.clearCookie(cookieName, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });
  console.log(`[TRACK-FORM] Cleared ${formType} tracking cookie`);
}

// Contact Form
app.post("/api/contact-form", formLimiter, async (req, res) => {
  const { name, email, phone, message, utm } = req.body;

  console.log("Contact Form Submission:", req.body);

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required!" });
  }

  try {
    const resolvedUtm = resolveUtm(utm, req);

    const casePayload = buildCasePayload(
      { name, email, phone, message },
      resolvedUtm,
    );

    const logicsResult = await createLogicsCase(casePayload);
    const caseId = logicsResult.caseId;

    const sourceName = SOURCE_NAMES[casePayload.StatusID] || "VF Digital";

    const mailOptions = {
      from: "inquiry@WynnTaxSolutions.com",
      to: "inquiry@taxadvocategroup.com",
      subject: `New Contact Form — ${name}${caseId ? ` [Case #${caseId}]` : ""}`,
      text: `
NEW CONTACT FORM SUBMISSION
${"─".repeat(50)}

Name:       ${name}
Email:      ${email}
Phone:      ${phone || "Not provided"}
Message:    ${message}

${"─".repeat(50)}
Lead Source: ${sourceName}
UTM Source:  ${resolvedUtm.utmSource || "Direct/Organic"}
UTM Medium:  ${resolvedUtm.utmMedium || "N/A"}
Campaign:    ${resolvedUtm.utmCampaign || "N/A"}

Logics CaseID: ${caseId || "Failed to create"}
${!logicsResult.ok ? `Logics Error: ${logicsResult.error}` : ""}
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

    res.status(200).json({ success: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Error sending email. Try again later." });
  }
});

// Lead Form
app.post("/api/lead-form", async (req, res) => {
  const { debtAmount, filedAllTaxes, name, phone, email, bestTime, utm } =
    req.body;

  console.log("[LEAD-FORM] Incoming submission:", {
    name,
    email,
    phone,
    debtAmount,
    filedAllTaxes,
  });
  console.log("[LEAD-FORM] Raw UTM from client:", utm);

  if (!debtAmount || !filedAllTaxes || !name || !phone || !email) {
    console.log("[LEAD-FORM] Validation failed — missing fields");
    return res
      .status(400)
      .json({ error: "All required fields must be provided!" });
  }

  try {
    const resolvedUtm = resolveUtm(utm, req);
    console.log("[LEAD-FORM] Resolved UTM:", resolvedUtm);

    const casePayload = buildCasePayload(
      {
        name,
        email,
        phone,
        balanceBand: debtAmount,
        message: `Debt: ${debtAmount} | Filed All: ${filedAllTaxes}${bestTime ? ` | Best Time: ${bestTime}` : ""}`,
      },
      resolvedUtm,
    );
    console.log(
      "[LEAD-FORM] Logics payload:",
      JSON.stringify(casePayload, null, 2),
    );

    console.log("[LEAD-FORM] Calling createLogicsCase...");
    const logicsResult = await createLogicsCase(casePayload);
    const caseId = logicsResult.caseId;
    console.log("[LEAD-FORM] Logics response:", {
      ok: logicsResult.ok,
      caseId,
      error: logicsResult.error || null,
    });

    const sourceName = SOURCE_NAMES[casePayload.StatusID] || "VF Digital";

    const mailOptions = {
      from: "inquiry@WynnTaxSolutions.com",
      to: "mgray@taxadvocategroup.com",
      subject: `New Lead Form — ${name}${caseId ? ` [Case #${caseId}]` : ""}`,
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
Lead Source: ${sourceName}
UTM Source:  ${resolvedUtm.utmSource || "Direct/Organic"}
Campaign:    ${resolvedUtm.utmCampaign || "N/A"}

Logics CaseID: ${caseId || "Failed to create"}
${!logicsResult.ok ? `Logics Error: ${logicsResult.error}` : ""}
      `.trim(),
    };

    console.log("[LEAD-FORM] Sending email...");
    await transporter.sendMail(mailOptions);
    console.log("[LEAD-FORM] Email sent successfully");

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

    console.log("[LEAD-FORM] ✓ Complete — CaseID:", caseId);
    res.status(200).json({ success: "Lead form email sent successfully!" });
  } catch (error) {
    console.error("[LEAD-FORM] ✗ Error:", error?.message || error);
    console.error("[LEAD-FORM] Stack:", error?.stack);
    res
      .status(500)
      .json({ error: "Error sending lead form email. Try again later." });
  }
});
/* -------------------------------------------------------------------------- */
/*                          TAX STEWART ROUTES                                */
/* -------------------------------------------------------------------------- */

// Tax Stewart Question Submission (with full form data)
app.post("/api/send-question", async (req, res) => {
  try {
    const { name, email, phone, message, utm } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required." });
    }

    // Accept message as object or string
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

    // Sanitize + cap size
    transcript = safeText(transcript, 8000);
    const nextQuestionText = safeText(nextQuestion, 2000);

    const resolvedUtm = resolveUtm(utm, req);

    const casePayload = buildCasePayload(
      { name, email, phone, message: nextQuestionText },
      resolvedUtm,
    );

    const logicsResult = await createLogicsCase(casePayload);
    const caseId = logicsResult.caseId;

    const sourceName = SOURCE_NAMES[casePayload.StatusID] || "VF Digital";

    const mailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      replyTo: email,
      to: "mgray@taxadvocategroup.com",
      subject: `New Tax Stewart Submission — ${email}${caseId ? ` [Case #${caseId}]` : ""}`,
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
Lead Source: ${sourceName}
UTM Source:  ${resolvedUtm.utmSource || "Direct/Organic"}
Campaign:    ${resolvedUtm.utmCampaign || "N/A"}

Logics CaseID: ${caseId || "Failed to create"}
${!logicsResult.ok ? `Logics Error: ${logicsResult.error}` : ""}
      `.trim(),
      headers: { "X-App-Route": "send-question" },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[/send-question] sendMail result:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
    });

    return res.status(200).json({ success: "Question sent successfully!" });
  } catch (error) {
    console.error("[/send-question] error:", error?.stack || error);
    return res
      .status(500)
      .json({ error: "Error sending question. Please try again later." });
  }
});

// Tax Stewart AI Answer
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

    // Conversational memory
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

// Tax Stewart Status
app.get("/api/ts-status", questionCounter, (req, res) => {
  res.json({
    ok: true,
    count: req.taxStewart.count,
    remaining: req.taxStewart.remaining,
    resetAt: req.taxStewart.resetAt,
  });
});

/* -------------------------------------------------------------------------- */
/*                        VERIFICATION & PDF ROUTES                           */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                        RESEND VERIFICATION CODES                           */
/* -------------------------------------------------------------------------- */

// Rate limiter for resend requests (max 3 per 15 minutes per contact)
const resendLimiter = new Map();

function checkResendLimit(identifier) {
  const now = Date.now();
  const key = identifier.toLowerCase();

  if (!resendLimiter.has(key)) {
    resendLimiter.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 2, resetAt: now + 15 * 60 * 1000 };
  }

  const data = resendLimiter.get(key);

  // Reset if time window passed
  if (now > data.resetAt) {
    resendLimiter.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 2, resetAt: now + 15 * 60 * 1000 };
  }

  // Check if limit exceeded
  if (data.count >= 3) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: data.resetAt,
      waitMinutes: Math.ceil((data.resetAt - now) / 60000),
    };
  }

  // Increment count
  data.count++;
  resendLimiter.set(key, data);

  return {
    allowed: true,
    remaining: 3 - data.count,
    resetAt: data.resetAt,
  };
}

// Cleanup old entries every 30 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of resendLimiter.entries()) {
      if (now > data.resetAt) {
        resendLimiter.delete(key);
      }
    }
  },
  30 * 60 * 1000,
);

/**
 * POST /api/resend-verification-code
 * Resend verification code to email or phone
 */
app.post("/api/resend-verification-code", async (req, res) => {
  try {
    const { email, phone, contactPref, name, type } = req.body;

    // Determine which contact to resend to
    const targetEmail = type === "email" || !type ? email : null;
    const targetPhone = type === "phone" || !type ? phone : null;

    if (!targetEmail && !targetPhone) {
      return res.status(400).json({
        ok: false,
        error: "Email or phone required",
      });
    }

    const results = {
      email: { sent: false },
      phone: { sent: false },
    };

    // Resend to email
    if (targetEmail && (contactPref === "email" || contactPref === "both")) {
      // Check rate limit
      const limit = checkResendLimit(targetEmail);

      if (!limit.allowed) {
        return res.json({
          ok: false,
          error: `Too many requests. Please wait ${limit.waitMinutes} minutes before requesting another code.`,
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

      const mailOptions = {
        from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
        to: targetEmail,
        subject: "Your New Verification Code - Wynn Tax Solutions",
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);

      results.email = {
        sent: true,
        remaining: limit.remaining,
        resetAt: limit.resetAt,
      };

      console.log(
        "[RESEND] Email code sent to:",
        targetEmail,
        "Remaining:",
        limit.remaining,
      );
    }

    // Resend to phone
    if (targetPhone && (contactPref === "phone" || contactPref === "both")) {
      // Check rate limit
      const limit = checkResendLimit(targetPhone);

      if (!limit.allowed) {
        return res.json({
          ok: false,
          error: `Too many requests. Please wait ${limit.waitMinutes} minutes before requesting another code.`,
          rateLimited: true,
          resetAt: limit.resetAt,
        });
      }

      const phoneCode = generateCode();
      storeVerificationCode(targetPhone, phoneCode, "phone");

      function stripCommonPhonePunctuation(str) {
        return String(str).replace(/[()\-\s]/g, "");
      }

      const phoneNumber = stripCommonPhonePunctuation(targetPhone);

      await sendTextMessageAPI({
        phoneNumber,
        content: `Your NEW Wynn Tax verification code is: ${phoneCode}. Valid for 10 minutes.`,
      });

      results.phone = {
        sent: true,
        remaining: limit.remaining,
        resetAt: limit.resetAt,
      };

      console.log(
        "[RESEND] Phone code sent to:",
        phoneNumber,
        "Remaining:",
        limit.remaining,
      );
    }

    return res.json({
      ok: true,
      codesSent: results,
      message: "New verification code sent",
    });
  } catch (error) {
    console.error("[/resend-verification-code] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to resend verification code",
    });
  }
});

app.post("/api/send-verification-codes", async (req, res) => {
  try {
    const { email, phone, contactPref, name } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        ok: false,
        error: "Email or phone required",
      });
    }

    const codes = {};

    // Send email verification
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

      const mailOptions = {
        from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
        to: email,
        subject: "Verify Your Email - Wynn Tax Solutions",
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);
      codes.email = "sent";
    }

    // Send phone verification
    if (phone && (contactPref === "phone" || contactPref === "both")) {
      console.log("[VERIFY] Sending phone code to:", phone);

      const phoneCode = generateCode();
      storeVerificationCode(phone, phoneCode, "phone");

      function stripCommonPhonePunctuation(str) {
        return String(str).replace(/[()\-\s]/g, "");
      }

      const phoneNumber = stripCommonPhonePunctuation(phone);
      console.log(
        "[VERIFY] Normalized phone:",
        phoneNumber,
        "code:",
        phoneCode,
      );

      await sendTextMessageAPI({
        phoneNumber,
        content: `Your Wynn Tax Solutions verification code is: ${phoneCode}. Valid for 10 minutes.`,
      });

      console.log("[VERIFY] SMS send requested successfully for:", phoneNumber);

      codes.phone = "sent";
    }

    return res.json({
      ok: true,
      codesSent: codes,
    });
  } catch (error) {
    console.error("[/send-verification-codes] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to send verification codes",
    });
  }
});

app.post("/api/verify-codes", async (req, res) => {
  try {
    const { email, phone, emailCode, phoneCode, contactPref } = req.body;

    const results = {
      emailVerified: false,
      phoneVerified: false,
    };

    // Verify email code
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
              ? "Email verification code expired. Please request a new one."
              : "Invalid email verification code.",
          field: "email",
        });
      }
      results.emailVerified = true;
    }

    // Verify phone code
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
              ? "Phone verification code expired. Please request a new one."
              : "Invalid phone verification code.",
          field: "phone",
        });
      }
      results.phoneVerified = true;
    }

    return res.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    console.error("[/verify-codes] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Verification failed",
    });
  }
});

/**
 * POST /api/finalize-submission
 */
app.post("/api/finalize-submission", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      contactPref,
      question,
      answer,
      // Intake data
      issues,
      balanceBand,
      noticeType,
      taxScope,
      state,
      filerType,
      intakeSummary,
      // UTM tracking
      utm,
    } = req.body;

    // Verify that email/phone were verified
    if (email && !isVerified(email)) {
      return res.status(400).json({
        ok: false,
        error: "Email not verified",
      });
    }

    if (phone && !isVerified(phone)) {
      return res.status(400).json({
        ok: false,
        error: "Phone not verified",
      });
    }

    // Read conversation history from cookie before we clear it
    const conversationHistory = readHistory(req);

    // Get question counter data
    const questionCounterData = req.signedCookies?.ts_qc
      ? JSON.parse(req.signedCookies.ts_qc)
      : { count: 0 };

    // Get session metadata
    const ipAddress =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Generate AI summary for email body
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

    // Save to MongoDB
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

    // ── IRS Logics: Create case from verified submission ─────
    const resolvedUtm = resolveUtm(utm, req);

    const casePayload = buildCasePayload(
      {
        name,
        email,
        phone,
        issues,
        balanceBand,
        noticeType,
        taxScope,
        state,
        filerType,
        intakeSummary,
        aiSummary,
        contactPref,
      },
      resolvedUtm,
    );

    const logicsResult = await createLogicsCase(casePayload);
    const caseId = logicsResult.caseId;

    if (caseId) {
      await TaxStewartSubmission.updateOne(
        { _id: submission._id },
        {
          $set: {
            logicsCaseId: String(caseId),
            leadSource: SOURCE_NAMES[casePayload.StatusID] || "VF Digital",
          },
        },
      ).catch((e) =>
        console.error("[FINALIZE] Logics ID save failed:", e.message),
      );
    }
    console.log(
      "[/finalize-submission] Logics result:",
      logicsResult.ok ? `CaseID ${caseId}` : logicsResult.error,
    );
    // ── End IRS Logics ───────────────────────────────────────

    // Path to the standard Wynn Tax guide PDF
    const pdfPath = path.join(__dirname, "library", "wynn-tax-guide.pdf");

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.error("[/finalize-submission] PDF not found at:", pdfPath);
      return res.status(500).json({
        ok: false,
        error: "Guide not available. Our team will contact you directly.",
      });
    }

    // Send email with PDF attachment using Handlebars template
    if (email && (contactPref === "email" || contactPref === "both")) {
      const emailHtml = welcomeTemplate({
        name: name,
        aiSummary: aiSummary,
        logoUrl: process.env.LOGO_URL || "",
        calendlyLink:
          process.env.CALENDLY_LINK || "https://calendly.com/wynntax",
        year: new Date().getFullYear(),
      });

      const mailOptions = {
        from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
        to: email,
        subject: `Welcome to Wynn Tax Solutions, ${name}`,
        html: emailHtml,
        attachments: [
          {
            filename: "Wynn_Tax_Solutions_Guide.pdf",
            path: pdfPath,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log("[/finalize-submission] Welcome email sent to:", email);
    }

    // Send text with scheduling link
    if (phone && (contactPref === "phone" || contactPref === "both")) {
      const trackingNumber = process.env.CALL_RAIL_TRACKING_NUMBER;
      const calendlyLink =
        process.env.CALENDLY_LINK || "https://calendly.com/wynntax";

      function stripCommonPhonePunctuation(str) {
        return String(str).replace(/[()\-\s]/g, "");
      }

      const phoneNumber = stripCommonPhonePunctuation(phone);

      await sendTextMessageAPI({
        phoneNumber,
        trackingNumber: trackingNumber,
        content: `Hi ${name}! Thanks for reaching out to Wynn Tax Solutions. ${
          email
            ? "We've sent your guide via email. "
            : `Please review the information about our client journey at https://www.wynntaxsolutions.com/services-brochure`
        } 
        
Ready to schedule your consultation? ${calendlyLink}`,
      });
      console.log("[/finalize-submission] SMS sent to:", phoneNumber);
    }

    // Format conversation history for internal email
    const formattedHistory = conversationHistory
      .map((item, idx) => {
        return `
┌─────────────────────────────────────────────────────────
│ Question ${idx + 1}:
└─────────────────────────────────────────────────────────
${item.q}

┌─────────────────────────────────────────────────────────
│ Answer ${idx + 1}:
└─────────────────────────────────────────────────────────
${item.a}
`;
      })
      .join("\n\n");

    // Send internal notification email with ALL data
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

    const sourceName = SOURCE_NAMES[casePayload.StatusID] || "VF Digital";

    const internalMailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      replyTo: email,
      to: "inquiry@taxadvocategroup.com",
      subject: `🎯 New Verified Tax Stewart Lead - ${name} [${submission._id}]${caseId ? ` [Case #${caseId}]` : ""}`,
      text: `
╔═════════════════════════════════════════════════════════════════╗
║                                                                 ║
║          VERIFIED TAX STEWART SUBMISSION                        ║
║          Database ID: ${submission._id}                         ║
║          Logics CaseID: ${caseId || "Failed to create"}                              ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:               ${name}
Email:              ${email} ✓ VERIFIED
Phone:              ${phone || "Not provided"}${phone ? " ✓ VERIFIED" : ""}
Contact Preference: ${contactPref}
Questions Asked:    ${questionCounterData.count || 0}

IP Address:         ${ipAddress}
User Agent:         ${userAgent}

Lead Source:        ${sourceName}
UTM Source:         ${resolvedUtm.utmSource || "Direct/Organic"}
UTM Medium:         ${resolvedUtm.utmMedium || "N/A"}
Campaign:           ${resolvedUtm.utmCampaign || "N/A"}
Logics CaseID:      ${caseId || "Failed to create"}
${!logicsResult.ok ? `Logics Error:       ${logicsResult.error}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TAX SITUATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${intakeSummary || "Not provided"}

📊 INTAKE DETAILS:
${intakeDetails || "Not provided"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 FINAL QUESTION & ANSWER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ USER'S QUESTION ─────────────────────────────────────────────┐
│ ${question || "No question provided"}
└───────────────────────────────────────────────────────────────┘

┌─ AI RESPONSE PROVIDED ────────────────────────────────────────┐
│ ${answer || "No response provided"}
└───────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 FULL CONVERSATION HISTORY (${conversationHistory.length} exchanges)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formattedHistory || "No previous conversation history"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI SUMMARY SENT TO CLIENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${aiSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ACTIONS TAKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${email ? "✓ Tax guide PDF sent to email" : ""}
${phone ? "✓ Scheduling link sent via text" : ""}
✓ Data saved to MongoDB (ID: ${submission._id})
${caseId ? `✓ IRS Logics case created (CaseID: ${caseId})` : "✗ IRS Logics case creation failed"}
✓ Session cookies cleared

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a VERIFIED lead ready for follow-up.

View in database:
Query: db.taxstewartsubmissions.findOne({_id: ObjectId("${submission._id}")})

Update status:
db.taxstewartsubmissions.updateOne(
  {_id: ObjectId("${submission._id}")},
  {$set: {status: "contacted", assignedTo: "YourName"}}
)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
    };

    await transporter.sendMail(internalMailOptions);
    console.log("[/finalize-submission] Internal notification sent");

    // Clear all session cookies
    res.clearCookie("ts_qc", { path: "/" });
    res.clearCookie(TS_HISTORY_COOKIE, { path: "/" });
    console.log("[/finalize-submission] Session cookies cleared");

    return res.json({
      ok: true,
      message: "Submission finalized successfully",
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("[/finalize-submission] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to finalize submission",
    });
  }
});

/**
 * POST /api/save-progress
 */
app.post("/api/save-progress", (req, res) => {
  try {
    const { savePartialProgress } = require("./utils/partialSubmissions");

    const formData = req.body;

    if (!formData || typeof formData !== "object") {
      return res.status(400).json({
        ok: false,
        error: "Invalid form data",
      });
    }

    savePartialProgress(res, formData);

    return res.json({
      ok: true,
      message: "Progress saved",
    });
  } catch (error) {
    console.error("[/save-progress] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to save progress",
    });
  }
});

/**
 * GET /api/restore-progress
 */
app.get("/api/restore-progress", (req, res) => {
  try {
    const { readPartialProgress } = require("./utils/partialSubmissions");

    const partial = readPartialProgress(req);

    if (!partial) {
      return res.json({
        ok: true,
        hasProgress: false,
        data: null,
      });
    }

    return res.json({
      ok: true,
      hasProgress: true,
      data: partial,
    });
  } catch (error) {
    console.error("[/restore-progress] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to restore progress",
    });
  }
});

const {
  sendAbandonedSessionsDigest,
  sendHighPriorityAbandonAlert,
} = require("./utils/abandonedSessionEmail");

const { saveAbandonedSession } = require("./utils/abandonedSessionCleanup");

/**
 * GET /api/abandoned-digest
 */
app.get("/api/abandoned-digest", async (req, res) => {
  try {
    const result = await sendAbandonedSessionsDigest(transporter);

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[/abandoned-digest] error:", error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/track-abandon
 */
app.post("/api/track-abandon", async (req, res) => {
  try {
    const abandoned = await saveAbandonedSession(req);

    if (!abandoned) {
      return res.json({
        ok: true,
        saved: false,
        message: "No data to save",
      });
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
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                            CRON JOB SETUP                                  */
/* -------------------------------------------------------------------------- */

const cron = require("node-cron");

// Run every day at 9:00 AM
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

  // Add dynamic blog posts
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
