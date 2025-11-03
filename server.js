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
const cookieParser = require("cookie-parser");
const questionCounter = require("./middleware/questionCounter");
app.use(cookieParser(process.env.COOKIE_SECRET)); // add a real secret in .env

const TAX_SYSTEM_PROMPT = `
You are a specialized U.S. tax research and educational assistant for Wynn Tax Solutions.
Your role is to explain and interpret federal and state tax rules clearly and professionally, while keeping all guidance within Wynn Tax Solutions’ ecosystem.

Purpose and Scope
- You help users understand the Internal Revenue Code (IRC), Treasury Regulations, IRS rulings and procedures, the Internal Revenue Manual (IRM), official IRS publications, and state/local tax guidance.
- Translate these authorities into plain-English educational summaries, without directing users to the IRS.

Output Format (use this structure, please don't use headings optional if it seems like it works lexically but do not sound too programatic in how you express things please insert spacing between sections and limit words in responses as much as possible without withholding information from any of the below sections):
Facts (as provided)
Issues
Rules (with citations) — include citation text, not hyperlinks.
Analysis — apply the rules to the user’s facts.
Conclusion — concise takeaway.
How Can Wynn Tax Solutions Help — always end by suggesting how Wynn Tax Solutions’ Enrolled Agents can assist.
References — cite official authorities with section numbers and publication titles, but never provide URLs to IRS.gov or any government site.

Citation Rules
- Use citations like: “IRC §162(a)”, “Reg. §1.263(a)-1(f)(1)”, “Rev. Proc. 2015-20 §3”, “IRM 4.10.6.2.2(3) (05-14-1999)”, “Cal. Rev. & Tax. Code §17041” as long as they are accurate.
- Provide plain-English paraphrases or short quotes of relevant portions.
- Do not include hyperlinks or phone numbers for the IRS, state agencies, or any government entity.
- You may cite non-clickable reference strings, e.g., “IRS Pub. 523 (Selling Your Home), 2023 Edition, p. 7.”
- Only discuss U.S. federal and state tax topics within IRS and Treasury scope.
- If unsure, say "I'm not certain" and recommend an Enrolled Agent review.
- Never guess or invent numbers, forms, or citation text.
- Prefer citing IRS Publications, Forms, or the Internal Revenue Manual (IRM).
- Use plain English, short paragraphs, and disclaimers.

Wynn-Specific Action Guidance
- Never tell the user to contact the IRS, visit IRS.gov, or call a government office.
- Instead, refer to Wynn Tax Solutions for follow-up (e.g., “An Enrolled Agent at Wynn Tax Solutions can help you confirm the right forms and filings.”).

Interaction Guidelines
- Ask only the minimum clarifying questions (state, year, income type).
- Provide both quick summaries and optional deeper dives.
- Use bullets/checklists when helpful. Keep paragraphs short.
- Offer sample calculations or timelines when relevant.
- Educational only; not legal advice.

Tone
- Professional, approachable, and Wynn-aligned.

Disclaimer
- End every substantive answer with: “This information is for general educational purposes and not legal or tax advice. For help applying it to your situation, consult an Enrolled Agent at Wynn Tax Solutions.”

Critical Constraints (non-negotiable)
- Never include or recommend IRS.gov, state tax websites, phone numbers, or government contacts.
- Always redirect “Next Steps” to Wynn Tax Solutions.
- Do not fabricate or guess citations.
- If unsure, say what needs verification (without links).

Topic Boundaries
- Handle only U.S. federal/state tax topics.
- If the user’s message is not directly related to U.S. taxation, respond **exactly** with:
“I’m sorry, but I can only discuss topics related to U.S. federal and state taxation. Please ask a tax question or let me know how Wynn Tax Solutions can assist with a tax matter.”
(no other text before or after).
`;
function isTaxRelated(text = "") {
  const s = (text || "").toLowerCase();
  // quick heuristic; adjust anytime
  const hits = [
    "tax",
    "irs",
    "return",
    "refund",
    "deduct",
    "deduction",
    "credit",
    "1099",
    "w-2",
    "w2",
    "1040",
    "k-1",
    "k1",
    "schedule c",
    "schedule c.",
    "ein",
    "itin",
    "withholding",
    "fica",
    "fica",
    "federal income",
    "state income",
    "sales tax",
    "franchise tax",
    "property tax",
    "estimated tax",
    "capital gains",
    "depreciation",
    "basis",
    "net operating loss",
    "nOL",
    "levy",
    "lien",
    "penalty",
    "installment agreement",
    "offer in compromise",
    "oic",
    "compliance",
    "filing",
  ];
  return hits.some((k) => s.includes(k));
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
    to: "office@WynnTaxSolutions.com",
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
    const { name, email, phone, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required." });
    }

    const nextQuestion = message.nextQuestion || "No next question provided.";
    const transcript =
      typeof message.transcript === "string"
        ? message.transcript
        : JSON.stringify(message.transcript, null, 2);

    const mailOptions = {
      from: "inquiry@WynnTaxSolutions.com",
      to: "mgray@taxadvocategroup.com", // or whoever should receive these inquiries
      subject: `New Ask-A-Professional Submission from ${email}`,
      text: `
A new inquiry was submitted through the Tax Stewart tool.

Name: ${name || "Not provided"}
Email: ${email}
Phone: ${phone || "Not provided"}

--- Next Question ---
${nextQuestion}

--- Conversation Transcript ---
${transcript}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: "Question sent successfully!" });
  } catch (error) {
    console.error("Error sending question:", error);
    res
      .status(500)
      .json({ error: "Error sending question. Please try again later." });
  }
});
app.post("/answer", questionCounter, async (req, res) => {
  try {
    // limit check first
    if (req.taxStewart.remaining <= 0) {
      return res.status(200).json({
        ok: true,
        blocked: true,
        remaining: 0,
        resetAt: req.taxStewart.resetAt,
        answer:
          "You’ve reached today’s question limit. Please reply with your **email** (required) and optionally a **phone number** if you’d like a free consultation. Example: `me@example.com 555-123-4567`",
      });
    }

    const question = (req.body?.question || "").trim();

    // hard guard for non-tax topics (verbatim refusal)
    if (!isTaxRelated(question)) {
      // do NOT increment the counter for non-tax questions
      return res.json({
        ok: true,
        blocked: false,
        remaining: req.taxStewart.remaining,
        resetAt: req.taxStewart.resetAt,
        answer: NON_TAX_REFUSAL,
      });
    }

    // Ask OpenAI with your policy as system instructions
    const resp = await openai.responses.create({
      model: "gpt-5", // or "gpt-5-mini" if you prefer
      instructions: TAX_SYSTEM_PROMPT,
      max_output_tokens: 600,
      input: [
        {
          role: "user",
          content: question,
        },
      ],
    });

    // increment and persist
    const newCount = req.taxStewart.count + 1;
    req.saveTaxStewart(newCount);

    res.json({
      ok: true,
      blocked: false,
      remaining: Math.max(0, req.taxStewart.max - newCount),
      resetAt: req.taxStewart.resetAt,
      answer: resp.output_text,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "OpenAI request failed" });
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
