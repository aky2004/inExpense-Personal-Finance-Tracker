import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { cacheService, CACHE_TTL } from '../services/redis.js';

export const categoriesRouter = Router();

const CATEGORIES_CACHE_KEY = 'categories:all';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Retrieve list of categories (Cached in Redis for 1 hour)
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of transaction categories
 */
categoriesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    // 1. Check Redis cache
    const cachedCategories = await cacheService.get<any[]>(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      res.json({ source: 'cache', data: cachedCategories });
      return;
    }

    // 2. Fetch from PostgreSQL
    const result = await query(
      'SELECT id, name, type, color, icon FROM categories ORDER BY name ASC'
    );

    // 3. Store in Redis cache for 1 hour (3600 seconds)
    await cacheService.set(CATEGORIES_CACHE_KEY, result.rows, CACHE_TTL.CATEGORIES);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.json({ source: 'database', data: result.rows });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       403:
 *         description: Forbidden (Admin only)
 */
categoriesRouter.post(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, type, color = '#6366f1', icon = 'Tag' } = req.body;

      if (!name || !type) {
        res.status(400).json({ error: 'Name and type (income/expense) are required.' });
        return;
      }

      if (!['income', 'expense'].includes(type)) {
        res.status(400).json({ error: 'Type must be either "income" or "expense".' });
        return;
      }

      const result = await query(
        `INSERT INTO categories (name, type, color, icon)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, type, color, icon`,
        [name.trim(), type, color, icon]
      );

      // Invalidate category cache on data update
      await cacheService.invalidateCategories();

      res.status(201).json({
        message: 'Category created successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'A category with this name already exists.' });
        return;
      }
      res.status(500).json({ error: 'Failed to create category.' });
    }
  }
);
