import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import EventCard from '../components/EventCard';

export default function Events({ bookings = false }) {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const query = bookings ? '' : (params.get('q') || '').trim();
  return <EventResults key={[bookings, query, user?.id].join(':')} bookings={bookings} query={query} />;
}

function EventResults({ bookings, query }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const endpoint = bookings ? '/me/registrations' : '/events' + (query ? '?' + new URLSearchParams({ q: query }) : '');
  const reload = useCallback(async () => {
    const data = await api(endpoint);
    setEvents(data);
  }, [endpoint]);
  useEffect(() => {
    let active = true;
    api(endpoint).then(data => {
      if (active) { setEvents(data); setError(''); }
    }).catch(err => {
      if (active) setError(err.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint, user?.id]);
  return <main className="page">
    <header className="page-heading"><div><p className="eyebrow">{bookings ? 'Your activity' : 'Discover'}</p><h1>{bookings ? 'My Bookings' : query ? 'Search Results' : 'All Events'}</h1></div>
      {user?.role === 'organizer' && <Link className="action" to="/create">+ Create Event</Link>}
    </header>
    {query && <div className="search-summary"><p>Results for <strong>“{query}”</strong> — matching title, category or location.</p><Link className="action secondary" to="/events">Clear Search</Link></div>}
    {!loading && !error && query && <p role="status">{events.length} {events.length === 1 ? 'event' : 'events'} found</p>}
    {loading && <p role="status">Loading events…</p>}
    {error && <p className="error" role="alert">{error} <button onClick={() => window.location.reload()}>Retry</button></p>}
    {!loading && !error && events.length === 0 && <div className="panel"><p>{bookings ? 'You have no event bookings yet.' : query ? 'No events match your search. Try another title, category or location.' : 'No events are currently available.'}</p>{bookings && <Link to="/events">Browse Events</Link>}</div>}
    {!error && <div className="event-grid">{events.map(event => <EventCard key={event.id} event={event} onChange={reload} />)}</div>}
  </main>;
}
