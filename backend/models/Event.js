const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    desc: {
      type: String,
      default: "",
    },
    // YYYY-MM-DD string — matches frontend date format
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    startHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    startMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 59,
    },
    endHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    endMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 59,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#60a5fa",
    },
    category: {
      type: String,
      enum: ["work", "study", "exercise", "leisure", "sleep", "other"],
      default: "other",
    },
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    // Optional — events can exist outside a calendar (personal events)
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calendar",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast date + user queries
EventSchema.index({ date: 1, createdBy: 1 });
EventSchema.index({ calendar: 1, date: 1 });

module.exports = mongoose.model("Event", EventSchema);
