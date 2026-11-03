import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";

import { getEmployees } from "../services/api";

function Performance() {
  const navigate = useNavigate();

  const [employees, setEmployees] =
    useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data =
          await getEmployees();

        setEmployees(data);
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  const sortedEmployees =
    [...employees].sort(
      (a, b) =>
        (b.performance
          ?.overallScore || 0) -
        (a.performance
          ?.overallScore || 0)
    );

  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Analytics / Performance
            </p>

            <h1>
              Employee Performance
            </h1>

            <p className="topbar-subtitle">
              Evaluate productivity,
              attendance and employee
              performance.
            </p>
          </div>

        </header>

        <section className="performance-grid">

          {sortedEmployees.map(
            (employee, index) => {

              const score =
                employee.performance
                  ?.overallScore || 0;

              let level = "Needs Attention";

              if (score >= 85) {
                level = "Excellent";
              } else if (score >= 70) {
                level = "Good";
              } else if (score >= 50) {
                level = "Average";
              }

              return (
                <div
                  className="performance-card"
                  key={employee._id}
                >

                  <div className="performance-card-top">

                    <div className="employee-avatar large">
                      {employee.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <span className="ranking">
                      #{index + 1}
                    </span>

                  </div>

                  <h3>
                    {employee.name}
                  </h3>

                  <p>
                    {employee.department}
                  </p>

                  <div className="performance-score">

                    <strong>
                      {score}%
                    </strong>

                    <span>
                      {level}
                    </span>

                  </div>

                  <div className="score-bar">

                    <div
                      style={{
                        width: `${score}%`,
                      }}
                    />

                  </div>

                  <button
                    className="view-button full"
                    onClick={() =>
                      navigate(
                        `/hr/employees/${employee._id}`
                      )
                    }
                  >
                    View Performance
                  </button>

                </div>
              );
            }
          )}

        </section>

      </main>

    </div>
  );
}

export default Performance;
