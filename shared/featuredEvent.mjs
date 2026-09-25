import { eventTimestamp } from './eventTime.mjs';

// Feature the nearest upcoming active event, with a stable tie-break by ID.
export function upcomingEvents(events, now = Date.now()) {
  return events.filter(event => event.status === 'active' && eventTimestamp(event.date, event.time) > now)
    .sort((a, b) => eventTimestamp(a.date, a.time) - eventTimestamp(b.date, b.time) || a.id - b.id);
}
