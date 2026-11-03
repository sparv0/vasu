import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";

import {
  getAllLeaves,
  updateLeaveStatus,
} from "../services/api";

function Leaves() {
  const [leaves, setLeaves] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(null);

  const loadLeaves = async () => {
    try {
      const data =
        await getAllLeaves();

      setLeaves(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const updateStatus = async (
    id,
    status
  ) => {
    try {
      setProcessing(id);

      await updateLeaveStatus(
        id,
        status,
        status === "Approved"
          ? "Leave approved by HR."
          : "Leave request rejected by HR."
      );

      await loadLeaves();
    } catch (error) {
      alert(error.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Management / Leaves
            </p>

            <h1>
              Leave Management
            </h1>

            <p className="topbar-subtitle">
              Review and manage employee
              leave requests.
            </p>
          </div>

        </header>

        <section className="page-card">

          <div className="page-card-header">

            <div>
              <h2>
                Leave Requests
              </h2>

              <p>
                Manage employee leave
                applications
              </p>
            </div>

          </div>

          {loading ? (
            <div className="empty-state">
              Loading leave requests...
            </div>
          ) : (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {leaves.map(
                    (leave) => (
                      <tr
                        key={leave._id}
                      >

                        <td>
                          <strong>
                            {
                              leave.employee
                                ?.name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            leave.leaveType
                          }
                        </td>

                        <td>
                          {new Date(
                            leave.startDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {new Date(
                            leave.endDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {
                            leave.numberOfDays
                          }
                        </td>

                        <td className="reason-cell">
                          {leave.reason}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              leave.status
                            }
                          />
                        </td>

                        <td>

                          {leave.status ===
                          "Pending" ? (
                            <div className="action-buttons">

                              <button
                                className="approve-button"
                                disabled={
                                  processing ===
                                  leave._id
                                }
                                onClick={() =>
                                  updateStatus(
                                    leave._id,
                                    "Approved"
                                  )
                                }
                              >
                                Approve
                              </button>

                              <button
                                className="reject-button"
                                disabled={
                                  processing ===
                                  leave._id
                                }
                                onClick={() =>
                                  updateStatus(
                                    leave._id,
                                    "Rejected"
                                  )
                                }
                              >
                                Reject
                              </button>

                            </div>
                          ) : (
                            "—"
                          )}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {leaves.length ===
                0 && (
                <div className="empty-state">
                  No leave requests
                  available.
                </div>
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Leaves;
