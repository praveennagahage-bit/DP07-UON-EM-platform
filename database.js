const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function createDatabase(filename = process.env.DB_PATH || path.join(__dirname, 'users.db')) {
    const db = await new Promise((resolve, reject) => {
        const connection = new sqlite3.Database(filename, err => err ? reject(err) : resolve(connection));
    });
    const run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
    const get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
    const all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
    const exec = sql => new Promise((resolve, reject) => db.exec(sql, err => err ? reject(err) : resolve()));
    const close = () => new Promise((resolve, reject) => db.close(err => err ? reject(err) : resolve()));
    try {
        await exec(`PRAGMA foreign_keys = ON;
            PRAGMA busy_timeout = 5000;
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT, lastName TEXT, email TEXT UNIQUE, role TEXT, password TEXT
            );
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL, description TEXT, date TEXT NOT NULL,
                time TEXT NOT NULL, location TEXT NOT NULL, category TEXT,
                capacity INTEGER DEFAULT 0, createdBy INTEGER,
                FOREIGN KEY (createdBy) REFERENCES users(id)
            );`);
        // Additive migration: preserve existing users and events.
        const columns = await all('PRAGMA table_info(events)');
        if (!columns.some(column => column.name === 'status')) {
            await run("ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
        }
        if (!columns.some(column => column.name === 'cancellationReason')) {
            await run("ALTER TABLE events ADD COLUMN cancellationReason TEXT NOT NULL DEFAULT ''");
        }
        if (!columns.some(column => column.name === 'image')) {
            await run('ALTER TABLE events ADD COLUMN image BLOB');
        }
        await exec(`CREATE TABLE IF NOT EXISTS sessions (
                tokenHash TEXT PRIMARY KEY,
                userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expiresAt INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expiresAt);
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                eventId INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(userId, eventId)
            );
            CREATE INDEX IF NOT EXISTS registrations_event ON registrations(eventId);
            -- Enforce capacity inside the write, including simultaneous requests.
            CREATE TRIGGER IF NOT EXISTS registration_rules
            BEFORE INSERT ON registrations BEGIN
                SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM events WHERE id = NEW.eventId)
                    THEN RAISE(ABORT, 'Event not found') END;
                SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.userId AND role = 'attendee')
                    THEN RAISE(ABORT, 'Attendee not found') END;
                SELECT CASE WHEN (SELECT status FROM events WHERE id = NEW.eventId) != 'active'
                    THEN RAISE(ABORT, 'Event is cancelled') END;
                SELECT CASE WHEN EXISTS (SELECT 1 FROM registrations WHERE eventId = NEW.eventId AND userId = NEW.userId)
                    THEN RAISE(ABORT, 'Already registered') END;
                SELECT CASE WHEN (SELECT COUNT(*) FROM registrations WHERE eventId = NEW.eventId)
                    >= (SELECT capacity FROM events WHERE id = NEW.eventId)
                    THEN RAISE(ABORT, 'Event is full') END;
            END;
            CREATE TRIGGER IF NOT EXISTS event_capacity_rules
            BEFORE UPDATE OF capacity ON events
            WHEN NEW.capacity < (SELECT COUNT(*) FROM registrations WHERE eventId = NEW.id)
            BEGIN SELECT RAISE(ABORT, 'Capacity cannot be below the registered count'); END;`);
        if (!columns.some(column => column.name === 'cancellationVersion')) await run('ALTER TABLE events ADD COLUMN cancellationVersion INTEGER NOT NULL DEFAULT 0');
        // A cancellation and its notifications are one atomic SQLite statement.
        await exec(`CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                eventId INTEGER REFERENCES events(id) ON DELETE SET NULL,
                type TEXT NOT NULL DEFAULT 'event_cancelled',
                eventTitle TEXT NOT NULL,
                message TEXT NOT NULL,
                isRead INTEGER NOT NULL DEFAULT 0 CHECK (isRead IN (0, 1)),
                createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                UNIQUE(userId, eventId, type)
            );
            CREATE INDEX IF NOT EXISTS notifications_user ON notifications(userId, isRead, id);
            DROP TRIGGER IF EXISTS notify_event_cancellation;
            CREATE TRIGGER notify_event_cancellation
            AFTER UPDATE OF status ON events
            WHEN OLD.status = 'active' AND NEW.status = 'cancelled'
            BEGIN
                INSERT INTO notifications (userId, eventId, type, eventTitle, message)
                SELECT userId, NEW.id, CASE WHEN NEW.cancellationVersion = 0 THEN 'event_cancelled' ELSE 'event_cancelled:' || NEW.cancellationVersion END, NEW.title, NEW.cancellationReason
                FROM registrations WHERE eventId = NEW.id;
            END;`);
        const userColumns = await all('PRAGMA table_info(users)');
        for (const [name, definition] of [['status', "TEXT NOT NULL DEFAULT 'active'"], ['banReason', "TEXT NOT NULL DEFAULT ''"], ['bio', "TEXT NOT NULL DEFAULT ''"]]) {
            if (!userColumns.some(column => column.name === name)) await run('ALTER TABLE users ADD COLUMN ' + name + ' ' + definition);
        }
        await exec(`CREATE TABLE IF NOT EXISTS admin_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actorId INTEGER NOT NULL REFERENCES users(id),
            action TEXT NOT NULL, targetType TEXT NOT NULL, targetId INTEGER NOT NULL,
            reason TEXT NOT NULL, details TEXT NOT NULL DEFAULT '',
            createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TRIGGER IF NOT EXISTS revoke_banned_sessions AFTER UPDATE OF status ON users
        WHEN NEW.status = 'banned' BEGIN DELETE FROM sessions WHERE userId = NEW.id; END;
        CREATE TRIGGER IF NOT EXISTS reject_banned_session BEFORE INSERT ON sessions
        WHEN (SELECT status FROM users WHERE id = NEW.userId) != 'active'
        BEGIN SELECT RAISE(ABORT, 'Account is suspended'); END;
        CREATE TRIGGER IF NOT EXISTS reject_banned_registration BEFORE INSERT ON registrations
        WHEN (SELECT status FROM users WHERE id = NEW.userId) = 'banned'
        BEGIN SELECT RAISE(ABORT, 'Account is suspended'); END;`);
        await exec(`CREATE TABLE IF NOT EXISTS blocked_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT, phrase TEXT NOT NULL, normalized TEXT NOT NULL UNIQUE,
            enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1))
        );
        CREATE TABLE IF NOT EXISTS event_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporterId INTEGER NOT NULL REFERENCES users(id),
            eventId INTEGER REFERENCES events(id) ON DELETE SET NULL,
            eventTitle TEXT NOT NULL, reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','resolved','dismissed')),
            resolution TEXT NOT NULL DEFAULT '',
            createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS one_pending_report ON event_reports(reporterId,eventId) WHERE status = 'pending';`);
        await exec(`CREATE TABLE IF NOT EXISTS sent_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            senderId INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL, body TEXT NOT NULL,
            eventId INTEGER REFERENCES events(id) ON DELETE SET NULL,
            recipientCount INTEGER NOT NULL,
            createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE INDEX IF NOT EXISTS messages_sender ON sent_messages(senderId, createdAt);`);
        // Serialize access to this connection: transactions must not include another
        // request's writes or expose partially updated data to concurrent readers.
        let queue = Promise.resolve();
        const enqueue = work => {
            const result = queue.then(work);
            queue = result.catch(() => {});
            return result;
        };
        const transaction = work => enqueue(async () => {
            await run('BEGIN IMMEDIATE');
            try { const result = await work({ run, get, all }); await run('COMMIT'); return result; }
            catch (error) { await run('ROLLBACK'); throw error; }
        });
        return { run: (...args) => enqueue(() => run(...args)), get: (...args) => enqueue(() => get(...args)),
            all: (...args) => enqueue(() => all(...args)), close: () => enqueue(close), transaction };
    } catch (error) {
        await close();
        throw error;
    }
}

module.exports = { createDatabase };
