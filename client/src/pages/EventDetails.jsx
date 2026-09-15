import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let currentUser = null;

  try {
    const storedUser = localStorage.getItem("uonUser");

    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error("Failed to read user information:", err);
  }

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(
          `http://localhost:3000/events/${id}`
        );

        if (!response.ok) {
          throw new Error("Event not found");
        }

        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
        setError("Could not load event details");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1d1d1d",
          color: "white",
          padding: "40px",
        }}
      >
        Loading event...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1d1d1d",
          color: "white",
          padding: "40px",
        }}
      >
        <h2>{error || "Event not found"}</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: "#1d1d1d",
        color: "#ffffff",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate("/events")}
          style={{
            background: "transparent",
            color: "#7fb7aa",
            border: "none",
            cursor: "pointer",
            marginBottom: "20px",
            padding: 0,
          }}
        >
          ← Back to Events
        </button>

        <div
          style={{
            background: "#0b0b0b",
            border: "1px solid #292929",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "45px",
              background:
                "linear-gradient(135deg, #064e43 0%, #033b34 100%)",
            }}
          >
            <span
              style={{
                background: "#087565",
                padding: "6px 10px",
                borderRadius: "5px",
                fontSize: "13px",
              }}
            >
              {event.category || "Event"}
            </span>

            <h1
              style={{
                marginTop: "18px",
                marginBottom: "10px",
              }}
            >
              {event.title}
            </h1>

            <p style={{ color: "#d1e5df" }}>
              {event.description}
            </p>
          </div>

          <div style={{ padding: "30px" }}>
            <p>📅 {event.date}</p>
            <p>⏰ {event.time}</p>
            <p>📍 {event.location}</p>
            <p>👥 Capacity: {event.capacity}</p>

            {event.firstName && (
              <p style={{ color: "#999999" }}>
                Created by: {event.firstName} {event.lastName}
              </p>
            )}

            {currentUser?.role === "attendee" && (
              <button
                style={{
                  marginTop: "20px",
                  padding: "11px 20px",
                  background: "#065f52",
                  color: "#ffffff",
                  border: "1px solid #087565",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Join Event
              </button>
            )}

            {currentUser?.role === "organizer" && (
              <button
                onClick={() => navigate(`/events/${event.id}/edit`)}
                style={{
                  marginTop: "20px",
                  padding: "11px 20px",
                  background: "#065f52",
                  color: "#ffffff",
                  border: "1px solid #087565",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Edit Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;