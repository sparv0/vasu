import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const menuItems = [
    {
      path: "/hr/dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      path: "/hr/employees",
      icon: "♙",
      label: "Employees",
    },
    {
      path: "/hr/attendance",
      icon: "◷",
      label: "Attendance",
    },
    {
      path: "/hr/leaves",
      icon: "▣",
      label: "Leaves",
    },
    {
      path: "/hr/performance",
      icon: "↗",
      label: "Performance",
    },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <div className="brand-logo">
          EP
        </div>

        <div>
          <h2>WorkPulse</h2>
          <span>Management System</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span>MAIN MENU</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "H"}
          </div>

          <div>
            <strong>
              {user.name || "HR Manager"}
            </strong>

            <span>
              {user.email ||
                "hr@company.com"}
            </span>
          </div>
        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;
