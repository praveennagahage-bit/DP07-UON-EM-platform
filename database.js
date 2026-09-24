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
            CREATE TRIGGER IF NOT EXISTS notify_event_cancellation
            AFTER UPDATE OF status ON events
            WHEN OLD.status = 'active' AND NEW.status = 'cancelled'
            BEGIN
                INSERT INTO notifications (userId, eventId, eventTitle, message)
                SELECT userId, NEW.id, NEW.title, NEW.cancellationReason
                FROM registrations WHERE eventId = NEW.id;
            END;`);
        return { run, get, all, close };
    } catch (error) {
        await close();
        throw error;
    }
}

module.exports = { createDatabase };
