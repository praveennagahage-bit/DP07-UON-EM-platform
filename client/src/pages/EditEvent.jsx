import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    capacity: "",
  });

  const [error, setError] = useState("");

  let currentUser = null;

  try {
    const storedUser = localStorage.getItem("uonUser");

    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error(err);
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

        setForm({
          title: data.title || "",
          description: data.description || "",
          date: data.date || "",
          time: data.time || "",
          location: data.location || "",
          category: data.category || "",
          capacity: data.capacity || "",
        });
      } catch (err) {
        console.error(err);
        setError("Could not load event");
      }
    }

    fetchEvent();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "organizer") {
      setError("Only organizers can edit events");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/events/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            capacity: Number(form.capacity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update event");
        return;
      }

      navigate("/events");
    } catch (err) {
      console.error(err);
      setError("Could not connect to server");
    }
  }

  if (!currentUser || currentUser.role !== "organizer") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1d1d1d",
          color: "white",
          padding: "40px",
        }}
      >
        <h2>Organizer access required</h2>
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
          maxWidth: "650px",
          margin: "0 auto",
          background: "#0b0b0b",
          border: "1px solid #292929",
          borderRadius: "10px",
          padding: "30px",
        }}
      >
        <p
          style={{
            color: "#7fb7aa",
            fontSize: "13px",
            textTransform: "uppercase",
          }}
        >
          Organizer
        </p>

        <h1>Edit Event</h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Event title"
            style={inputStyle}
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            placeholder="Description"
            style={inputStyle}
          />

                <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        className="dark-date-time"
        style={inputStyle}
        />

        <input
        type="time"
        name="time"
        value={form.time}
        onChange={handleChange}
        className="dark-date-time"
        style={inputStyle}
        />

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            style={inputStyle}
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Social">Social</option>
            <option value="Sports">Sports</option>
          </select>

          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            placeholder="Capacity"
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "#ff6666" }}>
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/events")}
              style={{
                flex: 1,
                padding: "12px",
                background: "#ffffff",
                color: "#111111",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px",
                background: "#065f52",
                color: "#ffffff",
                border: "1px solid #087565",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  background: "#171717",
  color: "#ffffff",
  border: "1px solid #343434",
  borderRadius: "6px",
  fontFamily: "inherit",
};

export default EditEvent;