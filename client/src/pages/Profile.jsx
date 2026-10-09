import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { profileInputErrors, characterCount, LIMITS } from '../../../shared/validation.mjs';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, bio: user.bio || '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  function change(e) { setForm(previous => ({ ...previous, [e.target.name]: e.target.value })); setMessage(''); }
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    const validation = profileInputErrors(form);
    setErrors(validation); setError(''); setMessage('');
    if (Object.keys(validation).length) return;
    setBusy(true);
    try { await updateProfile(form); setMessage('Profile saved.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="page editor-page">
    <h1>My Profile</h1>
    <section className="panel">
      <p><strong>Email:</strong> {user.email}</p><p><strong>Role:</strong> {user.role}</p>
      <p className="muted">Email and role are read-only. You can update your name and bio below.</p>
      <form className="event-form" onSubmit={save} noValidate>
        {['firstName', 'lastName'].map(name => <label key={name}>{name === 'firstName' ? 'First name' : 'Last name'}
          <input name={name} autoComplete={name === 'firstName' ? 'given-name' : 'family-name'} value={form[name]} onChange={change} required aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? name + '-error' : undefined} />
          <span className="muted">{characterCount(form[name].trim())} / {LIMITS.name} characters</span>
          {errors[name] && <span id={name + '-error'} className="error" role="alert">{errors[name]}</span>}
        </label>)}
        <label>Bio<textarea name="bio" value={form.bio} onChange={change} aria-invalid={Boolean(errors.bio)} aria-describedby="bio-help" />
          <span id="bio-help" className="muted">{characterCount(form.bio.trim())} / {LIMITS.bio} characters. Plain text only.</span>
          {errors.bio && <span className="error" role="alert">{errors.bio}</span>}
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="success" role="status">{message}</p>}
        <button className="action" disabled={busy}>{busy ? 'Saving…' : 'Save Profile'}</button>
      </form>
    </section>
  </main>;
}
