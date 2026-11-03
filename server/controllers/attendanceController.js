
const Attendance = require("../models/Attendance");
const User = require("../models/User");

// =====================================================
// DATE HELPERS — INDIA STANDARD TIME
// =====================================================

// Get today's date in India Standard Time
const getIndiaDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// Get the start and end of today in IST
const getTodayRange = () => {
  const today = getIndiaDateString();

  const start = new Date(`${today}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
};

// =====================================================
// WORKING HOURS CALCULATION
// =====================================================

// Example: 17 hours 58 minutes = 17.97 decimal hours
const calculateWorkingDuration = (checkIn, checkOut) => {
  const startTime = new Date(checkIn).getTime();
  const endTime = new Date(checkOut).getTime();

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return {
      totalMinutes: 0,
      workingHours: 0,
      overtimeHours: 0,
    };
  }

  const totalMinutes = Math.floor(
    (endTime - startTime) / 60000
  );

  const workingHours = Number(
    (totalMinutes / 60).toFixed(2)
  );

  const overtimeMinutes = Math.max(
    0,
    totalMinutes - 8 * 60
  );

  const overtimeHours = Number(
    (overtimeMinutes / 60).toFixed(2)
  );

  return {
    totalMinutes,
    workingHours,
    overtimeHours,
  };
};

// =====================================================
// EMPLOYEE: CHECK IN
// =====================================================

const checkIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { start, end } = getTodayRange();

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: start, $lt: end },
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        message: "You have already checked in today.",
      });
    }

    if (
      attendance &&
      attendance.verificationStatus === "Rejected"
    ) {
      return res.status(400).json({
        message:
          "Your attendance was rejected. Please contact HR.",
      });
    }

    const now = new Date();
    const today = getIndiaDateString(now);

    // 9:15 AM IST is the late-arrival threshold.
    const lateTime = new Date(
      `${today}T09:15:00+05:30`
    );

    const status = now > lateTime ? "Late" : "Present";

    if (!attendance) {
      attendance = await Attendance.create({
        employee: employeeId,
        date: start,
        checkIn: now,
        status,
        verificationStatus: "Pending",
      });
    } else {
      attendance.checkIn = now;
      attendance.status = status;
      attendance.verificationStatus = "Pending";
      attendance.verifiedBy = null;
      attendance.verifiedAt = null;
      attendance.rejectionReason = "";

      await attendance.save();
    }

    return res.json({
      message:
        "Check-in recorded. Attendance is pending HR verification.",
      attendance,
    });
  } catch (error) {
    console.error("Check-in Error:", error);

    return res.status(500).json({
      message: "Unable to record check-in.",
    });
  }
};

// =====================================================
// EMPLOYEE: CHECK OUT
// =====================================================

const checkOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: start, $lt: end },
    });

    if (!attendance) {
      return res.status(404).json({
        message: "No check-in record found for today.",
      });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({
        message: "You must check in first.",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "You have already checked out today.",
      });
    }

    if (attendance.verificationStatus === "Rejected") {
      return res.status(400).json({
        message:
          "This attendance was rejected. Please contact HR.",
      });
    }

    const now = new Date();

    if (now <= new Date(attendance.checkIn)) {
      return res.status(400).json({
        message: "Check-out time must be after check-in.",
      });
    }

    attendance.checkOut = now;

    const duration = calculateWorkingDuration(
      attendance.checkIn,
      attendance.checkOut
    );

    attendance.workingHours = duration.workingHours;
    attendance.overtimeHours = duration.overtimeHours;

    // Completed attendance awaits HR's decision.
    attendance.status =
      new Date(attendance.checkIn) >
      new Date(
        `${getIndiaDateString(attendance.checkIn)}T09:15:00+05:30`
      )
        ? "Late"
        : "Present";

    attendance.verificationStatus = "Pending";
    attendance.verifiedBy = null;
    attendance.verifiedAt = null;
    attendance.rejectionReason = "";

    await attendance.save();

    return res.json({
      message:
        "Check-out recorded. Attendance is pending HR verification.",
      attendance,
    });
  } catch (error) {
    console.error("Check-out Error:", error);

    return res.status(500).json({
      message: "Unable to record check-out.",
    });
  }
};

// =====================================================
// EMPLOYEE: VIEW OWN ATTENDANCE HISTORY
// =====================================================

const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      employee: req.user._id,
    }).sort({ date: -1 });

    return res.json(attendance);
  } catch (error) {
    console.error("Get My Attendance Error:", error);

    return res.status(500).json({
      message: "Unable to load attendance.",
    });
  }
};

// =====================================================
// HR: VIEW ALL ATTENDANCE RECORDS
// =====================================================

const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate(
        "employee",
        "employeeId name email department designation"
      )
      .populate(
        "verifiedBy",
        "name email employeeId role"
      )
      .sort({ date: -1 });

    return res.json(attendance);
  } catch (error) {
    console.error("Get All Attendance Error:", error);

    return res.status(500).json({
      message: "Unable to load attendance.",
    });
  }
};

// =====================================================
// HR: VALIDATE ATTENDANCE BEFORE REVIEW
// =====================================================

const findPendingCompletedAttendance = async (
  id,
  res
) => {
  const attendance = await Attendance.findById(id);

  if (!attendance) {
    res.status(404).json({
      message: "Attendance record not found.",
    });

    return null;
  }

  if (attendance.verificationStatus !== "Pending") {
    res.status(400).json({
      message:
        "Only pending attendance records can be reviewed.",
    });

    return null;
  }

  if (!attendance.checkIn || !attendance.checkOut) {
    res.status(400).json({
      message:
        "Attendance can only be reviewed after check-out.",
    });

    return null;
  }

  return attendance;
};

// =====================================================
// HR: VERIFY ATTENDANCE
// Preserves Present or Late status
// =====================================================

const verifyAttendance = async (req, res) => {
  try {
    const attendance =
      await findPendingCompletedAttendance(
        req.params.id,
        res
      );

    if (!attendance) return;

    attendance.verificationStatus = "Verified";
    attendance.verifiedBy = req.user._id;
    attendance.verifiedAt = new Date();
    attendance.rejectionReason = "";

    await attendance.save();

    return res.json({
      message: "Attendance verified successfully.",
      attendance,
    });
  } catch (error) {
    console.error("Verify Attendance Error:", error);

    return res.status(500).json({
      message: "Unable to verify attendance.",
    });
  }
};

// =====================================================
// HR: MARK ATTENDANCE AS HALF DAY
// Only HR can call this protected route.
// =====================================================

const markHalfDay = async (req, res) => {
  try {
    const attendance =
      await findPendingCompletedAttendance(
        req.params.id,
        res
      );

    if (!attendance) return;

    attendance.status = "Half Day";
    attendance.verificationStatus = "Verified";
    attendance.verifiedBy = req.user._id;
    attendance.verifiedAt = new Date();
    attendance.rejectionReason = "";

    await attendance.save();

    return res.json({
      message:
        "Attendance marked as Half Day successfully.",
      attendance,
    });
  } catch (error) {
    console.error("Mark Half Day Error:", error);

    return res.status(500).json({
      message:
        "Unable to mark attendance as Half Day.",
    });
  }
};

// =====================================================
// HR: REJECT ATTENDANCE
// Rejection automatically marks attendance Absent.
// =====================================================

const rejectAttendance = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (
      typeof rejectionReason !== "string" ||
      !rejectionReason.trim()
    ) {
      return res.status(400).json({
        message: "Please provide a rejection reason.",
      });
    }

    const attendance =
      await findPendingCompletedAttendance(
        req.params.id,
        res
      );

    if (!attendance) return;

    // HR rejection automatically makes the attendance Absent.
    attendance.status = "Absent";
    attendance.verificationStatus = "Rejected";
    attendance.rejectionReason =
      rejectionReason.trim();
    attendance.verifiedBy = req.user._id;
    attendance.verifiedAt = new Date();

    await attendance.save();

    return res.status(200).json({
      message:
        "Attendance rejected and marked Absent.",
      attendance,
    });
  } catch (error) {
    console.error("Reject Attendance Error:", error);

    return res.status(500).json({
      message: "Unable to reject attendance.",
    });
  }
};

// =====================================================
// HR: MANUALLY CREATE ATTENDANCE
// =====================================================

const createAttendance = async (req, res) => {
  try {
    const {
      employee,
      date,
      status,
      checkIn,
      checkOut,
      productivityScore,
      notes,
    } = req.body;

    if (!employee || !date) {
      return res.status(400).json({
        message: "Employee and date are required.",
      });
    }

    const employeeExists = await User.findOne({
      _id: employee,
      role: "employee",
    });

    if (!employeeExists) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    const attendanceDate = new Date(date);

    if (Number.isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        message: "Invalid attendance date.",
      });
    }

    const inTime = checkIn
      ? new Date(checkIn)
      : null;

    const outTime = checkOut
      ? new Date(checkOut)
      : null;

    if (
      (inTime &&
        Number.isNaN(inTime.getTime())) ||
      (outTime &&
        Number.isNaN(outTime.getTime()))
    ) {
      return res.status(400).json({
        message:
          "Invalid check-in or check-out time.",
      });
    }

    if (
      inTime &&
      outTime &&
      outTime <= inTime
    ) {
      return res.status(400).json({
        message:
          "Check-out must be after check-in.",
      });
    }

    let workingHours = 0;
    let overtimeHours = 0;

    if (inTime && outTime) {
      const duration = calculateWorkingDuration(
        inTime,
        outTime
      );

      workingHours = duration.workingHours;
      overtimeHours = duration.overtimeHours;
    }

    const hasCompleteTimes = Boolean(
      inTime && outTime
    );

    const attendance = await Attendance.create({
      employee,
      date: attendanceDate,
      status: status || "Present",
      checkIn: inTime,
      checkOut: outTime,
      workingHours,
      overtimeHours,
      productivityScore:
        productivityScore ?? 0,
      notes: notes || "",
      verificationStatus: hasCompleteTimes
        ? "Verified"
        : "Pending",
      verifiedBy: hasCompleteTimes
        ? req.user._id
        : null,
      verifiedAt: hasCompleteTimes
        ? new Date()
        : null,
    });

    return res.status(201).json({
      message: "Attendance record created.",
      attendance,
    });
  } catch (error) {
    console.error("Create Attendance Error:", error);

    return res.status(500).json({
      message: "Unable to create attendance.",
    });
  }
};

// =====================================================
// EXPORT CONTROLLER FUNCTIONS
// =====================================================

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  createAttendance,
  verifyAttendance,
  rejectAttendance,
  markHalfDay,
};
