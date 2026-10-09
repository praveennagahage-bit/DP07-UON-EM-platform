import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Admin() {
  const [tab, setTab] = useState('users');
  return <main className="page">
    <h1>Administration</h1>
    <p className="muted">Manage accounts and events across the platform. Changes require a reason and are recorded.</p>
    <div className="actions admin-tabs" aria-label="Administration sections">
      {['users', 'events', 'audit'].map(item => <button key={item} className={'action' + (item === tab ? '' : ' secondary')} aria-pressed={item === tab} onClick={() => setTab(item)}>{ { users: 'Users', events: 'All Events', audit: 'Activity Log' }[item]}</button>)}
    </div>
    <AdminList key={tab} tab={tab} />
  </main>;
}
function AdminList({ tab }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const endpoint = tab === 'users' ? '/admin/users' : tab === 'events' ? '/events' : '/admin/audit';
  useEffect(() => {
    let active = true;
    api(endpoint).then(data => { if (active) { setRows(data); setMore(data.length === 50); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);
  async function refresh() {
    setLoading(true); setError('');
    try { const data = await api(endpoint); setRows(data); setMore(data.length === 50); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  async function older() {
    setBusy(true); setError('');
    try {
      const data = await api('/admin/audit?before=' + rows[rows.length - 1].id);
      setRows(previous => [...previous, ...data]); setMore(data.length === 50);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function changeStatus(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api('/admin/users/' + selected.id + '/status', { method: 'PUT', body: JSON.stringify({ status: selected.status === 'active' ? 'banned' : 'active', reason }) });
      setSelected(null); setReason(''); setMessage(result.message); await refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const filtered = rows.filter(row => (tab === 'users' ? [row.firstName, row.lastName, row.email, row.role, row.status] : tab === 'events' ? [row.title, row.category, row.firstName, row.lastName, row.status] : [row.action, row.reason, row.firstName, row.lastName]).join(' ').toLowerCase().includes(query.toLowerCase()));
  return <section className="panel">
    <div className="inline-form">
      <label className="grow">Filter {tab === 'audit' ? 'loaded activity' : tab}<input value={query} onChange={e => setQuery(e.target.value)} type="search" /></label>
      <button className="action secondary" disabled={loading || busy} onClick={refresh}>Refresh</button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {message && <p className="success" role="status">{message}</p>}
    {selected && <form className="panel event-form" onSubmit={changeStatus}>
      <h2>{selected.status === 'active' ? 'Suspend' : 'Restore'} {selected.firstName} {selected.lastName}</h2>
      <p>{selected.email}</p>
      <p className="muted">Suspension signs the user out and prevents further login. Existing activities and bookings are retained for separate review.</p>
      <label>Management reason<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} required /></label>
      <div className="actions"><button type="button" className="action secondary" disabled={busy} onClick={() => setSelected(null)}>Cancel</button><button className="action danger" disabled={busy || !reason.trim()}>{busy ? 'Updating…' : 'Confirm ' + (selected.status === 'active' ? 'suspension' : 'restoration')}</button></div>
    </form>}
    {loading ? <p role="status">Loading…</p> : <>
      <p role="status">{filtered.length} results</p>
      <div className="admin-list">
        {filtered.map(row => <article className="admin-row" key={row.id}>
          {tab === 'users' ? <>
            <h2>{row.firstName} {row.lastName}</h2><p>{row.email}</p><p>{row.role} · {row.status === 'banned' ? 'Suspended' : 'Active'}</p>
            {row.banReason && <p className="cancellation">Reason: {row.banReason}</p>}
            {row.role === 'admin' ? <p className="muted">Protected administrator account</p> : <button className="action secondary" disabled={busy} onClick={() => { setSelected(row); setReason(''); setMessage(''); }}>{row.status === 'active' ? 'Suspend account' : 'Restore account'}</button>}
          </> : tab === 'events' ? <>
            <h2>{row.title}</h2><p>{row.category} · {row.status} · {row.registeredCount} / {row.capacity} registered</p>
            <p className="muted">Owner: {row.firstName ? row.firstName + ' ' + row.lastName : 'Legacy event without an owner'}</p>
            <Link className="action" to={'/events/' + row.id}>Review / Manage</Link>
          </> : <>
            <h2>{row.action.replaceAll('_', ' ')}</h2>
            <p>{row.firstName} {row.lastName} · {row.targetType} #{row.targetId}</p>
            <p><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} (Sydney)</time></p>
            <p>Reason: {row.reason}</p>
            <details><summary>Change details</summary><pre>{JSON.stringify(JSON.parse(row.details), null, 2)}</pre></details>
          </>}
        </article>)}
      </div>
      {tab === 'audit' && more && <button className="action secondary" onClick={older} disabled={busy}>Load older activity</button>}
    </>}
  </section>;
}
