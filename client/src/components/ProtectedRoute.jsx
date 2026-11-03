import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    localStorage.removeItem("user");
  }

  console.log("ProtectedRoute:");
  console.log("Token:", token);
  console.log("User:", user);
  console.log("Allowed Role:", allowedRole);
  console.log("User Role:", user?.role);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    console.log(
      `Role mismatch: user=${user.role}, allowed=${allowedRole}`
    );

    if (user.role === "hr") {
      return <Navigate to="/hr/dashboard" replace />;
    }

    if (user.role === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

