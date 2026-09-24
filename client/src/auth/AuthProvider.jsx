import { useEffect, useState } from 'react';
import { api, apiFetch } from '../api';
import { AuthContext } from './AuthContext';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    // Discard the prototype's client-controlled identity.
    localStorage.removeItem('uonUser');
    async function loadSession() {
      try {
        const response = await apiFetch('/me');
        if (!response.ok && response.status !== 401) throw new Error('Could not check your session');
        const data = response.ok ? await response.json() : { user: null };
        if (active) { setUser(data.user); setError(''); }
      } catch {
        if (active) setError('Could not connect to the server. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    const expired = () => setUser(null);
    const focused = () => { void loadSession(); };
    window.addEventListener('uon-session-expired', expired);
    window.addEventListener('focus', focused);
    void loadSession();
    return () => {
      active = false;
      window.removeEventListener('uon-session-expired', expired);
      window.removeEventListener('focus', focused);
    };
  }, []);
  async function login(credentials) {
    const data = await api('/login', { method: 'POST', body: JSON.stringify(credentials) });
    setUser(data.user);
  }
  async function logout() {
    await api('/logout', { method: 'POST' });
    setUser(null);
  }
  if (loading) return <main className="page"><p role="status">Checking your session…</p></main>;
  if (error) return <main className="page"><p role="alert">{error}</p><button onClick={() => window.location.reload()}>Retry</button></main>;
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
