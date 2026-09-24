import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { isFutureEvent } from '../../../shared/eventTime.mjs';

export default function AttendeeManager({ event, onChange }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const endpoint = '/events/' + event.id + '/attendees';
  const load = useCallback(async () => {
    setAttendees(await api(endpoint));
  }, [endpoint]);
  useEffect(() => {
    let active = true;
    api(endpoint).then(data => { if (active) setAttendees(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);
  async function search(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      setResults(await api('/attendees?q=' + encodeURIComponent(query.trim())));
      setSearched(true);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function change(user, remove) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api(endpoint + (remove ? '/' + user.id : ''), {
        method: remove ? 'DELETE' : 'POST',
        ...(remove ? {} : { body: JSON.stringify({ userId: user.id }) }),
      });
      await Promise.all([load(), onChange()]);
      setMessage(user.firstName + (remove ? ' was removed from this event.' : ' was registered for this event.'));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="panel" aria-labelledby="attendees-heading">
    <h2 id="attendees-heading">Attendee Management</h2>
    <p className="count">{event.registeredCount} / {event.capacity} registered</p>
    {loading && <p role="status">Loading attendees…</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {message && <p role="status" className="success">{message}</p>}
    {!loading && !attendees.length && <p className="muted">No attendees registered yet.</p>}
    {attendees.length > 0 && <div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
      <tbody>{attendees.map(user => <tr key={user.id}><td>{user.firstName} {user.lastName}</td><td>{user.email}</td><td><button className="action danger" disabled={busy} onClick={() => change(user, true)} aria-label={'Remove ' + user.firstName + ' ' + user.lastName}>Remove</button></td></tr>)}</tbody>
    </table></div>}
    {event.status === 'active' && !isFutureEvent(event.date, event.time) && <p className="muted">Registration is closed because this event has started.</p>}
    {event.status === 'active' && isFutureEvent(event.date, event.time) && <>
      <h3>Add Attendee</h3>
      <p className="muted">Search an existing attendee account by name or email.</p>
      <form className="inline-form" onSubmit={search}>
        <label className="grow">Name or email<input value={query} onChange={e => { setQuery(e.target.value); setSearched(false); setResults([]); }} placeholder="At least 2 characters" minLength={2} required /></label>
        <button className="action" disabled={busy || query.trim().length < 2}>Find Attendee</button>
      </form>
      {searched && !results.length && <p>No matching attendee accounts found.</p>}
      <ul className="search-results">{results.map(user => {
        const registered = attendees.some(item => item.id === user.id);
        const full = event.registeredCount >= event.capacity;
        return <li key={user.id}><div>{user.firstName} {user.lastName}<small>{user.email}</small></div>
          <button className="action" disabled={busy || registered || full} onClick={() => change(user, false)} aria-label={'Add ' + user.firstName + ' ' + user.lastName}>{registered ? 'Registered' : full ? 'Event Full' : 'Add'}</button></li>;
      })}</ul>
    </>}
  </section>;
}
