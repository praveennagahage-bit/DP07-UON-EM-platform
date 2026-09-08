const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcrypt');

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
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, role, password } = req.body;

    if (!firstName || !lastName || !email || !role || !password) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    try {
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (firstName, lastName, email, role, password)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [firstName, lastName, email, role, hashedPassword],
            function (err) {
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
            }
        );
    } catch (err) {
        console.error('Password hashing error:', err);

        return res.status(500).json({
            message: 'Error processing password'
        });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required'
        });
    }

    // Find the user by email first
    const sql = `SELECT * FROM users WHERE email = ?`;

    db.get(sql, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({
                message: 'Database error'
            });
        }

        // Do not reveal whether the email or password was incorrect
        if (!row) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        try {
            // Compare entered password with the stored bcrypt hash
            const passwordMatch = await bcrypt.compare(
                password,
                row.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

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
        } catch (err) {
            console.error('Password comparison error:', err);

            return res.status(500).json({
                message: 'Authentication error'
            });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});