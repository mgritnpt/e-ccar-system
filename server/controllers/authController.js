const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'eccarSuperSecretKey5555';

exports.register = async (req, res) => {
  const { username, password, name, email, position, department, bu, role } = req.body;

  if (!username || !password || !name || !email || !role) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const pool = await getPool();
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, name, email, position, department, bu, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, passwordHash, name, email, position, department, bu, role]
    );

    const token = jwt.sign(
      { id: result.insertId, username, name, email, role, bu, department },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, username, name, email, role, bu, department }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const pool = await getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, bu: user.bu, department: user.department },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        bu: user.bu,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};

exports.me = async (req, res) => {
  try {
    const pool = await getPool();
    const [users] = await pool.query(
      'SELECT id, username, name, email, position, department, bu, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ message: 'Database error occurred.' });
  }
};
