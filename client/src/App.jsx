import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import HRDashboard from "./pages/HRDashboard";
import Employees from "./pages/Employees";
import EmployeeDetails from "./pages/EmployeeDetails";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Performance from "./pages/Performance";

import EmployeeDashboard from "./pages/EmployeeDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <HashRouter>

      <Routes>

        {/* PUBLIC */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* HR */}

        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRole="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute allowedRole="hr">
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees/:id"
          element={
            <ProtectedRoute allowedRole="hr">
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute allowedRole="hr">
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/leaves"
          element={
            <ProtectedRoute allowedRole="hr">
              <Leaves />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/performance"
          element={
            <ProtectedRoute allowedRole="hr">
              <Performance />
            </ProtectedRoute>
          }
        />

        {/* EMPLOYEE */}

        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </HashRouter>
  );
}

export default App;


