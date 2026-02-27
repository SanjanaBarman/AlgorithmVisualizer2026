const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const initializeDatabase = require('./database');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let db;

// Initialize database and start server
initializeDatabase().then(database => {
    db = database;
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});

// -------------------- REGISTER ENDPOINT --------------------
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required' 
            });
        }

        // Username validation
        if (username.length < 3) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username must be at least 3 characters' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please enter a valid email address' 
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username or email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        console.log(`✅ New user registered: ${username} (${email})`);

        res.status(201).json({ 
            success: true, 
            message: 'Account created successfully! You can now log in.' 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error. Please try again.' 
        });
    }
});

// -------------------- LOGIN ENDPOINT --------------------
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password are required' 
            });
        }

        // Find user by username or email
        const user = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        // Update last login
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            user.id
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        console.log(`✅ User logged in: ${user.username}`);

        res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            user: userWithoutPassword 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error. Please try again.' 
        });
    }
});

// -------------------- GET ALL USERS (for testing) --------------------
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.all('SELECT id, username, email, created_at, last_login FROM users');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes should come before this
// ... (your API endpoints)

// For any non-API route, check if file exists, otherwise serve index.html
app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const filePath = path.join(__dirname, '../frontend', req.path);
    
    // Check if the requested file exists
    if (req.path === '/main.html' || req.path === '/index.html' || req.path === '/') {
        // Serve the requested HTML file
        if (req.path === '/') {
            res.sendFile(path.join(__dirname, '../frontend/index.html'));
        } else {
            res.sendFile(path.join(__dirname, '../frontend', req.path));
        }
    } else {
        // For any other route, try to serve the file, fallback to index.html
        res.sendFile(filePath, (err) => {
            if (err) {
                res.sendFile(path.join(__dirname, '../frontend/index.html'));
            }
        });
    }
});

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes should come before this
// ... (your API endpoints)

// For any non-API route, serve the appropriate file
app.get('*', (req, res) => {
    // Don't interfere with API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Always serve index.html for root path
    if (req.path === '/' || req.path === '/index.html') {
        return res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
    
    // For other files, try to serve them
    const filePath = path.join(__dirname, '../frontend', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            // If file not found, serve index.html
            res.sendFile(path.join(__dirname, '../frontend/index.html'));
        }
    });
});