const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Register route
app.post('/register', (req, res) => {
    const { firstName, lastName, email, role, password } = req.body;

    if (!firstName || !lastName || !email || !role || !password) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    const sql = `
        INSERT INTO users (firstName, lastName, email, role, password)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(sql, [firstName, lastName, email, role, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({
                    message: 'Email already exists'
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
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required'
        });
    }

    const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;

    db.get(sql, [email, password], (err, row) => {
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
                    firstName: row.firstName,
                    lastName: row.lastName,
                    email: row.email,
                    role: row.role
                }
            });
        } else {
            res.status(401).json({
                message: 'Invalid email or password'
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});