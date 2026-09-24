export async function apiFetch(path, options = {}) {
  const response = await fetch('/api' + path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-UON-Request': '1', ...options.headers },
  });
  if (response.status === 401 && path !== '/login') {
    window.dispatchEvent(new Event('uon-session-expired'));
  }
  return response;
}

export async function api(path, options = {}) {
  const response = await apiFetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
