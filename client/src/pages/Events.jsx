import { useNavigate } from "react-router-dom";

function Events() {
  const navigate = useNavigate();

  const events = [
    {
      id: 1,
      title: "AI Workshop",
      date: "2026-05-20",
      venue: "UoN Campus",
    },
    {
      id: 2,
      title: "Tech Meetup",
      date: "2026-06-10",
      venue: "Newcastle City Hall",
    },
    {
      id: 3,
      title: "Hackathon",
      date: "2026-07-01",
      venue: "Innovation Hub",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h1>All Events</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              width: "250px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                backgroundColor: "#fff",
            }}
          >
            <h2>{event.title}</h2>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Venue:</strong> {event.venue}</p>

            <button
              onClick={() => navigate(`/events/${event.id}`)}
              style={{ marginTop: "10px" }}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;