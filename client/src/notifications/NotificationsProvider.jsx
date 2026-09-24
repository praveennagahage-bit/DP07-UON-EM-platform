import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { NotificationsContext } from './NotificationsContext';

// Remount on account changes so one account never sees another account's cached notifications.
export default function NotificationsProvider({ children }) {
  const { user } = useAuth();
  return <SessionNotifications key={user?.id || 'guest'} user={user}>{children}</SessionNotifications>;
}

function SessionNotifications({ user, children }) {
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const active = useRef(false);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    if (!user) return;
    const request = ++version.current;
    try {
      const result = await api('/notifications');
      if (active.current && request === version.current) { setData(result); setError(''); }
    } catch (err) {
      if (active.current && request === version.current) setError(err.message || 'Could not load notifications');
    } finally {
      if (active.current && request === version.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    active.current = true;
    if (!user) return () => { active.current = false; };
    void refresh();
    const visibleRefresh = () => { if (!document.hidden) void refresh(); };
    const timer = window.setInterval(visibleRefresh, 15000);
    window.addEventListener('focus', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => {
      active.current = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
    };
  }, [user, refresh]);
  async function markRead(id) {
    await api('/notifications/' + id + '/read', { method: 'POST' });
    // Update immediately, then reconcile with the server.
    setData(previous => ({
      ...previous,
      notifications: previous.notifications.map(item => item.id === id ? { ...item, isRead: 1 } : item),
      unreadCount: previous.unreadCount - (previous.notifications.some(item => item.id === id && !item.isRead) ? 1 : 0),
    }));
    await refresh();
  }
  async function markAllRead() {
    await api('/notifications/read-all', { method: 'POST' });
    await refresh();
  }
  return <NotificationsContext.Provider value={{ ...data, loading, error, refresh, markRead, markAllRead }}>{children}</NotificationsContext.Provider>;
}
