const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");


// DASHBOARD ANALYTICS
const getDashboardAnalytics = async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments({
            status: "Active"
        });

        const totalAttendance = await Attendance.countDocuments({
            attendanceStatus: "Present"
        });

        const totalLeave = await Attendance.countDocuments({
            attendanceStatus: "Leave"
        });

        const totalAbsent = await Attendance.countDocuments({
            attendanceStatus: "Absent"
        });

        const attendanceRecords = await Attendance.find();

        let totalWorkingHours = 0;

        attendanceRecords.forEach(record => {
            totalWorkingHours += record.workingHours || 0;
        });

        const averageWorkingHours =
            attendanceRecords.length > 0
                ? Number(
                    (
                        totalWorkingHours /
                        attendanceRecords.length
                    ).toFixed(2)
                )
                : 0;

        res.json({
            totalEmployees,
            totalAttendance,
            totalLeave,
            totalAbsent,
            averageWorkingHours
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ATTENDANCE ANALYTICS
const getAttendanceAnalytics = async (req, res) => {
    try {
        const data = await Attendance.aggregate([
            {
                $group: {
                    _id: "$attendanceStatus",
                    count: {
                        $sum: 1
                    }
                }
            }
        ]);

        res.json(data);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// PRODUCTIVITY ANALYTICS
const getProductivityAnalytics = async (req, res) => {
    try {
        const data = await Attendance.aggregate([
            {
                $group: {
                    _id: "$employee",
                    averageProductivity: {
                        $avg: "$productivity"
                    },
                    averageWorkingHours: {
                        $avg: "$workingHours"
                    }
                }
            }
        ]);

        res.json(data);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    getDashboardAnalytics,
    getAttendanceAnalytics,
    getProductivityAnalytics
};
