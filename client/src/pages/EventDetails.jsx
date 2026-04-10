import { useParams } from "react-router-dom";

function EventDetails() {
  const { id } = useParams();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Event Details</h1>
      <p>You selected event ID: {id}</p>
    </div>
  );
}

export default EventDetails;