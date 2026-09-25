import "./FeaturedEvent.css";
import featuredImage from "../assets/featured-event.jpg";

export default function FeaturedEvent() {
  return (
    <section className="featured-section">

      {/* Main featured card */}
      <div className="featured-card">

        {/* LEFT IMAGE */}
        <div className="featured-image-wrapper">
          <img
            src={featuredImage}
            alt="Featured Event"
            className="featured-image"
          />

          <span className="featured-label">
            FEATURED
          </span>
        </div>

        {/* RIGHT CONTENT */}
        <div className="featured-content">

          <span className="featured-category">
            SEMINAR
          </span>

          <h2 className="featured-title">
            Future Careers: Industry Insights Panel
          </h2>

          <p className="featured-description">
            Hear from UON alumni and industry experts about career paths,
            job opportunities and how to stand out in today&apos;s market.
          </p>

          {/* Event Information */}
          <div className="featured-meta">

            <div className="meta-item">
              <span className="meta-icon">▣</span>
              <span>Wed, 22 Oct 2025</span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">◷</span>
              <span>2:00 PM – 4:00 PM</span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">⌖</span>
              <span>Newton Lecture Theatre</span>
            </div>

          </div>

          {/* Bottom area */}
          <div className="featured-bottom">

            <div className="attendees">

              <div className="avatar-stack">
                <div className="avatar">J</div>
                <div className="avatar">M</div>
                <div className="avatar">A</div>
                <div className="avatar">S</div>
              </div>

              <span className="attendee-text">
                120+ students attending
              </span>

            </div>

            <button className="featured-button">
              Save My Spot
              <span>→</span>
            </button>

          </div>

        </div>
      </div>
    </section>
  );
}