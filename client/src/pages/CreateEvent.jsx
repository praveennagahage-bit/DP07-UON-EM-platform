import { useState } from "react";

function CreateEvent() {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    venue: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Event Created:", formData);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Create Event</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label><br />
          <input
            type="text"
            name="title"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Date:</label><br />
          <input
            type="date"
            name="date"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Venue:</label><br />
          <input
            type="text"
            name="venue"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>
          Create Event
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;