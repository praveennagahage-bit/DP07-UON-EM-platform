import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const events = [
    {
      id: 1,
      title: "AI Workshop",
      date: "20 Apr 2026",
      venue: "UoN Campus",
    },
    {
      id: 2,
      title: "Tech Meetup",
      date: "10 Jun 2026",
      venue: "City Hall",
    },
    {
      id: 3,
      title: "Hackathon",
      date: "01 Jul 2026",
      venue: "Innovation Hub",
    },
  ];

  const itemStyle = {
    padding: "12px 14px",
    borderRadius: "6px",
    background: "#171717",
    border: "1px solid #2b2b2b",
    color: "#f5f5f5",
    cursor: "pointer",
    transition: "0.2s ease",
  };

  const categoryItem = {
    display: "flex",
    justifyContent: "space-between",
    padding: "11px 14px",
    borderRadius: "6px",
    background: "#171717",
    border: "1px solid #2b2b2b",
    color: "#d4d4d4",
  };

  const activeCategory = {
    display: "flex",
    justifyContent: "space-between",
    padding: "11px 14px",
    borderRadius: "6px",
    background: "#064e43",
    border: "1px solid #0b6b5c",
    color: "#ffffff",
    fontWeight: "600",
  };

  const sidebarCardStyle = {
    background: "#0b0b0b",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #292929",
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: "#1d1d1d",
        color: "#ffffff",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "flex",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ flex: 3, minWidth: 0 }}>

          {/* HERO SECTION */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #064e43 0%, #033b34 100%)",
              color: "white",
              padding: "48px 42px",
              borderRadius: "10px",
              border: "1px solid #0b6255",
            }}
          >
            <div
              style={{
                maxWidth: "650px",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "14px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#b7d9d2",
                  fontWeight: "600",
                }}
              >
                UON Event Management
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "38px",
                  lineHeight: "1.15",
                  fontWeight: "700",
                }}
              >
                Discover Events at UON
              </h1>

              <p
                style={{
                  marginTop: "16px",
                  marginBottom: 0,
                  color: "#d6e7e3",
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              >
                Find workshops, seminars, social activities and university
                events in one place.
              </p>

              <button
                onClick={() => navigate("/events")}
                style={{
                  marginTop: "26px",
                  padding: "11px 22px",
                  background: "#f5f5f5",
                  color: "#111111",
                  border: "1px solid #f5f5f5",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Browse Events
              </button>
            </div>
          </div>

          {/* EVENTS SECTION */}
          <div
            style={{
              marginTop: "38px",
              marginBottom: "18px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#7fb7aa",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontWeight: "600",
              }}
            >
              Explore
            </p>

            <h2
              style={{
                margin: "5px 0 0",
                fontSize: "26px",
                fontWeight: "650",
              }}
            >
              Upcoming Events
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: "#0b0b0b",
                  borderRadius: "8px",
                  width: "280px",
                  overflow: "hidden",
                  border: "1px solid #292929",
                }}
              >
                {/* IMAGE */}
                <img
                  src="https://picsum.photos/300/150"
                  alt={event.title}
                  style={{
                    width: "100%",
                    height: "145px",
                    objectFit: "cover",
                    display: "block",
                    filter: "brightness(0.8)",
                  }}
                />

                <div style={{ padding: "18px" }}>
                  <h3
                    style={{
                      margin: "0 0 15px",
                      color: "#ffffff",
                      fontSize: "18px",
                    }}
                  >
                    {event.title}
                  </h3>

                  <p
                    style={{
                      margin: "6px 0",
                      color: "#bdbdbd",
                      fontSize: "14px",
                    }}
                  >
                    {event.date}
                  </p>

                  <p
                    style={{
                      margin: "6px 0",
                      color: "#bdbdbd",
                      fontSize: "14px",
                    }}
                  >
                    {event.venue}
                  </p>

                  <button
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{
                      marginTop: "16px",
                      padding: "10px",
                      width: "100%",
                      background: "#064e43",
                      color: "white",
                      border: "1px solid #0b6255",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            flex: 1,
            minWidth: "280px",
          }}
        >
          {/* QUICK ACTIONS */}
          <div style={sidebarCardStyle}>
            <p
              style={{
                margin: "0 0 6px",
                color: "#7fb7aa",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "1.1px",
                fontWeight: "600",
              }}
            >
              Shortcuts
            </p>

            <h3
              style={{
                margin: "0 0 18px",
                color: "#ffffff",
              }}
            >
              Quick Actions
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={itemStyle}
                onClick={() => navigate("/create")}
              >
                Create New Event →
              </div>

              <div style={itemStyle}>
                My Bookings →
              </div>

              <div style={itemStyle}>
                Update Profile →
              </div>
            </div>
          </div>

          {/* CATEGORIES */}
          <div style={sidebarCardStyle}>
            <p
              style={{
                margin: "0 0 6px",
                color: "#7fb7aa",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "1.1px",
                fontWeight: "600",
              }}
            >
              Browse By
            </p>

            <h3
              style={{
                margin: "0 0 18px",
                color: "#ffffff",
              }}
            >
              Categories
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "9px",
              }}
            >
              <div style={activeCategory}>
                All Events <span>24</span>
              </div>

              <div style={categoryItem}>
                Workshops <span>8</span>
              </div>

              <div style={categoryItem}>
                Seminars <span>6</span>
              </div>

              <div style={categoryItem}>
                Social <span>7</span>
              </div>

              <div style={categoryItem}>
                Sports <span>3</span>
              </div>
            </div>
          </div>

          {/* SUBSCRIBE */}
          <div style={sidebarCardStyle}>
            <p
              style={{
                margin: "0 0 6px",
                color: "#7fb7aa",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "1.1px",
                fontWeight: "600",
              }}
            >
              Notifications
            </p>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#ffffff",
              }}
            >
              Stay Updated
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#aaaaaa",
                lineHeight: "1.5",
                margin: "0 0 14px",
              }}
            >
              Subscribe to receive event updates.
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: "11px",
                background: "#171717",
                color: "#ffffff",
                borderRadius: "6px",
                border: "1px solid #343434",
                outline: "none",
              }}
            />

            <button
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "11px",
                background: "#064e43",
                color: "white",
                border: "1px solid #0b6255",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;