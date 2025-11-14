// models/FormSubmission.js
const mongoose = require("mongoose");

/**
 * Generic model for tracking ALL form submissions/abandonments
 * Includes ContactUs, LandingPopup, and any other forms
 */
const formSubmissionSchema = new mongoose.Schema(
  {
    // Form identification
    formType: {
      type: String,
      required: true,
      enum: ["contact-us", "landing-popup", "tax-stewart", "other"],
      index: true,
    },

    // Form data (flexible to accommodate different forms)
    formData: {
      type: mongoose.Schema.Types.Mixed, // Can store any structure
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["abandoned", "submitted", "contacted"],
      default: "abandoned",
      index: true,
    },

    // Session metadata
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // Follow-up tracking
    followedUp: {
      type: Boolean,
      default: false,
    },
    followUpNotes: String,
    followUpDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
formSubmissionSchema.index({ formType: 1, status: 1 });
formSubmissionSchema.index({ "formData.email": 1 });
formSubmissionSchema.index({ "formData.phone": 1 });
formSubmissionSchema.index({ createdAt: -1 });

// Get form-specific stats
formSubmissionSchema.statics.getStatsByForm = async function (
  formType,
  startDate,
  endDate
) {
  const dateFilter = { formType };

  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const [total, byStatus] = await Promise.all([
    this.countDocuments(dateFilter),
    this.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    total,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

module.exports = mongoose.model("FormSubmission", formSubmissionSchema);
