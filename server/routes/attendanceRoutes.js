const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  createAttendance,
  verifyAttendance,
  rejectAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

// =========================
// EMPLOYEE ROUTES
// =========================

// Employee check-in
router.post(
  "/check-in",
  protect,
  allowRoles("employee"),
  checkIn
);

// Employee check-out
router.post(
  "/check-out",
  protect,
  allowRoles("employee"),
  checkOut
);

// Employee views their own attendance
router.get(
  "/my",
  protect,
  allowRoles("employee"),
  getMyAttendance
);

// =========================
// HR ROUTES
// =========================

// HR views all attendance records
router.get(
  "/all",
  protect,
  allowRoles("hr"),
  getAllAttendance
);

// HR manually creates an attendance record
router.post(
  "/create",
  protect,
  allowRoles("hr"),
  createAttendance
);

// HR approves attendance
router.patch(
  "/:id/verify",
  protect,
  allowRoles("hr"),
  verifyAttendance
);

// HR rejects attendance
router.patch(
  "/:id/reject",
  protect,
  allowRoles("hr"),
  rejectAttendance
);

module.exports = router;
