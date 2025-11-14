// models/AbandonedSubmission.js
const mongoose = require("mongoose");

/**
 * Schema for tracking abandoned/incomplete Tax Stewart sessions
 * These are sessions where users started but didn't complete verification
 */
const abandonedSubmissionSchema = new mongoose.Schema(
  {
    // Whatever data they provided
    issues: [String],
    balanceBand: String,
    noticeType: String,
    taxScope: String,
    state: String,
    filerType: String,

    // Question/answer if they got that far
    question: String,
    answer: String,

    // Partial contact info (not verified)
    name: String,
    email: String,
    phone: String,
    contactPref: String,

    // Where they stopped
    lastPhase: {
      type: String,
      enum: [
        "intake_issues",
        "intake_questions",
        "question",
        "name",
        "contact_offer",
        "contact_details",
        "verification", // They got codes but didn't verify
      ],
      required: true,
    },

    // Conversation history (from cookie)
    conversationHistory: [
      {
        q: String,
        a: String,
      },
    ],

    // Session metadata
    startedAt: {
      type: Date,
      required: true,
    },
    lastUpdated: {
      type: Date,
      required: true,
    },
    sessionDuration: Number, // milliseconds from start to abandon
    questionsAsked: Number,
    ipAddress: String,
    userAgent: String,

    // Follow-up tracking
    followedUp: {
      type: Boolean,
      default: false,
    },
    followUpNotes: String,

    // Did they eventually convert?
    converted: {
      type: Boolean,
      default: false,
    },
    convertedSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxStewartSubmission",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
abandonedSubmissionSchema.index({ lastPhase: 1 });
abandonedSubmissionSchema.index({ lastUpdated: -1 });
abandonedSubmissionSchema.index({ email: 1 });
abandonedSubmissionSchema.index({ phone: 1 });
abandonedSubmissionSchema.index({ followedUp: 1 });

// Calculate abandonment funnel metrics
abandonedSubmissionSchema.statics.getFunnelMetrics = async function (
  startDate,
  endDate
) {
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.lastUpdated = {};
    if (startDate) dateFilter.lastUpdated.$gte = new Date(startDate);
    if (endDate) dateFilter.lastUpdated.$lte = new Date(endDate);
  }

  const byPhase = await this.aggregate([
    { $match: dateFilter },
    { $group: { _id: "$lastPhase", count: { $sum: 1 } } },
  ]);

  return byPhase.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

module.exports = mongoose.model(
  "AbandonedSubmission",
  abandonedSubmissionSchema
);
