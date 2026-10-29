const { normalize, checkEventKeywords } = require('./contentModeration');
const { createModerator } = require('./aiModeration');
const { installAdminFeatures } = require('./adminFeatures');
const { decodeEventImage } = require('./eventImage');
const { eventTimestamp, isFutureEvent } = require('./shared/eventTime.mjs');
const { eventInputErrors, profileInputErrors, textError } = require('./shared/validation.mjs');
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
    email: user.email, role: user.role, bio: user.bio || '',
});

function createApp(db, options = {}) {
    const app = express();
    const moderator = createModerator(options.moderation);
    const reviewAttempts = new Map();
    async function reviewEvent(req) {
        await checkEventKeywords(db, req.body);
        if (moderator.status.mode === 'required') {
            const now = Date.now();
            for (const [id, entry] of reviewAttempts) if (entry.until <= now) reviewAttempts.delete(id);
            const entry = reviewAttempts.get(req.user.id) || { until: now + 60000, count: 0 };
            if (entry.count >= 10) throw fail(429, 'Too many content review attempts. Please try again in a minute.');
            entry.count++;
            reviewAttempts.set(req.user.id, entry);
        }
        await moderator.check(req.body);
    }
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
            "SELECT users.* FROM sessions JOIN users ON users.id = sessions.userId WHERE tokenHash = ? AND expiresAt > ? AND users.status = 'active'",
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
    const admin = requireRole('admin');
    const eventManager = (req, res, next) => {
        if (!req.user) return next(fail(401, 'Please sign in to continue'));
        if (!['organizer', 'admin'].includes(req.user.role)) return next(fail(403, 'Organizer or administrator access required'));
        next();
    };
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
        if (req.user.role !== 'admin' && event.createdBy !== req.user.id) throw fail(403, 'Only the organizer who created this event can manage it');
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
        const validation = eventInputErrors(body);
        if (Object.keys(validation).length) throw fail(400, Object.values(validation)[0]);
        const category = text(body.category);
        if (!['Workshop', 'Seminar', 'Social', 'Sports'].includes(category)) throw fail(400, 'Select a valid category');
        return [title, text(body.description), date, time, location, category, capacity];
    }

    function moderationReason(value) {
        const error = textError(value, 'Management reason', 500, true);
        if (error) throw fail(400, error);
        return value.trim();
    }
    async function auditChange(req, action, targetType, targetId, reason, work) {
        return db.transaction(async tx => {
            const actor = await tx.get('SELECT role, status FROM users WHERE id = ?', [req.user.id]);
            if (actor?.role !== 'admin' || actor.status !== 'active') throw fail(403, 'Administrator access required');
            const result = await work(tx);
            const auditRecord = await tx.run('INSERT INTO admin_audit (actorId, action, targetType, targetId, reason, details) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, action, targetType, result?.auditTargetId ?? Number(targetId), reason, JSON.stringify(result?.audit || {})]);
            // Notify only the event owner, in the same transaction as moderation.
            // Each edit has its own audit ID so repeated edits retain separate notices.
            if (targetType === 'event' && req.event.createdBy) {
                const deleted = action === 'delete_event';
                const cancelled = action === 'cancel_event';
                const type = cancelled ? (result.audit.cancellationVersion ? 'event_cancelled:' + result.audit.cancellationVersion : 'event_cancelled') : (deleted ? 'event_deleted:' : action === 'restore_event' ? 'event_restored:' : 'event_updated:') + auditRecord.id;
                const changes = [];
                const labels = { title: 'Title', description: 'Description', date: 'Date', time: 'Time (Australia/Sydney)', location: 'Location', category: 'Category', capacity: 'Capacity' };
                for (const [key, label] of Object.entries(labels)) {
                    if (action === 'edit_event' && result.audit.before[key] !== result.audit.after[key]) {
                        changes.push(label + ': ' + (result.audit.before[key] ?? '') + ' → ' + result.audit.after[key]);
                    }
                }
                if (result?.audit?.imageChanged) changes.push('Image: replaced or removed');
                const message = reason + (action === 'edit_event' ? '\n\nChanges:\n' + (changes.length ? changes.join('\n') : 'No text or image changes.') : '');
                await tx.run(`INSERT INTO notifications (userId, eventId, type, eventTitle, message)
                    SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS
                    (SELECT 1 FROM notifications WHERE userId = ? AND eventId = ? AND type = ?)`,
                    [req.event.createdBy, deleted ? null : Number(targetId), type, result?.audit?.after?.title || req.event.title, message,
                        req.event.createdBy, Number(targetId), type]);
            }
            if (action === 'restore_event') {
                await tx.run(`INSERT INTO notifications (userId, eventId, type, eventTitle, message)
                    SELECT userId, eventId, ?, ?, ? FROM registrations WHERE eventId = ? AND userId != ?`,
                    ['event_restored:' + auditRecord.id, req.event.title, reason, targetId, req.event.createdBy || 0]);
            }
            return result;
        });
    }
    async function organizerTransaction(req, work) {
        return db.transaction(async tx => {
            const actor = await tx.get('SELECT role, status FROM users WHERE id = ?', [req.user.id]);
            const event = await tx.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
            if (actor?.role !== 'organizer' || actor.status !== 'active') throw fail(403, 'Organizer access required');
            if (!event) throw fail(404, 'Event not found');
            if (event.createdBy !== req.user.id) throw fail(403, 'Only the event creator can manage it');
            return work(tx, event);
        });
    }
    async function notify(tx, userId, eventId, type, title, message) {
        await tx.run('INSERT INTO notifications (userId, eventId, type, eventTitle, message) VALUES (?, ?, ?, ?, ?)',
            [userId, eventId, type, title, message]);
    }
    function optionalReason(value, fallback) {
        return value === undefined || value === '' ? fallback : moderationReason(value);
    }

    const manageEvent = (req, action, work) => req.user.role === 'admin'
        ? auditChange(req, action, 'event', req.params.id, moderationReason(req.body.moderationReason || req.body.reason), work)
        : organizerTransaction(req, work);

    installAdminFeatures(app, db, { admin, eventManager, moderator });

    app.get('/', (req, res) => res.send('Server is running!'));

    // USER REGISTER: role selection is retained for the coursework demo.
    app.post('/register', async (req, res) => {
        const firstName = text(req.body.firstName), lastName = text(req.body.lastName);
        const nameErrors = profileInputErrors({ firstName, lastName, bio: '' });
        if (Object.keys(nameErrors).length) throw fail(400, Object.values(nameErrors)[0]);
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
        if (user.status !== 'active') throw fail(403, 'Your account is suspended. Contact the site administrator.');
        const token = randomBytes(32).toString('hex');
        await db.run('DELETE FROM sessions WHERE expiresAt <= ? OR tokenHash = ?', [Date.now(), req.sessionHash]);
        await db.run('INSERT INTO sessions (tokenHash, userId, expiresAt) VALUES (?, ?, ?)', [hashToken(token), user.id, Date.now() + SESSION_TTL]);
        res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL });
        res.json({ user: publicUser(user) });
    });
    app.get('/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));
    app.put('/me/profile', requireUser, async (req, res) => {
        if (Object.keys(req.body).some(key => !['firstName', 'lastName', 'bio'].includes(key))) throw fail(400, 'Only first name, last name and bio can be updated here');
        const errors = profileInputErrors(req.body);
        if (Object.keys(errors).length) throw fail(400, Object.values(errors)[0]);
        const result = await db.run("UPDATE users SET firstName = ?, lastName = ?, bio = ? WHERE id = ? AND status = 'active'",
            [text(req.body.firstName), text(req.body.lastName), text(req.body.bio), req.user.id]);
        if (!result.changes) throw fail(401, 'Please sign in to continue');
        res.json({ user: publicUser(await db.get('SELECT * FROM users WHERE id = ?', [req.user.id])) });
    });
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
        await reviewEvent(req);
        const result = await db.transaction(async tx => {
        const actor = await tx.get('SELECT role, status FROM users WHERE id = ?', [req.user.id]);
        if (actor?.role !== 'organizer' || actor.status !== 'active') throw fail(403, 'Organizer access required');
        await checkEventKeywords(tx, req.body);
        return tx.run('INSERT INTO events (title, description, date, time, location, category, capacity, createdBy, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [...values, req.user.id, image || null]);
        });
        res.status(201).json({ message: 'Event created successfully', eventId: result.id });
    });
    app.put('/events/:id', eventManager, ownsEvent, async (req, res) => {
        const values = eventValues(req.body);
        const image = await decodeEventImage(req.body.image);
        await reviewEvent(req);
        await manageEvent(req, 'edit_event', async tx => {
        await checkEventKeywords(tx, req.body);
        const before = await tx.get('SELECT title, description, date, time, location, category, capacity FROM events WHERE id = ?', [req.params.id]);
        const result = await tx.run(`UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, category = ?, capacity = ?, image = CASE WHEN ? THEN ? ELSE image END
            WHERE id = ? AND status = 'active'`, [...values, image !== undefined ? 1 : 0, image || null, req.params.id]);
        if (!result.changes) throw fail(409, 'Cancelled events cannot be edited');
        const after = { title: values[0], description: values[1], date: values[2], time: values[3], location: values[4], category: values[5], capacity: values[6] };
        const labels = { title: 'Title', description: 'Description', date: 'Date', time: 'Time (Australia/Sydney)', location: 'Location', category: 'Category', capacity: 'Capacity' };
        const changes = Object.keys(labels).filter(key => before[key] !== after[key]).map(key => labels[key] + ': ' + (before[key] ?? '') + ' → ' + after[key]);
        if (changes.length) {
            const reason = req.user.role === 'admin' ? moderationReason(req.body.moderationReason || req.body.reason) : optionalReason(req.body.reason, 'The organizer updated the event details.');
            const recipients = await tx.all('SELECT userId FROM registrations WHERE eventId = ? AND userId != ?', [req.params.id, req.user.role === 'admin' ? req.event.createdBy || 0 : 0]);
            const type = 'event_details_changed:' + randomBytes(16).toString('hex');
            for (const { userId } of recipients) await notify(tx, userId, Number(req.params.id), type, after.title, reason + '\n\nChanges:\n' + changes.join('\n'));
        }
        return { audit: { before, after, imageChanged: image !== undefined } };
        });
        res.json({ message: 'Event updated successfully' });
    });
    app.post('/events/:id/cancel', eventManager, ownsEvent, async (req, res) => {
        const reason = text(req.body.reason);
        if (!reason || reason.length > 2000) throw fail(400, 'A cancellation reason of 1–2000 characters is required');
        await eventExists(req.params.id);
        await manageEvent(req, 'cancel_event', async tx => {
        const result = await tx.run("UPDATE events SET status = 'cancelled', cancellationReason = ? WHERE id = ? AND status = 'active'", [reason, req.params.id]);
        if (!result.changes) throw fail(409, 'Event is already cancelled');
        const current = await tx.get('SELECT cancellationVersion FROM events WHERE id = ?', [req.params.id]);
        return { audit: { title: req.event.title, cancellationVersion: current.cancellationVersion } };
        });
        res.json({ message: 'Event cancelled. Notifications have been sent to registered attendees.' });
    });
    app.post('/events/:id/restore', admin, ownsEvent, async (req, res) => {
        const reason = moderationReason(req.body.reason);
        await auditChange(req, 'restore_event', 'event', req.params.id, reason, async tx => {
            const current = await tx.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
            if (!current) throw fail(404, 'Event not found');
            if (current.status !== 'cancelled') throw fail(409, 'Only cancelled events can be restored');
            if (!isFutureEvent(current.date, current.time)) throw fail(409, 'Past or started events cannot be restored');
            await tx.run("UPDATE events SET status = 'active', cancellationReason = '', cancellationVersion = cancellationVersion + 1 WHERE id = ?", [current.id]);
            return { audit: { title: current.title, previousCancellationReason: current.cancellationReason } };
        });
        res.json({ message: 'Event restored. The creator and registered attendees have been notified.' });
    });
    // Keep the existing delete API, but preserve events with booking history.
    app.delete('/events/:id', eventManager, ownsEvent, async (req, res) => {
        await eventExists(req.params.id);
        await manageEvent(req, 'delete_event', async tx => {
        const result = await tx.run('DELETE FROM events WHERE id = ? AND NOT EXISTS (SELECT 1 FROM registrations WHERE eventId = events.id)', [req.params.id]);
        if (!result.changes) throw fail(409, 'This event has registrations. Cancel it instead.');
        return { audit: { title: req.event.title, createdBy: req.event.createdBy } };
        });
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
        res.json(await db.all(`SELECT id, firstName, lastName, email FROM users WHERE role = 'attendee' AND status = 'active'
            AND (instr(lower(firstName || ' ' || lastName), lower(?)) > 0 OR instr(lower(email), lower(?)) > 0)
            ORDER BY firstName, lastName, id LIMIT 30`, [query, query]));
    });
    async function changeAttendee(req, removing) {
        const reason = optionalReason(req.body.reason, removing ? 'The organizer removed your registration.' : 'The organizer registered you for this event.');
        const userId = removing ? Number(req.params.userId) : req.body.userId;
        await organizerTransaction(req, async (tx, event) => {
            if (removing) {
                const result = await tx.run('DELETE FROM registrations WHERE eventId = ? AND userId = ?', [event.id, userId]);
                if (!result.changes) throw fail(404, 'Registration not found');
            } else {
                if (!isFutureEvent(event.date, event.time)) throw fail(409, 'Registration is closed because this event has already started');
                await tx.run('INSERT INTO registrations (eventId, userId) VALUES (?, ?)', [event.id, userId]);
            }
            await notify(tx, userId, event.id, (removing ? 'registration_removed:' : 'registration_added:') + randomBytes(16).toString('hex'), event.title, reason);
        });
    }
    app.post('/events/:id/attendees', organizer, ownsEvent, async (req, res) => {
        if (!Number.isSafeInteger(req.body.userId) || req.body.userId < 1) throw fail(400, 'Select an attendee');
        await changeAttendee(req, false);
        res.status(201).json({ message: 'Attendee registered' });
    });
    app.delete('/events/:id/attendees/:userId', organizer, ownsEvent, async (req, res) => {
        if (!/^[1-9]\d*$/.test(req.params.userId)) throw fail(400, 'Invalid attendee ID');
        await changeAttendee(req, true);
        res.json({ message: 'Attendee removed' });
    });

    app.get('/admin/users', admin, async (req, res) => {
        const q = text(req.query.q);
        res.json(await db.all(`SELECT id, firstName, lastName, email, role, status, banReason FROM users
            WHERE instr(lower(firstName || ' ' || lastName || ' ' || email), lower(?)) > 0 ORDER BY id DESC`, [q]));
    });
    app.put('/admin/users/:id/role', admin, async (req, res) => {
        const role = req.body.role;
        if (!['admin', 'organizer', 'attendee'].includes(role)) throw fail(400, 'Select a valid role');
        const reason = moderationReason(req.body.reason);
        await auditChange(req, 'change_role', 'user', req.params.id, reason, async tx => {
            const target = await tx.get('SELECT id, role, status FROM users WHERE id = ?', [req.params.id]);
            if (!target) throw fail(404, 'User not found');
            if (target.status !== 'active') throw fail(409, 'Restore the account before changing its role');
            if (target.role === role) throw fail(409, 'Account already has this role');
            if (target.role !== 'admin' && role !== 'admin') throw fail(400, 'This operation only grants or revokes administrator access');
            if (target.role === 'admin') {
                const count = await tx.get("SELECT count(*) AS n FROM users WHERE role = 'admin' AND status = 'active'");
                if (count.n <= 1) throw fail(409, 'At least one active administrator must remain');
            }
            await tx.run('UPDATE users SET role = ? WHERE id = ?', [role, target.id]);
            await tx.run('DELETE FROM sessions WHERE userId = ?', [target.id]);
            await notify(tx, target.id, null, 'role_changed:' + randomBytes(16).toString('hex'), 'Account role changed',
                reason + '\n\nRole: ' + target.role + ' → ' + role + '\nPlease sign in again.');
            return { audit: { from: target.role, to: role } };
        });
        res.json({ message: 'Role updated and user notified. The affected account must sign in again.' });
    });
    app.put('/admin/users/:id/status', admin, async (req, res) => {
        if (!['active', 'banned'].includes(req.body.status)) throw fail(400, 'Select active or banned');
        const reason = moderationReason(req.body.reason);
        await auditChange(req, req.body.status === 'banned' ? 'ban_user' : 'unban_user', 'user', req.params.id, reason, async tx => {
            const target = await tx.get('SELECT id, role, status FROM users WHERE id = ?', [req.params.id]);
            if (!target) throw fail(404, 'User not found');
            if (target.role === 'admin' || target.id === req.user.id) throw fail(403, 'Administrator accounts cannot be suspended here');
            if (target.status === req.body.status) throw fail(409, 'Account already has this status');
            await tx.run('UPDATE users SET status = ?, banReason = ? WHERE id = ?', [req.body.status, req.body.status === 'banned' ? reason : '', target.id]);
            return { audit: { from: target.status, to: req.body.status } };
        });
        res.json({ message: req.body.status === 'banned' ? 'Account suspended and existing sessions revoked.' : 'Account restored. The user must sign in again.' });
    });
    app.get('/admin/audit', admin, async (req, res) => {
        const before = req.query.before === undefined ? Number.MAX_SAFE_INTEGER : Number(req.query.before);
        if (!Number.isSafeInteger(before) || before < 1) throw fail(400, 'Invalid audit cursor');
        res.json(await db.all(`SELECT admin_audit.*, users.firstName, users.lastName FROM admin_audit
            JOIN users ON users.id = actorId WHERE admin_audit.id < ? ORDER BY admin_audit.id DESC LIMIT 50`, [before]));
    });

    app.get('/admin/keywords', admin, async (req, res) => {
        res.json(await db.all('SELECT id, phrase, enabled FROM blocked_keywords ORDER BY id DESC'));
    });
    app.post('/admin/keywords', admin, async (req, res) => {
        const phrase = moderationReason(req.body.phrase);
        if (Array.from(phrase).length > 100 || Array.from(normalize(phrase)).length < 2) throw fail(400, 'Use a phrase of 2–100 characters');
        const reason = moderationReason(req.body.reason);
        await auditChange(req, 'add_keyword', 'keyword', 0, reason, async tx => {
            if (await tx.get('SELECT id FROM blocked_keywords WHERE normalized = ?', [normalize(phrase)])) throw fail(409, 'This phrase already exists');
            const added = await tx.run('INSERT INTO blocked_keywords (phrase, normalized) VALUES (?, ?)', [phrase, normalize(phrase)]);
            return { auditTargetId: added.id, audit: { keywordId: added.id, phrase } };
        });
        res.status(201).json({ message: 'Keyword enabled. New event submissions and edits will be checked.' });
    });
    app.put('/admin/keywords/:id', admin, async (req, res) => {
        if (typeof req.body.enabled !== 'boolean') throw fail(400, 'Select enabled or disabled');
        await auditChange(req, 'set_keyword', 'keyword', req.params.id, moderationReason(req.body.reason), async tx => {
            const row = await tx.get('SELECT * FROM blocked_keywords WHERE id = ?', [req.params.id]);
            if (!row) throw fail(404, 'Keyword not found');
            await tx.run('UPDATE blocked_keywords SET enabled = ? WHERE id = ?', [req.body.enabled ? 1 : 0, row.id]);
            return { audit: { phrase: row.phrase, enabled: req.body.enabled } };
        });
        res.json({ message: 'Keyword rule updated.' });
    });
    app.post('/events/:id/reports', requireUser, async (req, res) => {
        const reason = moderationReason(req.body.reason);
        await db.transaction(async tx => {
            const actor = await tx.get("SELECT id FROM users WHERE id = ? AND status = 'active'", [req.user.id]);
            if (!actor) throw fail(401, 'Please sign in to continue');
            const event = await tx.get('SELECT id, title FROM events WHERE id = ?', [req.params.id]);
            if (!event) throw fail(404, 'Event not found');
            if (await tx.get("SELECT id FROM event_reports WHERE eventId = ? AND reporterId = ? AND status = 'pending'", [event.id, actor.id])) throw fail(409, 'You already have a pending report for this event');
            const recent = await tx.get("SELECT count(*) AS n FROM event_reports WHERE reporterId = ? AND createdAt >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')", [actor.id]);
            if (recent.n >= 5) throw fail(429, 'You can submit up to five reports per hour. Please try again later.');
            await tx.run('INSERT INTO event_reports (reporterId, eventId, eventTitle, reason) VALUES (?, ?, ?, ?)', [actor.id, event.id, event.title, reason]);
        });
        res.status(201).json({ message: 'Report submitted for administrator review. Your identity is not shared with the event organizer.' });
    });
    app.get('/admin/reports', admin, async (req, res) => {
        const before = req.query.before === undefined ? Number.MAX_SAFE_INTEGER : Number(req.query.before);
        if (!Number.isSafeInteger(before) || before < 1) throw fail(400, 'Invalid cursor');
        res.json(await db.all('SELECT * FROM event_reports WHERE id < ? ORDER BY id DESC LIMIT 50', [before]));
    });
    app.put('/admin/reports/:id', admin, async (req, res) => {
        if (!['resolved', 'dismissed'].includes(req.body.status)) throw fail(400, 'Choose resolved or dismissed');
        const reason = moderationReason(req.body.reason);
        await auditChange(req, 'review_report', 'report', req.params.id, reason, async tx => {
            const report = await tx.get('SELECT * FROM event_reports WHERE id = ?', [req.params.id]);
            if (!report) throw fail(404, 'Report not found');
            if (report.status !== 'pending') throw fail(409, 'Report has already been reviewed');
            await tx.run('UPDATE event_reports SET status = ?, resolution = ? WHERE id = ?', [req.body.status, reason, report.id]);
            await notify(tx, report.reporterId, report.eventId, 'report_reviewed:' + report.id, report.eventTitle, 'Report ' + req.body.status + ': ' + reason);
            return { audit: { status: req.body.status, eventId: report.eventId } };
        });
        res.json({ message: 'Report reviewed and reporter notified.' });
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
        const rule = ['Event not found', 'Attendee not found', 'Account is suspended', 'Event is cancelled', 'Already registered',
            'Event is full', 'Capacity cannot be below the registered count'].find(message => error.message.includes(message));
        if (rule) return res.status(rule.endsWith('not found') ? 404 : 409).json({ message: rule });
        if (error.message.includes('UNIQUE constraint failed: users.email')) return res.status(409).json({ message: 'Email already exists' });
        const status = error.status || 500;
        if (status >= 500) console.error(error);
        res.status(status).json({ message: status >= 500 && !error.publicMessage ? 'An unexpected server error occurred' : error.message });
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
