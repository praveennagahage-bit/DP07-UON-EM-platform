import QuickActions from "../components/QuickActions";
import FeaturedEvent from "../components/FeaturedEvent";
import defaultEventImage from "../assets/hero.png";
import { apiFetch } from "../api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  // Search
  const [search, setSearch] = useState("");

  // Events
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/events?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/events");
    }
  };

  // Load events from backend
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setEventError("");

        const response = await apiFetch("/events");

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = await response.json();

        setAllEvents(
          data.filter((event) => event.status === "active")
        );
      } catch (error) {
        console.error("Could not load homepage events:", error);
        setEventError("Could not load upcoming events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Only show first 3 events
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

  // Reusable styles
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
        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <div style={{ flex: 3, minWidth: 0 }}>
          {/* =====================================================
              HERO SECTION
          ====================================================== */}

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
                maxWidth: "760px",
              }}
            >
              {/* SMALL HEADING */}

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

              {/* MAIN HEADING */}

              <h1
                style={{
                  margin: 0,
                  fontSize: "42px",
                  lineHeight: "1.12",
                  fontWeight: "700",
                }}
              >
                Discover Amazing
                <br />

                <span
                  style={{
                    color: "#38e2b4",
                  }}
                >
                  Events at UON
                </span>
              </h1>

              {/* HERO DESCRIPTION */}

              <p
                style={{
                  marginTop: "16px",
                  marginBottom: 0,
                  color: "#d6e7e3",
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              >
                Find workshops, seminars, social activities, sports and more.
                <br />
                Make the most of your university experience.
              </p>

              {/* =====================================================
                  BIG SEARCH BAR
              ====================================================== */}

              <form
                onSubmit={handleSearch}
                style={{
                  marginTop: "28px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                }}
              >
                {/* SEARCH INPUT */}

                <div
                  style={{
                    position: "relative",
                    flex: 1,
                  }}
                >
                  {/* SEARCH ICON */}

                  <span
                    style={{
                      position: "absolute",
                      left: "18px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#a9bbb7",
                      fontSize: "18px",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  >
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search events, topics or categories..."
                    style={{
                      boxSizing: "border-box",
                      width: "100%",
                      height: "56px",
                      padding: "0 20px 0 50px",
                      background: "rgba(8, 29, 27, 0.90)",
                      color: "#ffffff",
                      border:
                        "1px solid rgba(255, 255, 255, 0.22)",
                      borderRadius: "9px",
                      fontSize: "15px",
                      outline: "none",
                      boxShadow:
                        "0 6px 20px rgba(0, 0, 0, 0.12)",
                    }}
                  />
                </div>

                {/* SEARCH BUTTON */}

                <button
                  type="submit"
                  style={{
                    height: "56px",
                    padding: "0 26px",
                    background: "#20dbaa",
                    color: "#03231b",
                    border: "none",
                    borderRadius: "9px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                    whiteSpace: "nowrap",
                    boxShadow:
                      "0 7px 20px rgba(32, 219, 170, 0.16)",
                  }}
                >
                  Explore Events

                  <span
                    style={{
                      fontSize: "18px",
                    }}
                  >
                    →
                  </span>
                </button>
              </form>

              {/* =====================================================
                  SMALL CATEGORY LINKS UNDER SEARCH
              ====================================================== */}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "35px",
                  marginTop: "25px",
                }}
              >
                {/* WORKSHOPS */}

                <div
                  onClick={() =>
                    navigate("/events?category=Workshop")
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>▣</span>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      Workshops
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#acd1c8",
                        marginTop: "2px",
                      }}
                    >
                      Learn new skills
                    </div>
                  </div>
                </div>

                {/* SEMINARS */}

                <div
                  onClick={() =>
                    navigate("/events?category=Seminar")
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>▰</span>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      Seminars
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#acd1c8",
                        marginTop: "2px",
                      }}
                    >
                      Gain insights
                    </div>
                  </div>
                </div>

                {/* SOCIAL */}

                <div
                  onClick={() =>
                    navigate("/events?category=Social")
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>♙</span>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      Social
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#acd1c8",
                        marginTop: "2px",
                      }}
                    >
                      Meet new people
                    </div>
                  </div>
                </div>

                {/* SPORTS */}

                <div
                  onClick={() =>
                    navigate("/events?category=Sports")
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>⚽</span>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      Sports
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#acd1c8",
                        marginTop: "2px",
                      }}
                    >
                      Stay active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              FEATURED EVENT SECTION
          ====================================================== */}

          <div
            style={{
              marginTop: "38px",
              marginBottom: "18px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: "650",
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <span
                style={{
                  color: "#35e6b5",
                  fontSize: "22px",
                }}
              >
                ★
              </span>

              Featured Event
            </h2>
          </div>

          {/* Featured event card */}

          <FeaturedEvent />

          {/* =====================================================
              EVENTS HEADING
          ====================================================== */}

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

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading && (
            <p
              style={{
                color: "#aaaaaa",
              }}
            >
              Loading events...
            </p>
          )}

          {/* =====================================================
              ERROR
          ====================================================== */}

          {eventError && (
            <p
              style={{
                color: "#ff7070",
              }}
            >
              {eventError}
            </p>
          )}

          {/* =====================================================
              NO EVENTS
          ====================================================== */}

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

          {/* =====================================================
              EVENT CARDS
          ====================================================== */}

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
                  src={event.imageUrl || defaultEventImage}
                  alt={event.title}
                  style={{
                    width: "100%",
                    height: "145px",
                    objectFit: "cover",
                    display: "block",
                    filter: "brightness(0.8)",
                  }}
                />

                <div
                  style={{
                    padding: "18px",
                  }}
                >
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

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        <div
          style={{
            flex: 1,
            minWidth: "280px",
          }}
        >
          {/* =====================================================
              QUICK ACTIONS
          ====================================================== */}

          <div
          className="sidebar"
          style={{ marginBottom: "20px" }}
          >
            <QuickActions />
          </div>

          {/* =====================================================
              CATEGORIES
          ====================================================== */}

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
              {/* ALL EVENTS */}

              <div
                style={{
                  ...activeCategory,
                  cursor: "pointer",
                }}
                onClick={() => navigate("/events")}
              >
                All Events

                <span>{allEvents.length}</span>
              </div>

              {/* WORKSHOPS */}

              <div
                style={{
                  ...categoryItem,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate("/events?category=Workshop")
                }
              >
                Workshops

                <span>{workshopCount}</span>
              </div>

              {/* SEMINARS */}

              <div
                style={{
                  ...categoryItem,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate("/events?category=Seminar")
                }
              >
                Seminars

                <span>{seminarCount}</span>
              </div>

              {/* SOCIAL */}

              <div
                style={{
                  ...categoryItem,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate("/events?category=Social")
                }
              >
                Social

                <span>{socialCount}</span>
              </div>

              {/* SPORTS */}

              <div
                style={{
                  ...categoryItem,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate("/events?category=Sports")
                }
              >
                Sports

                <span>{sportsCount}</span>
              </div>
            </div>
          </div>

          {/* =====================================================
              SUBSCRIBE
          ====================================================== */}

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