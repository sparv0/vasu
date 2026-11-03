const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require("../controllers/leaveController");

const router = express.Router();

// Employee
router.post(
  "/apply",
  protect,
  allowRoles("employee"),
  applyLeave
);

router.get(
  "/my",
  protect,
  allowRoles("employee"),
  getMyLeaves
);

// HR
router.get(
  "/all",
  protect,
  allowRoles("hr"),
  getAllLeaves
);

router.put(
  "/:id/status",
  protect,
  allowRoles("hr"),
  updateLeaveStatus
);

module.exports = router;
