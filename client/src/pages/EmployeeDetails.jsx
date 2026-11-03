import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";

import {
  getEmployeeDetails,
  getEmployeePerformance,
  updateEmployeePerformance,
} from "../services/api";

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------

  const [data, setData] = useState(null);
  const [performance, setPerformance] = useState(null);

  const [hrScore, setHRScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // LOAD EMPLOYEE + PERFORMANCE
  // ---------------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Employee ID:", id);

      // Load employee profile
      const details = await getEmployeeDetails(id);

      console.log(
        "Employee Details:",
        details
      );

      setData(details);

      // Load performance separately
      try {
        const performanceData =
          await getEmployeePerformance(id);

        console.log(
          "Employee Performance:",
          performanceData
        );

        setPerformance(performanceData);

        // Load previously saved HR evaluation
        if (performanceData?.hrEvaluation) {
          setHRScore(
            performanceData.hrEvaluation.hrScore ??
              ""
          );

          setFeedback(
            performanceData.hrEvaluation.hrFeedback ??
              ""
          );
        } else {
          setHRScore("");
          setFeedback("");
        }
      } catch (performanceError) {
        console.error(
          "Performance API Error:",
          performanceError
        );

        // Employee profile should still load
        setPerformance(null);
      }
    } catch (error) {
      console.error(
        "Employee Details Error:",
        error
      );

      setError(
        error.message ||
          "Unable to load employee profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    loadData();
  }, [id]);

  // ---------------------------------------------------------
  // SAVE HR PERFORMANCE
  // ---------------------------------------------------------

  const savePerformance = async () => {
    const score = Number(hrScore);

    // Validate score
    if (
      hrScore === "" ||
      Number.isNaN(score) ||
      score < 0 ||
      score > 100
    ) {
      alert(
        "Please enter an HR score between 0 and 100."
      );

      return;
    }

    try {
      setSaving(true);

      console.log(
        "Saving HR Evaluation:",
        {
          employeeId: id,
          hrScore: score,
          hrFeedback: feedback,
        }
      );

      const result =
        await updateEmployeePerformance(id, {
          hrScore: score,
          hrFeedback: feedback.trim(),
        });

      console.log(
        "Performance Save Response:",
        result
      );

      // Immediately update displayed performance
      if (result?.performance) {
        setPerformance((previous) => ({
          ...(previous || {}),
          hrEvaluation:
            result.performance,
        }));
      }

      // Keep exact entered score visible
      setHRScore(
        result?.performance?.hrScore ??
          score
      );

      setFeedback(
        result?.performance?.hrFeedback ??
          feedback
      );

      alert(
        "Performance updated successfully."
      );

      // Reload from MongoDB to confirm persistence
      await loadData();
    } catch (error) {
      console.error(
        "Save Performance Error:",
        error
      );

      alert(
        error.message ||
          "Unable to save performance."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <div className="loading-screen">
            <div className="loading-spinner"></div>

            <p>
              Loading employee profile...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR SCREEN
  // ---------------------------------------------------------

  if (error || !data) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <div className="error-screen">
            <div className="error-icon">
              !
            </div>

            <h2>
              Unable to load employee
            </h2>

            <p>
              {error ||
                "Employee information could not be found."}
            </p>

            <div className="error-actions">
              <button
                className="primary-button"
                onClick={loadData}
              >
                Try Again
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate(
                    "/hr/employees"
                  )
                }
              >
                Back to Employees
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  const {
    employee,
    attendance = [],
    leaves = [],
  } = data;

  const calculated =
    performance?.calculatedPerformance;

  const savedEvaluation =
    performance?.hrEvaluation;

  // Automatic score
  const automaticScore =
    calculated?.overallScore ?? 0;

  // Exact HR score entered by HR
  const savedHRScore =
    savedEvaluation?.hrScore ?? 0;

  // Final score after 90/10 calculation
  const finalScore =
    savedEvaluation?.overallScore ??
    automaticScore;

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="topbar">
          <div>
            <button
              className="back-button"
              onClick={() =>
                navigate(
                  "/hr/employees"
                )
              }
            >
              ← Employees
            </button>

            <h1>
              Employee Profile
            </h1>

            <p className="topbar-subtitle">
              View employee information,
              attendance and performance.
            </p>
          </div>
        </header>

        {/* =================================================
            EMPLOYEE PROFILE
        ================================================= */}

        <section className="employee-profile-card">

          <div className="large-avatar">
            {employee.name
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="employee-profile-info">
            <h2>
              {employee.name}
            </h2>

            <p>
              {employee.designation ||
                "Employee"}
            </p>

            <span>
              {employee.email}
            </span>
          </div>

          <div className="employee-profile-meta">

            <div>
              <span>
                Employee ID
              </span>

              <strong>
                {employee.employeeId ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {employee.department ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong className="active-text">
                Active
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            PERFORMANCE OVERVIEW
        ================================================= */}

        <section className="score-overview">

          {/* AUTOMATIC PERFORMANCE */}

          <div className="overall-score-card">

            <span>
              Automatic Performance
            </span>

            <strong>
              {automaticScore}%
            </strong>

            <p>
              Calculated automatically from
              attendance, punctuality,
              productivity and workload.
            </p>

          </div>


          {/* HR EVALUATION */}

          <div className="overall-score-card hr-score-card">

            <span>
              HR Evaluation
            </span>

            <strong>
              {savedHRScore}%
            </strong>

            <p>
              Score manually assigned by HR
              based on professional evaluation.
            </p>

          </div>


          {/* FINAL PERFORMANCE */}

          <div className="overall-score-card final-score-card">

            <span>
              Final Performance
            </span>

            <strong>
              {finalScore}%
            </strong>

            <p>
              90% automatic performance +
              10% HR evaluation.
            </p>

          </div>

        </section>

        {/* =================================================
            SCORE COMPONENTS
        ================================================= */}

        <section className="score-components">

          <div>
            <span>
              Attendance
            </span>

            <strong>
              {calculated?.attendanceScore ??
                0}%
            </strong>
          </div>


          <div>
            <span>
              Punctuality
            </span>

            <strong>
              {calculated?.punctualityScore ??
                0}%
            </strong>
          </div>


          <div>
            <span>
              Productivity
            </span>

            <strong>
              {calculated?.productivityScore ??
                0}%
            </strong>
          </div>


          <div>
            <span>
              Workload
            </span>

            <strong>
              {calculated?.workloadScore ??
                0}%
            </strong>
          </div>

        </section>

        {/* =================================================
            HR EVALUATION FORM
        ================================================= */}

        <section className="page-card">

          <div className="page-card-header">

            <div>
              <h2>
                HR Evaluation
              </h2>

              <p>
                Add or update your professional
                evaluation for this employee.
              </p>
            </div>

          </div>


          <div className="evaluation-form">

            {/* HR SCORE */}

            <div className="form-group">

              <label>
                HR Score (0–100)
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={hrScore}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  if (
                    value === "" ||
                    (
                      Number(value) >= 0 &&
                      Number(value) <= 100
                    )
                  ) {
                    setHRScore(value);
                  }
                }}
                placeholder="Enter score"
              />

            </div>


            {/* HR FEEDBACK */}

            <div className="form-group">

              <label>
                HR Feedback
              </label>

              <textarea
                value={feedback}
                onChange={(e) =>
                  setFeedback(
                    e.target.value
                  )
                }
                placeholder="Write employee performance feedback..."
                rows="4"
              />

            </div>


            {/* SAVE */}

            <button
              className="primary-button"
              onClick={savePerformance}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Evaluation"}
            </button>

          </div>

        </section>

        {/* =================================================
            SAVED EVALUATION DETAILS
        ================================================= */}

        {savedEvaluation && (
          <section className="page-card">

            <div className="page-card-header">

              <div>
                <h2>
                  Saved Evaluation
                </h2>

                <p>
                  Latest HR performance
                  evaluation stored in MongoDB.
                </p>
              </div>

            </div>

            <div className="evaluation-summary">

              <div>
                <span>
                  HR Score
                </span>

                <strong>
                  {savedEvaluation.hrScore ??
                    0}%
                </strong>
              </div>


              <div>
                <span>
                  Final Score
                </span>

                <strong>
                  {savedEvaluation.overallScore ??
                    0}%
                </strong>
              </div>


              <div>
                <span>
                  Evaluation Date
                </span>

                <strong>
                  {savedEvaluation.evaluationDate
                    ? new Date(
                        savedEvaluation.evaluationDate
                      ).toLocaleDateString()
                    : "—"}
                </strong>
              </div>

            </div>


            <div className="saved-feedback">

              <span>
                HR Feedback
              </span>

              <p>
                {savedEvaluation.hrFeedback ||
                  "No feedback provided."}
              </p>

            </div>

          </section>
        )}

        {/* =================================================
            ATTENDANCE
        ================================================= */}

        <section className="page-card">

          <div className="page-card-header">

            <div>
              <h2>
                Attendance Records
              </h2>

              <p>
                Complete attendance history
              </p>
            </div>

          </div>


          <div className="table-wrapper">

            {attendance.length === 0 ? (

              <div className="empty-state">
                No attendance records
                available.
              </div>

            ) : (

              <table>

                <thead>
                  <tr>
                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Check In
                    </th>

                    <th>
                      Check Out
                    </th>

                    <th>
                      Hours
                    </th>

                    <th>
                      Overtime
                    </th>

                    <th>
                      Productivity
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {attendance.map(
                    (record) => (
                      <tr
                        key={
                          record._id
                        }
                      >

                        <td>
                          {record.date
                            ? new Date(
                                record.date
                              ).toLocaleDateString()
                            : "—"}
                        </td>


                        <td>
                          <StatusBadge
                            status={
                              record.status
                            }
                          />
                        </td>


                        <td>
                          {record.checkIn
                            ? new Date(
                                record.checkIn
                              ).toLocaleTimeString()
                            : "—"}
                        </td>


                        <td>
                          {record.checkOut
                            ? new Date(
                                record.checkOut
                              ).toLocaleTimeString()
                            : "—"}
                        </td>


                        <td>
                          {record.workingHours ??
                            0}h
                        </td>


                        <td>
                          {record.overtimeHours ??
                            0}h
                        </td>


                        <td>
                          {record.productivityScore ??
                            0}%
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

        {/* =================================================
            LEAVE HISTORY
        ================================================= */}

        <section className="page-card">

          <div className="page-card-header">

            <div>
              <h2>
                Leave History
              </h2>

              <p>
                Employee leave records
              </p>
            </div>

          </div>


          <div className="table-wrapper">

            {leaves.length === 0 ? (

              <div className="empty-state">
                No leave records
                available.
              </div>

            ) : (

              <table>

                <thead>
                  <tr>
                    <th>
                      Type
                    </th>

                    <th>
                      Start
                    </th>

                    <th>
                      End
                    </th>

                    <th>
                      Days
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Reason
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {leaves.map(
                    (leave) => (
                      <tr
                        key={
                          leave._id
                        }
                      >

                        <td>
                          {leave.leaveType ||
                            "—"}
                        </td>


                        <td>
                          {leave.startDate
                            ? new Date(
                                leave.startDate
                              ).toLocaleDateString()
                            : "—"}
                        </td>


                        <td>
                          {leave.endDate
                            ? new Date(
                                leave.endDate
                              ).toLocaleDateString()
                            : "—"}
                        </td>


                        <td>
                          {leave.numberOfDays ??
                            0}
                        </td>


                        <td>
                          <StatusBadge
                            status={
                              leave.status
                            }
                          />
                        </td>


                        <td>
                          {leave.reason ||
                            "—"}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </main>
    </div>
  );
}

export default EmployeeDetails;
