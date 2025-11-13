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

/* -------------------------------------------------------------------------- */
/*                           HANDLEBARS TEMPLATES                             */
/* -------------------------------------------------------------------------- */

// Load and compile templates
const verificationTemplate = handlebars.compile(
  fs.readFileSync(
    path.join(__dirname, "library", "verification-email.hbs"),
    "utf8"
  )
);

const welcomeTemplate = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "library", "welcome-email.hbs"), "utf8")
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
  })
);

/* -------------------------------------------------------------------------- */
/*                            EXISTING FORM ROUTES                            */
/* -------------------------------------------------------------------------- */

// Contact Form (from original server)
app.post("/contact-form", formLimiter, async (req, res) => {
  const { name, email, phone, message } = req.body;

  console.log("Contact Form Submission:", req.body);

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required!" });
  }

  const mailOptions = {
    from: "inquiry@WynnTaxSolutions.com",
    to: "mgray@taxadvocategroup.com",
    subject: `New Contact Form Submission from ${name}`,
    text: `
      Name: ${name}
      Email: ${email}
      Phone: ${phone || "Not provided"}
      Message: ${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Error sending email. Try again later." });
  }
});

// Lead Form (from original server)
app.post("/lead-form", async (req, res) => {
  const { debtAmount, filedAllTaxes, name, phone, email, bestTime } = req.body;

  console.log("Lead Form Submission:", req.body);

  if (!debtAmount || !filedAllTaxes || !name || !phone || !email) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided!" });
  }

  const mailOptions = {
    from: "inquiry@WynnTaxSolutions.com",
    to: "mgray@taxadvocategroup.com",
    subject: `New Lead Form Submission from ${name}`,
    text: `
      Name: ${name}
      Phone: ${phone}
      Email: ${email}
      Best Time to Contact: ${bestTime || "Not specified"}
      Debt Amount: ${debtAmount}
      Filed All Taxes: ${filedAllTaxes}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: "Lead form email sent successfully!" });
  } catch (error) {
    console.error("Error sending lead form email:", error);
    res
      .status(500)
      .json({ error: "Error sending lead form email. Try again later." });
  }
});

/* -------------------------------------------------------------------------- */
/*                          TAX STEWART ROUTES                                */
/* -------------------------------------------------------------------------- */

// Tax Stewart Question Submission (with full form data)
app.post("/send-question", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

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

    const mailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      replyTo: email,
      to: "mgray@taxadvocategroup.com",
      subject: `New Tax Stewart Submission from ${email}`,
      text: `A new inquiry was submitted through the Tax Stewart tool.

Name: ${name || "Not provided"}
Email: ${email}
Phone: ${phone || "Not provided"}

--- User's Question ---
${nextQuestionText}

--- Full Conversation & Details ---
${transcript}
`,
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
app.post("/answer", questionCounter, async (req, res) => {
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
        "early-empty"
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
        "early-non-tax"
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
      "ok-openai"
    );
  } catch (err) {
    console.error("[/answer] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "OpenAI request failed", _trace: "catch" });
  }
});

// Tax Stewart Status
app.get("/ts-status", questionCounter, (req, res) => {
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

/**
 * POST /send-verification-codes
 * Send verification codes to email and/or phone
 */
app.post("/send-verification-codes", async (req, res) => {
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
        logoUrl: process.env.LOGO_URL || "", // Add your logo URL to .env
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
        phoneCode
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

/**
 * POST /verify-codes
 * Verify the codes provided by user
 */
app.post("/verify-codes", async (req, res) => {
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
 * POST /finalize-submission
 * After verification, send existing PDF guide and follow-up
 */
app.post("/finalize-submission", async (req, res) => {
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
    }

    // Send internal notification email
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

    const internalMailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>",
      replyTo: email,
      to: "mgray@taxadvocategroup.com",
      subject: `New Verified Tax Stewart Submission - ${name}`,
      text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERIFIED TAX STEWART SUBMISSION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT INFORMATION:
Name: ${name}
Email: ${email} ✓ VERIFIED
Phone: ${phone || "Not provided"}${phone ? " ✓ VERIFIED" : ""}
Contact Preference: ${contactPref}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TAX SITUATION SUMMARY:
${intakeSummary || "Not provided"}

INTAKE DETAILS:
${intakeDetails || "Not provided"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER'S QUESTION:
${question || "No question provided"}

AI RESPONSE PROVIDED:
${answer || "No response provided"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI SUMMARY SENT TO CLIENT:
${aiSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIONS TAKEN:
${email ? "✓ Tax guide PDF sent to email" : ""}
${phone ? "✓ Scheduling link sent via text" : ""}
`,
    };

    await transporter.sendMail(internalMailOptions);

    return res.json({
      ok: true,
      message: "Submission finalized successfully",
    });
  } catch (error) {
    console.error("[/finalize-submission] error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to finalize submission",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                SITEMAP                                     */
/* -------------------------------------------------------------------------- */

app.get("/sitemap.xml", async (req, res) => {
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
