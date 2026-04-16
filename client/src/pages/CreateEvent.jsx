import { useState } from "react";

function CreateEvent() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Event Created!");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "50px"
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Create Event</h2>

        <form onSubmit={handleSubmit}>
          
          {/* TITLE */}
          <label>Event Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />

          {/* DATE */}
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />

          {/* VENUE */}
          <label>Venue</label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            style={inputStyle}
          />

          {/* BUTTON */}
          <button
            type="submit"
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "10px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}

// 🔥 reusable style
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc"
};

export default CreateEvent;