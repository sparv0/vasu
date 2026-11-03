import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "hr") {
        navigate("/hr/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Left Branding Section */}
      <div className="login-brand">

        <div className="brand-content">

          <div className="brand-logo">
            EP
          </div>

          <h1>Employee Productivity</h1>
          <h1>& Attendance Management</h1>

          <p>
            A centralized platform for managing employee attendance,
            productivity and workplace performance.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <span>✓</span>
              <div>
                <strong>Smart Attendance</strong>
                <small>Track employee attendance efficiently</small>
              </div>
            </div>

            <div className="brand-feature">
              <span>✓</span>
              <div>
                <strong>Productivity Analytics</strong>
                <small>Monitor employee performance</small>
              </div>
            </div>

            <div className="brand-feature">
              <span>✓</span>
              <div>
                <strong>HR Management</strong>
                <small>Centralized employee records</small>
              </div>
            </div>
          </div>

        </div>

      </div>


      {/* Login Section */}
      <div className="login-section">

        <div className="login-card">

          <div className="login-heading">

            <div className="mobile-logo">
              EP
            </div>

            <h2>Welcome Back</h2>

            <p>
              Sign in to your account to continue
            </p>

          </div>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <form onSubmit={handleSubmit} className="login-form">

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>


            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? "Signing In..." : "Sign In"}

            </button>

          </form>


          <div className="login-divider">
            <span>New to the platform?</span>
          </div>


          <Link
            to="/register"
            className="register-link"
          >
            Create Employee Account
          </Link>


          <p className="login-footer">
            Employee Productivity & Attendance Management System
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;

