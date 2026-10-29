import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([api('/admin/statistics'), api('/moderation/status')]).then(([stats, status]) => {
      if (active) { setData(stats); setModeration(status); }
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  async function refresh() {
    setBusy(true); setError('');
    try { const [stats, status] = await Promise.all([api('/admin/statistics'), api('/moderation/status')]); setData(stats); setModeration(status); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const total = predicate => data.users.filter(predicate).reduce((sum, row) => sum + row.count, 0);
  return <section className="panel">
    <div className="page-heading"><h2>Platform overview</h2><button className="action secondary" disabled={busy} onClick={refresh}>{busy ? 'Refreshing…' : 'Refresh statistics'}</button></div>
    {error && <p className="error" role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading statistics…</p>}
    {data && <>
      <p className="muted">Snapshot: {new Date(data.generatedAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (Sydney)</p>
      <div className="stats-grid">{[
        ['Total users', total(() => true)], ['Active accounts', total(u => u.status === 'active')], ['Suspended accounts', total(u => u.status === 'banned')],
        ['Attendees', total(u => u.role === 'attendee')], ['Organizers', total(u => u.role === 'organizer')], ['Administrators', total(u => u.role === 'admin')],
        ['Total events', data.events.total], ['Upcoming active events', data.events.upcoming], ['Started / past active events', data.events.started], ['Cancelled events', data.events.cancelled],
        ['Total bookings', data.registrations.total], ['Distinct booked users', data.registrations.people], ['Bookings on active events', data.registrations.activeEventBookings], ['Pending reports', data.pendingReports],
      ].map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <p className="muted">Role counts include suspended accounts. Cancelled events are separate from upcoming and started events. Total bookings include retained bookings on cancelled events; bookings are not unique people. Event times use Australia/Sydney.</p>
    </>}
    {moderation && <div className="panel"><h3>Content review</h3><p>{moderation.mode === 'keywords' ? 'Keyword checks only — AI review is not enabled.' : moderation.configured ? 'AI review is enabled alongside keyword checks. New and edited event text must pass review.' : 'AI review is required, but the API key is missing. Event publishing is blocked until configuration is fixed.'}</p><p className="muted">Images are not AI-reviewed. Existing events are not scanned retroactively. Reports and administrator review remain available.</p></div>}
  </section>;
}
