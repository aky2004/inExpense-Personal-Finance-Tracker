import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyticsLimiter } from '../middleware/rateLimiter.js';
import { cacheService, CACHE_TTL } from '../services/redis.js';

export const analyticsRouter = Router();

// Apply authentication to all analytics endpoints
analyticsRouter.use(authenticateToken);
// Apply analytics rate limiter (50 req / hour)
analyticsRouter.use(analyticsLimiter);

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Overall financial statistics (Income, Expense, Balance, Savings Rate). Cached for 15 mins.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Overview stats
 */
analyticsRouter.get('/overview', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const userId = req.user!.id;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : null;

    const cacheKey = `analytics:user:${userId}:overview:${year}:${month || 'all'}`;

    // 1. Check Redis cache (15 min TTL)
    const cachedData = await cacheService.get<any>(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      res.json({ source: 'cache', data: cachedData });
      return;
    }

    // 2. Query Postgres
    const conditions = ['user_id = $1'];
    const params: any[] = [userId];

    if (year) {
      params.push(year);
      conditions.push(`EXTRACT(YEAR FROM date) = $${params.length}`);
    }

    if (month) {
      params.push(month);
      conditions.push(`EXTRACT(MONTH FROM date) = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN COALESCE(amount_inr, amount) ELSE 0 END), 0)::FLOAT as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN COALESCE(amount_inr, amount) ELSE 0 END), 0)::FLOAT as total_expense,
        COUNT(*)::INT as transaction_count
      FROM transactions
      ${whereClause};
    `;

    const result = await query(sql, params);
    const row = result.rows[0];
    const totalIncome = row.total_income;
    const totalExpense = row.total_expense;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(2) : '0.00';

    const overview = {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: parseFloat(savingsRate),
      transactionCount: row.transaction_count,
      year,
      month,
    };

    // 3. Cache in Redis for 15 minutes
    await cacheService.set(cacheKey, overview, CACHE_TTL.ANALYTICS);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.json({ source: 'database', data: overview });
  } catch (error: any) {
    console.error('Error in analytics overview:', error);
    res.status(500).json({ error: 'Failed to calculate analytics overview' });
  }
});

/**
 * @swagger
 * /api/analytics/category-breakdown:
 *   get:
 *     summary: Expenses grouped by category (for Pie chart). Cached for 15 mins.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category distribution
 */
analyticsRouter.get('/category-breakdown', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const userId = req.user!.id;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : null;

    const cacheKey = `analytics:user:${userId}:category-breakdown:${year}:${month || 'all'}`;

    // 1. Check Redis cache
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      res.json({ source: 'cache', data: cached });
      return;
    }

    // 2. Query Postgres
    const conditions = ["t.user_id = $1", "t.type = 'expense'"];
    const params: any[] = [userId];

    if (year) {
      params.push(year);
      conditions.push(`EXTRACT(YEAR FROM t.date) = $${params.length}`);
    }

    if (month) {
      params.push(month);
      conditions.push(`EXTRACT(MONTH FROM t.date) = $${params.length}`);
    }

    const sql = `
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category_name,
        COALESCE(c.color, '#94a3b8') as color,
        COALESCE(c.icon, 'Tag') as icon,
        SUM(COALESCE(t.amount_inr, t.amount))::FLOAT as total_amount,
        COUNT(t.id)::INT as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.name, c.color, c.icon
      ORDER BY total_amount DESC;
    `;

    const result = await query(sql, params);

    // 3. Cache in Redis for 15 mins
    await cacheService.set(cacheKey, result.rows, CACHE_TTL.ANALYTICS);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.json({ source: 'database', data: result.rows });
  } catch (error: any) {
    console.error('Error fetching category breakdown:', error);
    res.status(500).json({ error: 'Failed to compute category breakdown' });
  }
});

/**
 * @swagger
 * /api/analytics/monthly-trends:
 *   get:
 *     summary: Monthly income vs expense trends for Line and Bar charts. Cached for 15 mins.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *         default: 6
 *     responses:
 *       200:
 *         description: Monthly trend history
 */
analyticsRouter.get('/monthly-trends', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const userId = req.user!.id;
    const months = parseInt(req.query.months as string, 10) || 6;

    const cacheKey = `analytics:user:${userId}:monthly-trends:${months}`;

    // 1. Check Redis cache
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      res.json({ source: 'cache', data: cached });
      return;
    }

    // 2. Query Postgres aggregated by month
    const sql = `
      WITH month_series AS (
        SELECT TO_CHAR(d, 'YYYY-MM') as month_str,
               TO_CHAR(d, 'Mon YYYY') as display_name,
               d as month_date
        FROM GENERATE_SERIES(
          DATE_TRUNC('month', CURRENT_DATE) - ($2::INT - 1 || ' months')::INTERVAL,
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::INTERVAL
        ) d
      )
      SELECT 
        m.month_str,
        m.display_name,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN COALESCE(t.amount_inr, t.amount) ELSE 0 END), 0)::FLOAT as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN COALESCE(t.amount_inr, t.amount) ELSE 0 END), 0)::FLOAT as expense,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN COALESCE(t.amount_inr, t.amount) ELSE -COALESCE(t.amount_inr, t.amount) END), 0)::FLOAT as net
      FROM month_series m
      LEFT JOIN transactions t 
        ON TO_CHAR(t.date, 'YYYY-MM') = m.month_str 
        AND t.user_id = $1
      GROUP BY m.month_str, m.display_name, m.month_date
      ORDER BY m.month_date ASC;
    `;

    const result = await query(sql, [userId, months]);

    // 3. Cache in Redis for 15 mins
    await cacheService.set(cacheKey, result.rows, CACHE_TTL.ANALYTICS);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.json({ source: 'database', data: result.rows });
  } catch (error: any) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ error: 'Failed to retrieve monthly trends' });
  }
});
