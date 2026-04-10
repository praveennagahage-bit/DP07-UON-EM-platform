import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/">Home</Link> |{" "}
      <Link to="/events">Events</Link> |{" "}
      <Link to="/create">Create Event</Link>
    </nav>
  );
}

export default Navbar;