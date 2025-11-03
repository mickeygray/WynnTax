require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const connectDB = require("./config/db");
const OpenAI = require("openai");
const rateLimit = require("express-rate-limit");
const formLimiter = rateLimit({
  windowMs: 60 * 10000, // 15 minutes
  max: 1, // allow up to 3 submissions in 15 minutes
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

const TS_HISTORY_COOKIE = "ts_history";
const TS_HISTORY_MAX_ITEMS = 4;
const TS_HISTORY_MAX_FIELD = 1200; // cap each q/a to keep cookie < 4KB
const isProd = process.env.NODE_ENV === "production";

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
} // add a real secret in .env
const NON_TAX_REFUSAL =
  "This tool is designed to answer questions about U.S. federal and state taxes only. " +
  "Please rephrase your question to include a tax topic, or let Wynn Tax Solutions know how we can help with your tax situation.";
const TAX_SYSTEM_PROMPT = `
You are a specialized U.S. tax education assistant for Wynn Tax Solutions.

ROLE & SCOPE
- Explain and interpret federal and state tax rules clearly and professionally while keeping all guidance within Wynn Tax Solutions’ ecosystem.
- Draw on the Internal Revenue Code (IRC), Treasury Regulations, IRS rulings and procedures, the Internal Revenue Manual (IRM), official IRS publications, and state or local tax guidance.
- Your goal is to make these rules understandable in plain English for ordinary taxpayers, not professionals.

STYLE & OUTPUT
- Write in smooth, conversational paragraphs—never in rigid sections like “Facts/Issues/Rules.” 
- Integrate those ideas naturally within your response so it feels like thoughtful explanation, not a report.
- Keep answers concise (usually 6–10 sentences). Use short paragraphs or a few light bullets only if they truly help.
- Insert small pauses or spacing between ideas for readability.
- When citing authorities, include short inline references such as (IRC §6331) or (IRM 5.14.1.2(3) (10-01-2012)); never hyperlinks.
- Avoid repetition of headings or boilerplate phrasing.
- Professional, approachable, and Wynn-aligned.
- Use conversational rhythm similar to a knowledgeable tax consultant.
- Use light formatting for clarity:
  - ✅ checkmarks for “do” or compliant steps
  - ⚠️ warnings for risks or deadlines
  - ❌ for what to avoid
  - • bullets or numbered lists for clarity
  - occasional short breaks between ideas using &nbsp;&nbsp; or <PARA>
- Avoid rigid “Facts / Issues / Rules” headers unless absolutely natural.
- Keep responses concise (about 2–3 short paragraphs or 5–7 bullets total).
- Never use markdown headers (#, ##, etc.), but feel free to bold key terms for clarity.

CONTENT GUIDELINES
- Address the user’s situation factually: what it means, why it happens, what rules apply, and what reasonable next steps look like.
- When possible, mention deadlines, forms, or processes accurately, but never invent details.
- If unsure, say what needs verification rather than guessing.
- Stay strictly within U.S. federal or state tax matters.
- Keep it brief (no more than 150 words). Prefer 2–3 short paragraphs. Avoid headings and long lists.
- If your response naturally separates into ideas or short paragraphs, insert &nbsp;&nbsp; (two non-breaking spaces) between them instead of extra line breaks.

WYNN ACTION & DISCLAIMER
- Always end with a single, natural closing line that invites follow-up with Wynn Tax Solutions, e.g.:
  “Wynn Tax Solutions can help you review your documents and confirm the best next step. Educational information only—not legal or tax advice.”
- Do not advertise or repeat long marketing copy.

PROHIBITIONS
- Never tell the user to contact or visit the IRS or any government website.
- Never include phone numbers, URLs, or external resources.
- Never fabricate citations, numbers, or official forms.
- Never discuss non-tax topics; if the user asks, politely decline.

INTERACTION BEHAVIOR
- Ask clarifying questions only when essential (year, state, or income type).
- Maintain a calm, professional tone—reassuring, precise, and human.
- Be brief, accurate, and always aligned with Wynn’s educational mission.
`;

function isTaxRelated(text = "") {
  const s = (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim(); // strip punctuation

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
    "ftb",
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
    "Tax Consultant",
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

  // use a word boundary regex for accuracy
  return keywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(s));
}

const PORT = process.env.PORT || 5000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Middleware
connectDB();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://www.wynntaxsolutions.com"],
    credentials: true,
  })
);
app.use("/send-email", formLimiter);
// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.WYNN_API_KEY,
  },
});

// Handle Contact Form Submission
app.post("/send-email", async (req, res) => {
  const { name, email, message, phone } = req.body;
  console.log(req.body);
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const mailOptions = {
    from: "inquiry@WynnTaxSolutions.com",
    to: "mgray@taxadvocategroup.com",
    subject: `New Inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Error sending email. Try again later." });
  }
});

app.post("/lead-form", async (req, res) => {
  const { debtAmount, filedAllTaxes, name, phone, email, bestTime } = req.body;

  console.log("Lead Form Submission:", req.body);

  // Simple validation
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

    // Sanitize + cap size (big bodies can get filtered/quarantined)
    transcript = safeText(transcript, 8000);
    const nextQuestionText = safeText(nextQuestion, 2000);

    const mailOptions = {
      from: "Wynn Tax Solutions <inquiry@WynnTaxSolutions.com>", // same sender as the working route
      replyTo: email, // so replies go to the user
      to: "mgray@taxadvocategroup.com",
      subject: `New Ask-A-Professional Submission from ${email}`,
      text: `A new inquiry was submitted through the Tax Stewart tool.

Name: ${name || "Not provided"}
Email: ${email}
Phone: ${phone || "Not provided"}

--- Next Question ---
${nextQuestionText}

--- Conversation Transcript ---
${transcript}
`,
      headers: { "X-App-Route": "send-question" },
      // Optional: explicit envelope if your provider prefers alignment
      // envelope: { from: "bounce@WynnTaxSolutions.com", to: "mgray@taxadvocategroup.com" }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[/send-question] sendMail result:", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
      envelope: info?.envelope,
    });

    return res.status(200).json({ success: "Question sent successfully!" });
  } catch (error) {
    console.error("[/send-question] error:", error?.stack || error);
    return res
      .status(500)
      .json({ error: "Error sending question. Please try again later." });
  }
});

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
  const body = { ...payload, _trace: stamp }; // visible in Network tab
  console.log("[/answer] RESP:", stamp, JSON.stringify(body).slice(0, 200));
  return res.json(body);
}

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

    // ---- conversational memory ----
    const history = readHistory(req);
    // Use last 2 exchanges to keep context tight
    const prior = history.slice(-2).flatMap(({ q, a }) => [
      { role: "user", content: q },
      { role: "assistant", content: a },
    ]);
    // Build a compact context: last 2 user/assistant pairs

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
app.get("/ts-status", questionCounter, (req, res) => {
  res.json({
    ok: true,
    count: req.taxStewart.count,
    remaining: req.taxStewart.remaining,
    resetAt: req.taxStewart.resetAt,
  });
});
// Serve Dynamic Sitemap
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

  // Create a sitemap stream
  const stream = new SitemapStream({
    hostname: "https://www.WynnTaxSolutions.com",
  });

  // Convert stream to XML by pushing links
  const xml = await streamToPromise(Readable.from(links)).then((data) => {
    links.forEach((link) => stream.write(link));
    stream.end();
    return data;
  });

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
