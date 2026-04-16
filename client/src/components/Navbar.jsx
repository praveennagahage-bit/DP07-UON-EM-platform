import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/unilogo.jpg";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 TEMP login state (we will make dynamic later)
  const isLoggedIn = false;

  const linkStyle = (path) => ({
    marginRight: "20px",
    textDecoration: "none",
    fontWeight: "500",
    color: location.pathname === path ? "#4f46e5" : "#333",
    borderBottom: location.pathname === path ? "2px solid #4f46e5" : "none",
    paddingBottom: "3px"
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 40px",
        background: "#fff",
        borderBottom: "1px solid #ddd"
      }}
    >

      {/* LEFT: LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
       {/* LOGO */}
  <img
    src={logo}
    alt="uon logo"
    style={{ width: "40px" }}
  />

  {/* TEXT */}
  <div>
    <div style={{ fontWeight: "bold", fontSize: "16px" }}>
      University of Newcastle
    </div>
    <div style={{ fontSize: "12px", color: "#666" }}>
      Event Management Platform
    </div>
  </div>

</div>
      {/* CENTER NAV */}
      <div>
        <Link to="/" style={linkStyle("/")}>Home</Link>
        <Link to="/events" style={linkStyle("/events")}>Events</Link>
        <Link to="/create" style={linkStyle("/create")}>Create</Link>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search events..."
          style={{
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #ccc"
          }}
        />

        {/* NOTIFICATION */}
        <span style={{ fontSize: "18px" }}>🔔</span>

        {/* PROFILE / AUTH */}
        {isLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                background: "#4f46e5",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold"
              }}
            >
              JD
            </div>
            <div>
              <div style={{ fontSize: "14px" }}>John Doe</div>
              <div style={{ fontSize: "12px", color: "#555" }}>Student</div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => navigate("/auth")}
            style={{
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "#f5f5f5"
            }}
          >
            Sign In / Sign Up
          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;