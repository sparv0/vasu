const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const hrRoutes = require("./routes/hrRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const performanceRoutes = require("./routes/performanceRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

app.use(express.json());

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log("MongoDB connected successfully.");
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(500).json({ message: "Database connection failed." });
  }
});

app.get("/", (req, res) => {
  res.json({
    message:
      "Employee Productivity Management API is running.",
  });
});

app.get("/api", (req, res) => {
  res.json({
    message:
      "Employee Productivity Management API is running.",
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/hr",
  hrRoutes
);

app.use(
  "/api/employee",
  employeeRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  "/api/leaves",
  leaveRoutes
);

app.use(
  "/api/performance",
  performanceRoutes
);

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error(
        "MongoDB connection failed:",
        error
      );
    });
}

module.exports = app;
