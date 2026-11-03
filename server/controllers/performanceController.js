const Performance = require("../models/Performance");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const User = require("../models/User");

const calculatePerformance = async (employeeId) => {
  const attendance = await Attendance.find({
    employee: employeeId,
  });

  const totalDays = attendance.length;

  if (totalDays === 0) {
    return {
      attendanceScore: 0,
      punctualityScore: 0,
      productivityScore: 0,
      workloadScore: 0,
      overallScore: 0,
    };
  }

  const presentDays = attendance.filter(
    (a) =>
      a.status === "Present" ||
      a.status === "Late"
  ).length;

  const lateDays = attendance.filter(
    (a) => a.status === "Late"
  ).length;

  const attendanceScore = Math.round(
    (presentDays / totalDays) * 100
  );

  const punctualityScore = Math.round(
    ((totalDays - lateDays) / totalDays) * 100
  );

  const productivityScores = attendance.map(
    (a) => a.productivityScore || 0
  );

  const productivityScore = Math.round(
    productivityScores.reduce(
      (sum, score) => sum + score,
      0
    ) / totalDays
  );

  const totalOvertime = attendance.reduce(
    (sum, a) => sum + (a.overtimeHours || 0),
    0
  );

  const workloadScore = Math.min(
    100,
    Math.round(
      70 + totalOvertime * 3
    )
  );

  // Overall automatic score
  const overallScore = Math.round(
    attendanceScore * 0.30 +
      punctualityScore * 0.20 +
      productivityScore * 0.30 +
      workloadScore * 0.20
  );

  return {
    attendanceScore,
    punctualityScore,
    productivityScore,
    workloadScore,
    overallScore,
  };
};

// HR gets employee performance
const getEmployeePerformance = async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.employeeId,
      role: "employee",
    }).select("-password");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    const calculated =
      await calculatePerformance(
        employee._id
      );

    const existing =
      await Performance.findOne({
        employee: employee._id,
      });

    res.json({
      employee,
      calculatedPerformance: calculated,
      hrEvaluation: existing || null,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load employee performance.",
    });
  }
};

// HR gives score and feedback
const updateEmployeePerformance = async (
  req,
  res
) => {
  try {
    const {
      hrScore,
      hrFeedback,
    } = req.body;

    const employee = await User.findOne({
      _id: req.params.employeeId,
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    const calculated =
      await calculatePerformance(
        employee._id
      );

    const finalHRScore =
      Math.min(
        100,
        Math.max(
          0,
          Number(hrScore) || 0
        )
      );

    // Automatic score 90% + HR evaluation 10%
    const overallScore = Math.round(
      calculated.overallScore * 0.90 +
        finalHRScore * 0.10
    );

    const performance =
      await Performance.findOneAndUpdate(
        {
          employee: employee._id,
        },
        {
          employee: employee._id,

          attendanceScore:
            calculated.attendanceScore,

          punctualityScore:
            calculated.punctualityScore,

          productivityScore:
            calculated.productivityScore,

          workloadScore:
            calculated.workloadScore,

          hrScore: finalHRScore,

          overallScore,

          hrFeedback:
            hrFeedback || "",

          evaluatedBy:
            req.user._id,

          evaluationDate:
            new Date(),
        },
        {
          new: true,
          upsert: true,
        }
      );

    res.json({
      message:
        "Employee performance updated successfully.",

      performance,
    });
  } catch (error) {
    console.error(
      "Performance Error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to update employee performance.",
    });
  }
};

// Employee sees own performance
const getMyPerformance = async (
  req,
  res
) => {
  try {
    const calculated =
      await calculatePerformance(
        req.user._id
      );

    const evaluation =
      await Performance.findOne({
        employee: req.user._id,
      }).populate(
        "evaluatedBy",
        "name email"
      );

    res.json({
      calculatedPerformance:
        calculated,

      hrEvaluation:
        evaluation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Unable to load your performance.",
    });
  }
};

module.exports = {
  getEmployeePerformance,
  updateEmployeePerformance,
  getMyPerformance,
};
