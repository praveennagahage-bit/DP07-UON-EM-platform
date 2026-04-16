import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

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
        borderBottom: "1px solid #ddd",
      }}
    >
      {/* LEFT: LOGO + TITLE */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/University_of_Newcastle_Australia_logo.svg/1200px-University_of_Newcastle_Australia_logo.svg.png"
          alt="logo"
          style={{ width: "40px" }}
        />
        <div>
          <strong>University of Newcastle</strong>
          <div style={{ fontSize: "12px", color: "#555" }}>
            Event Management Platform
          </div>
        </div>
      </div>

      {/* CENTER NAV */}
      <div>
        <Link to="/" style={linkStyle("/")}>Home</Link>
        <Link to="/events" style={linkStyle("/events")}>Events</Link>
        <Link to="/bookings" style={linkStyle("/bookings")}>My Bookings</Link>
        <Link to="/create" style={linkStyle("/create")}>Create Event</Link>
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

        {/* PROFILE */}
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

      </div>
    </nav>
  );
}

export default Navbar;