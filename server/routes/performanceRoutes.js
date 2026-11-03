const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getEmployeePerformance,
  updateEmployeePerformance,
  getMyPerformance,
} = require("../controllers/performanceController");

const router = express.Router();

// Employee
router.get(
  "/my",
  protect,
  allowRoles("employee"),
  getMyPerformance
);

// HR
router.get(
  "/employee/:employeeId",
  protect,
  allowRoles("hr"),
  getEmployeePerformance
);

router.put(
  "/employee/:employeeId",
  protect,
  allowRoles("hr"),
  updateEmployeePerformance
);

module.exports = router;
