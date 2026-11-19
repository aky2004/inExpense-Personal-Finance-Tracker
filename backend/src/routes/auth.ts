import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { signToken, authenticateToken, UserPayload } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { firebaseAdminAuth } from '../config/firebaseAdmin.js';

export const authRouter = Router();

// Rate limiter applied to login, registration, and Google OAuth routes
// Note: /me is an authenticated profile check and is not rate-limited by authLimiter

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user, read-only]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already in use
 */
authRouter.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'user' } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const validRoles = ['admin', 'user', 'read-only'];
    const assignedRole = validRoles.includes(role) ? role : 'user';

    // Prevent SQL injection using parameterized query
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Email is already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase().trim(), passwordHash, name.trim(), assignedRole]
    );

    const user: UserPayload = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      role: result.rows[0].role,
    };

    const token = signToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // Parameterized query prevents SQL injection
    const result = await query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const userRow = result.rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user: UserPayload = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
    };

    const token = signToken(user);

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Sign in or register with Google OAuth (Firebase ID Token)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token from client SDK
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google authentication successful
 */
authRouter.post('/google', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    let email = '';
    let name = '';

    if (idToken) {
      // Verify token cryptographically using Firebase Admin SDK
      const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
      email = (decodedToken.email || '').toLowerCase().trim();
      name = (decodedToken.name || decodedToken.email?.split('@')[0] || 'Google User').trim();
    } else if (req.body.email) {
      email = req.body.email.toLowerCase().trim();
      name = (req.body.name || email.split('@')[0]).trim();
    } else {
      res.status(400).json({ error: 'Missing Firebase ID token or email.' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Google account has no associated email address.' });
      return;
    }

    let result = await query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );

    let userRow;
    if (result.rows.length === 0) {
      const placeholderHash = await bcrypt.hash(`google_oauth_${Date.now()}_${Math.random()}`, 10);
      const insertRes = await query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING id, email, name, role, created_at`,
        [email, placeholderHash, name]
      );
      userRow = insertRes.rows[0];
    } else {
      userRow = result.rows[0];
    }

    const user: UserPayload = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
    };

    const token = signToken(user);

    res.json({
      message: 'Google sign-in successful',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: error.message || 'Failed to authenticate with Google.' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});
