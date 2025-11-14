// models/TaxStewartSubmission.js
const mongoose = require("mongoose");

const taxStewartSubmissionSchema = new mongoose.Schema(
  {
    // Contact Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    contactPref: {
      type: String,
      enum: ["email", "phone", "both"],
      required: true,
    },

    // Verification Status
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // Tax Situation Intake
    issues: [String],
    balanceBand: String,
    noticeType: String,
    taxScope: String,
    state: String,
    filerType: String,
    intakeSummary: String,

    // Question & Answer
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },

    // Conversation History (from cookie)
    conversationHistory: [
      {
        q: String,
        a: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // AI Summary sent to client
    aiSummary: String,

    // Session Metadata
    ipAddress: String,
    userAgent: String,
    sessionDuration: Number, // milliseconds from first interaction to submission
    questionsAsked: Number, // total questions they asked before submitting

    // Status tracking
    status: {
      type: String,
      enum: ["submitted", "contacted", "scheduled", "converted", "archived"],
      default: "submitted",
    },

    // Follow-up notes (for your team)
    notes: String,
    followUpDate: Date,
    assignedTo: String,

    // Analytics
    source: {
      type: String,
      default: "tax-stewart-widget",
    },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for common queries
taxStewartSubmissionSchema.index({ email: 1 });
taxStewartSubmissionSchema.index({ phone: 1 });
taxStewartSubmissionSchema.index({ createdAt: -1 });
taxStewartSubmissionSchema.index({ status: 1 });

// Virtual for full name display
taxStewartSubmissionSchema.virtual("displayName").get(function () {
  return this.name || this.email;
});

// Method to format for email
taxStewartSubmissionSchema.methods.formatForEmail = function () {
  const issueLabels = {
    balance_due: "Balance due",
    irs_notice: "IRS notice",
    unfiled: "Unfiled returns",
    levy_lien: "Levy/Lien",
    audit: "Audit/Exam",
  };

  const amountLabels = {
    lt10k: "Under $10k",
    "10to50k": "$10k–$50k",
    gt50k: "Over $50k",
    unsure: "Not sure",
  };

  const noticeLabels = {
    none: "No notice",
    cp504: "CP504",
    levy: "Levy / Final notice",
    other: "Something else",
  };

  return {
    name: this.name,
    email: this.email,
    phone: this.phone || "Not provided",
    contactPref: this.contactPref,
    issues:
      this.issues?.map((id) => issueLabels[id] || id).join(", ") || "None",
    amount:
      amountLabels[this.balanceBand] || this.balanceBand || "Not provided",
    notice: noticeLabels[this.noticeType] || this.noticeType || "Not provided",
    taxScope: this.taxScope || "Not provided",
    state: this.state || "Not applicable",
    filerType: this.filerType || "Not provided",
    summary: this.intakeSummary || "Not provided",
    question: this.question,
    answer: this.answer,
    conversationHistory: this.conversationHistory || [],
    questionsAsked: this.questionsAsked || 0,
    submittedAt: this.createdAt,
  };
};

module.exports = mongoose.model(
  "TaxStewartSubmission",
  taxStewartSubmissionSchema
);
