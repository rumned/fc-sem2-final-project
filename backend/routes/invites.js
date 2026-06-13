const express = require("express");
const router = express.Router();
const { getInvites, sendInvite, respondInvite, deleteInvite } = require("../controllers/inviteController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/")
  .get(getInvites)
  .post(sendInvite);

router.route("/:id")
  .put(respondInvite)
  .delete(deleteInvite);

module.exports = router;
