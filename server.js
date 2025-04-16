require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { SitemapStream, streamToPromise } = require("sitemap");
const { Readable } = require("stream");
const connectDB = require("./config/db");
const app = express();
const axios = require("axios");
const Client = require("./models/Client");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

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
const evaluateScheduleWindow = (activityDates) => {
  const now = new Date();
  let within7Days = 0;
  let within30Days = 0;

  activityDates.forEach((date) => {
    const activityDate = new Date(date);
    const diffInDays = (now - activityDate) / (1000 * 60 * 60 * 24);

    if (diffInDays <= 7) within7Days++;
    if (diffInDays <= 30) within30Days++;
  });

  if (within7Days >= 1 || within30Days >= 2) {
    return "caseNumberIsClientOverlimit";
  } else {
    return "caseNumberCanSchedule";
  }
};
const statusLookup = {
  10: "pendingActivityCheck",
  11: "pendingActivityCheck",
  12: "caseNumberIsDead",
  13: "pendingActivityCheck",
  18: "caseNumberIsDelinquent",
  22: "caseNumberIsDead",
  24: "caseNumberIsDead",
  25: "caseNumberIsDead",
  26: "caseNumberIsDead",
  60: "caseNumberIsDelinquent",
  151: "pendingActivityCheck",
  152: "pendingActivityCheck",
  153: "pendingActivityCheck",
  154: "pendingActivityCheck",
  155: "pendingActivityCheck",
  156: "pendingActivityCheck",
  157: "pendingActivityCheck",
  158: "pendingActivityCheck",
  159: "pendingActivityCheck",
  181: "pendingActivityCheck",
  182: "pendingActivityCheck",
  183: "pendingActivityCheck",
  184: "pendingActivityCheck",
  190: "pendingActivityCheck",
  191: "pendingActivityCheck",
  192: "pendingActivityCheck",
  193: "pendingActivityCheck",
  194: "pendingActivityCheck",
  195: "pendingActivityCheck",
  196: "pendingActivityCheck",
  197: "pendingActivityCheck",
  198: "pendingActivityCheck",
  199: "pendingActivityCheck",
  200: "pendingActivityCheck",
  201: "pendingActivityCheck",
  202: "pendingActivityCheck",
  203: "pendingActivityCheck",
  204: "pendingActivityCheck",
  205: "pendingActivityCheck",
  207: "pendingActivityCheck",
  208: "caseNumberIsDead",
  209: "caseNumberIsDead",
  210: "pendingActivityCheck",
  211: "pendingActivityCheck",
  212: "caseNumberIsDead",
  213: "pendingActivityCheck",
  214: "pendingActivityCheck",
  216: "pendingActivityCheck",
  217: "pendingActivityCheck",
  218: "pendingActivityCheck",
  219: "pendingActivityCheck",
  220: "pendingActivityCheck",
};

const fetchActivities = async (caseID) => {
  const response = await axios.get(
    `https://wynntax.logiqs.com/publicapi/2020-02-22/cases/activity?apikey=${
      process.env.LOGICS_API_KEY
    }&CaseID=${parseInt(caseID)}`
  );

  console.log(response.data);
  return response.data;
};

const fetchCaseInfo = async (caseID) => {
  const response = await axios.get(
    `https://wynntax.logiqs.com/publicapi/2020-02-22/cases/casefile?apikey=${
      process.env.LOGICS_API_KEY
    }&CaseID=${parseInt(caseID)}`
  );

  return JSON.parse(response.data.data);
};

// Handle Contact Form Submission
app.post("/send-email", async (req, res) => {
  const { name, email, message, phone } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const mailOptions = {
    from: "inquiry@wynntaxsolutions.com",
    to: "office@taxadvocategroup.com",
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
app.post("/verify", async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({ error: "No token provided." });
    }

    const client = await Client.findOne({ token });
    if (!client) {
      return res.status(404).json({ status: "invalidToken" });
    }

    const [firstName, ...rest] = client.name.trim().split(" ");
    const lastName = rest.join(" ");
    const caseID = client.caseNumber;

    // Get case info from Logics
    const caseInfo = await fetchCaseInfo(caseID);
    const statusID = caseInfo.StatusID;

    // Build response payload
    const basicInfo = {
      caseID,
      firstName,
      lastName,
      cell: client.cell,
      email: client.email,
      stage: client.stage,
    };

    // Run activity check
    const activityData = await fetchActivities(caseID);
    const allActivities = activityData.data || [];

    const matchingActivities = allActivities.filter(
      (a) => a.Subject === "Client Scheduled Appointment Phone Call"
    );

    const activityDates = [];
    let matchedActivity = null;

    matchingActivities.forEach((activity) => {
      const created = new Date(activity.CreatedOn);
      activityDates.push(created);

      if (activity.Comments?.length) {
        const commentDates = activity.Comments.map(
          (c) => new Date(c.CommentDate)
        ).filter(Boolean);
        activityDates.push(...commentDates);
      }

      if (!matchedActivity) matchedActivity = activity;
    });

    const mappedStatus = statusLookup[statusID];

    // Determine final eligibility
    let evaluatedStatus = "caseNumberCanSchedule";

    if (
      mappedStatus === "caseNumberIsDelinquent" ||
      mappedStatus === "caseNumberIsDead"
    ) {
      evaluatedStatus = mappedStatus;
    } else if (activityDates.length > 0) {
      evaluatedStatus = evaluateScheduleWindow(activityDates);
    }

    // Return info to frontend
    res.json({
      ...basicInfo,
      status: evaluatedStatus,
      scheduledActivity: matchedActivity?.ActivityID || null,
    });

    // Progress stage if needed
    if (client.stage === "poa") {
      client.stage = "433a";
    }

    // Set expiration for cleanup
    client.createdAt = client.createdAt || new Date();
    client.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await client.save();
  } catch (err) {
    console.error("Verify route error:", err.message);
    res.status(500).json({ error: "Error verifying case. Please try again." });
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
    hostname: "https://www.wynntaxsolutions.com",
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
app.post("/setschedule", async (req, res) => {
  const { selectedDate, selectedTime, token, scheduledActivity } = req.body;

  if (!token || !selectedDate || !selectedTime) {
    return res.status(400).json({ error: "Missing required scheduling data." });
  }

  try {
    // 🔍 Look up client via token to get caseID
    const client = await Client.findOne({ token });

    if (!client) {
      return res.status(404).json({ error: "Invalid or expired token." });
    }

    const caseID = client.caseNumber;

    const comment = `Client requested a call at ${selectedTime} on ${new Date(
      selectedDate
    ).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    })} PST\n`;

    if (scheduledActivity) {
      // ✏️ Update existing activity
      await axios.post(
        "https://wynntax.logiqs.com/publicapi/2020-02-22/cases/activity",
        null,
        {
          params: {
            apikey: process.env.LOGICS_API_KEY,
            ActivityID: scheduledActivity,
            CaseID: caseID,
            Comment: comment,
          },
        }
      );
    } else {
      // ➕ Create new activity
      await axios.post(
        "https://wynntax.logiqs.com/publicapi/2020-02-22/cases/activity",
        null,
        {
          params: {
            apikey: process.env.LOGICS_API_KEY,
            CaseID: caseID,
            Subject: "Client Scheduled Appointment Phone Call",
            Comment: comment,
          },
        }
      );
    }

    // ✅ Stage progression + token cleanup
    if (client.stage === "prac") {
      client.stage = "poa";
    }
    app.post("/setschedule", async (req, res) => {
      const {
        selectedDate,
        selectedTime,
        token,
        scheduledActivity,
        selectedAgent,
      } = req.body;

      if (!token || !selectedDate || !selectedTime) {
        return res
          .status(400)
          .json({ error: "Missing required scheduling data." });
      }

      try {
        // 🔍 Look up client via token to get caseID
        const client = await Client.findOne({ token });

        if (!client) {
          return res.status(404).json({ error: "Invalid or expired token." });
        }

        const caseID = client.caseNumber;

        const comment = `Client requested a call at ${selectedTime} on ${new Date(
          selectedDate
        ).toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
        })} PST\nPreferred Agent: ${selectedAgent}`;

        if (scheduledActivity) {
          // ✏️ Update existing activity
          await axios.post(
            "https://wynntax.logiqs.com/publicapi/2020-02-22/cases/activity",
            null,
            {
              params: {
                apikey: process.env.LOGICS_API_KEY,
                ActivityID: scheduledActivity,
                CaseID: caseID,
                Comment: comment,
              },
            }
          );
        } else {
          // ➕ Create new activity
          await axios.post(
            "https://wynntax.logiqs.com/publicapi/2020-02-22/cases/activity",
            null,
            {
              params: {
                apikey: process.env.LOGICS_API_KEY,
                CaseID: caseID,
                Subject: "Client Scheduled Appointment Phone Call",
                Comment: comment,
              },
            }
          );
        }

        // ✅ Stage progression + token cleanup
        if (client.stage === "prac") {
          client.stage = "poa";
        }

        client.token = undefined;
        client.tokenExpiresAt = undefined;
        await client.save();

        return res.json({ success: true });
      } catch (err) {
        console.error("Schedule error:", err);
        return res
          .status(500)
          .json({ error: "Failed to schedule appointment." });
      }
    });
    const templateSource = fs.readFileSync(
      path.join(__dirname, `../templates/${client.stage}.hbs`),
      "utf8"
    );
    const compiledTemplate = handlebars.compile(templateSource);

    const emailHtml = compiledTemplate({
      name: client.name,
      date: new Date(selectedDate).toLocaleDateString(),
      time: selectedTime,
    });

    await transporter.sendMail({
      from: "support@wynntaxsolutions.com",
      to: client.email,
      subject: "Your Appointment Has Been Scheduled",
      html: emailHtml,
      attachments:
        client.stage === "433a"
          ? [
              {
                filename: `${client.stage}.pdf`,
                path: path.join(__dirname, "../templates/433a.pdf"),
              },
            ]
          : [],
    });

    await transporter.sendMail({
      from: "support@wynntaxsolutions.com",
      to: "as@taxadvocategroup.com",
      subject: `New Appointment Scheduled by ${client.name}`,
      text: `${client.name} scheduled a call at ${selectedTime} on ${new Date(
        selectedDate
      ).toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      })} PST for case #${client.caseNumber}`,
    });

    await Client.deleteOne({ token });

    return res.json({ success: true });
  } catch (err) {
    console.error("Schedule error:", err);
    return res.status(500).json({ error: "Failed to schedule appointment." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
