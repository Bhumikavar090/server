const express = require("express");

const {
  getIssueActivity,
  createActivity,
} = require("../controllers/activityController");

const router = express.Router();

router.get(
  "/:issueId/activity",
  getIssueActivity
);

router.post(
  "/:issueId/activity",
  createActivity
);

module.exports = router;
