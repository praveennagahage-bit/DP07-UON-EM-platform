import { useNavigate } from "react-router-dom";
import "./QuickActions.css";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-card">

      {/* Header */}
      <div className="quick-actions-header">
        <h3>Quick Actions</h3>

        <button
          className="view-profile-btn"
          onClick={() => navigate("/profile")}
        >
          View Profile →
        </button>
      </div>

      {/* Quick Action Grid */}
      <div className="quick-actions-grid">

        {/* Browse Events */}
        <button
          className="quick-action-item"
          onClick={() => navigate("/events")}
        >
          <div className="quick-action-icon">▣</div>

          <div className="quick-action-text">
            <h4>Browse Events</h4>
            <p>Find what's happening</p>
          </div>
        </button>

        {/* My Bookings */}
        <button
          className="quick-action-item"
          onClick={() => navigate("/bookings")}
        >
          <div className="quick-action-icon">◇</div>

          <div className="quick-action-text">
            <h4>My Bookings</h4>
            <p>View registered events</p>
          </div>
        </button>

        {/* Update Profile */}
        <button
          className="quick-action-item"
          onClick={() => navigate("/profile")}
        >
          <div className="quick-action-icon">♙</div>

          <div className="quick-action-text">
            <h4>Update Profile</h4>
            <p>Keep your info current</p>
          </div>
        </button>

        {/* Notifications */}
        <button
          className="quick-action-item"
          onClick={() => navigate("/notifications")}
        >
          <div className="quick-action-icon">♢</div>

          <div className="quick-action-text">
            <h4>Notifications</h4>
            <p>See latest updates</p>
          </div>
        </button>

      </div>
    </div>
  );
}