import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventSearch({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  function search(e) {
    e.preventDefault();
    const value = query.trim();
    navigate('/events' + (value ? '?' + new URLSearchParams({ q: value }) : ''));
  }
  return <form className="event-search" role="search" onSubmit={search}>
    <input type="search" aria-label="Search events" placeholder="Search events..." value={query} onChange={e => setQuery(e.target.value)} maxLength={200} />
    <button type="submit">Search</button>
  </form>;
}
