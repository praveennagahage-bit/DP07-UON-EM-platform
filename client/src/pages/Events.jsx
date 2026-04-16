import { useNavigate } from "react-router-dom";

function Events() {
  const navigate = useNavigate();

  const events = [
    { id: 1, title: "AI Workshop", date: "20 Apr 2026", venue: "UoN Campus" },
    { id: 2, title: "Tech Meetup", date: "10 Jun 2026", venue: "City Hall" },
    { id: 3, title: "Hackathon", date: "01 Jul 2026", venue: "Innovation Hub" },
  ];

  return (
    <div style={{ padding: "30px" }}>
      <h1>All Events</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              background: "#fff",
              borderRadius: "15px",
              width: "280px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            <img
              src="https://via.placeholder.com/300x150"
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
                  borderRadius: "5px"
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;