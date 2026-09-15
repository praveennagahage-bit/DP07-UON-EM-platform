const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Always use users.db in the same folder as this file
const dbPath = path.join(__dirname, 'users.db');

// Create or open the database file
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create database tables
db.serialize(() => {

    // Create users table
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

    // Create events table
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            location TEXT NOT NULL,
            category TEXT,
            capacity INTEGER DEFAULT 0,
            createdBy INTEGER,
            FOREIGN KEY (createdBy) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Failed to create events table:', err.message);
        } else {
            console.log('Events table is ready.');
        }
    });

});

module.exports = db;