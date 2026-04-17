const sqlite3 = require('sqlite3').verbose();

// Create or open the database file
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create users table if it does not exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT,
            lastName TEXT,
            email TEXT UNIQUE,
            role TEXT,
            password TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Failed to create users table:', err.message);
        } else {
            console.log('Users table is ready.');
        }
    });
});

module.exports = db;