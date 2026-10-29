import { useEffect, useState } from 'react';
import { api } from '../api';

export default function MessageComposer({ eventId }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.all([eventId ? Promise.resolve([]) : api('/admin/users'), api('/messages/sent')])
      .then(([accounts, history]) => { if (active) { setUsers(accounts.filter(u => u.status === 'active')); setSent(history); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId]);
  async function send(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api('/messages', { method: 'POST', body: JSON.stringify({ title, body, audience: eventId ? 'event' : 'users', ...(eventId ? { eventId: Number(eventId) } : { userIds: selected }) }) });
      setMessage(result.message); setTitle(''); setBody('');
      try { setSent(await api('/messages/sent')); } catch { /* Delivery succeeded; keep the success message. */ }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const filtered = users.filter(u => [u.firstName, u.lastName, u.email, u.role].join(' ').toLowerCase().includes(query.toLowerCase()));
  const history = eventId ? sent.filter(item => item.eventId === Number(eventId)) : sent;
  return <section className="panel">
    <h2>{eventId ? 'Message registered attendees' : 'Send a message'}</h2>
    <p className="muted">{eventId ? 'Send to all currently registered, active accounts for this event, including cancelled events.' : 'Choose active users or organizers. To message an event’s attendees, open its management page.'} Messages appear in Notifications. Up to 5 sends per minute.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {message && <p className="success" role="status">{message}</p>}
    {loading && <p role="status">Loading…</p>}
    <form className="event-form" onSubmit={send}>
      {!eventId && <fieldset className="recipient-picker"><legend>Recipients ({selected.length}/100 selected)</legend>
        <label>Find a user or organizer<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="recipient-list">{filtered.map(u => <label className="recipient-option" key={u.id}>
          <input type="checkbox" checked={selected.includes(u.id)} disabled={busy || (!selected.includes(u.id) && selected.length >= 100)} onChange={e => setSelected(ids => e.target.checked ? [...ids, u.id] : ids.filter(id => id !== u.id))} />
          <span>{u.firstName} {u.lastName} · {u.role}<small>{u.email}</small></span>
        </label>)}{!loading && !filtered.length && <p>No matching active accounts.</p>}</div>
      </fieldset>}
      <label>Subject<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} /></label>
      <label>Message<textarea required maxLength={1000} rows={4} value={body} onChange={e => setBody(e.target.value)} disabled={busy} placeholder="Please bring water and arrive 10 minutes early." /></label>
      <button className="action" disabled={busy || loading || !title.trim() || !body.trim() || (!eventId && !selected.length)}>{busy ? 'Sending…' : 'Send notification'}</button>
    </form>
    <details className="sent-history"><summary>Your recent sent messages</summary><p className="muted">From your latest 50 sends. Counts reflect recipients at delivery time.</p>
      {history.map(item => <article key={item.id}><h3>{item.title}</h3><p className="description">{item.body}</p><p>{item.recipientCount} recipient(s) · {new Date(item.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (Sydney)</p></article>)}
      {!history.length && <p>No sent messages.</p>}
    </details>
  </section>;
}
