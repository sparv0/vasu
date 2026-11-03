import { useEffect, useState } from "react";

import {
    BarChart3,
    TrendingUp,
    Clock3,
    UserCheck
} from "lucide-react";

import {
    getAttendanceAnalytics,
    getProductivityAnalytics
} from "../services/api";

function Analytics() {

    const [attendanceData, setAttendanceData] = useState([]);
    const [productivityData, setProductivityData] = useState([]);


    useEffect(() => {

        const loadAnalytics = async () => {

            try {

                const [
                    attendance,
                    productivity
                ] = await Promise.all([
                    getAttendanceAnalytics(),
                    getProductivityAnalytics()
                ]);

                setAttendanceData(attendance);
                setProductivityData(productivity);

            } catch (error) {

                console.error(error);

            }

        };

        loadAnalytics();

    }, []);


    const getStatusCount = (status) => {

        const record = attendanceData.find(
            (item) => item._id === status
        );

        return record?.count || 0;
    };


    const maxProductivity = Math.max(
        ...productivityData.map(
            (item) => item.averageProductivity || 0
        ),
        1
    );


    return (
        <div>

            <div className="page-heading">

                <div>

                    <span className="eyebrow">
                        BUSINESS INTELLIGENCE
                    </span>

                    <h1>Analytics</h1>

                    <p>
                        Understand attendance and workforce productivity.
                    </p>

                </div>

            </div>


            <div className="analytics-cards">

                <div className="analytics-card">

                    <div className="analytics-card-icon">
                        <UserCheck size={20} />
                    </div>

                    <div>
                        <span>Present</span>

                        <strong>
                            {getStatusCount("Present")}
                        </strong>
                    </div>

                </div>


                <div className="analytics-card">

                    <div className="analytics-card-icon orange">
                        <Clock3 size={20} />
                    </div>

                    <div>
                        <span>Leave</span>

                        <strong>
                            {getStatusCount("Leave")}
                        </strong>
                    </div>

                </div>


                <div className="analytics-card">

                    <div className="analytics-card-icon red">
                        <TrendingUp size={20} />
                    </div>

                    <div>
                        <span>Absent</span>

                        <strong>
                            {getStatusCount("Absent")}
                        </strong>
                    </div>

                </div>

            </div>


            <div className="analytics-grid">

                <div className="panel">

                    <div className="panel-header">

                        <div>
                            <h3>
                                Attendance Distribution
                            </h3>

                            <p>
                                Overall attendance records
                            </p>
                        </div>

                        <BarChart3 size={20} />

                    </div>


                    <div className="bar-chart">

                        {[
                            "Present",
                            "Absent",
                            "Leave",
                            "Half Day"
                        ].map((status) => {

                            const value =
                                getStatusCount(status);

                            const total =
                                attendanceData.reduce(
                                    (sum, item) =>
                                        sum + item.count,
                                    0
                                ) || 1;

                            const percentage =
                                (value / total) * 100;

                            return (

                                <div
                                    className="bar-row"
                                    key={status}
                                >

                                    <div className="bar-label">
                                        <span>{status}</span>
                                        <strong>{value}</strong>
                                    </div>

                                    <div className="bar-track">

                                        <div
                                            className="bar-fill"
                                            style={{
                                                width:
                                                    `${percentage}%`
                                            }}
                                        />

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                </div>


                <div className="panel">

                    <div className="panel-header">

                        <div>
                            <h3>
                                Productivity Overview
                            </h3>

                            <p>
                                Employee productivity scores
                            </p>
                        </div>

                        <TrendingUp size={20} />

                    </div>


                    {productivityData.length === 0 ? (

                        <div className="empty-state">
                            <BarChart3 size={30} />
                            <p>
                                No productivity data available.
                            </p>
                        </div>

                    ) : (

                        <div className="productivity-list">

                            {productivityData.map(
                                (item, index) => {

                                    const percentage =
                                        ((item.averageProductivity || 0)
                                            / maxProductivity) *
                                        100;

                                    return (

                                        <div
                                            className="productivity-item"
                                            key={item._id}
                                        >

                                            <div className="productivity-top">

                                                <span>
                                                    Employee #{index + 1}
                                                </span>

                                                <strong>
                                                    {Number(
                                                        item.averageProductivity || 0
                                                    ).toFixed(1)}
                                                </strong>

                                            </div>

                                            <div className="bar-track">

                                                <div
                                                    className="bar-fill productivity"
                                                    style={{
                                                        width:
                                                            `${percentage}%`
                                                    }}
                                                />

                                            </div>

                                            <span className="productivity-hours">
                                                Average working hours:
                                                {" "}
                                                {Number(
                                                    item.averageWorkingHours || 0
                                                ).toFixed(2)}
                                                {" "}hrs
                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Analytics;
