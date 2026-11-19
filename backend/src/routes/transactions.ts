import { Router, Request, Response } from 'express';
import { query, pool } from '../db/pool.js';
import { authenticateToken, requireCanMutate } from '../middleware/auth.js';
import { transactionLimiter } from '../middleware/rateLimiter.js';
import { cacheService } from '../services/redis.js';
import { convertToINR } from '../utils/currency.js';

export const transactionsRouter = Router();

// Apply auth to all transaction routes
transactionsRouter.use(authenticateToken);
// Apply transaction rate limiter (100 req / hour)
transactionsRouter.use(transactionLimiter);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get list of transactions (accessible to all roles, filtered by user unless admin)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 15
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount]
 *         default: date
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         default: DESC
 *     responses:
 *       200:
 *         description: Paginated transaction list
 */
transactionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      page = 1,
      limit = 15,
      type,
      categoryId,
      search,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'DESC',
      userId, // Admin can query a specific user's transactions
      account,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit as string, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    // Build parameterized query securely (preventing SQL injection)
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // RBAC: Standard user & read-only user can ONLY view their own transactions
    if (user.role !== 'admin') {
      conditions.push(`t.user_id = $${paramIndex++}`);
      values.push(user.id);
    } else if (userId) {
      conditions.push(`t.user_id = $${paramIndex++}`);
      values.push(parseInt(userId as string, 10));
    }

    if (type && ['income', 'expense', 'transfer'].includes(type as string)) {
      conditions.push(`t.type = $${paramIndex++}`);
      values.push(type);
    }

    if (account && typeof account === 'string') {
      conditions.push(`t.account = $${paramIndex++}`);
      values.push(account);
    }

    if (categoryId) {
      conditions.push(`t.category_id = $${paramIndex++}`);
      values.push(parseInt(categoryId as string, 10));
    }

    if (startDate) {
      conditions.push(`t.date >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.date <= $${paramIndex++}`);
      values.push(endDate);
    }

    if (search && typeof search === 'string') {
      conditions.push(`(t.description ILIKE $${paramIndex} OR t.payee ILIKE $${paramIndex} OR t.note ILIKE $${paramIndex++})`);
      values.push(`%${search.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column and order against allowed whitelists
    const validSortCols: Record<string, string> = { date: 't.date', amount: 't.amount' };
    const sortCol = validSortCols[sortBy as string] || 't.date';
    const orderDirection = (sortOrder as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query for total pagination
    const countSql = `SELECT COUNT(*) FROM transactions t ${whereClause};`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query joining categories and users
    const dataSql = `
      SELECT 
        t.id,
        t.user_id,
        u.name as user_name,
        u.email as user_email,
        t.category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        t.type,
        t.amount::FLOAT,
        COALESCE(t.currency, 'INR') as currency,
        COALESCE(t.exchange_rate, 1.0)::FLOAT as exchange_rate,
        COALESCE(t.amount_inr, t.amount)::FLOAT as amount_inr,
        TO_CHAR(t.date, 'YYYY-MM-DD') as date,
        t.description,
        t.account,
        t.to_account,
        t.payee,
        t.tags,
        t.payment_type,
        t.note,
        t.external_url,
        t.external_ref,
        t.location,
        t.exclude_from_stats,
        t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY ${sortCol} ${orderDirection}, t.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const dataValues = [...values, limitNum, offset];
    const dataResult = await query(dataSql, dataValues);

    res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * @swagger
 * /api/transactions/imports:
 *   get:
 *     summary: Get history and audit log of previous CSV imports
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of previous import batches
 */
transactionsRouter.get(
  '/imports',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const result = await query(
        `SELECT id, batch_id, filename, total_records, inflow_amount::FLOAT, outflow_amount::FLOAT,
                net_amount::FLOAT, account, status, created_at
         FROM import_batches
         WHERE user_id = $1
         ORDER BY created_at DESC;`,
        [user.id]
      );
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (err) {
      console.error('Error fetching import history:', err);
      res.status(500).json({ error: 'Failed to fetch import history' });
    }
  }
);

/**
 * @swagger
 * /api/transactions/imports/{batchId}:
 *   delete:
 *     summary: Rollback and delete a previous CSV import batch
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch rolled back successfully
 *       403:
 *         description: Forbidden for read-only users
 */
transactionsRouter.delete(
  '/imports/:batchId',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();
    try {
      const user = req.user!;
      const { batchId } = req.params;

      await client.query('BEGIN');

      const delTxRes = await client.query(
        `DELETE FROM transactions WHERE batch_id = $1 AND user_id = $2 RETURNING id;`,
        [batchId, user.id]
      );

      await client.query(
        `DELETE FROM import_batches WHERE batch_id = $1 AND user_id = $2;`,
        [batchId, user.id]
      );

      await client.query('COMMIT');

      // Invalidate Redis analytics cache atomically
      await cacheService.invalidateUserAnalytics(user.id);

      res.json({
        success: true,
        message: `Rolled back import batch ${batchId}. Removed ${delTxRes.rowCount} transactions.`,
        deletedCount: delTxRes.rowCount,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error rolling back import batch:', err);
      res.status(500).json({ error: 'Failed to rollback import batch' });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/transactions/import:
 *   post:
 *     summary: Bulk import transactions from CSV / JSON dataset
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactions
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *               filename:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transactions imported successfully
 *       400:
 *         description: Invalid payload or empty list
 *       403:
 *         description: Forbidden for read-only users
 */
// Robust ISO Date Normalizer (handles DD-MM-YYYY, DD/MM/YYYY, DD-Mon-YYYY, ISO, timestamps)
function normalizeDateToISO(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  let str = String(rawDate).trim();
  if (!str) return new Date().toISOString().split('T')[0];

  // Strip timestamp part if present (e.g., "16-10-2026 14:30:22" or "2026-10-16T14:30:00")
  if (str.includes('T')) {
    str = str.split('T')[0].trim();
  } else if (str.includes(' ')) {
    const parts = str.split(' ');
    if (parts[0].includes('-') || parts[0].includes('/') || parts[0].includes('.')) {
      str = parts[0].trim();
    }
  }

  // Already standard ISO: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Format: YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const sepMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (sepMatch) {
    let [, p1, p2, p3] = sepMatch;
    let year = parseInt(p3, 10);
    if (year < 100) year += 2000;
    const num1 = parseInt(p1, 10);
    const num2 = parseInt(p2, 10);

    let day = num1;
    let month = num2;

    // Invert if month > 12 (must be MM-DD-YYYY)
    if (month > 12 && day <= 12) {
      day = num2;
      month = num1;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Format: DD-Mon-YYYY (e.g., 16-Oct-2026 or 16-OCT-26)
  const monMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const monMatch = str.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{2,4})$/);
  if (monMatch) {
    let [, d, monStr, y] = monMatch;
    const m = monMap[monStr.toLowerCase().substring(0, 3)];
    if (m) {
      let year = parseInt(y, 10);
      if (year < 100) year += 2000;
      return `${year}-${m}-${d.padStart(2, '0')}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

transactionsRouter.post(
  '/import',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();
    try {
      const { transactions, user_id, filename = 'bank_statement.csv' } = req.body;
      if (!Array.isArray(transactions) || transactions.length === 0) {
        res.status(400).json({ error: 'transactions must be a non-empty array' });
        return;
      }

      if (transactions.length > 2000) {
        res.status(400).json({ error: 'Maximum 2,000 transactions can be imported in a single batch.' });
        return;
      }

      const targetUserId = (req.user!.role === 'admin' && user_id) ? user_id : req.user!.id;
      const batchId = 'IMP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

      // Pre-load all categories for name-based lookup
      const catResult = await query('SELECT id, LOWER(name) as name, type FROM categories');
      const categoryMap = new Map<string, number>();
      for (const cat of catResult.rows) {
        categoryMap.set(cat.name, cat.id);
      }

      await client.query('BEGIN');

      let insertedCount = 0;
      let batchInflow = 0;
      let batchOutflow = 0;
      let primaryAccount = 'Main Checking';
      const sampleRows: any[] = [];

      for (const item of transactions) {
        const rawAmount = parseFloat(item.amount);
        if (isNaN(rawAmount) || rawAmount === 0) continue;

        const absAmount = Math.abs(rawAmount);

        const desc = (item.description || item.payee || item.details || item.narration || 'Imported Transaction').trim();
        const descLower = desc.toLowerCase();

        // Determine transaction type
        let txType = item.type ? String(item.type).toLowerCase().trim() : '';
        if (!['income', 'expense', 'transfer'].includes(txType)) {
          const incomeKws = ['received', 'refund', 'cashback', 'salary', 'credit', 'interest', 'dividend', 'deposit', 'added to wallet', 'reversal', 'inward', 'bonus', 'cr'];
          const expenseKws = ['paid to', 'payment to', 'purchase', 'spent', 'debited', 'recharge', 'bill', 'sent to', 'transferred to', 'withdrawn', 'fee', 'charge', 'dr'];

          if (incomeKws.some(kw => descLower.includes(kw))) {
            txType = 'income';
          } else if (expenseKws.some(kw => descLower.includes(kw))) {
            txType = 'expense';
          } else {
            txType = rawAmount < 0 ? 'expense' : 'expense';
          }
        }

        // Determine date robustly
        const rawDate = normalizeDateToISO(item.date);

        // Resolve category_id
        let categoryId: number | null = null;
        if (item.category_id && !isNaN(parseInt(item.category_id, 10))) {
          categoryId = parseInt(item.category_id, 10);
        } else if (item.category_name || item.category) {
          const catName = String(item.category_name || item.category).toLowerCase().trim();
          categoryId = categoryMap.get(catName) || null;
          if (!categoryId) {
            for (const [key, val] of categoryMap.entries()) {
              if (catName.includes(key) || key.includes(catName)) {
                categoryId = val;
                break;
              }
            }
          }
        }

        const { currency: finalCurrency, exchangeRate, amountINR } = convertToINR(absAmount, item.currency || 'INR');
        let account = (item.account || 'Main Checking').trim();
        // If account is just a number (e.g., from an improperly mapped balance column like "3003.12")
        if (/^[\d.,]+$/.test(account) || !account) {
          account = filename.toLowerCase().includes('mobikwik') || filename.toLowerCase().includes('wallet')
            ? 'Cash & UPI Wallet'
            : 'HDFC Salary Account';
        }
        primaryAccount = account;
        const payee = item.payee ? String(item.payee).trim() : null;
        const paymentType = item.payment_type || item.paymentType || 'Credit card';
        const note = item.note ? String(item.note).trim() : `Batch ${batchId}`;

        if (txType === 'income') {
          batchInflow += amountINR;
        } else {
          batchOutflow += amountINR;
        }

        const insertRes = await client.query(
          `INSERT INTO transactions (
            user_id, category_id, type, amount, currency, exchange_rate, amount_inr,
            date, description, account, payee, payment_type, note, exclude_from_stats, batch_id
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id, type, amount::FLOAT, date, description, batch_id;`,
          [
            targetUserId,
            categoryId,
            txType,
            absAmount,
            finalCurrency,
            exchangeRate,
            amountINR,
            rawDate,
            desc,
            account,
            payee,
            paymentType,
            note,
            false,
            batchId,
          ]
        );

        if (insertRes.rows.length > 0) {
          insertedCount++;
          if (sampleRows.length < 5) {
            sampleRows.push(insertRes.rows[0]);
          }
        }
      }

      // Record this batch in import_batches table
      await client.query(
        `INSERT INTO import_batches (
          batch_id, user_id, filename, total_records, inflow_amount, outflow_amount, net_amount, account, status
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SETTLED');`,
        [
          batchId,
          targetUserId,
          filename,
          insertedCount,
          batchInflow,
          batchOutflow,
          batchInflow - batchOutflow,
          primaryAccount,
        ]
      );

      await client.query('COMMIT');

      // Invalidate Redis analytics cache atomically
      await cacheService.invalidateUserAnalytics(targetUserId);

      res.status(201).json({
        success: true,
        message: `Successfully imported ${insertedCount} transactions.`,
        count: insertedCount,
        batchId,
        inflow: batchInflow,
        outflow: batchOutflow,
        net: batchInflow - batchOutflow,
        sample: sampleRows,
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error during batch transaction import:', err);
      res.status(500).json({
        error: `Failed to import transactions. Database transaction rolled back: ${err.message || 'Validation error'}`
      });
    } finally {
      client.release();
    }
  }
);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction (Restricted to admin and user roles)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               category_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 *       403:
 *         description: Forbidden for read-only users
 */
transactionsRouter.post(
  '/',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        type,
        amount,
        currency = 'INR',
        date,
        category_id,
        description,
        user_id,
        account = 'Main Checking',
        to_account,
        payee,
        tags = [],
        payment_type = 'Credit card',
        note,
        external_url,
        external_ref,
        location,
        exclude_from_stats = false,
      } = req.body;

      if (!type || !amount || !date) {
        res.status(400).json({ error: 'Type, amount, and date are required.' });
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number.' });
        return;
      }

      if (!['income', 'expense', 'transfer'].includes(type)) {
        res.status(400).json({ error: 'Type must be "income", "expense", or "transfer".' });
        return;
      }

      // Compute multi-currency conversion to base INR
      const { currency: finalCurrency, exchangeRate, amountINR } = convertToINR(parsedAmount, currency);

      // If admin specified user_id, use it, else default to current user's id
      const targetUserId = (req.user!.role === 'admin' && user_id) ? user_id : req.user!.id;
      const normalizedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? [tags] : []);
      const finalDesc = description ? description.trim() : (payee ? payee.trim() : (type === 'transfer' ? `Transfer to ${to_account || 'Account'}` : ''));

      const result = await query(
        `INSERT INTO transactions (
          user_id, category_id, type, amount, currency, exchange_rate, amount_inr,
          date, description, account, to_account, payee, tags, payment_type, note,
          external_url, external_ref, location, exclude_from_stats
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         RETURNING 
          id, user_id, category_id, type, amount::FLOAT, currency, exchange_rate::FLOAT, amount_inr::FLOAT,
          TO_CHAR(date, 'YYYY-MM-DD') as date, description,
          account, to_account, payee, tags, payment_type, note,
          external_url, external_ref, location, exclude_from_stats, created_at;`,
        [
          targetUserId,
          category_id || null,
          type,
          parsedAmount,
          finalCurrency,
          exchangeRate,
          amountINR,
          date,
          finalDesc,
          account || 'Main Checking',
          to_account || null,
          payee ? payee.trim() : null,
          normalizedTags,
          payment_type || 'Credit card',
          note ? note.trim() : null,
          external_url ? external_url.trim() : null,
          external_ref ? external_ref.trim() : null,
          location ? location.trim() : null,
          !!exclude_from_stats,
        ]
      );

      // Invalidate Redis analytics cache for this user
      await cacheService.invalidateUserAnalytics(targetUserId);

      res.status(201).json({
        message: 'Transaction created successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update an existing transaction (Restricted to admin and user roles)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction updated
 *       403:
 *         description: Forbidden for read-only users or modifying another user's record
 */
transactionsRouter.put(
  '/:id',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const transactionId = parseInt(req.params.id as string, 10);
      const {
        type,
        amount,
        currency,
        date,
        category_id,
        description,
        account = 'Main Checking',
        to_account,
        payee,
        tags = [],
        payment_type = 'Credit card',
        note,
        external_url,
        external_ref,
        location,
        exclude_from_stats = false,
      } = req.body;

      // Check transaction existence and ownership
      const existing = await query('SELECT user_id, currency, amount FROM transactions WHERE id = $1', [transactionId]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }

      const txOwnerId = existing.rows[0].user_id;
      if (req.user!.role !== 'admin' && txOwnerId !== req.user!.id) {
        res.status(403).json({ error: 'You do not have permission to edit this transaction.' });
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number.' });
        return;
      }

      if (!['income', 'expense', 'transfer'].includes(type)) {
        res.status(400).json({ error: 'Type must be "income", "expense", or "transfer".' });
        return;
      }

      const txCurrency = currency || existing.rows[0].currency || 'INR';
      const { currency: finalCurrency, exchangeRate, amountINR } = convertToINR(parsedAmount, txCurrency);

      const normalizedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? [tags] : []);
      const finalDesc = description ? description.trim() : (payee ? payee.trim() : '');

      const result = await query(
        `UPDATE transactions
         SET 
          type = $1, 
          amount = $2, 
          currency = $3,
          exchange_rate = $4,
          amount_inr = $5,
          date = $6, 
          category_id = $7, 
          description = $8,
          account = $9,
          to_account = $10,
          payee = $11,
          tags = $12,
          payment_type = $13,
          note = $14,
          external_url = $15,
          external_ref = $16,
          location = $17,
          exclude_from_stats = $18,
          updated_at = NOW()
         WHERE id = $19
         RETURNING 
          id, user_id, category_id, type, amount::FLOAT, currency, exchange_rate::FLOAT, amount_inr::FLOAT,
          TO_CHAR(date, 'YYYY-MM-DD') as date, description,
          account, to_account, payee, tags, payment_type, note,
          external_url, external_ref, location, exclude_from_stats, updated_at;`,
        [
          type,
          parsedAmount,
          finalCurrency,
          exchangeRate,
          amountINR,
          date,
          category_id || null,
          finalDesc,
          account || 'Main Checking',
          to_account || null,
          payee ? payee.trim() : null,
          normalizedTags,
          payment_type || 'Credit card',
          note ? note.trim() : null,
          external_url ? external_url.trim() : null,
          external_ref ? external_ref.trim() : null,
          location ? location.trim() : null,
          !!exclude_from_stats,
          transactionId,
        ]
      );

      // Invalidate Redis analytics cache for this user
      await cacheService.invalidateUserAnalytics(txOwnerId);

      res.json({
        message: 'Transaction updated successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  }
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction (Restricted to admin and user roles)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       403:
 *         description: Forbidden for read-only users or deleting another user's record
 */
transactionsRouter.delete(
  '/:id',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const transactionId = parseInt(req.params.id as string, 10);

      // Check ownership
      const existing = await query('SELECT user_id FROM transactions WHERE id = $1', [transactionId]);
      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }

      const txOwnerId = existing.rows[0].user_id;
      if (req.user!.role !== 'admin' && txOwnerId !== req.user!.id) {
        res.status(403).json({ error: 'You do not have permission to delete this transaction.' });
        return;
      }

      await query('DELETE FROM transactions WHERE id = $1', [transactionId]);

      // Invalidate Redis analytics cache
      await cacheService.invalidateUserAnalytics(txOwnerId);

      res.json({ message: 'Transaction deleted successfully', id: transactionId });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }
);
