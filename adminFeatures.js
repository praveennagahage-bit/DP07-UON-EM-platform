const { textError } = require('./shared/validation.mjs');
const { isFutureEvent } = require('./shared/eventTime.mjs');
const fail = (status, message) => Object.assign(new Error(message), { status });

function installAdminFeatures(app, db, { admin, eventManager, moderator }) {
    app.get('/moderation/status', eventManager, (req, res) => res.json(moderator.status));
    app.get('/admin/statistics', admin, async (req, res) => {
        const result = await db.transaction(async tx => {
            const users = await tx.all('SELECT role, status, COUNT(*) AS count FROM users GROUP BY role, status');
            const events = await tx.all('SELECT status, date, time FROM events');
            const registrations = await tx.get(`SELECT COUNT(*) AS total, COUNT(DISTINCT r.userId) AS people,
                COALESCE(SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END), 0) AS activeEventBookings
                FROM registrations r JOIN events e ON e.id = r.eventId`);
            const reports = await tx.get("SELECT COUNT(*) AS pending FROM event_reports WHERE status = 'pending'");
            const now = Date.now();
            return { users, registrations, pendingReports: reports.pending,
                events: { total: events.length, cancelled: events.filter(e => e.status === 'cancelled').length,
                    upcoming: events.filter(e => e.status === 'active' && isFutureEvent(e.date, e.time, now)).length,
                    started: events.filter(e => e.status === 'active' && !isFutureEvent(e.date, e.time, now)).length },
                generatedAt: new Date(now).toISOString() };
        });
        res.json(result);
    });
    app.get('/messages/sent', eventManager, async (req, res) => {
        res.json(await db.all('SELECT id, title, body, eventId, recipientCount, createdAt FROM sent_messages WHERE senderId = ? ORDER BY id DESC LIMIT 50', [req.user.id]));
    });
    app.post('/messages', eventManager, async (req, res) => {
        const { title, body, audience, eventId, userIds } = req.body;
        for (const [value, label, limit] of [[title, 'Subject', 100], [body, 'Message', 1000]]) {
            const error = textError(value, label, limit, true);
            if (error) throw fail(400, error);
        }
        if (!['event', 'users'].includes(audience)) throw fail(400, 'Select a valid audience');
        if (audience === 'event' && (!Number.isSafeInteger(eventId) || eventId < 1)) throw fail(400, 'Select an event');
        if (audience === 'users' && (!Array.isArray(userIds) || !userIds.length || userIds.length > 100 || userIds.some(id => !Number.isSafeInteger(id) || id < 1))) throw fail(400, 'Select between 1 and 100 valid recipients');
        const result = await db.transaction(async tx => {
            const actor = await tx.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
            if (!actor || actor.status !== 'active' || !['admin', 'organizer'].includes(actor.role)) throw fail(403, 'Messaging access required');
            let recipients;
            if (audience === 'event') {
                const event = await tx.get('SELECT * FROM events WHERE id = ?', [eventId]);
                if (!event) throw fail(404, 'Event not found');
                if (actor.role !== 'admin' && event.createdBy !== actor.id) throw fail(403, 'Only the event creator can message its attendees');
                recipients = await tx.all("SELECT u.id FROM registrations r JOIN users u ON u.id = r.userId WHERE r.eventId = ? AND u.status = 'active'", [eventId]);
            } else {
                if (actor.role !== 'admin') throw fail(403, 'Only administrators can send direct messages');
                const ids = [...new Set(userIds)];
                recipients = await tx.all("SELECT id FROM users WHERE status = 'active' AND id IN (" + ids.map(() => '?').join(',') + ')', ids);
                if (recipients.length !== ids.length) throw fail(400, 'Some recipients are unavailable. Refresh the account list.');
            }
            if (!recipients.length) throw fail(400, 'There are no active recipients for this event');
            const recent = await tx.get("SELECT COUNT(*) AS count FROM sent_messages WHERE senderId = ? AND createdAt >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 minute')", [actor.id]);
            if (recent.count >= 5) throw fail(429, 'Please wait a minute before sending more messages');
            const record = await tx.run('INSERT INTO sent_messages (senderId, title, body, eventId, recipientCount) VALUES (?, ?, ?, ?, ?)', [actor.id, title.trim(), body.trim(), audience === 'event' ? eventId : null, recipients.length]);
            for (const recipient of recipients) await tx.run('INSERT INTO notifications (userId, eventId, type, eventTitle, message) VALUES (?, ?, ?, ?, ?)',
                [recipient.id, audience === 'event' ? eventId : null, 'message:' + record.id, title.trim(), 'From: ' + actor.firstName + ' ' + actor.lastName + ' (' + actor.role + ')\n\n' + body.trim()]);
            return { message: 'Message sent to ' + recipients.length + ' recipient(s).', recipientCount: recipients.length };
        });
        res.status(201).json(result);
    });
}
module.exports = { installAdminFeatures };
