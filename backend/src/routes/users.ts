import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

export const usersRouter = Router();

// Apply auth and require admin role
usersRouter.use(authenticateToken);
usersRouter.use(requireAdmin);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with transaction stats (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden (Admin only)
 */
usersRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.role, 
        u.created_at,
        COUNT(t.id)::INT as transaction_count,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN COALESCE(t.amount_inr, t.amount) ELSE 0 END), 0)::FLOAT as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN COALESCE(t.amount_inr, t.amount) ELSE 0 END), 0)::FLOAT as total_expense
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id
      ORDER BY u.id ASC;
    `;

    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Update a user's role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user, read-only]
 *     responses:
 *       200:
 *         description: User role updated
 */
usersRouter.patch('/:id/role', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id as string, 10);
    const { role } = req.body;

    if (!['admin', 'user', 'read-only'].includes(role)) {
      res.status(400).json({ error: "Role must be 'admin', 'user', or 'read-only'." });
      return;
    }

    const result = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ message: 'User role updated successfully', user: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});
