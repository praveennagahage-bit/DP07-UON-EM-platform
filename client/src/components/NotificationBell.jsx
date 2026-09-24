import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../notifications/NotificationsContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const { unreadCount, error, refresh } = useNotifications();
  return <Link to={user ? '/notifications' : '/auth'} className="notification-bell"
    onClick={() => { if (user) void refresh(); }}
    aria-label={user ? 'Notifications' + (error ? ' (refresh needed)' : ', ' + unreadCount + ' unread') : 'Sign in to view notifications'}
    title={error ? 'Notifications could not refresh. Open to retry.' : 'Notifications'}>
    <span aria-hidden="true">🔔</span>
    {user && (error || unreadCount > 0) && <span className="notification-badge" aria-hidden="true">{error ? '!' : unreadCount > 99 ? '99+' : unreadCount}</span>}
  </Link>;
}
