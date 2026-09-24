export const EVENT_TIME_ZONE = 'Australia/Sydney';
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EVENT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function eventLocalNow(now = Date.now()) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(now)).map(part => [part.type, part.value]));
  return { date: parts.year + '-' + parts.month + '-' + parts.day, time: parts.hour + ':' + parts.minute };
}
export function eventTimestamp(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const nominal = Date.parse(date + 'T' + time + ':00Z');
  if (!Number.isFinite(nominal) || new Date(nominal).toISOString().slice(0, 10) !== date) return NaN;
  // Try the actual zone offsets either side of a DST transition, then round-trip.
  const offsets = new Set([-86400000, 0, 86400000].map(delta => {
    const probe = nominal + delta;
    const local = eventLocalNow(probe);
    return Date.parse(local.date + 'T' + local.time + ':00Z') - probe;
  }));
  const matches = [...offsets].map(offset => nominal - offset).filter(candidate => {
    const local = eventLocalNow(candidate);
    return local.date === date && local.time === time;
  });
  // A missing spring-forward time is invalid; an ambiguous autumn time uses the first occurrence.
  return matches.length ? Math.min(...matches) : NaN;
}
export function isFutureEvent(date, time, now = Date.now()) {
  return eventTimestamp(date, time) > now;
}
