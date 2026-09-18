import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import RegistrationButton from './RegistrationButton';

export default function EventCard({ event, onChange }) {
  const { user } = useAuth();
  return <article className="event-card">
    {event.imageUrl && <img className="event-cover" src={event.imageUrl} alt={event.title} loading="lazy" />}
    <div className="event-banner"><span>{event.category || 'Event'}</span><span>{event.status === 'cancelled' ? 'Cancelled' : 'Active'}</span></div>
    <div className="card-body">
      <h2>{event.title}</h2>
      <p className="muted">{event.date} · {event.time}</p>
      <p>{event.location}</p>
      <p className="muted">{event.description || 'No description available.'}</p>
      <p className="count">{event.registeredCount} / {event.capacity} registered</p>
      {event.status === 'cancelled' && <p className="cancellation">Cancellation reason: {event.cancellationReason}</p>}
      <Link className="action" to={'/events/' + event.id}>{user?.role === 'organizer' && user.id === event.createdBy ? 'Manage Event' : 'View Details'}</Link>
      <RegistrationButton event={event} onChange={onChange} />
      {user?.role === 'organizer' && user.id === event.createdBy && event.status !== 'cancelled' && <Link className="action secondary" to={'/events/' + event.id + '/edit'}>Edit Event</Link>}
    </div>
  </article>;
}
