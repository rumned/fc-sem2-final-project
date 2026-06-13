const express = require("express");
const router = express.Router();
const { getCalendars, getCalendar, createCalendar, updateCalendar, deleteCalendar, assignMember, removeMember } = require("../controllers/calendarController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/")
  .get(getCalendars)
  .post(createCalendar);

router.route("/:id")
  .get(getCalendar)
  .put(updateCalendar)
  .delete(deleteCalendar);

// Direct member management (admin only — enforced in the controller)
router.post("/:id/members", assignMember);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;