const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtemp, rm, rmdir } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { createDatabase } = require('../database');
const { createApp } = require('../server');

const eventData = { title: 'Workshop', description: 'Integration test', date: '2099-12-20', time: '14:00', location: 'UON', category: 'Workshop', capacity: 2 };
async function fixture(t) {
    const db = await createDatabase(':memory:');
    const server = createApp(db).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + server.address().port;
    t.after(async () => { await new Promise(resolve => server.close(resolve)); await db.close(); });
    async function request(route, { method = 'GET', cookie, body, headers = {} } = {}) {
        const response = await fetch(url + route, {
            method, headers: { 'Content-Type': 'application/json', 'X-UON-Request': '1', ...(cookie ? { Cookie: cookie } : {}), ...headers },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: response.status, data: response.headers.get('content-type')?.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type'), cookie: response.headers.get('set-cookie') };
    }
    let n = 0;
    async function account(role = 'attendee') {
        const email = 'user' + (++n) + '@example.test';
        const signup = await request('/register', { method: 'POST', body: { firstName: 'User' + n, lastName: 'Test', email, role, password: 'demo-password' } });
        assert.equal(signup.status, 201);
        const login = await request('/login', { method: 'POST', body: { email, password: 'demo-password' } });
        assert.equal(login.status, 200);
        return { id: signup.data.userId, cookie: login.cookie.split(';')[0], email, rawCookie: login.cookie };
    }
    async function event(owner, overrides = {}) {
        const result = await request('/events', { method: 'POST', cookie: owner.cookie, body: { ...eventData, ...overrides } });
        assert.equal(result.status, 201, JSON.stringify(result.data));
        return result.data.eventId;
    }
    return { db, request, account, event };
}

test('Session cookie, server-side role, logout, expiry and forged tokens', async t => {
    const { db, request, account } = await fixture(t);
    const user = await account();
    assert.match(user.rawCookie, /HttpOnly/);
    assert.match(user.rawCookie, /SameSite=Lax/i);
    assert.equal((await request('/me')).status, 401);
    assert.equal((await request('/me', { cookie: 'uon_session=' + 'a'.repeat(64) })).status, 401);
    assert.equal((await request('/me', { cookie: user.cookie })).data.user.id, user.id);
    assert.equal((await request('/me', { cookie: user.cookie })).data.user.password, undefined);
    assert.equal((await request('/events', { method: 'POST', cookie: user.cookie, body: { ...eventData, role: 'organizer' } })).status, 403);
    const row = await db.get('SELECT * FROM sessions WHERE userId = ?', [user.id]);
    assert.notEqual(row.tokenHash, user.cookie.split('=')[1]);
    await db.run("UPDATE users SET role = 'organizer' WHERE id = ?", [user.id]);
    assert.equal((await request('/me', { cookie: user.cookie })).data.user.role, 'organizer');
    await request('/logout', { method: 'POST', cookie: user.cookie });
    assert.equal((await request('/me', { cookie: user.cookie })).status, 401);
    const another = await account();
    await db.run('UPDATE sessions SET expiresAt = 0 WHERE userId = ?', [another.id]);
    assert.equal((await request('/me', { cookie: another.cookie })).status, 401);
});

test('All management endpoints reject anonymous and attendee requests', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), user = await account();
    const id = await event(owner);
    const routes = [
        ['POST', '/events', eventData], ['PUT', '/events/' + id, eventData],
        ['DELETE', '/events/' + id], ['POST', '/events/' + id + '/cancel', { reason: 'Reason' }],
        ['GET', '/events/' + id + '/attendees'], ['GET', '/attendees?q=user'],
        ['POST', '/events/' + id + '/attendees', { userId: user.id }],
        ['DELETE', '/events/' + id + '/attendees/' + user.id],
    ];
    for (const [method, route, body] of routes) {
        assert.equal((await request(route, { method, body })).status, 401, route);
        assert.equal((await request(route, { method, body, cookie: user.cookie })).status, 403, route);
    }
    assert.equal((await request('/events/' + id + '/register', { method: 'POST' })).status, 401);
    assert.equal((await request('/events/' + id + '/register', { method: 'POST', cookie: owner.cookie })).status, 403);
});

test('Own registrations ignore forged userId, prevent duplicates, and remain private', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), alice = await account(), bob = await account();
    const id = await event(owner);
    const route = '/events/' + id + '/register';
    assert.equal((await request(route, { method: 'POST', cookie: alice.cookie, body: { userId: bob.id } })).status, 201);
    assert.equal((await request(route, { method: 'POST', cookie: alice.cookie })).status, 409);
    assert.equal((await request('/me/registrations', { cookie: alice.cookie })).data.length, 1);
    assert.equal((await request('/me/registrations', { cookie: bob.cookie })).data.length, 0);
    assert.equal((await request('/events/' + id, { cookie: alice.cookie })).data.isRegistered, 1);
    assert.equal((await request(route, { method: 'DELETE', cookie: bob.cookie, body: { userId: alice.id } })).status, 404);
    assert.equal((await request(route, { method: 'DELETE', cookie: alice.cookie })).status, 200);
    assert.equal((await request(route, { method: 'POST', cookie: bob.cookie })).status, 201);
});

test('Only the creator can edit, cancel, delete or administer participants; spoofed ownership is ignored', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), other = await account('organizer'), user = await account();
    const id = await event(owner, { createdBy: other.id });
    assert.equal((await request('/events/' + id)).data.createdBy, owner.id);
    const routes = [
        ['PUT', '/events/' + id, { ...eventData, createdBy: other.id }],
        ['DELETE', '/events/' + id],
        ['POST', '/events/' + id + '/cancel', { reason: 'Not yours' }],
        ['GET', '/events/' + id + '/attendees'],
        ['POST', '/events/' + id + '/attendees', { userId: user.id }],
        ['DELETE', '/events/' + id + '/attendees/' + user.id],
    ];
    for (const [method, route, body] of routes) {
        assert.equal((await request(route, { method, body, cookie: other.cookie })).status, 403, route);
    }
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, title: 'Owner edit', createdBy: other.id } })).status, 200);
    assert.equal((await request('/events/' + id)).data.createdBy, owner.id);
    assert.equal((await request('/events/' + id + '/attendees', { method: 'POST', cookie: owner.cookie, body: { userId: user.id } })).status, 201);
    assert.equal((await request('/events/' + id + '/attendees', { cookie: owner.cookie })).data[0].id, user.id);
    assert.equal((await request('/events/' + id + '/attendees/' + user.id, { method: 'DELETE', cookie: owner.cookie })).status, 200);
    assert.equal((await request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Presenter unavailable' } })).status, 200);
    assert.equal((await request('/events/' + id, { method: 'DELETE', cookie: owner.cookie })).status, 200);
});

test('Concurrent registration and admin adds cannot overbook the last seat', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), alice = await account(), bob = await account();
    const id = await event(owner, { capacity: 1 });
    const results = await Promise.all([
        request('/events/' + id + '/register', { method: 'POST', cookie: alice.cookie }),
        request('/events/' + id + '/attendees', { method: 'POST', cookie: owner.cookie, body: { userId: bob.id } }),
    ]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal((await request('/events/' + id)).data.registeredCount, 1);
});

test('Capacity cannot be reduced below registrations; cancellation retains reason and blocks new joins', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), alice = await account(), bob = await account(), charlie = await account();
    const id = await event(owner);
    for (const user of [alice, bob]) await request('/events/' + id + '/register', { method: 'POST', cookie: user.cookie });
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, capacity: 1 } })).status, 409);
    assert.equal((await request('/events/' + id, { method: 'DELETE', cookie: owner.cookie })).status, 409);
    assert.equal((await request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: ' ' } })).status, 400);
    assert.equal((await request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Venue closed' } })).status, 200);
    const booking = (await request('/me/registrations', { cookie: alice.cookie })).data[0];
    assert.equal(booking.status, 'cancelled');
    assert.equal(booking.cancellationReason, 'Venue closed');
    assert.equal((await request('/events/' + id + '/register', { method: 'POST', cookie: charlie.cookie })).status, 409);
    assert.equal((await request('/events/' + id + '/attendees', { method: 'POST', cookie: owner.cookie, body: { userId: charlie.id } })).status, 409);
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: eventData })).status, 409);
    for (const user of [alice, bob]) assert.equal((await request('/events/' + id + '/register', { method: 'DELETE', cookie: user.cookie })).status, 200);
    assert.equal((await request('/events/' + id, { method: 'DELETE', cookie: owner.cookie })).status, 200);
    assert.equal((await request('/events/' + id)).status, 404);
});

test('Validation, CSRF origin and non-attendee targets are rejected', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer');
    const id = await event(owner);
    assert.equal((await request('/events', { method: 'POST', cookie: owner.cookie })).status, 400);
    assert.equal((await request('/register', { method: 'POST' })).status, 400);
    assert.equal((await request('/events', { method: 'POST', cookie: owner.cookie, body: eventData, headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await request('/logout', { method: 'POST', cookie: owner.cookie, headers: { 'X-UON-Request': '' } })).status, 403);
    for (const capacity of [0, -1, 1.5, '2']) {
        assert.equal((await request('/events', { method: 'POST', cookie: owner.cookie, body: { ...eventData, capacity } })).status, 400);
    }
    assert.equal((await request('/events', { method: 'POST', cookie: owner.cookie, body: { ...eventData, date: '2026-02-30' } })).status, 400);
    assert.equal((await request('/events/' + id + '/attendees', { method: 'POST', cookie: owner.cookie, body: { userId: owner.id } })).status, 404);
    assert.equal((await request('/events/abc')).status, 400);
    assert.equal((await request('/events/999999')).status, 404);
    assert.equal((await request('/login', { method: 'POST', body: { email: owner.email, password: 'wrong' } })).status, 401);
});

test('Login rotates the previous session and recognizes existing mixed-case email', async t => {
    const { db, request, account } = await fixture(t);
    const user = await account();
    await db.run('UPDATE users SET email = ? WHERE id = ?', ['  Legacy@Example.Test  ', user.id]);
    const result = await request('/login', { method: 'POST', cookie: user.cookie, body: { email: 'legacy@example.test', password: 'demo-password' } });
    assert.equal(result.status, 200);
    assert.notEqual(result.cookie.split(';')[0], user.cookie);
    assert.equal((await request('/me', { cookie: user.cookie })).status, 401);
    assert.equal((await request('/me', { cookie: result.cookie.split(';')[0] })).status, 200);
});

test('Database migration preserves legacy data and survives reopening', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'uon-migration-'));
    const filename = path.join(directory, 'test.db');
    const sqlite3 = require('sqlite3');
    const legacy = new sqlite3.Database(filename);
    await new Promise((resolve, reject) => legacy.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, firstName TEXT, lastName TEXT, email TEXT UNIQUE, role TEXT, password TEXT);
        CREATE TABLE events (id INTEGER PRIMARY KEY, title TEXT, description TEXT, date TEXT, time TEXT, location TEXT, category TEXT, capacity INTEGER, createdBy INTEGER);
        INSERT INTO users VALUES (1, 'Legacy', 'User', 'legacy@example.test', 'organizer', 'existing-hash');
        INSERT INTO events VALUES (1, 'Existing event', '', '2026-12-20', '14:00', 'UON', 'Workshop', 10, 1);`, err => err ? reject(err) : resolve()));
    await new Promise(resolve => legacy.close(resolve));
    let db;
    try {
        db = await createDatabase(filename);
        assert.equal((await db.get('SELECT * FROM events WHERE id = 1')).status, 'active');
        assert.equal((await db.get('SELECT * FROM users WHERE id = 1')).password, 'existing-hash');
        await db.run('INSERT INTO sessions VALUES (?, 1, ?)', ['stored-hash', Date.now() + 10000]);
        await db.run("INSERT INTO notifications (userId, eventId, eventTitle, message, isRead) VALUES (1, 1, 'Existing event', 'Persistent notice', 1)");
        await db.close();
        db = await createDatabase(filename);
        assert.equal((await db.get('SELECT * FROM events WHERE id = 1')).title, 'Existing event');
        assert.equal((await db.get('SELECT COUNT(*) AS count FROM sessions')).count, 1);
        assert.equal((await db.get('SELECT * FROM notifications')).isRead, 1);
    } finally { if (db) await db.close(); await rm(filename); await rmdir(directory); }
});

test('Search matches title, category and location, trims whitespace and treats SQL wildcards literally', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), user = await account();
    const ai = await event(owner, { title: 'AI Research', category: 'Workshop', location: 'City Campus' });
    const sport = await event(owner, { title: 'Football', category: 'Sports', location: 'Oval' });
    const literal = await event(owner, { title: '100%_Ready', category: 'Social', location: 'Library' });
    await request('/events/' + ai + '/register', { method: 'POST', cookie: user.cookie });
    const search = q => request('/events?' + new URLSearchParams({ q }), { cookie: user.cookie });
    assert.deepEqual((await search('  aI research  ')).data.map(item => item.id), [ai]);
    assert.equal((await search('aI research')).data[0].isRegistered, 1);
    assert.equal((await search('aI research')).data[0].registeredCount, 1);
    assert.deepEqual((await search('SPORTS')).data.map(item => item.id), [sport]);
    assert.deepEqual((await search('city')).data.map(item => item.id), [ai]);
    assert.deepEqual((await search('%_')).data.map(item => item.id), [literal]);
    assert.deepEqual((await search("' OR 1=1 --")).data, []);
    assert.equal((await search('   ')).data.length, 3);
    assert.equal((await request('/events?q=Library')).data[0].id, literal);
    assert.deepEqual((await search('not found')).data, []);
    await request('/events/' + ai + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Cancelled' } });
    assert.equal((await search('AI')).data[0].status, 'cancelled');
});

test('Cancellation notifies current self/admin registrations, excludes removed and unrelated users', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), alice = await account(), bob = await account(), removed = await account(), unrelated = await account();
    const id = await event(owner, { capacity: 4, title: 'Cancelled workshop' });
    await request('/events/' + id + '/register', { method: 'POST', cookie: alice.cookie });
    await request('/events/' + id + '/attendees', { method: 'POST', cookie: owner.cookie, body: { userId: bob.id } });
    await request('/events/' + id + '/register', { method: 'POST', cookie: removed.cookie });
    await request('/events/' + id + '/register', { method: 'DELETE', cookie: removed.cookie });
    assert.equal((await request('/notifications', { cookie: alice.cookie })).data.unreadCount, 0);
    await request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Presenter unavailable' } });
    for (const user of [alice, bob]) {
        const result = await request('/notifications', { cookie: user.cookie });
        assert.equal(result.status, 200);
        assert.equal(result.data.unreadCount, 1);
        assert.equal(result.data.notifications.length, 1);
        const notification = result.data.notifications[0];
        assert.equal(notification.eventId, id);
        assert.equal(notification.eventTitle, 'Cancelled workshop');
        assert.equal(notification.message, 'Presenter unavailable');
        assert.equal(notification.isRead, 0);
        assert.ok(Number.isFinite(Date.parse(notification.createdAt)));
        assert.equal((await request('/notifications', { cookie: user.cookie })).data.unreadCount, 1, 'Viewing does not silently mark read');
    }
    for (const user of [removed, unrelated, owner]) {
        assert.deepEqual((await request('/notifications', { cookie: user.cookie })).data, { notifications: [], unreadCount: 0 });
    }
});

test('Notifications are private; read-one and read-all are persistent, idempotent and account-scoped', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), alice = await account(), bob = await account();
    for (let i = 0; i < 2; i++) {
        const id = await event(owner, { title: 'Notification ' + i });
        for (const user of [alice, bob]) await request('/events/' + id + '/register', { method: 'POST', cookie: user.cookie });
        await request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Reason ' + i } });
    }
    const aliceList = (await request('/notifications', { cookie: alice.cookie })).data;
    const bobId = (await request('/notifications', { cookie: bob.cookie })).data.notifications[0].id;
    assert.equal(aliceList.unreadCount, 2);
    assert.ok(aliceList.notifications[0].id > aliceList.notifications[1].id);
    assert.equal((await request('/notifications')).status, 401);
    assert.equal((await request('/notifications/read-all', { method: 'POST' })).status, 401);
    assert.equal((await request('/notifications/' + bobId + '/read', { method: 'POST' })).status, 401);
    for (const user of [alice, owner]) assert.equal((await request('/notifications/' + bobId + '/read', { method: 'POST', cookie: user.cookie })).status, 404);
    assert.equal((await request('/notifications?userId=' + bob.id, { cookie: alice.cookie })).data.notifications[0].id, aliceList.notifications[0].id);
    const readPath = '/notifications/' + aliceList.notifications[0].id + '/read';
    for (let i = 0; i < 2; i++) assert.equal((await request(readPath, { method: 'POST', cookie: alice.cookie })).status, 200);
    assert.equal((await request('/notifications', { cookie: alice.cookie })).data.unreadCount, 1);
    assert.equal((await request('/notifications/abc/read', { method: 'POST', cookie: alice.cookie })).status, 400);
    assert.equal((await request('/notifications/999999/read', { method: 'POST', cookie: alice.cookie })).status, 404);
    await request('/notifications/read-all', { method: 'POST', cookie: alice.cookie, body: { userId: bob.id } });
    await request('/notifications/read-all', { method: 'POST', cookie: alice.cookie });
    assert.equal((await request('/notifications', { cookie: alice.cookie })).data.unreadCount, 0);
    assert.equal((await request('/notifications', { cookie: bob.cookie })).data.unreadCount, 2);
});

test('Concurrent/repeated cancellations generate exactly one notification per recipient', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), user = await account();
    const id = await event(owner);
    await request('/events/' + id + '/register', { method: 'POST', cookie: user.cookie });
    const cancel = () => request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Reason' } });
    const results = await Promise.all([cancel(), cancel()]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
    assert.equal((await cancel()).status, 409);
    assert.equal((await request('/notifications', { cookie: user.cookie })).data.notifications.length, 1);
});

test('Notification insertion failure rolls back cancellation and all partial notifications', async t => {
    const { db, request, account, event } = await fixture(t);
    const owner = await account('organizer'), alice = await account(), bob = await account();
    const id = await event(owner);
    for (const user of [alice, bob]) await request('/events/' + id + '/register', { method: 'POST', cookie: user.cookie });
    await db.run("CREATE TRIGGER simulate_notification_failure BEFORE INSERT ON notifications WHEN NEW.userId = " + bob.id + " BEGIN SELECT RAISE(ABORT, 'Simulated write failure'); END");
    await assert.rejects(db.run("UPDATE events SET status = 'cancelled', cancellationReason = 'Reason' WHERE id = ?", [id]), /Simulated write failure/);
    assert.equal((await db.get('SELECT status FROM events WHERE id = ?', [id])).status, 'active');
    assert.equal((await db.get('SELECT count(*) AS count FROM notifications')).count, 0);
});

test('Notification snapshots survive removal of bookings and subsequent deletion of the event', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer'), user = await account();
    const id = await event(owner, { title: 'Retained title' });
    await request('/events/' + id + '/register', { method: 'POST', cookie: user.cookie });
    await request('/events/' + id + '/cancel', { method: 'POST', cookie: owner.cookie, body: { reason: 'Retained reason' } });
    await request('/events/' + id + '/register', { method: 'DELETE', cookie: user.cookie });
    assert.equal((await request('/events/' + id, { method: 'DELETE', cookie: owner.cookie })).status, 200);
    const result = (await request('/notifications', { cookie: user.cookie })).data;
    assert.equal(result.unreadCount, 1);
    assert.equal(result.notifications[0].eventId, null);
    assert.equal(result.notifications[0].eventTitle, 'Retained title');
    assert.equal(result.notifications[0].message, 'Retained reason');
});

test('Image create, preview URL, replacement, preservation and removal work without exposing binary data in JSON', async t => {
    const { request, account, event } = await fixture(t);
    const sharp = require('sharp');
    const owner = await account('organizer'), other = await account('organizer');
    const png = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#065f52' } }).png().toBuffer();
    const image = 'data:image/png;base64,' + png.toString('base64');
    const id = await event(owner, { image });
    const details = (await request('/events/' + id)).data;
    assert.equal(details.imageUrl, '/api/events/' + id + '/image');
    assert.equal(details.image, undefined);
    const loaded = await request('/events/' + id + '/image');
    assert.equal(loaded.status, 200);
    assert.match(loaded.contentType, /^image\/webp/);
    assert.equal((await sharp(loaded.data).metadata()).format, 'webp');
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: other.cookie, body: { ...eventData, image: null } })).status, 403);
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: eventData })).status, 200);
    assert.equal((await request('/events/' + id)).data.imageUrl, details.imageUrl);
    const jpeg = await sharp(png).jpeg().toBuffer();
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, image: 'data:image/jpeg;base64,' + jpeg.toString('base64') } })).status, 200);
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, image: null } })).status, 200);
    assert.equal((await request('/events/' + id)).data.imageUrl, null);
    assert.equal((await request('/events/' + id + '/image')).status, 404);
});

test('Image validation rejects disguised files, corrupt images and oversized uploads without partially saving events', async t => {
    const { request, account, event } = await fixture(t);
    const owner = await account('organizer');
    const id = await event(owner);
    const invalid = [
        'data:image/svg+xml;base64,' + Buffer.from('<svg></svg>').toString('base64'),
        'data:image/png;base64,' + Buffer.from('not an image').toString('base64'),
        'data:image/png;base64,!!!!',
        'data:image/png;base64,' + Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64'),
        { path: '/etc/passwd' },
    ];
    for (const image of invalid) {
        const result = await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, title: 'Must not save', image } });
        assert.equal(result.status, 400, JSON.stringify(result.data));
        assert.equal((await request('/events/' + id)).data.title, eventData.title);
    }
    assert.equal((await request('/events', { method: 'POST', cookie: owner.cookie, body: { ...eventData, image: invalid[1] } })).status, 400);
    assert.equal((await request('/events')).data.length, 1);
    const oversized = await request('/events', { method: 'POST', cookie: owner.cookie, body: { ...eventData, image: 'x'.repeat(3 * 1024 * 1024) } });
    assert.equal(oversized.status, 413);
});

test('Create/edit reject past dates, elapsed times, invalid leap days and Sydney spring-forward gaps', async t => {
    const { request, account, event } = await fixture(t);
    const { eventLocalNow } = require('../shared/eventTime.mjs');
    const owner = await account('organizer');
    const id = await event(owner);
    const elapsed = eventLocalNow(Date.now() - 120000);
    for (const values of [{ date: '2000-01-01', time: '12:00' }, elapsed, { date: '2099-02-29', time: '12:00' }, { date: '2026-10-04', time: '02:30' }]) {
        assert.equal((await request('/events', { method: 'POST', cookie: owner.cookie, body: { ...eventData, ...values } })).status, 400);
        assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, ...values } })).status, 400);
    }
    assert.equal((await request('/events')).data.length, 1);
});

test('Old events remain readable but cannot accept self or manual registrations; ownerless events cannot be claimed', async t => {
    const { db, request, account, event } = await fixture(t);
    const owner = await account('organizer'), user = await account();
    const id = await event(owner);
    await db.run("UPDATE events SET date = '2000-01-01' WHERE id = ?", [id]);
    assert.equal((await request('/events/' + id)).status, 200);
    assert.equal((await request('/events/' + id + '/register', { method: 'POST', cookie: user.cookie })).status, 409);
    assert.equal((await request('/events/' + id + '/attendees', { method: 'POST', cookie: owner.cookie, body: { userId: user.id } })).status, 409);
    await db.run('UPDATE events SET createdBy = NULL WHERE id = ?', [id]);
    assert.equal((await request('/events/' + id, { method: 'PUT', cookie: owner.cookie, body: { ...eventData, createdBy: owner.id } })).status, 403);
});
