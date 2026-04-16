import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const events = [
    { id: 1, title: "AI Workshop", date: "20 Apr 2026", venue: "UoN Campus" },
    { id: 2, title: "Tech Meetup", date: "10 Jun 2026", venue: "City Hall" },
    { id: 3, title: "Hackathon", date: "01 Jul 2026", venue: "Innovation Hub" },
  ];

  // 🔥 STYLES
  const itemStyle = {
    padding: "10px",
    borderRadius: "8px",
    background: "#f5f5f5",
    cursor: "pointer"
  };

  const categoryItem = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderRadius: "8px",
    background: "#f5f5f5"
  };

  const activeCategory = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderRadius: "8px",
    background: "#e0e7ff",
    color: "#4f46e5",
    fontWeight: "bold"
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "30px" }}>

      {/* LEFT SIDE */}
      <div style={{ flex: 3 }}>

        {/* HERO SECTION */}
        <div
          style={{
            background: "linear-gradient(to right, #4f46e5, #7c3aed)",
            color: "white",
            padding: "40px",
            borderRadius: "15px",
          }}
        >
          <h1>Discover Amazing Events at UoN</h1>
          <p>Join workshops, seminars, and social events.</p>

          <button
            onClick={() => navigate("/events")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "white",
              color: "#4f46e5",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Browse Events
          </button>
        </div>

        {/* EVENTS SECTION */}
        <h2 style={{ marginTop: "40px" }}>Upcoming Events</h2>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#fff",
                borderRadius: "15px",
                width: "280px",
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              {/* IMAGE */}
              <img
                src="https://picsum.photos/300/150"
                alt="event"
                style={{ width: "100%" }}
              />

              <div style={{ padding: "15px" }}>
                <h3>{event.title}</h3>
                <p>{event.date}</p>
                <p>{event.venue}</p>

                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    width: "100%",
                    background: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE (SIDEBAR) */}
      <div style={{ flex: 1 }}>

        {/* QUICK ACTIONS */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginBottom: "15px" }}>⚡ Quick Actions</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={itemStyle} onClick={() => navigate("/create")}>
              📊 Create New Event →
            </div>
            <div style={itemStyle}>📅 My Bookings →</div>
            <div style={itemStyle}>👤 Update Profile →</div>
          </div>
        </div>

        {/* CATEGORIES */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginBottom: "15px" }}>📁 Categories</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={activeCategory}>All Events <span>24</span></div>
            <div style={categoryItem}>Workshops <span>8</span></div>
            <div style={categoryItem}>Seminars <span>6</span></div>
            <div style={categoryItem}>Social <span>7</span></div>
            <div style={categoryItem}>Sports <span>3</span></div>
          </div>
        </div>

        {/* SUBSCRIBE */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h3>📩 Stay Updated</h3>
          <p style={{ fontSize: "14px", color: "#555" }}>
            Subscribe to get event updates
          </p>

          <input
            type="email"
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc"
            }}
          />

          <button style={{
            marginTop: "10px",
            width: "100%",
            padding: "10px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "5px"
          }}>
            Subscribe
          </button>
        </div>

      </div>
    </div>
  );
}

export default Home;