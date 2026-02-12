const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Store active sessions (in production, use Redis or database)
const sessions = new Map();

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Generate a secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify studio password and create session
router.post('/studio/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const studioPassword = process.env.STUDIO_PASSWORD;

  if (!studioPassword) {
    console.error('STUDIO_PASSWORD not configured in environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Use timing-safe comparison to prevent timing attacks
  const passwordBuffer = Buffer.from(password);
  const studioPasswordBuffer = Buffer.from(studioPassword);

  // If lengths differ, compare against same-length buffer (constant time)
  if (passwordBuffer.length !== studioPasswordBuffer.length) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const isValid = crypto.timingSafeEqual(passwordBuffer, studioPasswordBuffer);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Create session token
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_DURATION;

  sessions.set(token, {
    createdAt: Date.now(),
    expiresAt,
  });

  res.json({
    success: true,
    token,
    expiresAt,
  });
});

// Verify session token
router.post('/studio/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, message: 'Token is required' });
  }

  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ valid: false, message: 'Invalid session' });
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ valid: false, message: 'Session expired' });
  }

  res.json({ valid: true });
});

// Logout (invalidate session)
router.post('/studio/logout', (req, res) => {
  const { token } = req.body;

  if (token) {
    sessions.delete(token);
  }

  res.json({ success: true });
});

module.exports = router;
