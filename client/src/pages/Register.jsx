import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const data = await registerUser(
        name,
        email,
        password,
        department
      );


      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );


      navigate("/employee/dashboard");

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <h1>Create Account</h1>

          <p>
            Employee registration
          </p>

        </div>


        <form onSubmit={handleRegister}>

          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />


          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />


          <label>Department</label>

          <input
            type="text"
            placeholder="e.g. Computer Science"
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
          />


          <label>Password</label>

          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>

        </form>


        <p className="auth-footer">

          Already have an account?{" "}

          <span
            onClick={() =>
              navigate("/login")
            }
          >
            Login
          </span>

        </p>

      </div>

    </div>
  );
}

export default Register;
