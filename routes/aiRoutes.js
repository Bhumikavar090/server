const express = require("express");

const {
  analyzeIssueController,
  analyzeFindingsController,
} = require("../controllers/aiController");

const router = express.Router();

router.post(
  "/issues/:id/analyze",
  analyzeIssueController
);

router.post(
  "/issues/:id/analyze-findings",
  analyzeFindingsController
);

module.exports = router;