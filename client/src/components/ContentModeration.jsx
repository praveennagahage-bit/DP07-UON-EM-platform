import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ContentModeration({ kind }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState('');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('resolved');
  const [more, setMore] = useState(false);
  const endpoint = '/admin/' + kind;
  useEffect(() => {
    let active = true;
    api(endpoint).then(data => { if (active) { setRows(data); setMore(data.length === 50); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);
  async function load(older = false) {
    setBusy(true); setError('');
    try {
      const data = await api(endpoint + (older ? '?before=' + rows.at(-1).id : ''));
      setRows(previous => older ? [...previous, ...data] : data); setMore(data.length === 50);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const body = kind === 'keywords' ? selected ? { enabled: !selected.enabled, reason } : { phrase, reason } : { status, reason };
      const result = await api(endpoint + (selected ? '/' + selected.id : ''), { method: selected ? 'PUT' : 'POST', body: JSON.stringify(body) });
      setMessage(result.message); setSelected(null); setReason(''); setPhrase('');
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="panel">
    <h2>{kind === 'keywords' ? 'Blocked keywords' : 'Event reports'}</h2>
    <p className="muted">{kind === 'keywords' ? 'Enabled phrases block event titles, descriptions and locations, including edits. Matching ignores case, full-width variants, repeated whitespace and zero-width separators. Phrases match within longer text; use specific phrases to reduce false positives. Existing events are not removed automatically.' : 'Review reports before taking action. Open the event to cancel it if necessary; resolving a report does not automatically cancel or delete the event. Reporter identity is not shared with the organizer.'}</p>
    <button className="action secondary" disabled={busy} onClick={() => load()}>Refresh</button>
    {error && <p className="error" role="alert">{error}</p>}
    {message && <p className="success" role="status">{message}</p>}
    {(kind === 'keywords' || selected) && <form className="event-form panel" onSubmit={submit}>
      <h3>{selected ? kind === 'keywords' ? (selected.enabled ? 'Disable: ' : 'Enable: ') + selected.phrase : 'Review: ' + selected.eventTitle : 'Add blocking phrase'}</h3>
      {kind === 'keywords' && !selected && <label>Phrase<input value={phrase} onChange={e => setPhrase(e.target.value)} minLength={2} maxLength={100} required /></label>}
      {kind === 'reports' && <label>Outcome<select value={status} onChange={e => setStatus(e.target.value)}><option value="resolved">Resolved — action completed</option><option value="dismissed">Dismissed — no action needed</option></select></label>}
      <label>{kind === 'reports' ? 'Response to reporter' : 'Management reason'}<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} required /></label>
      <div className="actions"><button className="action" disabled={busy || !reason.trim()}>Confirm</button>{selected && <button type="button" className="action secondary" onClick={() => { setSelected(null); setReason(''); }}>Cancel</button>}</div>
    </form>}
    {loading ? <p role="status">Loading…</p> : !rows.length ? <p>No {kind} yet.</p> : <div className="admin-list">{rows.map(row => <article className="admin-row" key={row.id}>
      <h3>{kind === 'keywords' ? row.phrase : row.eventTitle}</h3>
      <p>{kind === 'keywords' ? row.enabled ? 'Enabled' : 'Disabled' : row.status}</p>
      {kind === 'reports' && <><p className="description">{row.reason}</p><p className="muted">{new Date(row.createdAt).toLocaleString()}</p>{row.resolution && <p>Response: {row.resolution}</p>}{row.eventId ? <Link className="action secondary" to={'/events/' + row.eventId}>Review Event</Link> : <p>Event has been deleted. Report retained.</p>}</>}
      {(kind === 'keywords' || row.status === 'pending') && <button className="action" disabled={busy} onClick={() => { setSelected(row); setReason(''); setStatus('resolved'); }}>{kind === 'keywords' ? row.enabled ? 'Disable rule' : 'Enable rule' : 'Review Report'}</button>}
    </article>)}</div>}
    {kind === 'reports' && more && <button className="action" disabled={busy} onClick={() => load(true)}>Load older reports</button>}
  </section>;
}
