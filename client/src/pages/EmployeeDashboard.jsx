
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getEmployeeDashboard,
  checkInEmployee,
  checkOutEmployee,
} from "../services/api";

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      const result = await getEmployeeDashboard();

      console.log("Employee dashboard response:", result);
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD + AUTOMATIC REFRESH
  // =====================================================

  useEffect(() => {
    loadDashboard();

    // Refresh HR verification decisions without requiring logout.
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // =====================================================
  // CHECK IN
  // =====================================================

  const handleCheckIn = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceMessage("");
      setAttendanceError("");

      const result = await checkInEmployee();

      setAttendanceMessage(
        result.message || "Check-in recorded successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error("Check-in error:", err);
      setAttendanceError(
        err.message || "Unable to record check-in."
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  // =====================================================
  // CHECK OUT
  // =====================================================

  const handleCheckOut = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceMessage("");
      setAttendanceError("");

      const result = await checkOutEmployee();

      setAttendanceMessage(
        result.message ||
          "Check-out recorded successfully. Your attendance is awaiting HR review."
      );

      await loadDashboard();
    } catch (err) {
      console.error("Check-out error:", err);
      setAttendanceError(
        err.message || "Unable to record check-out."
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const getStatusClass = (status) => {
    if (!status) return "status-default";

    const value = String(status).toLowerCase();

    if (value === "present") return "status-present";
    if (value === "absent") return "status-absent";
    if (value === "late") return "status-late";
    if (value.includes("leave")) return "status-leave";
    if (value.includes("half")) return "status-half";
    if (value.includes("reject")) return "status-absent";
    if (value.includes("pending")) return "status-late";
    if (value.includes("verif")) return "status-present";

    return "status-default";
  };

  // Attendance status is separate from HR's verification decision.
  const getVerificationStatus = (record) => {
    if (record?.verificationStatus) {
      return record.verificationStatus;
    }

    // Support older records if they used these values directly.
    if (
      ["rejected", "verified"].includes(
        String(record?.status || "").toLowerCase()
      )
    ) {
      return record.status;
    }

    return "Pending";
  };

  const getVerificationMessage = (record) => {
    const verification = getVerificationStatus(record).toLowerCase();

    if (verification === "rejected") {
      return "HR rejected this attendance request.";
    }

    if (verification === "verified") {
      if (
        String(record?.status || "").toLowerCase() === "half day"
      ) {
        return "HR approved this attendance as Half Day.";
      }

      return "HR verified your attendance.";
    }

    if (!record?.checkOut) {
      return record?.checkIn
        ? "Check out to submit your completed attendance for HR review."
        : "Attendance has not been completed.";
    }

    return "Your completed attendance is awaiting HR review.";
  };

  // =====================================================
  // DATE AND TIME FORMATTERS
  // =====================================================

  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatHours = (value) => {
    if (value === null || value === undefined || value === "") {
      return "0";
    }

    const hours = Number(value);

    return Number.isFinite(hours) ? hours.toFixed(2) : "0";
  };

  // =====================================================
  // FIND TODAY'S ATTENDANCE
  // =====================================================

  const getTodayAttendance = () => {
    if (!Array.isArray(data?.attendance)) return null;

    const today = new Date();

    const todayDate = today.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    return data.attendance.find((record) => {
      const value = record.date || record.checkIn;

      if (!value) return false;

      const recordDate = new Date(value);

      if (Number.isNaN(recordDate.getTime())) return false;

      const dateString = recordDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      return dateString === todayDate;
    });
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div className="employee-dashboard-page">
        <div className="employee-loading">
          <div className="loading-spinner"></div>

          <h2>Loading your dashboard</h2>

          <p>
            Please wait while we retrieve your attendance information.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR SCREEN
  // =====================================================

  if (error) {
    return (
      <div className="employee-dashboard-page">
        <div className="employee-error">
          <div className="error-icon">!</div>

          <h2>Unable to load dashboard</h2>
          <p>{error}</p>

          <div className="error-actions">
            <button
              className="employee-primary-button"
              onClick={() => loadDashboard()}
            >
              Try Again
            </button>

            <button
              className="employee-secondary-button"
              onClick={logout}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // SAFETY CHECK
  // =====================================================

  if (!data || !data.employee || !data.statistics) {
    return (
      <div className="employee-dashboard-page">
        <div className="employee-error">
          <div className="error-icon">!</div>

          <h2>No dashboard data available</h2>

          <p>
            The server did not return the expected employee information.
          </p>

          <button
            className="employee-primary-button"
            onClick={() => loadDashboard()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD DATA
  // =====================================================

  const {
    employee,
    statistics,
    attendance = [],
  } = data;

  const todayAttendance = getTodayAttendance();

  const hasCheckedIn = Boolean(todayAttendance?.checkIn);
  const hasCheckedOut = Boolean(todayAttendance?.checkOut);

  const todayVerification = todayAttendance
    ? getVerificationStatus(todayAttendance)
    : null;

  const isTodayRejected =
    String(todayVerification || "").toLowerCase() === "rejected";

  const isTodayVerified =
    String(todayVerification || "").toLowerCase() === "verified";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="employee-dashboard-page">
      {/* TOP NAVIGATION */}
      <header className="employee-topbar">
        <div className="employee-brand">
          <div className="employee-brand-logo">EP</div>

          <div>
            <h2>Employee Portal</h2>
            <span>Productivity &amp; Attendance</span>
          </div>
        </div>

        <div className="employee-topbar-right">
          <div className="employee-user">
            <div className="employee-avatar">
              {employee.name?.charAt(0).toUpperCase() || "E"}
            </div>

            <div className="employee-user-info">
              <strong>{employee.name}</strong>
              <span>Employee</span>
            </div>
          </div>

          <button className="employee-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="employee-main">
        {/* WELCOME */}
        <section className="employee-welcome">
          <div>
            <p className="welcome-label">EMPLOYEE PORTAL</p>

            <h1>Welcome back, {employee.name}</h1>

            <p>
              Here's an overview of your attendance and productivity.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={() => loadDashboard()}
          >
            ↻ Refresh Data
          </button>
        </section>

        {/* PROFILE */}
        <section className="employee-profile">
          <div className="large-avatar">
            {employee.name?.charAt(0).toUpperCase() || "E"}
          </div>

          <div className="profile-main">
            <h2>{employee.name}</h2>
            <p>{employee.email}</p>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-item">
            <span>Department</span>
            <strong>{employee.department || "General"}</strong>
          </div>

          <div className="profile-item">
            <span>Designation</span>
            <strong>{employee.designation || "Employee"}</strong>
          </div>
        </section>

        {/* TODAY'S ATTENDANCE */}
        <section className="today-attendance-card">
          <div className="today-attendance-left">
            <div className="today-attendance-icon">📅</div>

            <div>
              <p className="today-label">TODAY'S ATTENDANCE</p>

              <h2>
                {!todayAttendance
                  ? "Mark Your Attendance"
                  : hasCheckedOut
                    ? "Attendance Completed"
                    : "Attendance In Progress"}
              </h2>

              <p className="today-date">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
          </div>

          <div className="today-attendance-right">
            {!hasCheckedIn && (
              <button
                className="check-in-button"
                onClick={handleCheckIn}
                disabled={attendanceLoading}
              >
                {attendanceLoading ? "Checking In..." : "✓ Check In"}
              </button>
            )}

            {hasCheckedIn && !hasCheckedOut && (
              <div className="attendance-action-group">
                <div
                  className={`today-status ${
                    todayAttendance.status === "Late"
                      ? "late-status"
                      : "present-status"
                  }`}
                >
                  <span></span>
                  {todayAttendance.status || "Present"}
                </div>

                <p className="check-time">
                  Checked in at {formatTime(todayAttendance.checkIn)}
                </p>

                <button
                  className="check-out-button"
                  onClick={handleCheckOut}
                  disabled={attendanceLoading}
                >
                  {attendanceLoading ? "Checking Out..." : "↪ Check Out"}
                </button>
              </div>
            )}

            {hasCheckedIn && hasCheckedOut && (
              <div className="attendance-completed">
                <div className="today-status completed-status">
                  ✓ Attendance Completed
                </div>

                <p className="check-time">
                  In: {formatTime(todayAttendance.checkIn)}
                  {" • "}
                  Out: {formatTime(todayAttendance.checkOut)}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CHECK-IN/CHECK-OUT FEEDBACK */}
        {attendanceMessage && (
          <div className="attendance-success-message" role="status">
            ✓ {attendanceMessage}
          </div>
        )}

        {attendanceError && (
          <div className="attendance-error-message" role="alert">
            {attendanceError}
          </div>
        )}

        {/* TODAY'S HR VERIFICATION STATUS */}
        {todayAttendance && hasCheckedOut && (
          <section className="employee-attendance-card">
            <div className="attendance-heading">
              <div>
                <h2>HR Attendance Review</h2>
                <p>
                  Review status for your attendance on{" "}
                  {formatDate(todayAttendance.date || todayAttendance.checkIn)}.
                </p>
              </div>

              <span
                className={`employee-status ${getStatusClass(
                  todayVerification
                )}`}
              >
                {todayVerification}
              </span>
            </div>

            <p>{getVerificationMessage(todayAttendance)}</p>

            {isTodayVerified && (
              <p>
                <strong>Attendance status: </strong>
                <span
                  className={`employee-status ${getStatusClass(
                    todayAttendance.status
                  )}`}
                >
                  {todayAttendance.status || "Verified"}
                </span>
              </p>
            )}

            {isTodayRejected && (
              <div className="attendance-error-message">
                <strong>Rejection reason: </strong>
                {todayAttendance.rejectionReason ||
                  "No rejection reason was provided."}
              </div>
            )}

            {!isTodayVerified && !isTodayRejected && (
              <p className="check-time">
                Your attendance status may be updated after HR reviews it.
              </p>
            )}
          </section>
        )}

        {/* STATISTICS */}
        <section className="employee-stats">
          <div className="employee-stat-card">
            <div className="stat-top">
              <span className="stat-title">Total Days</span>
              <span className="stat-symbol blue">📅</span>
            </div>

            <strong>{statistics.totalDays || 0}</strong>

            <span className="stat-description">
              Recorded attendance
            </span>
          </div>

          <div className="employee-stat-card">
            <div className="stat-top">
              <span className="stat-title">Present</span>
              <span className="stat-symbol green">✓</span>
            </div>

            <strong>{statistics.presentDays || 0}</strong>

            <span className="stat-description">Days present</span>
          </div>

          <div className="employee-stat-card">
            <div className="stat-top">
              <span className="stat-title">Absent</span>
              <span className="stat-symbol red">!</span>
            </div>

            <strong>{statistics.absentDays || 0}</strong>

            <span className="stat-description">Days absent</span>
          </div>

          <div className="employee-stat-card">
            <div className="stat-top">
              <span className="stat-title">Late</span>
              <span className="stat-symbol orange">⏰</span>
            </div>

            <strong>{statistics.lateDays || 0}</strong>

            <span className="stat-description">Late arrivals</span>
          </div>

          <div className="employee-stat-card">
            <div className="stat-top">
              <span className="stat-title">Overtime</span>
              <span className="stat-symbol purple">↑</span>
            </div>

            <strong>
              {statistics.overtimeHours || 0}
              <small> hrs</small>
            </strong>

            <span className="stat-description">
              Additional work hours
            </span>
          </div>

          <div className="employee-stat-card">
            <div className="stat-top">
              <span className="stat-title">Productivity</span>
              <span className="stat-symbol teal">%</span>
            </div>

            <strong>{statistics.averageProductivity || 0}%</strong>

            <span className="stat-description">
              Average productivity
            </span>
          </div>
        </section>

        {/* ATTENDANCE HISTORY */}
        <section className="employee-attendance-card">
          <div className="attendance-heading">
            <div>
              <h2>Attendance Records</h2>
              <p>
                Your complete attendance and productivity history.
              </p>
            </div>

            <div className="record-count">
              {attendance.length} Records
            </div>
          </div>

          {attendance.length === 0 ? (
            <div className="employee-empty">
              <div className="empty-icon">📋</div>

              <h3>No attendance records</h3>

              <p>
                Your attendance records will appear here after you check in.
              </p>
            </div>
          ) : (
            <div className="employee-table-container">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Attendance Status</th>
                    <th>HR Verification</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Overtime</th>
                    <th>Productivity</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.map((record) => {
                    const verification = getVerificationStatus(record);
                    const rejected =
                      String(verification).toLowerCase() === "rejected";
                    const verified =
                      String(verification).toLowerCase() === "verified";

                    return (
                      <tr key={record._id}>
                        <td>
                          <strong>{formatDate(record.date)}</strong>
                        </td>

                        <td>
                          <span
                            className={`employee-status ${getStatusClass(
                              record.status
                            )}`}
                          >
                            {record.status || "Unknown"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`employee-status ${getStatusClass(
                              verification
                            )}`}
                          >
                            {verification}
                          </span>

                          {rejected && (
                            <p className="rejection-reason">
                              <strong>Reason: </strong>
                              {record.rejectionReason ||
                                "No reason provided."}
                            </p>
                          )}

                          {verified &&
                            String(record.status || "").toLowerCase() ===
                              "half day" && (
                              <p className="check-time">
                                HR approved Half Day.
                              </p>
                            )}
                        </td>

                        <td>{formatTime(record.checkIn)}</td>

                        <td>{formatTime(record.checkOut)}</td>

                        <td>{formatHours(record.workingHours)} hrs</td>

                        <td>{formatHours(record.overtimeHours)} hrs</td>

                        <td>
                          <div className="productivity-cell">
                            <div className="productivity-bar">
                              <div
                                className="productivity-fill"
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      Number(record.productivityScore) || 0,
                                      0
                                    ),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>

                            <span>
                              {record.productivityScore || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="employee-footer">
        Employee Productivity &amp; Attendance Management System
      </footer>
    </div>
  );
}

export default EmployeeDashboard;
