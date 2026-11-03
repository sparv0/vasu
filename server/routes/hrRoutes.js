const express = require("express");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const {
  getHRDashboard,
  getEmployees,
  getEmployeeDetails,
} = require("../controllers/hrController");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  allowRoles("hr"),
  getHRDashboard
);

router.get(
  "/employees",
  protect,
  allowRoles("hr"),
  getEmployees
);

router.get(
  "/employees/:id",
  protect,
  allowRoles("hr"),
  getEmployeeDetails
);

module.exports = router;