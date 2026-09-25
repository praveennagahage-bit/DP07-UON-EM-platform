const { test } = require('node:test');
const assert = require('node:assert/strict');
const { upcomingEvents, featuredEvent } = require('../shared/featuredEvent.mjs');

test('Featured event favors registrations, then earlier start and ID; excludes past and cancelled events', () => {
  const now = Date.parse('2026-09-25T00:00:00Z');
  const base = { status: 'active', date: '2099-01-01', time: '10:00', registeredCount: 2 };
  const early = { ...base, id: 1 };
  const popular = { ...base, id: 2, date: '2099-02-01', registeredCount: 5 };
  const events = [early, popular, { ...base, id: 3, status: 'cancelled', registeredCount: 100 },
    { ...base, id: 4, date: '2000-01-01', registeredCount: 100 }];
  assert.equal(featuredEvent(events, now), popular);
  assert.equal(upcomingEvents(events, now)[0], early);
  assert.equal(featuredEvent([{ ...popular, id: 8 }, popular], now), popular);
  assert.equal(featuredEvent([{ ...popular, registeredCount: 2 }, early], now), early);
  assert.equal(featuredEvent([], now), undefined);
});

test('Featured selection uses real upcoming active events, Sydney time and stable chronological order', () => {
  const base = { status: 'active', date: '2026-10-05', time: '10:00' };
  const events = [
    { ...base, id: 3 }, { ...base, id: 2 },
    { ...base, id: 1, status: 'cancelled' },
    { ...base, id: 4, date: '2026-10-04' },
    { ...base, id: 5, date: '2026-10-04', time: '02:30' },
    { ...base, id: 6, time: '09:00' },
  ];
  const result = upcomingEvents(events, Date.parse('2026-10-04T00:00:00Z'));
  assert.deepEqual(result.map(event => event.id), [6, 2, 3]);
  assert.equal(result[1], events[1]);
  assert.equal(events[0].id, 3);
  assert.deepEqual(upcomingEvents([], Date.now()), []);
  assert.deepEqual(upcomingEvents(events, Date.parse('2027-01-01T00:00:00Z')), []);
});
