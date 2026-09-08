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
    color: location.pathname === path ? "#065f52" : "#333",
    borderBottom:
      location.pathname === path ? "2px solid #065f52" : "2px solid transparent",
    paddingBottom: "4px",
    transition: "0.2s ease"
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 40px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e5e5"
      }}
    >
      {/* LEFT: LOGO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        {/* LOGO */}
        <img
          src={logo}
          alt="uon logo"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain"
          }}
        />

        {/* TEXT */}
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "16px",
              color: "#111111"
            }}
          >
            University of Newcastle
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#666666"
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
          gap: "15px"
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
            outline: "none"
          }}
        />

        {/* NOTIFICATION */}
        <span
          style={{
            fontSize: "18px",
            cursor: "pointer"
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
              gap: "8px"
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                background: "#065f52",
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
              <div
                style={{
                  fontSize: "14px",
                  color: "#111111"
                }}
              >
                John Doe
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#666666"
                }}
              >
                Student
              </div>
            </div>
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
              fontWeight: "600"
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