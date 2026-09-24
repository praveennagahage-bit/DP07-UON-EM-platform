import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import RegistrationButton from '../components/RegistrationButton';
import AttendeeManager from '../components/AttendeeManager';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const endpoint = '/events/' + id;
  const reload = useCallback(async () => { setEvent(await api(endpoint)); }, [endpoint]);
  useEffect(() => {
    let active = true;
    api(endpoint).then(data => { if (active) { setEvent(data); setError(''); } })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [endpoint, user?.id]);
  async function cancel(e) {
    e.preventDefault();
    setBusy(true); setActionError('');
    try {
      await api(endpoint + '/cancel', { method: 'POST', body: JSON.stringify({ reason }) });
      await reload();
    } catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm('Permanently delete this event? This cannot be undone.')) return;
    setBusy(true); setActionError('');
    try {
      await api(endpoint, { method: 'DELETE' });
      navigate('/events');
    } catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }
  if (error) return <main className="page"><p role="alert" className="error">{error}</p><Link to="/events">Back to Events</Link></main>;
  if (!event) return <main className="page"><p role="status">Loading event…</p></main>;
  return <main className="page detail-page">
    <Link className="back-link" to="/events">← Back to Events</Link>
    <article className="panel">
      {event.imageUrl && <img className="event-cover detail-cover" src={event.imageUrl} alt={event.title} />}
      <div className="event-banner"><span>{event.category}</span><span>{event.status === 'cancelled' ? 'Cancelled' : 'Active'}</span></div>
      <h1>{event.title}</h1><p className="description">{event.description}</p>
      <p>{event.date} · {event.time}</p><p>{event.location}</p>
      <p className="count">{event.registeredCount} / {event.capacity} registered</p>
      {event.firstName && <p className="muted">Created by: {event.firstName} {event.lastName}</p>}
      {event.status === 'cancelled' && <p className="cancellation" role="status">This event has been cancelled. Reason: {event.cancellationReason}</p>}
      <RegistrationButton event={event} onChange={reload} />
      {user?.role === 'organizer' && user.id === event.createdBy && event.status === 'active' && <Link className="action" to={endpoint + '/edit'}>Edit Event</Link>}
    </article>
    {user?.role === 'organizer' && user.id === event.createdBy && <>
      <AttendeeManager key={id} event={event} onChange={reload} />
      <section className="panel">
        <h2>Event Administration</h2>
        {actionError && <p className="error" role="alert">{actionError}</p>}
        {event.status === 'active' && <form onSubmit={cancel}>
          <label>Cancellation reason<textarea value={reason} onChange={e => setReason(e.target.value)} required maxLength={2000} placeholder="Explain why this event is being cancelled." /></label>
          <p className="muted">The event and its bookings will be retained. All registered attendees will receive a notification with the cancellation reason.</p>
          <button className="action danger" disabled={busy || !reason.trim()}>{busy ? 'Updating…' : 'Cancel Event'}</button>
        </form>}
        <hr /><p className="muted">Only events with no registrations can be permanently deleted.</p>
        <button className="action secondary" disabled={busy || event.registeredCount > 0} onClick={remove}>Delete Event</button>
      </section>
    </>}
  </main>;
}
