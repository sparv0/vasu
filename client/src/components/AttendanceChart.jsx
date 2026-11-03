import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function AttendanceChart({ data }) {
  return (
    <div className="chart-card">

      <div className="chart-header">
        <div>
          <h3>Attendance Overview</h3>
          <p>
            Attendance activity across recent
            records
          </p>
        </div>

        <span className="chart-period">
          Live Data
        </span>
      </div>

      <div className="chart-container">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              allowDecimals={false}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="present"
              stroke="#071d45"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Present"
            />

            <Line
              type="monotone"
              dataKey="absent"
              stroke="#d64545"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Absent"
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default AttendanceChart;
