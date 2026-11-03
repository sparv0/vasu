const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attendanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    punctualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    productivityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    workloadScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    hrScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    hrFeedback: {
      type: String,
      default: "",
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    evaluationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Performance", performanceSchema);
