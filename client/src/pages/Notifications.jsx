import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../notifications/NotificationsContext';

const notificationLabels = {
  message: ['Message', 'A message from your administrator or event organizer.'],
  event_cancelled: ['Event Cancelled', 'This event has been cancelled.'],
  event_restored: ['Event Restored by Admin', 'An administrator has restored this event. Existing bookings are still valid.'],
  event_updated: ['Event Updated by Admin', 'An administrator has edited your event.'],
  event_deleted: ['Event Deleted by Admin', 'An administrator has permanently deleted your event.'],
  event_details_changed: ['Event Details Changed', 'Details of an event you registered for have changed.'],
  registration_added: ['Registration Added', 'The organizer registered you for this event.'],
  registration_removed: ['Registration Removed', 'The organizer removed your registration for this event.'],
  report_reviewed: ['Report Reviewed', 'An administrator has reviewed your event report.'],
  role_changed: ['Account Role Changed', 'An administrator changed your account role.'],
};
const labelFor = item => notificationLabels[item.type.split(':')[0]] || ['Notification', 'You have a new update.'];

export default function Notifications() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <NotificationList />;
}

function NotificationList() {
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  useEffect(() => { void refresh(); }, [refresh]);
  async function read(id) {
    if (busy) return;
    setBusy(true); setActionError('');
    try { if (id) await markRead(id); else await markAllRead(); }
    catch (err) { setActionError(err.message); }
    finally { setBusy(false); }
  }
  const shown = unreadOnly ? notifications.filter(item => !item.isRead) : notifications;
  return <main className="page detail-page">
    <header className="page-heading"><div><p className="eyebrow">Your updates</p><h1>Notifications</h1>
      <p className="count" role="status">{unreadCount} unread</p></div>
      <div className="actions"><button className="action secondary" onClick={() => void refresh()}>Refresh</button>
        <button className="action" disabled={busy || loading || unreadCount === 0} onClick={() => read()}>Mark All as Read</button></div>
    </header>
    <div className="notification-filters" aria-label="Notification filter">
      <button className={'action ' + (!unreadOnly ? '' : 'secondary')} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</button>
      <button className={'action ' + (unreadOnly ? '' : 'secondary')} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread</button>
    </div>
    {loading && <p role="status">Loading notifications…</p>}
    {error && <p className="error" role="alert">{error} Use Refresh to try again.</p>}
    {actionError && <p className="error" role="alert">{actionError}</p>}
    {!loading && !error && !shown.length && <section className="panel"><p>{unreadOnly ? 'You have no unread notifications.' : 'No notifications yet.'}</p></section>}
    <div className="notification-list">{shown.map(item => <article key={item.id} className={'panel notification-item' + (!item.isRead ? ' unread' : '')}>
      <div className="page-heading"><span className="eyebrow">{labelFor(item)[0]}</span><span className="muted">{item.isRead ? 'Read' : 'Unread'}</span></div>
      <h2>{item.eventTitle}</h2>
      <p>{labelFor(item)[1]}</p>
      <p className="cancellation" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.message}</p>
      <time className="muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
      <div className="actions notification-actions">
        {item.eventId ? <Link className="action secondary" to={'/events/' + item.eventId}>View Event</Link> : /^(role_changed|message):/.test(item.type) ? null : <span className="muted">This event is no longer available.</span>}
        {!item.isRead && <button className="action" disabled={busy} onClick={() => read(item.id)}>Mark as Read</button>}
      </div>
    </article>)}</div>
  </main>;
}
