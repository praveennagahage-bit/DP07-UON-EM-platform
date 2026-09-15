import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read the currently logged-in user
  let currentUser = null;

  try {
    const storedUser = localStorage.getItem("uonUser");

    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error("Failed to read user information:", err);
  }

  // Load events from backend when the page opens
  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:3000/events");

      if (!response.ok) {
        throw new Error("Failed to load events");
      }

      const data = await response.json();

      setEvents(data);
    } catch (err) {
      console.error(err);
      setError("Could not load events");
    } finally {
      setLoading(false);
    }
  }

  // Delete event - organizer only
  async function handleDeleteEvent(eventId) {
    if (!currentUser || currentUser.role !== "organizer") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/events/${eventId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete event");
        return;
      }

      // Refresh event list after deletion
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Could not connect to server");
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 60px)",
          background: "#1d1d1d",
          color: "#ffffff",
          padding: "30px",
        }}
      >
        <h2>Loading events...</h2>
      </div>
    );
  }

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
        }}
      >
        {/* PAGE HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                color: "#7fb7aa",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontWeight: "600",
              }}
            >
              Discover
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              All Events
            </h1>
          </div>

          {/* ORGANIZER CREATE BUTTON */}
          {currentUser?.role === "organizer" && (
            <button
              onClick={() => navigate("/create")}
              style={{
                padding: "11px 18px",
                background: "#065f52",
                color: "#ffffff",
                border: "1px solid #0b7464",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              + Create Event
            </button>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <p
            style={{
              color: "#ff7070",
              marginBottom: "20px",
            }}
          >
            {error}
          </p>
        )}

        {/* NO EVENTS */}
        {!error && events.length === 0 && (
          <div
            style={{
              padding: "30px",
              background: "#0b0b0b",
              border: "1px solid #292929",
              borderRadius: "8px",
              color: "#aaaaaa",
            }}
          >
            No events are currently available.
          </div>
        )}

        {/* EVENT CARDS */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                width: "320px",
                background: "#0b0b0b",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #292929",
              }}
            >
              {/* IMAGE AREA */}
              <div
                style={{
                  height: "150px",
                  background:
                    "linear-gradient(135deg, #064e43 0%, #033b34 100%)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "42px",
                  }}
                >
                  📅
                </div>

                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "#065f52",
                    color: "#ffffff",
                    padding: "5px 9px",
                    borderRadius: "5px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {event.category || "Event"}
                </span>
              </div>

              {/* CONTENT */}
              <div
                style={{
                  padding: "18px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px",
                    color: "#ffffff",
                    fontSize: "19px",
                  }}
                >
                  {event.title}
                </h3>

                <p
                  style={{
                    fontSize: "14px",
                    color: "#bdbdbd",
                    margin: "7px 0",
                  }}
                >
                  📅 {event.date} &nbsp;&nbsp; ⏰ {event.time}
                </p>

                <p
                  style={{
                    fontSize: "14px",
                    color: "#bdbdbd",
                    margin: "7px 0",
                  }}
                >
                  📍 {event.location}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#9d9d9d",
                    lineHeight: "1.5",
                    minHeight: "40px",
                  }}
                >
                  {event.description || "No description available."}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#7fb7aa",
                  }}
                >
                  Capacity: {event.capacity}
                </p>

                {event.firstName && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#777777",
                    }}
                  >
                    Created by: {event.firstName} {event.lastName}
                  </p>
                )}

                {/* VIEW DETAILS */}
                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "10px",
                    background: "#065f52",
                    color: "#ffffff",
                    border: "1px solid #0b7464",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  View Details
                </button>

                {/* ATTENDEE BUTTON */}
                {currentUser?.role === "attendee" && (
                  <button
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "8px",
                      background: "#ffffff",
                      color: "#111111",
                      border: "1px solid #ffffff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Join Event
                  </button>
                )}

                {/* ORGANIZER CONTROLS */}
                {currentUser?.role === "organizer" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        navigate(`/events/${event.id}/edit`)
                      }
                      style={{
                        flex: 1,
                        padding: "9px",
                        background: "#ffffff",
                        color: "#111111",
                        border: "1px solid #ffffff",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteEvent(event.id)
                      }
                      style={{
                        flex: 1,
                        padding: "9px",
                        background: "#7a1f1f",
                        color: "#ffffff",
                        border: "1px solid #9b2c2c",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Events;