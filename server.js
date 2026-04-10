const express = require('express');
const db = require('./database');
const app = express();
const PORT = 3000;

// Parse JSON request body
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Register route
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;

    db.run(sql, [username, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({
                    message: 'Username already exists'
                });
            }

            return res.status(500).json({
                message: 'Error saving user'
            });
        }

        res.json({
            message: 'User registered successfully',
            userId: this.lastID
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;

    db.get(sql, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({
                message: 'Database error'
            });
        }

        if (row) {
            res.json({
                message: 'Login successful',
                user: {
                    id: row.id,
                    username: row.username
                }
            });
        } else {
            res.status(401).json({
                message: 'Invalid username or password'
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});