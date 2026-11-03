import {
    LayoutDashboard,
    Users,
    ClipboardCheck,
    BarChart3,
    LogOut,
    BriefcaseBusiness
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {

    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const menuItems = [
        {
            name: "Dashboard",
            path: "/",
            icon: LayoutDashboard
        },
        {
            name: "Employees",
            path: "/employees",
            icon: Users
        },
        {
            name: "Attendance",
            path: "/attendance",
            icon: ClipboardCheck
        },
        {
            name: "Analytics",
            path: "/analytics",
            icon: BarChart3
        }
    ];

    return (
        <aside className="sidebar">

            <div className="brand">

                <div className="brand-icon">
                    <BriefcaseBusiness size={21} />
                </div>

                <div>
                    <h2>WorkTrack</h2>
                    <span>Management System</span>
                </div>

            </div>


            <div className="sidebar-section-title">
                MAIN MENU
            </div>


            <nav className="sidebar-menu">

                {menuItems.map((item) => {

                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "active" : ""}`
                            }
                        >

                            <Icon size={19} />

                            <span>{item.name}</span>

                        </NavLink>
                    );

                })}

            </nav>


            <div className="sidebar-bottom">

                <button
                    className="logout-button"
                    onClick={logout}
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;
