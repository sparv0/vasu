const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getEmployeeDashboard,
} = require("../controllers/employeeController");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  allowRoles("employee"),
  getEmployeeDashboard
);

module.exports = router;
