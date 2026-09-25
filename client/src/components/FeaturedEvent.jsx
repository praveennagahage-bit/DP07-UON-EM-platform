import "./FeaturedEvent.css";
import featuredImage from "../assets/hero.png";
import { useNavigate } from 'react-router-dom';

export default function FeaturedEvent({ event, loading, error }) {
  const navigate = useNavigate();
  if (loading) return <p role="status">Loading featured event…</p>;
  if (error) return <p role="alert">Could not load the featured event. Please refresh to try again.</p>;
  if (!event) return <p>No upcoming events to feature yet.</p>;
  return (
    <section className="featured-section">

      {/* Main featured card */}
      <div className="featured-card">

        {/* LEFT IMAGE */}
        <div className="featured-image-wrapper">
          <img
            src={event.imageUrl || featuredImage}
            alt={event.title}
            className="featured-image"
          />

          <span className="featured-label">
            FEATURED
          </span>
        </div>

        {/* RIGHT CONTENT */}
        <div className="featured-content">

          <span className="featured-category">
            {event.category}
          </span>

          <h2 className="featured-title">
            {event.title}
          </h2>

          <p className="featured-description">
            {event.description || 'Explore this upcoming UON event.'}
          </p>

          {/* Event Information */}
          <div className="featured-meta">

            <div className="meta-item">
              <span className="meta-icon">▣</span>
              <span>{event.date}</span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">◷</span>
              <span>{event.time} (Australia/Sydney)</span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">⌖</span>
              <span>{event.location}</span>
            </div>

          </div>

          {/* Bottom area */}
          <div className="featured-bottom">

            <div className="attendees">

              <span className="attendee-text">
                {event.registeredCount} / {event.capacity} registered{event.registeredCount >= event.capacity ? ' · Event full' : ''}
              </span>

            </div>

            <button className="featured-button" onClick={() => navigate('/events/' + event.id)}>
              View Event
              <span>→</span>
            </button>

          </div>

        </div>
      </div>
    </section>
  );
}
