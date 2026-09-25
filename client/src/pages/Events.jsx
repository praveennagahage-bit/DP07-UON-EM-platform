import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api";
import EventCard from "../components/EventCard";

export default function Events({ bookings = false }) {
  const [params] = useSearchParams();
  const { user } = useAuth();

  /*
    Supports:
    /events?q=AI
    /events?search=AI
    /events?category=Workshop
  */

  const searchQuery = bookings
    ? ""
    : (
        params.get("q") ||
        params.get("search") ||
        ""
      ).trim();

  return (
    <EventResults
      key={[bookings, searchQuery, params.get('category'), user?.id].join(":")}
      bookings={bookings}
      query={searchQuery}
      category={bookings ? '' : (params.get('category') || '').trim()}
    />
  );
}

function EventResults({ bookings, query, category }) {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
    If user is viewing bookings:
      /me/registrations

    Normal event page:
      /events

    Search:
      /events?q=Workshop
  */
  const endpoint = bookings
    ? "/me/registrations"
    : "/events" +
      (query || category
        ? "?" +
          new URLSearchParams({
            ...(query ? { q: query } : {}),
            ...(category ? { category } : {}),
          })
        : "");

  /*
    Reload events.
    EventCard can call this after something changes.
  */
  const reload = useCallback(async () => {
    try {
      const data = await api(endpoint);
      setEvents(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [endpoint]);

  /*
    Load events
  */
  useEffect(() => {
    let active = true;

    api(endpoint)
      .then((data) => {
        if (active) {
          setEvents(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint, user?.id]);

  return (
    <main className="page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {bookings ? "Your activity" : "Discover"}
          </p>

          <h1>
            {bookings
              ? "My Bookings"
              : query || category
              ? "Search Results"
              : "All Events"}
          </h1>
        </div>

        {/* ORGANIZER CREATE EVENT BUTTON */}

        {user?.role === "organizer" && (
          <Link className="action" to="/create">
            + Create Event
          </Link>
        )}
      </header>

      {/* =====================================================
          SEARCH SUMMARY
      ====================================================== */}

      {(query || category) && (
        <div className="search-summary">
          <p>
            {category && <>Event type: <strong>{category}</strong>. </>}
            {query && <>Results for <strong>“{query}”</strong> — matching title, category or location.</>}
          </p>

          <Link
            className="action secondary"
            to="/events"
          >
            Clear Search
          </Link>
        </div>
      )}

      {/* =====================================================
          RESULT COUNT
      ====================================================== */}

      {!loading && !error && (query || category) && (
        <p role="status">
          {events.length}{" "}
          {events.length === 1 ? "event" : "events"} found
        </p>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <p role="status">
          Loading events…
        </p>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <p className="error" role="alert">
          {error}

          <button
            onClick={() => window.location.reload()}
            style={{
              marginLeft: "10px",
            }}
          >
            Retry
          </button>
        </p>
      )}

      {/* =====================================================
          NO EVENTS
      ====================================================== */}

      {!loading &&
        !error &&
        events.length === 0 && (
          <div className="panel">
            <p>
              {bookings
                ? "You have no event bookings yet."
                : query || category
                ? "No events match your search. Try another title, category or location."
                : "No events are currently available."}
            </p>

            {bookings && (
              <Link to="/events">
                Browse Events
              </Link>
            )}
          </div>
        )}

      {/* =====================================================
          EVENT GRID
      ====================================================== */}

      {!error && (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onChange={reload}
            />
          ))}
        </div>
      )}
    </main>
  );
}
