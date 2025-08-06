require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const connectDB = require("./config/db");
const app = express();

const PORT = process.env.PORT || 5000;
// Middleware
connectDB();
app.use(express.json());
app.use(cors());

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
    to: "office@WynnTaxSolutions.com",
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
