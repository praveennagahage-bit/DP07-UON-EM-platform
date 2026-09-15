import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/unilogo.jpg";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current logged-in user from localStorage
  let currentUser = null;

  try {
    const storedUser = localStorage.getItem("uonUser");

    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Failed to read user information:", error);
  }

  const isLoggedIn = currentUser !== null;

  // Handle user logout
  function handleLogout() {
    localStorage.removeItem("uonUser");
    navigate("/auth");
  }

  const linkStyle = (path) => ({
    marginRight: "20px",
    textDecoration: "none",
    fontWeight: "500",
    color: location.pathname === path ? "#065f52" : "#333",
    borderBottom:
      location.pathname === path
        ? "2px solid #065f52"
        : "2px solid transparent",
    paddingBottom: "4px",
    transition: "0.2s ease",
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e5e5",
      }}
    >
      {/* LEFT: LOGO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* LOGO */}
        <img
          src={logo}
          alt="uon logo"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
          }}
        />

        {/* TEXT */}
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "16px",
              color: "#111111",
            }}
          >
            University of Newcastle
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#666666",
            }}
          >
            Event Management Platform
          </div>
        </div>
      </div>

      {/* CENTER NAV */}
      <div>
        <Link to="/" style={linkStyle("/")}>
          Home
        </Link>

        <Link to="/events" style={linkStyle("/events")}>
          Events
        </Link>

        <Link to="/create" style={linkStyle("/create")}>
          Create
        </Link>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search events..."
          style={{
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #cccccc",
            background: "#ffffff",
            color: "#111111",
            outline: "none",
          }}
        />

        {/* NOTIFICATION */}
        <span
          style={{
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          🔔
        </span>

        {/* PROFILE / AUTH */}
        {isLoggedIn ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* USER AVATAR */}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#065f52",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {currentUser.firstName?.charAt(0).toUpperCase()}
              {currentUser.lastName?.charAt(0).toUpperCase()}
            </div>

            {/* USER INFORMATION */}
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#111111",
                }}
              >
                {currentUser.firstName} {currentUser.lastName}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#666666",
                  textTransform: "capitalize",
                }}
              >
                {currentUser.role}
              </div>
            </div>

            {/* LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "5px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #065f52",
                background: "#ffffff",
                color: "#065f52",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            style={{
              cursor: "pointer",
              padding: "9px 14px",
              borderRadius: "6px",
              background: "#065f52",
              color: "#ffffff",
              border: "1px solid #065f52",
              fontWeight: "600",
            }}
          >
            Sign In / Sign Up
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;