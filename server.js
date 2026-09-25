const { decodeEventImage } = require('./eventImage');
const { eventTimestamp, isFutureEvent } = require('./shared/eventTime.mjs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { randomBytes, createHash } = require('crypto');
const { createDatabase } = require('./database');

const SESSION_COOKIE = 'uon_session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const hashToken = token => createHash('sha256').update(token).digest('hex');
const text = value => typeof value === 'string' ? value.trim() : '';
const fail = (status, message) => Object.assign(new Error(message), { status });
const publicUser = user => ({
    id: user.id, firstName: user.firstName, lastName: user.lastName,
    email: user.email, role: user.role,
});

function createApp(db, options = {}) {
    const app = express();
    const origins = options.origins || (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173').split(',').map(value => value.trim());
    const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
    app.disable('x-powered-by');
    app.use(cors({ origin: origins, credentials: true }));
    app.use(express.json({ limit: '3mb' }));
    app.use((req, res, next) => { req.body ??= {}; next(); });
    // A custom header plus an explicit origin allowlist blocks cross-site form/fetch writes.
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            if (req.get('X-UON-Request') !== '1' || (req.get('Origin') && !origins.includes(req.get('Origin')))) {
                return next(fail(403, 'Request origin is not allowed'));
            }
        }
        next();
    });
    app.use(async (req, res, next) => {
        const token = (req.headers.cookie || '').split(';').map(part => part.trim())
            .find(part => part.startsWith(SESSION_COOKIE + '='))?.slice(SESSION_COOKIE.length + 1);
        req.sessionHash = /^[a-f0-9]{64}$/.test(token || '') ? hashToken(token) : null;
        req.user = req.sessionHash ? await db.get(
            'SELECT users.* FROM sessions JOIN users ON users.id = sessions.userId WHERE tokenHash = ? AND expiresAt > ?',
            [req.sessionHash, Date.now()]
        ) : null;
        next();
    });
    const requireUser = (req, res, next) => req.user ? next() : next(fail(401, 'Please sign in to continue'));
    const requireRole = role => (req, res, next) => {
        if (!req.user) return next(fail(401, 'Please sign in to continue'));
        if (req.user.role !== role) return next(fail(403, role === 'organizer' ? 'Organizer access required' : 'Attendee access required'));
        next();
    };
    const organizer = requireRole('organizer');
    const attendee = requireRole('attendee');
    app.param('id', (req, res, next, id) => {
        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return next(fail(400, 'Invalid event ID'));
        next();
    });
    const eventExists = async id => {
        const event = await db.get('SELECT * FROM events WHERE id = ?', [id]);
        if (!event) throw fail(404, 'Event not found');
        return event;
    };
    const ownsEvent = async (req, res, next) => {
        const event = await eventExists(req.params.id);
        if (event.createdBy !== req.user.id) throw fail(403, 'Only the organizer who created this event can manage it');
        req.event = event;
        next();
    };
    const eventSelect = `SELECT events.id, events.title, events.description, events.date, events.time,
        events.location, events.category, events.capacity, events.createdBy, events.status, events.cancellationReason,
        CASE WHEN events.image IS NOT NULL THEN '/api/events/' || events.id || '/image' ELSE NULL END AS imageUrl,
        users.firstName, users.lastName,
        (SELECT COUNT(*) FROM registrations WHERE eventId = events.id) AS registeredCount,
        EXISTS(SELECT 1 FROM registrations WHERE eventId = events.id AND userId = ?) AS isRegistered
        FROM events LEFT JOIN users ON events.createdBy = users.id`;
    function eventValues(body) {
        const { capacity } = body;
        const title = text(body.title), date = text(body.date), time = text(body.time), location = text(body.location);
        if (!title || !date || !time || !location) throw fail(400, 'Title, date, time and location are required');
        if (!Number.isFinite(eventTimestamp(date, time))) throw fail(400, 'Enter a valid date and time in Australia/Sydney (including daylight saving)');
        if (!isFutureEvent(date, time)) throw fail(400, 'Event date and time must be in the future (Australia/Sydney)');
        if (title.length > 200 || text(body.description).length > 5000 || location.length > 300) throw fail(400, 'Event title, description or location is too long');
        if (!Number.isSafeInteger(capacity) || capacity < 1) throw fail(400, 'Capacity must be a positive whole number');
        const category = text(body.category);
        if (!['Workshop', 'Seminar', 'Social', 'Sports'].includes(category)) throw fail(400, 'Select a valid category');
        return [title, text(body.description), date, time, location, category, capacity];
    }

    app.get('/', (req, res) => res.send('Server is running!'));

    // USER REGISTER: role selection is retained for the coursework demo.
    app.post('/register', async (req, res) => {
        const firstName = text(req.body.firstName), lastName = text(req.body.lastName);
        const email = text(req.body.email).toLowerCase(), { role, password } = req.body;
        if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, 'Enter your name and a valid email address');
        if (!['attendee', 'organizer'].includes(role)) throw fail(400, 'Select a valid role');
        if (typeof password !== 'string' || !password.length || Buffer.byteLength(password, 'utf8') > 72) {
            throw fail(400, 'Password is required and must not exceed 72 UTF-8 bytes');
        }
        if (await db.get('SELECT id FROM users WHERE lower(trim(email)) = ?', [email])) throw fail(409, 'Email already exists');
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.run('INSERT INTO users (firstName, lastName, email, role, password) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, email, role, hashed]);
        res.status(201).json({ message: 'User registered successfully', userId: result.id });
    });

    // USER LOGIN: only an unpredictable opaque token is sent to the browser.
    app.post('/login', async (req, res) => {
        const email = text(req.body.email).toLowerCase(), { password } = req.body;
        if (!email || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
            throw fail(400, 'Email and a valid password are required');
        }
        const user = await db.get('SELECT * FROM users WHERE lower(trim(email)) = ?', [email]);
        if (!user || !await bcrypt.compare(password, user.password)) throw fail(401, 'Invalid email or password');
        const token = randomBytes(32).toString('hex');
        await db.run('DELETE FROM sessions WHERE expiresAt <= ? OR tokenHash = ?', [Date.now(), req.sessionHash]);
        await db.run('INSERT INTO sessions (tokenHash, userId, expiresAt) VALUES (?, ?, ?)', [hashToken(token), user.id, Date.now() + SESSION_TTL]);
        res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL });
        res.json({ user: publicUser(user) });
    });
    app.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));
    app.post('/logout', async (req, res) => {
        if (req.sessionHash) await db.run('DELETE FROM sessions WHERE tokenHash = ?', [req.sessionHash]);
        res.clearCookie(SESSION_COOKIE, cookieOptions);
        res.json({ message: 'Logged out' });
    });

    // GET EVENTS: public data plus this session's registration state.
    app.get('/events', async (req, res) => {
        const query = text(req.query.q);
        const category = text(req.query.category);
        if (category && !['Workshop', 'Seminar', 'Social', 'Sports'].includes(category)) throw fail(400, 'Select a valid category');
        const conditions = [];
        if (query) conditions.push("(instr(lower(events.title), lower(?)) > 0 OR instr(lower(coalesce(events.category, '')), lower(?)) > 0 OR instr(lower(events.location), lower(?)) > 0)");
        if (category) conditions.push('events.category = ?');
        const filter = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
        res.json(await db.all(eventSelect + filter + ' ORDER BY events.id DESC',
            [req.user?.id || null, ...(query ? [query, query, query] : []), ...(category ? [category] : [])]));
    });
    app.get('/events/:id', async (req, res) => {
        const event = await db.get(eventSelect + ' WHERE events.id = ?', [req.user?.id || null, req.params.id]);
        if (!event) throw fail(404, 'Event not found');
        res.json(event);
    });
    app.get('/events/:id/image', async (req, res) => {
        const row = await db.get('SELECT image FROM events WHERE id = ?', [req.params.id]);
        if (!row?.image) throw fail(404, 'Image not found');
        res.set('X-Content-Type-Options', 'nosniff').type('image/webp').send(row.image);
    });
    // Only the creator can change an event or administer its participants.
    app.post('/events', organizer, async (req, res) => {
        const values = eventValues(req.body);
        const image = await decodeEventImage(req.body.image);
        const result = await db.run('INSERT INTO events (title, description, date, time, location, category, capacity, createdBy, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [...values, req.user.id, image || null]);
        res.status(201).json({ message: 'Event created successfully', eventId: result.id });
    });
    app.put('/events/:id', organizer, ownsEvent, async (req, res) => {
        const values = eventValues(req.body);
        const image = await decodeEventImage(req.body.image);
        const result = await db.run(`UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, category = ?, capacity = ?, image = CASE WHEN ? THEN ? ELSE image END
            WHERE id = ? AND status = 'active'`, [...values, image !== undefined ? 1 : 0, image || null, req.params.id]);
        if (!result.changes) throw fail(409, 'Cancelled events cannot be edited');
        res.json({ message: 'Event updated successfully' });
    });
    app.post('/events/:id/cancel', organizer, ownsEvent, async (req, res) => {
        const reason = text(req.body.reason);
        if (!reason || reason.length > 2000) throw fail(400, 'A cancellation reason of 1–2000 characters is required');
        await eventExists(req.params.id);
        const result = await db.run("UPDATE events SET status = 'cancelled', cancellationReason = ? WHERE id = ? AND status = 'active'", [reason, req.params.id]);
        if (!result.changes) throw fail(409, 'Event is already cancelled');
        res.json({ message: 'Event cancelled. Notifications have been sent to registered attendees.' });
    });
    // Keep the existing delete API, but preserve events with booking history.
    app.delete('/events/:id', organizer, ownsEvent, async (req, res) => {
        await eventExists(req.params.id);
        const result = await db.run('DELETE FROM events WHERE id = ? AND NOT EXISTS (SELECT 1 FROM registrations WHERE eventId = events.id)', [req.params.id]);
        if (!result.changes) throw fail(409, 'This event has registrations. Cancel it instead.');
        res.json({ message: 'Event deleted successfully' });
    });

    async function register(eventId, userId) {
        const event = await eventExists(eventId);
        if (!isFutureEvent(event.date, event.time)) throw fail(409, 'Registration is closed because this event has already started');
        await db.run('INSERT INTO registrations (eventId, userId) VALUES (?, ?)', [eventId, userId]);
    }
    async function unregister(eventId, userId) {
        await eventExists(eventId);
        const result = await db.run('DELETE FROM registrations WHERE eventId = ? AND userId = ?', [eventId, userId]);
        if (!result.changes) throw fail(404, 'Registration not found');
    }
    app.post('/events/:id/register', attendee, async (req, res) => {
        // Never use a userId supplied by an attendee.
        await register(req.params.id, req.user.id);
        res.status(201).json({ message: 'Registration confirmed' });
    });
    app.delete('/events/:id/register', attendee, async (req, res) => {
        await unregister(req.params.id, req.user.id);
        res.json({ message: 'Registration cancelled' });
    });
    app.get('/me/registrations', attendee, async (req, res) => {
        res.json(await db.all(eventSelect + ' WHERE EXISTS (SELECT 1 FROM registrations WHERE eventId = events.id AND userId = ?) ORDER BY events.date, events.time',
            [req.user.id, req.user.id]));
    });
    app.get('/events/:id/attendees', organizer, ownsEvent, async (req, res) => {
        await eventExists(req.params.id);
        res.json(await db.all(`SELECT users.id, users.firstName, users.lastName, users.email, registrations.createdAt
            FROM registrations JOIN users ON users.id = registrations.userId
            WHERE eventId = ? ORDER BY users.firstName, users.lastName, users.id`, [req.params.id]));
    });
    app.get('/attendees', organizer, async (req, res) => {
        const query = text(req.query.q);
        if (query.length < 2) return res.json([]);
        res.json(await db.all(`SELECT id, firstName, lastName, email FROM users WHERE role = 'attendee'
            AND (instr(lower(firstName || ' ' || lastName), lower(?)) > 0 OR instr(lower(email), lower(?)) > 0)
            ORDER BY firstName, lastName, id LIMIT 30`, [query, query]));
    });
    app.post('/events/:id/attendees', organizer, ownsEvent, async (req, res) => {
        if (!Number.isSafeInteger(req.body.userId) || req.body.userId < 1) throw fail(400, 'Select an attendee');
        await register(req.params.id, req.body.userId);
        res.status(201).json({ message: 'Attendee registered' });
    });
    app.delete('/events/:id/attendees/:userId', organizer, ownsEvent, async (req, res) => {
        if (!/^[1-9]\d*$/.test(req.params.userId)) throw fail(400, 'Invalid attendee ID');
        await unregister(req.params.id, Number(req.params.userId));
        res.json({ message: 'Attendee removed' });
    });

    // Notification ownership always comes from the authenticated session.
    app.get('/notifications', requireUser, async (req, res) => {
        const notifications = await db.all('SELECT id, eventId, type, eventTitle, message, isRead, createdAt FROM notifications WHERE userId = ? ORDER BY id DESC', [req.user.id]);
        res.json({ notifications, unreadCount: notifications.filter(item => !item.isRead).length });
    });
    app.post('/notifications/read-all', requireUser, async (req, res) => {
        await db.run('UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0', [req.user.id]);
        res.json({ message: 'All notifications marked as read' });
    });
    app.post('/notifications/:notificationId/read', requireUser, async (req, res) => {
        const id = req.params.notificationId;
        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw fail(400, 'Invalid notification ID');
        const result = await db.run('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [id, req.user.id]);
        if (!result.changes) throw fail(404, 'Notification not found');
        res.json({ message: 'Notification marked as read' });
    });

    app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
    app.use((error, req, res, next) => { // Express error middleware requires four arguments.
        if (res.headersSent) return next(error);
        const rule = ['Event not found', 'Attendee not found', 'Event is cancelled', 'Already registered',
            'Event is full', 'Capacity cannot be below the registered count'].find(message => error.message.includes(message));
        if (rule) return res.status(rule.endsWith('not found') ? 404 : 409).json({ message: rule });
        if (error.message.includes('UNIQUE constraint failed: users.email')) return res.status(409).json({ message: 'Email already exists' });
        const status = error.status || 500;
        if (status >= 500) console.error(error);
        res.status(status).json({ message: status >= 500 ? 'An unexpected server error occurred' : error.message });
    });
    return app;
}

if (require.main === module) {
    createDatabase().then(db => {
        const port = Number(process.env.PORT || 3000);
        createApp(db).listen(port, () => console.log('Server running on http://localhost:' + port));
    }).catch(error => {
        console.error('Could not initialize database:', error);
        process.exitCode = 1;
    });
}
module.exports = { createApp };
