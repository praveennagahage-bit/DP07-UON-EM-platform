import { eventTimestamp } from './eventTime.mjs';

// Keep the upcoming list chronological, with a stable tie-break by ID.
export function upcomingEvents(events, now = Date.now()) {
  return events.filter(event => event.status === 'active' && eventTimestamp(event.date, event.time) > now)
    .sort((a, b) => eventTimestamp(a.date, a.time) - eventTimestamp(b.date, b.time) || a.id - b.id);
}

export function featuredEvent(events, now = Date.now()) {
  return upcomingEvents(events, now).reduce((best, event) =>
    !best || (event.registeredCount || 0) > (best.registeredCount || 0) ? event : best, undefined);
}
