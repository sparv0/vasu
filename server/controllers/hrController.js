const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Performance = require("../models/Performance");

// =====================================================
// GET TODAY'S DATE RANGE IN INDIA (IST)
// =====================================================

const getTodayRange = () => {
  const now = new Date();

  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // Start of today in IST
  const start = new Date(`${istDate}T00:00:00+05:30`);

  // Start of tomorrow in IST
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start,
    end,
  };
};

// =====================================================
// HR DASHBOARD
// =====================================================

const getHRDashboard = async (req, res) => {
  try {
    // -------------------------------------------------
    // TOTAL EMPLOYEES
    // -------------------------------------------------

    const totalEmployees = await User.countDocuments({
      role: "employee",
    });

    const activeEmployees = await User.countDocuments({
      role: "employee",
      isActive: true,
    });

    // -------------------------------------------------
    // TODAY'S DATE RANGE
    // -------------------------------------------------

    const { start, end } = getTodayRange();

    console.log("=================================");
    console.log("HR DASHBOARD");
    console.log("Today Start:", start);
    console.log("Today End:", end);

    // -------------------------------------------------
    // TODAY'S ATTENDANCE
    // -------------------------------------------------

    const todayAttendance = await Attendance.find({
      date: {
        $gte: start,
        $lt: end,
      },
    }).populate(
      "employee",
      "name employeeId email"
    );

    console.log(
      "Attendance Records Found:",
      todayAttendance.length
    );

    todayAttendance.forEach((record) => {
      console.log({
        employee:
          record.employee?.name ||
          record.employee,
        employeeId:
          record.employee?.employeeId,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
      });
    });

    // -------------------------------------------------
    // PRESENT TODAY
    // Present means Present OR Late
    // -------------------------------------------------

    const present = todayAttendance.filter((attendance) => {
      const status = String(attendance.status || "")
        .trim()
        .toLowerCase();

      return (
        status === "present" ||
        status === "late"
      );
    }).length;

    // -------------------------------------------------
    // LATE TODAY
    // -------------------------------------------------

    const late = todayAttendance.filter((attendance) => {
      const status = String(attendance.status || "")
        .trim()
        .toLowerCase();

      return status === "late";
    }).length;

    // -------------------------------------------------
    // APPROVED LEAVE TODAY
    // -------------------------------------------------

    const onLeave = await Leave.countDocuments({
      status: "Approved",
      startDate: {
        $lte: end,
      },
      endDate: {
        $gte: start,
      },
    });

    // -------------------------------------------------
    // ABSENT TODAY
    //
    // Employees who are neither present nor on leave.
    // -------------------------------------------------

    const absent = Math.max(
      0,
      totalEmployees - present - onLeave
    );

    // -------------------------------------------------
    // OVERTIME
    // -------------------------------------------------

    const overtime = todayAttendance.reduce(
      (total, attendance) =>
        total +
        (attendance.overtimeHours || 0),
      0
    );

    // -------------------------------------------------
    // PRODUCTIVITY
    // -------------------------------------------------

    const productivity =
      todayAttendance.length > 0
        ? Math.round(
            todayAttendance.reduce(
              (total, attendance) =>
                total +
                (attendance.productivityScore || 0),
              0
            ) / todayAttendance.length
          )
        : 0;

    // -------------------------------------------------
    // LEAVE COUNTS
    // -------------------------------------------------

    const pendingLeaves =
      await Leave.countDocuments({
        status: "Pending",
      });

    const approvedLeaves =
      await Leave.countDocuments({
        status: "Approved",
      });

    // -------------------------------------------------
    // PERFORMANCE
    // -------------------------------------------------

    const performance =
      await Performance.find();

    const averagePerformance =
      performance.length > 0
        ? Math.round(
            performance.reduce(
              (sum, performanceRecord) =>
                sum +
                (performanceRecord.overallScore || 0),
              0
            ) / performance.length
          )
        : 0;

    // -------------------------------------------------
    // FINAL DEBUG
    // -------------------------------------------------

    console.log("------ DASHBOARD TOTALS ------");
    console.log(
      "Total Employees:",
      totalEmployees
    );
    console.log(
      "Active Employees:",
      activeEmployees
    );
    console.log("Present:", present);
    console.log("Late:", late);
    console.log("Absent:", absent);
    console.log("On Leave:", onLeave);
    console.log(
      "Overtime:",
      Number(overtime.toFixed(2))
    );
    console.log(
      "Productivity:",
      productivity
    );
    console.log(
      "Pending Leaves:",
      pendingLeaves
    );
    console.log(
      "Approved Leaves:",
      approvedLeaves
    );
    console.log(
      "Average Performance:",
      averagePerformance
    );
    console.log(
      "================================="
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    res.json({
      totalEmployees,
      activeEmployees,

      // Present includes both Present + Late
      present,

      absent,
      late,
      onLeave,

      overtime: Number(
        overtime.toFixed(2)
      ),

      productivity,

      pendingLeaves,
      approvedLeaves,

      averagePerformance,
    });
  } catch (error) {
    console.error(
      "HR Dashboard Error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to load HR dashboard.",
    });
  }
};

// =====================================================
// GET ALL EMPLOYEES
// =====================================================

const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
    })
      .select("-password")
      .sort({ name: 1 });

    const employeesWithStats =
      await Promise.all(
        employees.map(
          async (employee) => {
            const attendance =
              await Attendance.find({
                employee:
                  employee._id,
              });

            const performance =
              await Performance.findOne({
                employee:
                  employee._id,
              });

            // Present includes Present + Late
            const present =
              attendance.filter(
                (attendanceRecord) => {
                  const status = String(
                    attendanceRecord.status || ""
                  )
                    .trim()
                    .toLowerCase();

                  return (
                    status === "present" ||
                    status === "late"
                  );
                }
              ).length;

            const absent =
              attendance.filter(
                (attendanceRecord) => {
                  const status = String(
                    attendanceRecord.status || ""
                  )
                    .trim()
                    .toLowerCase();

                  return (
                    status === "absent"
                  );
                }
              ).length;

            const late =
              attendance.filter(
                (attendanceRecord) => {
                  const status = String(
                    attendanceRecord.status || ""
                  )
                    .trim()
                    .toLowerCase();

                  return (
                    status === "late"
                  );
                }
              ).length;

            const overtime =
              attendance.reduce(
                (
                  sum,
                  attendanceRecord
                ) =>
                  sum +
                  (attendanceRecord.overtimeHours ||
                    0),
                0
              );

            return {
              ...employee.toObject(),

              statistics: {
                totalDays:
                  attendance.length,

                presentDays:
                  present,

                absentDays:
                  absent,

                lateDays:
                  late,

                overtimeHours:
                  Number(
                    overtime.toFixed(2)
                  ),
              },

              performance:
                performance || null,
            };
          }
        )
      );

    res.json(
      employeesWithStats
    );
  } catch (error) {
    console.error(
      "Employees Error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to load employees.",
    });
  }
};

// =====================================================
// GET EMPLOYEE DETAILS
// =====================================================

const getEmployeeDetails =
  async (req, res) => {
    try {
      const employee =
        await User.findOne({
          _id: req.params.id,
          role: "employee",
        }).select("-password");

      if (!employee) {
        return res.status(404).json({
          message:
            "Employee not found.",
        });
      }

      const attendance =
        await Attendance.find({
          employee:
            employee._id,
        }).sort({
          date: -1,
        });

      const leaves =
        await Leave.find({
          employee:
            employee._id,
        }).sort({
          startDate: -1,
        });

      const performance =
        await Performance.findOne({
          employee:
            employee._id,
        }).populate(
          "evaluatedBy",
          "name email"
        );

      res.json({
        employee,
        attendance,
        leaves,
        performance,
      });
    } catch (error) {
      console.error(
        "Employee Details Error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to load employee details.",
      });
    }
  };

module.exports = {
  getHRDashboard,
  getEmployees,
  getEmployeeDetails,
};
