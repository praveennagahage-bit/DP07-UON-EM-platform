import { useState } from 'react';
import { api } from '../api';
export default function ReportEvent({ eventId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(e) {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await api('/events/' + eventId + '/reports', { method: 'POST', body: JSON.stringify({ reason }) });
      setMessage(result.message); setOpen(false); setReason('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="panel">
    <h2>Report this event</h2>
    <p className="muted">Describe the concern for administrator review. Reporting does not automatically remove an event.</p>
    {message && <p className="success" role="status">{message}</p>}
    {!open ? <button className="action secondary" onClick={() => setOpen(true)}>Report Event</button> : <form className="event-form" onSubmit={submit}>
      <label>Report reason<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions"><button className="action" disabled={busy || !reason.trim()}>Submit Report</button><button type="button" className="action secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button></div>
    </form>}
  </section>;
}
