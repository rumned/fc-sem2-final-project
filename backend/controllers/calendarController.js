const Calendar = require("../models/Calendar");
const Event = require("../models/Event");
const User = require("../models/User");

// @desc    Get calendars accessible to the user
// @route   GET /api/calendars?owner=&member=&isPublic=
// @access  Private
const getCalendars = async (req, res, next) => {
  try {
    const { owner, member, isPublic } = req.query;
    let filter = {};

    if (req.user.role === "admin") {
      // Admins see everything; still support query params
      if (owner)    filter.owner   = owner;
      if (member)   filter.members = member;
      if (isPublic !== undefined) filter.isPublic = isPublic === "true";
    } else {
      // Regular users see: their own calendars + calendars they're a member of + public ones
      filter.$or = [
        { owner: req.user.id },
        { members: req.user.id },
        { isPublic: true },
      ];
      if (isPublic !== undefined) filter.isPublic = isPublic === "true";
    }

    const calendars = await Calendar.find(filter)
      .populate("owner",   "name email role")
      .populate("members", "name email role");

    res.status(200).json({ success: true, count: calendars.length, data: calendars });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single calendar with members
// @route   GET /api/calendars/:id
// @access  Private
const getCalendar = async (req, res, next) => {
  try {
    const calendar = await Calendar.findById(req.params.id)
      .populate("owner",   "name email role")
      .populate("members", "name email role");

    if (!calendar) return res.status(404).json({ success: false, message: "Calendar not found" });

    // Check if user has access
    const isOwner  = calendar.owner._id.toString() === req.user.id;
    const isMember = calendar.members.some((m) => m._id.toString() === req.user.id);
    const isAdmin  = req.user.role === "admin";

    if (!isOwner && !isMember && !calendar.isPublic && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view this calendar" });
    }

    res.status(200).json({ success: true, data: calendar });
  } catch (error) {
    next(error);
  }
};

// @desc    Create calendar
// @route   POST /api/calendars
// @access  Private
const createCalendar = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    const calendar = await Calendar.create(req.body);
    res.status(201).json({ success: true, data: calendar });
  } catch (error) {
    next(error);
  }
};

// @desc    Update calendar (rename / recolor / description)
// @route   PUT /api/calendars/:id
// @access  Private (owner or admin)
const updateCalendar = async (req, res, next) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ success: false, message: "Calendar not found" });

    // The owner manages their own calendar; an admin can manage any calendar.
    const isOwner = calendar.owner.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this calendar" });
    }

    // Prevent changing the owner or members through this route
    // (members are managed via the dedicated assign/remove endpoints)
    delete req.body.owner;
    delete req.body.members;

    const updated = await Calendar.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("owner", "name email role").populate("members", "name email role");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete calendar and all its events
// @route   DELETE /api/calendars/:id
// @access  Private (owner or admin)
const deleteCalendar = async (req, res, next) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ success: false, message: "Calendar not found" });

    // The owner can delete their own calendar; an admin can delete any.
    const isOwner = calendar.owner.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this calendar" });
    }

    // Delete all events belonging to this calendar
    await Event.deleteMany({ calendar: req.params.id });
    await calendar.deleteOne();

    res.status(200).json({ success: true, message: "Calendar and its events deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a user to a calendar directly (no invite needed)
// @route   POST /api/calendars/:id/members   body: { email }
// @access  Admin only (owners use invites instead)
const assignMember = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only an admin can assign members directly" });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });

    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ success: false, message: "Calendar not found" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "No user with that email" });

    if (calendar.owner.toString() === user.id) {
      return res.status(400).json({ success: false, message: "That user owns this calendar" });
    }

    await Calendar.findByIdAndUpdate(req.params.id, { $addToSet: { members: user.id } });

    const updated = await Calendar.findById(req.params.id)
      .populate("owner", "name email role")
      .populate("members", "name email role");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from a calendar
// @route   DELETE /api/calendars/:id/members/:userId
// @access  Private (calendar owner or admin)
const removeMember = async (req, res, next) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ success: false, message: "Calendar not found" });

    // The owner manages their own members; an admin can manage any calendar.
    const isOwner = calendar.owner.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to remove members from this calendar" });
    }

    await Calendar.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.params.userId },
    });

    const updated = await Calendar.findById(req.params.id)
      .populate("owner", "name email role")
      .populate("members", "name email role");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCalendars, getCalendar, createCalendar, updateCalendar, deleteCalendar, assignMember, removeMember };