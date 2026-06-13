const Event = require("../models/Event");
const Calendar = require("../models/Calendar");

// Build a query that limits results to events the user can access
const buildAccessQuery = async (userId, role) => {
  if (role === "admin") return {};

  // Events the user created, or events in calendars they belong to
  const userCalendars = await Calendar.find({
    $or: [{ owner: userId }, { members: userId }],
  }).select("_id");

  const calendarIds = userCalendars.map((c) => c._id);

  return {
    $or: [
      { createdBy: userId },
      { calendar: { $in: calendarIds } },
    ],
  };
};

// @desc    Get events (filtered)
// @route   GET /api/events?date=&calendarId=&isAllDay=&startDate=&endDate=
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    const { date, calendarId, isAllDay, startDate, endDate } = req.query;

    const accessQuery = await buildAccessQuery(req.user.id, req.user.role);
    const filter = { ...accessQuery };

    if (date)        filter.date     = date;
    if (calendarId)  filter.calendar = calendarId;
    if (isAllDay !== undefined) filter.isAllDay = isAllDay === "true";

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate)   filter.date.$lte = endDate;
    }

    const events = await Event.find(filter)
      .populate("createdBy", "name email")
      .populate("calendar", "name color")
      .sort({ date: 1, startHour: 1, startMinute: 1 });

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("calendar", "name color");

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Check access
    const accessQuery = await buildAccessQuery(req.user.id, req.user.role);
    if (Object.keys(accessQuery).length > 0) {
      const hasAccess = await Event.findOne({ _id: req.params.id, ...accessQuery });
      if (!hasAccess) return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    // Validate calendar membership if a calendar is specified
    if (req.body.calendar) {
      const calendar = await Calendar.findById(req.body.calendar);
      if (!calendar) {
        return res.status(404).json({ success: false, message: "Calendar not found" });
      }
      const isMember =
        calendar.owner.toString() === req.user.id ||
        calendar.members.map(String).includes(req.user.id);
      if (!isMember && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Not a member of this calendar" });
      }
    }

    const event = await Event.create(req.body);

    // Return the event with the same populated shape a GET /events returns, so
    // the client can drop the freshly-saved event straight into its list with
    // full creator/calendar details — no refetch (page refresh) needed.
    await event.populate([
      { path: "createdBy", select: "name email" },
      { path: "calendar", select: "name color" },
    ]);

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (creator or calendar owner or admin)
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const isCreator = event.createdBy.toString() === req.user.id;
    const isAdmin   = req.user.role === "admin";

    let isCalendarOwner = false;
    if (event.calendar) {
      const cal = await Calendar.findById(event.calendar);
      isCalendarOwner = cal && cal.owner.toString() === req.user.id;
    }

    if (!isCreator && !isCalendarOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to update this event" });
    }

    // Prevent changing the creator
    delete req.body.createdBy;

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email")
      .populate("calendar", "name color");

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (creator or calendar owner or admin)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const isCreator = event.createdBy.toString() === req.user.id;
    const isAdmin   = req.user.role === "admin";

    let isCalendarOwner = false;
    if (event.calendar) {
      const cal = await Calendar.findById(event.calendar);
      isCalendarOwner = cal && cal.owner.toString() === req.user.id;
    }

    if (!isCreator && !isCalendarOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent };
