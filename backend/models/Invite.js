const mongoose = require("mongoose");

const InviteSchema = new mongoose.Schema(
  {
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calendar",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending invites for the same user + calendar
InviteSchema.index(
  { calendar: 1, invitedUser: 1 },
  { unique: true }
);

module.exports = mongoose.model("Invite", InviteSchema);
