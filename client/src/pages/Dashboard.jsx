import { useEffect, useState } from "react";

import {
    Users,
    UserCheck,
    UserX,
    CalendarDays,
    Clock3,
    ArrowUpRight,
    Activity
} from "lucide-react";

import {
    getDashboardAnalytics,
    getAttendance
} from "../services/api";

function Dashboard() {

    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalAttendance: 0,
        totalLeave: 0,
        totalAbsent: 0,
        averageWorkingHours: 0
    });

    const [attendance, setAttendance] = useState([]);

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                const [dashboardData, attendanceData] =
                    await Promise.all([
                        getDashboardAnalytics(),
                        getAttendance()
                    ]);

                setStats(dashboardData);

                setAttendance(
                    attendanceData.slice(0, 6)
                );

            } catch (error) {

                console.error(error);

            }

        };

        loadDashboard();

    }, []);


    const cards = [
        {
            title: "Total Employees",
            value: stats.totalEmployees,
            icon: Users,
            description: "Active employees",
            className: "blue"
        },
        {
            title: "Present",
            value: stats.totalAttendance,
            icon: UserCheck,
            description: "Attendance records",
            className: "green"
        },
        {
            title: "On Leave",
            value: stats.totalLeave,
            icon: CalendarDays,
            description: "Leave records",
            className: "orange"
        },
        {
            title: "Absent",
            value: stats.totalAbsent,
            icon: UserX,
            description: "Absent records",
            className: "red"
        }
    ];


    return (
        <div>

            <div className="page-heading">

                <div>
                    <span className="eyebrow">
                        OVERVIEW
                    </span>

                    <h1>Dashboard</h1>

                    <p>
                        Monitor your workforce at a glance.
                    </p>
                </div>

                <div className="date-display">
                    <CalendarDays size={17} />
                    {new Date().toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        }
                    )}
                </div>

            </div>


            <div className="stats-grid">

                {cards.map((card) => {

                    const Icon = card.icon;

                    return (
                        <div
                            className="stat-card"
                            key={card.title}
                        >

                            <div className="stat-top">

                                <div
                                    className={`stat-icon ${card.className}`}
                                >
                                    <Icon size={20} />
                                </div>

                                <ArrowUpRight
                                    size={17}
                                    className="muted-icon"
                                />

                            </div>

                            <div className="stat-value">
                                {card.value}
                            </div>

                            <div className="stat-title">
                                {card.title}
                            </div>

                            <div className="stat-description">
                                {card.description}
                            </div>

                        </div>
                    );

                })}

            </div>


            <div className="dashboard-grid">

                <div className="panel">

                    <div className="panel-header">

                        <div>
                            <h3>Recent Attendance</h3>
                            <p>Latest attendance activity</p>
                        </div>

                        <Activity size={19} />

                    </div>


                    {attendance.length === 0 ? (

                        <div className="empty-state">
                            <UserCheck size={30} />
                            <p>No attendance records yet.</p>
                        </div>

                    ) : (

                        <div className="attendance-list">

                            {attendance.map((item) => (

                                <div
                                    className="attendance-row"
                                    key={item._id}
                                >

                                    <div className="employee-mini">

                                        <div className="avatar small">
                                            {item.employee?.name
                                                ?.charAt(0)
                                                .toUpperCase() || "E"}
                                        </div>

                                        <div>
                                            <strong>
                                                {item.employee?.name ||
                                                    "Employee"}
                                            </strong>

                                            <span>
                                                {item.employee
                                                    ?.department ||
                                                    "—"}
                                            </span>
                                        </div>

                                    </div>


                                    <div className="attendance-time">

                                        <strong>
                                            {item.checkIn
                                                ? new Date(
                                                    item.checkIn
                                                ).toLocaleTimeString(
                                                    "en-IN",
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }
                                                )
                                                : "--"}
                                        </strong>

                                        <span>
                                            Check-in
                                        </span>

                                    </div>


                                    <span className="status-badge present">
                                        {item.attendanceStatus}
                                    </span>

                                </div>

                            ))}

                        </div>

                    )}

                </div>


                <div className="panel">

                    <div className="panel-header">

                        <div>
                            <h3>Working Hours</h3>
                            <p>Average employee hours</p>
                        </div>

                        <Clock3 size={19} />

                    </div>


                    <div className="hours-highlight">

                        <span>
                            Average daily hours
                        </span>

                        <strong>
                            {stats.averageWorkingHours}
                            <small> hrs</small>
                        </strong>

                    </div>


                    <div className="hours-bar">

                        <div
                            style={{
                                width: `${Math.min(
                                    (stats.averageWorkingHours / 8) * 100,
                                    100
                                )}%`
                            }}
                        />

                    </div>


                    <div className="hours-footer">
                        <span>0 hrs</span>
                        <span>8 hrs target</span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Dashboard;
