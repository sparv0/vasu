
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import AttendanceChart from "../components/AttendanceChart";
import ProductivityChart from "../components/ProductivityChart";

import {
  getHRDashboard,
  getEmployees,
  getAllAttendance,
  verifyAttendance,
  rejectAttendance,
  markHalfDay,
} from "../services/api";

function HRDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // Load dashboard statistics, employees, and attendance records.
  const loadData = useCallback(async () => {
    setError("");
    setAttendanceError("");

    try {
      const results = await Promise.allSettled([
        getHRDashboard(),
        getEmployees(),
        getAllAttendance(),
      ]);

      const [dashboardResult, employeesResult, attendanceResult] =
        results;

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      } else {
        console.error(
          "Unable to load HR dashboard:",
          dashboardResult.reason
        );
        setError(
          dashboardResult.reason?.message ||
            "Unable to load dashboard statistics."
        );
      }

      if (employeesResult.status === "fulfilled") {
        setEmployees(
          Array.isArray(employeesResult.value)
            ? employeesResult.value
            : employeesResult.value?.employees || []
        );
      } else {
        console.error(
          "Unable to load employees:",
          employeesResult.reason
        );
      }

      if (attendanceResult.status === "fulfilled") {
        const result = attendanceResult.value;

        setAttendanceRecords(
          Array.isArray(result)
            ? result
            : result?.attendance ||
                result?.records ||
                []
        );
      } else {
        console.error(
          "Unable to load attendance:",
          attendanceResult.reason
        );
        setAttendanceError(
          attendanceResult.reason?.message ||
            "Unable to load attendance records. Please check the attendance API."
        );
      }
    } catch (err) {
      console.error("Error loading HR dashboard:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Automatically refresh the dashboard every 30 seconds.
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Format dates consistently for the HR table.
  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  // Format timestamps for check-in/check-out.
  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const formatHours = (value) => {
    const hours = Number(value);

    return Number.isFinite(hours) ? `${hours.toFixed(2)} h` : "—";
  };

  const getEmployeeName = (record) => {
    const employee =
      record.employeeId && typeof record.employeeId === "object"
        ? record.employeeId
        : record.employee ||
          record.userId ||
          {};

    return (
      employee.name ||
      record.employeeName ||
      record.name ||
      "Unknown Employee"
    );
  };

  const getEmployeeCode = (record) => {
    const employee =
      record.employeeId && typeof record.employeeId === "object"
        ? record.employeeId
        : record.employee ||
          record.userId ||
          {};

    return (
      employee.employeeId ||
      employee.empId ||
      record.employeeCode ||
      "—"
    );
  };

  const getDepartment = (record) => {
    const employee =
      record.employeeId && typeof record.employeeId === "object"
        ? record.employeeId
        : record.employee ||
          record.userId ||
          {};

    return employee.department || record.department || "—";
  };

  const getVerificationStatus = (record) => {
    if (record.verificationStatus) {
      return record.verificationStatus;
    }

    // Compatibility with older records that may not have this field.
    if (
      record.status === "Rejected" ||
      record.status === "Verified"
    ) {
      return record.status;
    }

    return "Pending";
  };

  const isCompletedAttendance = (record) => {
    return Boolean(record.checkIn && record.checkOut);
  };

  const isPendingReview = (record) => {
    return (
      getVerificationStatus(record).toLowerCase() === "pending" &&
      isCompletedAttendance(record)
    );
  };

  const pendingReviews = attendanceRecords.filter(isPendingReview);

  // Keep existing employee-performance calculations.
  const productivityData = employees
    .filter((employee) => employee.performance)
    .slice(0, 8)
    .map((employee) => ({
      name: employee.name?.split(" ")[0] || "Employee",
      score: employee.performance?.overallScore || 0,
    }));

  const topEmployees = [...employees]
    .sort(
      (a, b) =>
        (b.performance?.overallScore || 0) -
        (a.performance?.overallScore || 0)
    )
    .slice(0, 5);

  // Keep the existing attendance chart.
  const attendanceChart = [
    {
      date: "Today",
      present: dashboard?.present || 0,
      absent: dashboard?.absent || 0,
    },
  ];

  // HR action: approve an attendance request.
  const handleVerify = async (record) => {
    const recordId = record._id;

    if (!recordId || !isPendingReview(record)) {
      return;
    }

    const confirmed = window.confirm(
      `Verify attendance for ${getEmployeeName(record)}?`
    );

    if (!confirmed) return;

    setActionLoading(recordId);
    setSuccessMessage("");
    setAttendanceError("");

    try {
      await verifyAttendance(recordId);

      setSuccessMessage(
        `Attendance verified for ${getEmployeeName(record)}.`
      );

      await loadData();
    } catch (err) {
      console.error("Attendance verification failed:", err);
      setAttendanceError(
        err.message || "Unable to verify this attendance request."
      );
    } finally {
      setActionLoading("");
    }
  };

  // HR action: mark an attendance request as Half Day.
  const handleHalfDay = async (record) => {
    const recordId = record._id;

    if (!recordId || !isPendingReview(record)) {
      return;
    }

    const confirmed = window.confirm(
      `Mark attendance for ${getEmployeeName(record)} as Half Day?`
    );

    if (!confirmed) return;

    setActionLoading(recordId);
    setSuccessMessage("");
    setAttendanceError("");

    try {
      await markHalfDay(recordId);

      setSuccessMessage(
        `Attendance for ${getEmployeeName(record)} has been marked Half Day.`
      );

      await loadData();
    } catch (err) {
      console.error("Mark Half Day failed:", err);
      setAttendanceError(
        err.message || "Unable to mark this attendance as Half Day."
      );
    } finally {
      setActionLoading("");
    }
  };

  // HR action: reject an attendance request with a required reason.
  const handleReject = async (record) => {
    const recordId = record._id;

    if (!recordId || !isPendingReview(record)) {
      return;
    }

    const rejectionReason = window.prompt(
      `Enter the reason for rejecting ${getEmployeeName(record)}'s attendance request:`
    );

    // Cancelled prompt: do not submit anything.
    if (rejectionReason === null) return;

    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      window.alert("Please enter a rejection reason.");
      return;
    }

    setActionLoading(recordId);
    setSuccessMessage("");
    setAttendanceError("");

    try {
      await rejectAttendance(recordId, trimmedReason);

      setSuccessMessage(
        `Attendance rejected for ${getEmployeeName(record)}.`
      );

      await loadData();
    } catch (err) {
      console.error("Attendance rejection failed:", err);
      setAttendanceError(
        err.message || "Unable to reject this attendance request."
      );
    } finally {
      setActionLoading("");
    }
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "Pending")
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `status-pill status-${normalized}`;
  };

  // Loading screen.
  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <div className="loading-screen">
            Loading HR analytics...
          </div>
        </main>
      </div>
    );
  }

  // Preserve the dashboard error screen and retry option.
  if (error && !dashboard) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <div className="error-screen">
            <h2>Unable to load dashboard</h2>
            <p>{error}</p>

            <button
              onClick={loadData}
              className="primary-button"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        {/* TOP BAR */}
        <header className="topbar">
          <div>
            <p className="breadcrumb">Overview / Dashboard</p>

            <h1>
              Good evening, {user.name || "HR Manager"}
            </h1>

            <p className="topbar-subtitle">
              Here's what's happening with your workforce today.
            </p>
          </div>

          <div className="topbar-actions">
            <button
              className="refresh-button"
              onClick={loadData}
              disabled={Boolean(actionLoading)}
            >
              ↻ Refresh
            </button>

            <div className="hr-profile">
              <div className="profile-avatar">
                {user.name?.charAt(0).toUpperCase() || "H"}
              </div>

              <div>
                <strong>{user.name || "HR Manager"}</strong>
                <span>Human Resources</span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="error-screen" role="alert">
            <p>{error}</p>
            <button className="primary-button" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {/* EXISTING STATISTICS */}
        <section className="stats-grid-new">
          <StatCard
            title="Total Employees"
            value={dashboard?.totalEmployees ?? 0}
            subtitle={`${dashboard?.activeEmployees ?? 0} active employees`}
            icon="♙"
          />

          <StatCard
            title="Present Today"
            value={dashboard?.present ?? 0}
            subtitle="Employees checked in"
            icon="✓"
          />

          <StatCard
            title="Absent Today"
            value={dashboard?.absent ?? 0}
            subtitle="No attendance recorded"
            icon="✕"
          />

          <StatCard
            title="On Leave"
            value={dashboard?.onLeave ?? 0}
            subtitle={`${dashboard?.pendingLeaves ?? 0} requests pending`}
            icon="▣"
          />

          <StatCard
            title="Overtime"
            value={`${dashboard?.overtime ?? 0}h`}
            subtitle="Today's total overtime"
            icon="◷"
          />

          <StatCard
            title="Productivity"
            value={`${dashboard?.productivity ?? 0}%`}
            subtitle="Average productivity"
            icon="↗"
          />
        </section>

        {/* EXISTING LEAVE ALERT */}
        {Number(dashboard?.pendingLeaves || 0) > 0 && (
          <div className="dashboard-alert">
            <div className="alert-icon">!</div>

            <div>
              <strong>Leave requests require attention</strong>
              <p>
                You have {dashboard.pendingLeaves} pending leave
                request(s).
              </p>
            </div>

            <button onClick={() => navigate("/hr/leaves")}>
              Review Requests →
            </button>
          </div>
        )}

        {/* NEW: ATTENDANCE VERIFICATION */}
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <h2>Attendance Verification</h2>
              <p>
                Review completed employee check-in and check-out
                requests before approving or rejecting them.
              </p>
            </div>

            <span className="score-pill">
              {pendingReviews.length} pending
            </span>
          </div>

          {successMessage && (
            <div className="dashboard-alert" role="status">
              <div className="alert-icon">✓</div>
              <div>
                <strong>Action completed</strong>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {attendanceError && (
            <div className="error-screen" role="alert">
              <p>{attendanceError}</p>
              <button
                className="primary-button"
                onClick={loadData}
              >
                Refresh Attendance
              </button>
            </div>
          )}

          <div className="performance-table">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Attendance Status</th>
                  <th>Verification</th>
                  <th>HR Actions</th>
                </tr>
              </thead>

              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-cell">
                      {attendanceError
                        ? "Attendance records could not be loaded."
                        : "No attendance records available."}
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => {
                    const verificationStatus =
                      getVerificationStatus(record);

                    const canReview = isPendingReview(record);
                    const isBusy = actionLoading === record._id;

                    return (
                      <tr key={record._id}>
                        <td>
                          <div className="employee-cell">
                            <div className="employee-avatar">
                              {getEmployeeName(record)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>{getEmployeeName(record)}</strong>
                              <span>{getEmployeeCode(record)}</span>
                              <span>{getDepartment(record)}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {formatDate(record.date || record.checkIn)}
                        </td>

                        <td>{formatTime(record.checkIn)}</td>

                        <td>{formatTime(record.checkOut)}</td>

                        <td>
                          {formatHours(
                            record.workingHours ??
                              record.totalHours
                          )}
                        </td>

                        <td>
                          <span className={getStatusClass(record.status)}>
                            {record.status || "Pending"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              verificationStatus
                            )}
                          >
                            {verificationStatus}
                          </span>

                          {verificationStatus.toLowerCase() ===
                            "rejected" &&
                            record.rejectionReason && (
                              <p className="rejection-reason">
                                Reason: {record.rejectionReason}
                              </p>
                            )}
                        </td>

                        <td>
                          {canReview ? (
                            <div className="attendance-actions">
                              <button
                                className="primary-button"
                                onClick={() => handleVerify(record)}
                                disabled={Boolean(actionLoading)}
                              >
                                {isBusy ? "Processing..." : "Verify"}
                              </button>

                              <button
                                className="secondary-button"
                                onClick={() => handleHalfDay(record)}
                                disabled={Boolean(actionLoading)}
                              >
                                Half Day
                              </button>

                              <button
                                className="danger-button"
                                onClick={() => handleReject(record)}
                                disabled={Boolean(actionLoading)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="muted-text">
                              {verificationStatus.toLowerCase() ===
                              "rejected"
                                ? "Rejected"
                                : verificationStatus.toLowerCase() ===
                                    "verified"
                                  ? "Reviewed"
                                  : !isCompletedAttendance(record)
                                    ? "Awaiting checkout"
                                    : "No action available"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* EXISTING CHARTS */}
        <section className="charts-grid">
          <AttendanceChart data={attendanceChart} />
          <ProductivityChart data={productivityData} />
        </section>

        {/* EXISTING EMPLOYEE PERFORMANCE TABLE */}
        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <h2>Employee Performance</h2>
              <p>Highest performing employees</p>
            </div>

            <button
              className="text-button"
              onClick={() => navigate("/hr/employees")}
            >
              View All →
            </button>
          </div>

          <div className="performance-table">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Overtime</th>
                  <th>HR Score</th>
                </tr>
              </thead>

              <tbody>
                {topEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-cell">
                      No employee performance records available yet.
                    </td>
                  </tr>
                ) : (
                  topEmployees.map((employee) => (
                    <tr key={employee._id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {employee.name?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{employee.name}</strong>
                            <span>
                              {employee.employeeId || "Employee"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{employee.department || "—"}</td>

                      <td>
                        {employee.statistics?.presentDays ?? 0}
                      </td>

                      <td>
                        {employee.statistics?.absentDays ?? 0}
                      </td>

                      <td>
                        {employee.statistics?.overtimeHours ?? 0}h
                      </td>

                      <td>
                        <span className="score-pill">
                          {employee.performance?.overallScore || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HRDashboard;
