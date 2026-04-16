import { useNavigate } from "react-router-dom";

function Events() {
  const navigate = useNavigate();

  const events = [
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      date: "20 Apr 2026",
      time: "10:00 AM",
      venue: "Engineering Building, Room 201",
      category: "Workshop",
      spots: 42,
      image: "https://picsum.photos/300/200?random=1"
    },
    {
      id: 2,
      title: "Careers in Tech: Panel Discussion",
      date: "10 Jun 2026",
      time: "2:00 PM",
      venue: "Business School Auditorium",
      category: "Seminar",
      spots: 87,
      image: "https://picsum.photos/300/200?random=2"
    },
    {
      id: 3,
      title: "International Students Welcome Fair",
      date: "01 Jul 2026",
      time: "11:00 AM",
      venue: "University Courtyard",
      category: "Social",
      spots: 120,
      image: "https://picsum.photos/300/200?random=3"
    }
  ];

  return (
    <div style={{ padding: "30px" }}>
      <h1>All Events</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              width: "300px",
              background: "#fff",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >

            {/* IMAGE + CATEGORY */}
            <div style={{ position: "relative" }}>
              <img
                src={event.image}
                alt="event"
                style={{ width: "100%", height: "150px", objectFit: "cover" }}
              />

              <span
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  background: "#6366f1",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}
              >
                {event.category}
              </span>
            </div>

            {/* CONTENT */}
            <div style={{ padding: "15px" }}>
              <h3 style={{ marginBottom: "10px" }}>{event.title}</h3>

              <p style={{ fontSize: "14px", color: "#555" }}>
                📅 {event.date} &nbsp; ⏰ {event.time}
              </p>

              <p style={{ fontSize: "14px", color: "#555" }}>
                📍 {event.venue}
              </p>

              <p style={{ fontSize: "13px", color: "#777" }}>
                Join us for an engaging and insightful event experience.
              </p>

              {/* FOOTER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "10px"
                }}
              >
                <span style={{ color: "green", fontSize: "13px" }}>
                  {event.spots} Spots Left
                </span>

                <button
                  onClick={() => navigate(`/events/${event.id}`)}
                  style={{
                    padding: "6px 12px",
                    background: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  View Details
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;