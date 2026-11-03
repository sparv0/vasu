import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";

import { getEmployees } from "../services/api";

function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data =
          await getEmployees();

        setEmployees(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const filteredEmployees =
    employees.filter((employee) => {
      const searchText =
        search.toLowerCase();

      return (
        employee.name
          ?.toLowerCase()
          .includes(searchText) ||
        employee.email
          ?.toLowerCase()
          .includes(searchText) ||
        employee.department
          ?.toLowerCase()
          .includes(searchText) ||
        employee.employeeId
          ?.toLowerCase()
          .includes(searchText)
      );
    });

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Management / Employees
            </p>

            <h1>
              Employee Directory
            </h1>

            <p className="topbar-subtitle">
              Manage and monitor your
              workforce.
            </p>
          </div>

        </header>

        <section className="page-card">

          <div className="page-card-header">

            <div>
              <h2>
                All Employees
              </h2>

              <p>
                {employees.length} employees
                registered
              </p>
            </div>

            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search employees..."
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
              Loading employees...
            </div>
          ) : (
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Overtime</th>
                    <th>Score</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredEmployees.map(
                    (employee) => (
                      <tr
                        key={employee._id}
                      >

                        <td>
                          <div className="employee-cell">

                            <div className="employee-avatar">
                              {employee.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {employee.name}
                              </strong>

                              <span>
                                {employee.email}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          {employee.department}
                        </td>

                        <td>
                          {employee.designation}
                        </td>

                        <td>
                          {
                            employee.statistics
                              ?.presentDays || 0
                          }
                        </td>

                        <td>
                          {
                            employee.statistics
                              ?.absentDays || 0
                          }
                        </td>

                        <td>
                          {
                            employee.statistics
                              ?.overtimeHours || 0
                          }h
                        </td>

                        <td>
                          <span className="score-pill">
                            {employee.performance
                              ?.overallScore ||
                              0}
                            %
                          </span>
                        </td>

                        <td>
                          <button
                            className="view-button"
                            onClick={() =>
                              navigate(
                                `/hr/employees/${employee._id}`
                              )
                            }
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {filteredEmployees.length ===
                0 && (
                <div className="empty-state">
                  No employees found.
                </div>
              )}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Employees;

