import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  // Load events from the backend
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setEventError("");

        const response = await fetch("http://localhost:3000/events");

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = await response.json();

        setAllEvents(data);
      } catch (error) {
        console.error("Could not load homepage events:", error);
        setEventError("Could not load upcoming events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Only show the first 3 events on the homepage
  const upcomingEvents = allEvents.slice(0, 3);

  // Dynamic category counts
  const workshopCount = allEvents.filter(
    (event) => event.category === "Workshop"
  ).length;

  const seminarCount = allEvents.filter(
    (event) => event.category === "Seminar"
  ).length;

  const socialCount = allEvents.filter(
    (event) => event.category === "Social"
  ).length;

  const sportsCount = allEvents.filter(
    (event) => event.category === "Sports"
  ).length;

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

          {/* LOADING */}
          {loading && (
            <p
              style={{
                color: "#aaaaaa",
              }}
            >
              Loading events...
            </p>
          )}

          {/* ERROR */}
          {eventError && (
            <p
              style={{
                color: "#ff7070",
              }}
            >
              {eventError}
            </p>
          )}

          {/* NO EVENTS */}
          {!loading &&
            !eventError &&
            upcomingEvents.length === 0 && (
              <div
                style={{
                  background: "#0b0b0b",
                  border: "1px solid #292929",
                  padding: "25px",
                  borderRadius: "8px",
                  color: "#aaaaaa",
                }}
              >
                No upcoming events are currently available.
              </div>
            )}

          {/* EVENT CARDS */}
          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            {upcomingEvents.map((event) => (
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
                {/* EVENT IMAGE */}
                <img
                  src={`https://picsum.photos/300/150?random=${event.id}`}
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
                  {/* CATEGORY */}
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#7fb7aa",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      fontWeight: "600",
                    }}
                  >
                    {event.category || "Event"}
                  </p>

                  {/* TITLE */}
                  <h3
                    style={{
                      margin: "0 0 15px",
                      color: "#ffffff",
                      fontSize: "18px",
                    }}
                  >
                    {event.title}
                  </h3>

                  {/* DATE */}
                  <p
                    style={{
                      margin: "6px 0",
                      color: "#bdbdbd",
                      fontSize: "14px",
                    }}
                  >
                    📅 {event.date}
                  </p>

                  {/* TIME */}
                  <p
                    style={{
                      margin: "6px 0",
                      color: "#bdbdbd",
                      fontSize: "14px",
                    }}
                  >
                    ⏰ {event.time}
                  </p>

                  {/* LOCATION */}
                  <p
                    style={{
                      margin: "6px 0",
                      color: "#bdbdbd",
                      fontSize: "14px",
                    }}
                  >
                    📍 {event.location}
                  </p>

                  {/* VIEW DETAILS */}
                  <button
                    onClick={() =>
                      navigate(`/events/${event.id}`)
                    }
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
                All Events
                <span>{allEvents.length}</span>
              </div>

              <div style={categoryItem}>
                Workshops
                <span>{workshopCount}</span>
              </div>

              <div style={categoryItem}>
                Seminars
                <span>{seminarCount}</span>
              </div>

              <div style={categoryItem}>
                Social
                <span>{socialCount}</span>
              </div>

              <div style={categoryItem}>
                Sports
                <span>{sportsCount}</span>
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