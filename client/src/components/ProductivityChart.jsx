import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function ProductivityChart({ data }) {
  return (
    <div className="chart-card">

      <div className="chart-header">
        <div>
          <h3>Employee Productivity</h3>
          <p>
            Productivity score by employee
          </p>
        </div>
      </div>

      <div className="chart-container">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
            />

            <YAxis
              domain={[0, 100]}
            />

            <Tooltip />

            <Bar
              dataKey="score"
              fill="#071d45"
              radius={[5, 5, 0, 0]}
              name="Productivity"
            />

          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default ProductivityChart;
