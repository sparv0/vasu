const express = require("express");

const {
    getDashboardAnalytics,
    getAttendanceAnalytics,
    getProductivityAnalytics
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/dashboard", getDashboardAnalytics);

router.get("/attendance", getAttendanceAnalytics);

router.get("/productivity", getProductivityAnalytics);

module.exports = router;
