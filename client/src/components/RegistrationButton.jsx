import { isFutureEvent } from '../../../shared/eventTime.mjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';

export default function RegistrationButton({ event, onChange }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!user) return <Link className="action secondary" to="/auth">Sign in to join</Link>;
  if (user.role !== 'attendee') return null;
  const registered = Boolean(event.isRegistered);
  const full = event.registeredCount >= event.capacity;
  const cancelled = event.status === 'cancelled';
  const started = !isFutureEvent(event.date, event.time);
  async function toggle() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api('/events/' + event.id + '/register', { method: registered ? 'DELETE' : 'POST' });
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }
  return <div className="registration-control">
    {registered && <p className="muted">{cancelled ? 'Your booking is for a cancelled event.' : 'You are registered.'}</p>}
    <button className={registered ? 'action secondary' : 'action'} disabled={busy || (!registered && (full || cancelled || started))} onClick={toggle}>
      {busy ? 'Updating…' : registered ? 'Cancel Registration' : cancelled ? 'Event Cancelled' : started ? 'Registration Closed' : full ? 'Event Full' : 'Join Event'}
    </button>
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
