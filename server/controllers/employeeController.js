const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Performance = require("../models/Performance");

const getEmployeeDashboard = async (
  req,
  res
) => {
  try {
    const employeeId = req.user._id;

    const attendanceRecords = await Attendance.find({
  employee: employeeId,
})
  .sort({ date: -1 })
  .lean();

    const leaves = await Leave.find({
      employee: employeeId,
    }).sort({ startDate: -1 });

    const performance =
      await Performance.findOne({
        employee: employeeId,
      });

    const totalDays =
      attendanceRecords.length;

    const presentDays =
      attendanceRecords.filter(
        (a) => a.status === "Present"
      ).length;

    const absentDays =
      attendanceRecords.filter(
        (a) => a.status === "Absent"
      ).length;

    const lateDays =
      attendanceRecords.filter(
        (a) => a.status === "Late"
      ).length;

    const leaveDays =
      attendanceRecords.filter(
        (a) => a.status === "On Leave"
      ).length;

    const overtimeHours =
      attendanceRecords.reduce(
        (total, attendance) =>
          total +
          (attendance.overtimeHours || 0),
        0
      );

    const totalWorkingHours =
      attendanceRecords.reduce(
        (total, attendance) =>
          total +
          (attendance.workingHours || 0),
        0
      );

    const averageProductivity =
      totalDays > 0
        ? Math.round(
            attendanceRecords.reduce(
              (total, attendance) =>
                total +
                (attendance.productivityScore ||
                  0),
              0
            ) / totalDays
          )
        : 0;

    const attendancePercentage =
      totalDays > 0
        ? Math.round(
            (presentDays / totalDays) *
              100
          )
        : 0;

    const approvedLeaves =
      leaves.filter(
        (leave) =>
          leave.status === "Approved"
      ).length;

    const pendingLeaves =
      leaves.filter(
        (leave) =>
          leave.status === "Pending"
      ).length;

    res.json({
      employee: {
        id: req.user._id,
        employeeId:
          req.user.employeeId,
        name: req.user.name,
        email: req.user.email,
        department:
          req.user.department,
        designation:
          req.user.designation,
        joiningDate:
          req.user.joiningDate,
      },

      statistics: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        overtimeHours:
          Number(
            overtimeHours.toFixed(2)
          ),
        totalWorkingHours:
          Number(
            totalWorkingHours.toFixed(2)
          ),
        averageProductivity,
        attendancePercentage,
        approvedLeaves,
        pendingLeaves,
      },

      performance,

      attendance:
        attendanceRecords,

      leaves,
    });
  } catch (error) {
    console.error(
      "Employee Dashboard Error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to load employee dashboard.",
    });
  }
};

module.exports = {
  getEmployeeDashboard,
};
