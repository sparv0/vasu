import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";

import {
  getAllAttendance,
} from "../services/api";

function Attendance() {
  const [records, setRecords] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const loadAttendance = async () => {
    try {
      const data =
        await getAllAttendance();

      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();

    const interval =
      setInterval(
        loadAttendance,
        30000
      );

    return () =>
      clearInterval(interval);
  }, []);

  const filtered =
    records.filter((record) =>
      record.employee?.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Management / Attendance
            </p>

            <h1>
              Attendance Management
            </h1>

            <p className="topbar-subtitle">
              Monitor employee attendance,
              working hours and overtime.
            </p>
          </div>

        </header>

        <section className="page-card">

          <div className="page-card-header">

            <div>
              <h2>
                Attendance Records
              </h2>

              <p>
                {records.length} records
              </p>
            </div>

            <div className="search-box">
              <span>⌕</span>

              <input
                placeholder="Search employee..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>

          </div>

          {loading ? (
            <div className="empty-state">
              Loading attendance...
            </div>
          ) : (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Productivity</th>
                  </tr>
                </thead>

                <tbody>

                  {filtered.map(
                    (record) => (
                      <tr
                        key={record._id}
                      >

                        <td>
                          {new Date(
                            record.date
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          <strong>
                            {
                              record.employee
                                ?.name
                            }
                          </strong>
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
                          {
                            record.workingHours
                          }h
                        </td>

                        <td>
                          {
                            record.overtimeHours
                          }h
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              record.status
                            }
                          />
                        </td>

                        <td>
                          {
                            record.productivityScore
                          }%
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Attendance;
