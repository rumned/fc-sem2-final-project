const mongoose = require("mongoose");

const CalendarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Calendar name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    color: {
      type: String,
      default: "#60a5fa",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Calendar", CalendarSchema);
