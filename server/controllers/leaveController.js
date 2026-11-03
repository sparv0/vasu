const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");

const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const difference = end - start;

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
};

// Employee applies for leave
const applyLeave = async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        message: "All leave fields are required.",
      });
    }

    const numberOfDays = calculateDays(
      startDate,
      endDate
    );

    if (numberOfDays <= 0) {
      return res.status(400).json({
        message: "Invalid leave dates.",
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
    });

    res.status(201).json({
      message: "Leave request submitted successfully.",
      leave,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error);

    res.status(500).json({
      message: "Unable to submit leave request.",
    });
  }
};

// Employee sees own leaves
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employee: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load leaves.",
    });
  }
};

// HR sees all leaves
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate(
        "employee",
        "employeeId name email department designation"
      )
      .populate(
        "reviewedBy",
        "name email"
      )
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load leave requests.",
    });
  }
};

// HR approves/rejects leave
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, hrComment } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid leave status.",
      });
    }

    const leave = await Leave.findById(
      req.params.id
    );

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found.",
      });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.hrComment = hrComment || "";

    await leave.save();

    // If approved, create attendance records as On Leave
    if (status === "Approved") {
      const currentDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      currentDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      while (currentDate <= endDate) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);

        await Attendance.findOneAndUpdate(
          {
            employee: leave.employee,
            date: {
              $gte: currentDate,
              $lt: nextDay,
            },
          },
          {
            employee: leave.employee,
            date: currentDate,
            status: "On Leave",
            checkIn: null,
            checkOut: null,
            workingHours: 0,
            overtimeHours: 0,
          },
          {
            upsert: true,
            new: true,
          }
        );

        currentDate.setDate(
          currentDate.getDate() + 1
        );
      }
    }

    res.json({
      message: `Leave ${status.toLowerCase()} successfully.`,
      leave,
    });
  } catch (error) {
    console.error("Update Leave Error:", error);

    res.status(500).json({
      message: "Unable to update leave request.",
    });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};
