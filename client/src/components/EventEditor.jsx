import { useAuth } from '../auth/AuthContext';
import { eventLocalNow, isFutureEvent } from '../../../shared/eventTime.mjs';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { LIMITS, characterCount, eventInputErrors, textError } from '../../../shared/validation.mjs';
import TimePicker from './TimePicker';

export default function EventEditor({ editing = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clock, setClock] = useState(() => eventLocalNow());
  const [existingImage, setExistingImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [readingImage, setReadingImage] = useState(false);
  const imageVersion = useRef(0);
  const imageInput = useRef(null);
  const [imageName, setImageName] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setClock(eventLocalNow()), 30000);
    const sequence = imageVersion;
    return () => { clearInterval(timer); ++sequence.current; };
  }, []);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', location: '', category: 'Workshop', capacity: '' });
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [moderationReason, setModerationReason] = useState('');
  useEffect(() => {
    if (!editing) return;
    let active = true;
    api('/events/' + id).then(data => {
      if (!active) return;
      if (user.role !== 'admin' && data.createdBy !== user.id) { setLoadError('Only the organizer who created this event can edit it.'); return; }
      setExistingImage(data.imageUrl);
      if (data.status === 'cancelled') { setLoadError('Cancelled events cannot be edited.'); return; }
      setForm({ title: data.title, description: data.description || '', date: data.date, time: data.time,
        location: data.location, category: data.category || 'Workshop', capacity: data.capacity });
    }).catch(err => { if (active) setLoadError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [editing, id, user.id, user.role]);
  function change(e) { setForm(previous => ({ ...previous, [e.target.name]: e.target.value })); }
  function chooseImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Reset the native control so choosing the same file again still fires change.
    e.target.value = '';
    const version = ++imageVersion.current;
    setImageError(''); setReadingImage(false);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setImageError('Choose a JPEG, PNG or WebP image, no larger than 2 MB.');
      e.target.value = ''; return;
    }
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (version !== imageVersion.current) return;
      setImageName(file.name);
      setForm(previous => ({ ...previous, image: reader.result })); setReadingImage(false);
    };
    reader.onerror = () => { if (version === imageVersion.current) { setImageError('Could not read this image. Please choose it again.'); setReadingImage(false); } };
    reader.readAsDataURL(file);
  }
  function removeImage() {
    ++imageVersion.current; setImageError(''); setReadingImage(false);
    setImageName('');
    setForm(previous => ({ ...previous, image: null }));
  }
  async function save(e) {
    e.preventDefault();
    if (busy || readingImage || imageError) return;
    const validation = eventInputErrors({ ...form, capacity: Number(form.capacity) });
    setFieldErrors(validation); setError('');
    if (Object.keys(validation).length) return;
    if (user.role === 'admin') {
      const reasonError = textError(moderationReason, 'Management reason', 500, true);
      if (reasonError) { setError(reasonError); return; }
    }
    if (!isFutureEvent(form.date, form.time)) { setError('Choose a future date and time in Australia/Sydney.'); return; }
    setBusy(true); setError('');
    try {
      const result = await api(editing ? '/events/' + id : '/events', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, capacity: Number(form.capacity), ...(user.role === 'admin' ? { moderationReason } : {}) }),
      });
      navigate('/events/' + (editing ? id : result.eventId));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  if (loading) return <main className="page"><p role="status">Loading event…</p></main>;
  if (loadError) return <main className="page"><p className="error" role="alert">{loadError}</p><Link to="/events">Back to Events</Link></main>;
  const preview = form.image === undefined ? existingImage : form.image;
  return <main className="page editor-page"><section className="panel">
    <p className="eyebrow">{user.role === 'admin' ? 'Administration' : 'Organizer'}</p><h1>{editing ? 'Edit Event' : 'Create Event'}</h1>
    <form className="event-form" onSubmit={save} noValidate>
      <label>Event title<input name="title" value={form.title} onChange={change} required aria-invalid={Boolean(fieldErrors.title)} aria-describedby="title-help" />
        <span id="title-help" className={characterCount(form.title.trim()) > LIMITS.title ? 'error' : 'muted'}>{characterCount(form.title.trim())} / {LIMITS.title} characters, including spaces and punctuation.</span>
        {fieldErrors.title && <span className="error" role="alert">{fieldErrors.title}</span>}
      </label>
      <label>Description<textarea name="description" value={form.description} onChange={change} rows={4} aria-invalid={Boolean(fieldErrors.description)} aria-describedby="description-help" />
        <span id="description-help" className={characterCount(form.description.trim()) > LIMITS.description ? 'error' : 'muted'}>{characterCount(form.description.trim())} / {LIMITS.description} characters. Plain text only; no HTML or script URLs.</span>
        {fieldErrors.description && <span className="error" role="alert">{fieldErrors.description}</span>}
      </label>
      <div>
        <span id="event-image-label">Event image (optional)</span>
        <input ref={imageInput} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={busy} aria-label="Event image (optional)" />
        <div className="image-upload-control" role="group" aria-labelledby="event-image-label">
          <button className="action secondary" type="button" onClick={() => imageInput.current?.click()} disabled={busy} aria-describedby="event-image-filename">Choose Image</button>
          <span id="event-image-filename" className="image-upload-filename" role="status">{imageName || (preview ? 'Current event image' : 'No file selected')}</span>
        </div>
      </div>
      <p className="muted">JPEG, PNG or WebP, up to 2 MB and 16 megapixels. A preview is shown before saving.</p>
      {preview && <img className="event-cover image-preview" src={preview} alt="Event image preview" />}
      {(preview || imageError) && <button className="action secondary" type="button" onClick={removeImage} disabled={busy}>Remove Image</button>}
      {readingImage && <p role="status">Reading image…</p>}
      {imageError && <p className="error" role="alert">{imageError}</p>}
      <p className="muted">Event date and time use Australia/Sydney. Past dates and times cannot be selected.</p>
      <div className="form-row"><label>Date<input name="date" type="date" min={clock.date} value={form.date} onChange={change} required /></label>
      <TimePicker value={form.time} disabled={busy} onChange={time => setForm(previous => ({ ...previous, time }))} /></div>
      <label>Location<input name="location" value={form.location} onChange={change} required aria-invalid={Boolean(fieldErrors.location)} placeholder="Engineering Building, Room 201" />
        <span className="muted">Venue or room name, up to {LIMITS.location} characters. For a virtual event, use Online.</span>
        {fieldErrors.location && <span className="error" role="alert">{fieldErrors.location}</span>}
      </label>
      <label>Event type / Category<select name="category" value={form.category} onChange={change} required>{['Workshop', 'Seminar', 'Social', 'Sports'].map(category => <option key={category} value={category}>{category}</option>)}</select></label>
      <p className="muted">Choose Workshop, Seminar, Social or Sports. You can change the event type when editing.</p>
      <label>Capacity<input name="capacity" type="number" min="1" max={LIMITS.capacity} step="1" value={form.capacity} onChange={change} required aria-invalid={Boolean(fieldErrors.capacity)} />
        <span className="muted">A whole number from 1 to {LIMITS.capacity}.</span>
        {fieldErrors.capacity && <span className="error" role="alert">{fieldErrors.capacity}</span>}
      </label>
      <p className="muted">Capacity is the maximum number of attendees. It cannot be lower than the current registration count.</p>
      {user.role === 'admin' && <label>Management reason<textarea value={moderationReason} onChange={e => setModerationReason(e.target.value)} required maxLength={500} placeholder="Explain this administrative edit." /></label>}
      {editing && <p className="muted">Existing text is preserved. If it exceeds the new limits, shorten it before saving.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions"><Link className="action secondary" to={editing ? '/events/' + id : '/events'}>Back</Link>
      <button className="action" disabled={busy || readingImage || Boolean(imageError)}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Event'}</button></div>
    </form>
  </section></main>;
}
