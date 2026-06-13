const Invite = require("../models/Invite");
const Calendar = require("../models/Calendar");
const User = require("../models/User");

// @desc    Get invites for the current user
// @route   GET /api/invites?status=&calendarId=
// @access  Private
const getInvites = async (req, res, next) => {
  try {
    const { status, calendarId } = req.query;
    const filter = {};

    // Admins see all; regular users see only their own
    if (req.user.role !== "admin") {
      filter.$or = [
        { invitedUser: req.user.id },
        { invitedBy: req.user.id },
      ];
    }

    if (status)     filter.status   = status;
    if (calendarId) filter.calendar = calendarId;

    const invites = await Invite.find(filter)
      .populate("calendar",    "name color")
      .populate("invitedBy",   "name email")
      .populate("invitedUser", "name email");

    res.status(200).json({ success: true, count: invites.length, data: invites });
  } catch (error) {
    next(error);
  }
};

// @desc    Send an invite
// @route   POST /api/invites   body: { calendarId, invitedUserId } or { calendarId, invitedEmail }
// @access  Private (calendar owner or admin)
const sendInvite = async (req, res, next) => {
  try {
    const { calendarId, invitedUserId, invitedEmail } = req.body;

    if (!calendarId || (!invitedUserId && !invitedEmail)) {
      return res.status(400).json({ success: false, message: "calendarId and an invited user (id or email) are required" });
    }

    const calendar = await Calendar.findById(calendarId);
    if (!calendar) return res.status(404).json({ success: false, message: "Calendar not found" });

    // Only the calendar owner or an admin can invite
    const isOwner = calendar.owner.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only the calendar owner can invite members" });
    }

    // Resolve the invited user by id or by email
    const invitedUser = invitedUserId
      ? await User.findById(invitedUserId)
      : await User.findOne({ email: invitedEmail.toLowerCase() });
    if (!invitedUser) return res.status(404).json({ success: false, message: "User not found" });

    // Can't invite yourself or the owner
    if (invitedUser.id === req.user.id || invitedUser.id === calendar.owner.toString()) {
      return res.status(400).json({ success: false, message: "That user already has access to this calendar" });
    }

    // Prevent inviting someone already a member
    if (calendar.members.map(String).includes(invitedUser.id)) {
      return res.status(400).json({ success: false, message: "User is already a member of this calendar" });
    }

    const invite = await Invite.create({
      calendar: calendarId,
      invitedBy: req.user.id,
      invitedUser: invitedUser.id,
    });

    await invite.populate([
      { path: "calendar",    select: "name color" },
      { path: "invitedBy",   select: "name email" },
      { path: "invitedUser", select: "name email" },
    ]);

    res.status(201).json({ success: true, data: invite });
  } catch (error) {
    // Catch duplicate invite (unique index)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Invite already sent to this user" });
    }
    next(error);
  }
};

// @desc    Accept or decline an invite
// @route   PUT /api/invites/:id
// @access  Private (invited user only)
const respondInvite = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'declined'" });
    }

    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    if (invite.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to respond to this invite" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, message: "Invite has already been responded to" });
    }

    invite.status = status;
    await invite.save();

    // If accepted, add user to calendar members
    if (status === "accepted") {
      await Calendar.findByIdAndUpdate(invite.calendar, {
        $addToSet: { members: invite.invitedUser },
      });
    }

    res.status(200).json({ success: true, data: invite });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel / delete an invite
// @route   DELETE /api/invites/:id
// @access  Private (sender or admin)
const deleteInvite = async (req, res, next) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    const isSender = invite.invitedBy.toString() === req.user.id;
    if (!isSender && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this invite" });
    }

    await invite.deleteOne();
    res.status(200).json({ success: true, message: "Invite cancelled" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInvites, sendInvite, respondInvite, deleteInvite };