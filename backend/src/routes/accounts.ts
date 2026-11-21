import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken, requireCanMutate } from '../middleware/auth.js';
import { getExchangeRateToINR } from '../utils/currency.js';

export const accountsRouter = Router();

accountsRouter.use(authenticateToken);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Retrieve user's accounts with dynamic balance calculation & KPIs
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts with balances and summary KPIs
 */
accountsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Fetch accounts with aggregated real-time inflows and outflows from transactions
    const sql = `
      SELECT 
        a.id,
        a.user_id,
        a.name,
        a.category,
        a.currency,
        a.initial_balance::FLOAT,
        a.credit_limit::FLOAT,
        a.default_payment_type,
        a.group_name,
        a.color,
        a.icon,
        a.created_at,
        a.updated_at,
        COALESCE(
          a.initial_balance +
          COALESCE(tx_in.total_in, 0) -
          COALESCE(tx_out.total_out, 0) +
          COALESCE(tx_trans_in.total_trans_in, 0) -
          COALESCE(tx_trans_out.total_trans_out, 0),
          a.initial_balance
        )::FLOAT as current_balance,
        (COALESCE(tx_count.cnt, 0) + COALESCE(tx_trans_in_count.cnt, 0))::INT as transaction_count
      FROM accounts a
      -- Inflows (income directly into this account)
      LEFT JOIN (
        SELECT account, SUM(COALESCE(amount_inr, amount)) as total_in
        FROM transactions
        WHERE user_id = $1 AND type = 'income'
        GROUP BY account
      ) tx_in ON a.name = tx_in.account
      -- Outflows (expenses directly out of this account)
      LEFT JOIN (
        SELECT account, SUM(COALESCE(amount_inr, amount)) as total_out
        FROM transactions
        WHERE user_id = $1 AND type = 'expense'
        GROUP BY account
      ) tx_out ON a.name = tx_out.account
      -- Transfers In (where this account was the target)
      LEFT JOIN (
        SELECT to_account, SUM(COALESCE(amount_inr, amount)) as total_trans_in
        FROM transactions
        WHERE user_id = $1 AND type = 'transfer' AND to_account IS NOT NULL
        GROUP BY to_account
      ) tx_trans_in ON a.name = tx_trans_in.to_account
      -- Transfers Out (where this account was the source)
      LEFT JOIN (
        SELECT account, SUM(COALESCE(amount_inr, amount)) as total_trans_out
        FROM transactions
        WHERE user_id = $1 AND type = 'transfer'
        GROUP BY account
      ) tx_trans_out ON a.name = tx_trans_out.account
      -- Transaction count
      LEFT JOIN (
        SELECT account, COUNT(*) as cnt
        FROM transactions
        WHERE user_id = $1
        GROUP BY account
      ) tx_count ON a.name = tx_count.account
      LEFT JOIN (
        SELECT to_account, COUNT(*) as cnt
        FROM transactions
        WHERE user_id = $1 AND type = 'transfer' AND to_account IS NOT NULL
        GROUP BY to_account
      ) tx_trans_in_count ON a.name = tx_trans_in_count.to_account
      WHERE a.user_id = $1
      ORDER BY a.group_name ASC, a.id ASC;
    `;

    const result = await query(sql, [userId]);
    const accounts = result.rows;

    // Calculate overall portfolio metrics normalized in INR
    let totalBalance = 0;
    let assets = 0;
    let liabilities = 0;
    let vehicles = 0;

    for (const acc of accounts) {
      const bal = Number(acc.current_balance) || 0;
      const rate = getExchangeRateToINR(acc.currency);
      const balINR = bal * rate;
      totalBalance += balINR;

      if (acc.group_name === 'Vehicles' || acc.category.toLowerCase().includes('vehicle')) {
        vehicles += balINR;
      }

      if (balINR >= 0) {
        assets += balINR;
      } else {
        liabilities += balINR;
      }
    }

    res.json({
      data: accounts,
      summary: {
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        assets: parseFloat(assets.toFixed(2)),
        liabilities: parseFloat(liabilities.toFixed(2)),
        vehicles: parseFloat(vehicles.toFixed(2)),
        accountCount: accounts.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts.' });
  }
});

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               currency:
 *                 type: string
 *               initial_balance:
 *                 type: number
 *               credit_limit:
 *                 type: number
 *               default_payment_type:
 *                 type: string
 *               group_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created
 */
accountsRouter.post(
  '/',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const {
        name,
        category = 'General',
        currency = 'INR',
        initial_balance = 0,
        credit_limit = 0,
        default_payment_type = 'None',
        group_name = 'Day-to-day',
        color = '#2563eb',
        icon = 'Wallet',
      } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Account name is required.' });
        return;
      }

      const parsedInit = parseFloat(initial_balance) || 0;
      const parsedLimit = parseFloat(credit_limit) || 0;

      const result = await query(
        `INSERT INTO accounts (
          user_id, name, category, currency, initial_balance, credit_limit,
          default_payment_type, group_name, color, icon
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, user_id, name, category, currency, initial_balance::FLOAT, credit_limit::FLOAT,
                   default_payment_type, group_name, color, icon, created_at;`,
        [
          userId,
          name.trim(),
          category,
          currency,
          parsedInit,
          parsedLimit,
          default_payment_type,
          group_name || 'Day-to-day',
          color,
          icon,
        ]
      );

      res.status(201).json({
        message: 'Account created successfully',
        data: {
          ...result.rows[0],
          current_balance: parsedInit,
          transaction_count: 0,
        },
      });
    } catch (error: any) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'An account with this name already exists.' });
        return;
      }
      console.error('Error creating account:', error);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  }
);

/**
 * @swagger
 * /api/accounts/bank-connections:
 *   get:
 *     summary: Bank connections status (Upcoming feature for automated Plaid / OpenBanking sync)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming feature status
 */
accountsRouter.get('/bank-connections', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'upcoming',
    feature: 'Bank Connections',
    version: 'v1.1',
    provider: 'Plaid / OpenBanking API',
    message: 'Automated bank account synchronization via Plaid and OpenBanking is an upcoming feature scheduled for release v1.1. Manual account management is fully active.',
    enabled: false,
    connections: [],
  });
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get single account details with recent transactions
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
accountsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const accountId = parseInt(req.params.id as string, 10);

    const accRes = await query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accRes.rows.length === 0) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const account = accRes.rows[0];

    // Fetch transactions strictly related to this account
    const txSql = `
      SELECT 
        t.id,
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
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND (t.account = $2 OR t.to_account = $2)
      ORDER BY t.date DESC, t.id DESC
      LIMIT 50;
    `;

    const txRes = await query(txSql, [userId, account.name]);

    // Compute live balance with currency conversion
    let currentBalance = Number(account.initial_balance) || 0;
    for (const t of txRes.rows) {
      const amt = (account.currency === 'INR') ? Number(t.amount_inr) : Number(t.amount);
      if (t.type === 'income') {
        if (t.account === account.name) currentBalance += amt;
      } else if (t.type === 'expense') {
        if (t.account === account.name) currentBalance -= amt;
      } else if (t.type === 'transfer') {
        if (t.to_account === account.name) currentBalance += amt;
        if (t.account === account.name) currentBalance -= amt;
      }
    }

    res.json({
      data: {
        ...account,
        current_balance: currentBalance,
        transactions: txRes.rows,
      },
    });
  } catch (error: any) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ error: 'Failed to fetch account details.' });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update account information
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
accountsRouter.put(
  '/:id',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const accountId = parseInt(req.params.id as string, 10);
      const {
        name,
        category,
        currency,
        initial_balance,
        credit_limit,
        default_payment_type,
        group_name,
        color,
        icon,
      } = req.body;

      const existing = await query(
        'SELECT id, name FROM accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      const oldName = existing.rows[0].name;

      const result = await query(
        `UPDATE accounts
         SET 
          name = COALESCE($1, name),
          category = COALESCE($2, category),
          currency = COALESCE($3, currency),
          initial_balance = COALESCE($4, initial_balance),
          credit_limit = COALESCE($5, credit_limit),
          default_payment_type = COALESCE($6, default_payment_type),
          group_name = COALESCE($7, group_name),
          color = COALESCE($8, color),
          icon = COALESCE($9, icon),
          updated_at = NOW()
         WHERE id = $10 AND user_id = $11
         RETURNING id, name, category, currency, initial_balance::FLOAT, credit_limit::FLOAT,
                   default_payment_type, group_name, color, icon, updated_at;`,
        [
          name ? name.trim() : null,
          category,
          currency,
          initial_balance !== undefined ? parseFloat(initial_balance) : null,
          credit_limit !== undefined ? parseFloat(credit_limit) : null,
          default_payment_type,
          group_name,
          color,
          icon,
          accountId,
          userId,
        ]
      );

      // If account was renamed, update corresponding transactions
      if (name && name.trim() !== oldName) {
        await query('UPDATE transactions SET account = $1 WHERE user_id = $2 AND account = $3', [
          name.trim(),
          userId,
          oldName,
        ]);
        await query('UPDATE transactions SET to_account = $1 WHERE user_id = $2 AND to_account = $3', [
          name.trim(),
          userId,
          oldName,
        ]);
      }

      res.json({
        message: 'Account updated successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error updating account:', error);
      res.status(500).json({ error: 'Failed to update account.' });
    }
  }
);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
accountsRouter.delete(
  '/:id',
  requireCanMutate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const accountId = parseInt(req.params.id as string, 10);

      const result = await query(
        'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id, name',
        [accountId, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      res.json({ message: 'Account deleted successfully', id: accountId });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Failed to delete account.' });
    }
  }
);

/**
 * @swagger
 * /api/accounts/{id}/analytics:
 *   get:
 *     summary: Per-account category breakdown and spending trajectory
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 */
accountsRouter.get('/:id/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const accountId = parseInt(req.params.id as string, 10);

    const accRes = await query('SELECT name FROM accounts WHERE id = $1 AND user_id = $2', [
      accountId,
      userId,
    ]);

    if (accRes.rows.length === 0) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const accName = accRes.rows[0].name;

    // 1. Category breakdown for this account
    const catSql = `
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category_name,
        COALESCE(c.color, '#94a3b8') as color,
        SUM(COALESCE(t.amount_inr, t.amount))::FLOAT as total_amount,
        COUNT(t.id)::INT as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.account = $2 AND t.type = 'expense'
      GROUP BY c.name, c.color
      ORDER BY total_amount DESC;
    `;
    const catResult = await query(catSql, [userId, accName]);

    // 2. Monthly trends for this account
    const trendSql = `
      WITH month_series AS (
        SELECT TO_CHAR(d, 'YYYY-MM') as month_str,
               TO_CHAR(d, 'Mon YYYY') as display_name,
               d as month_date
        FROM GENERATE_SERIES(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::INTERVAL
        ) d
      )
      SELECT 
        m.month_str,
        m.display_name,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN COALESCE(t.amount_inr, t.amount) ELSE 0 END), 0)::FLOAT as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN COALESCE(t.amount_inr, t.amount) ELSE 0 END), 0)::FLOAT as expense
      FROM month_series m
      LEFT JOIN transactions t 
        ON TO_CHAR(t.date, 'YYYY-MM') = m.month_str 
        AND t.user_id = $1 
        AND (t.account = $2 OR t.to_account = $2)
      GROUP BY m.month_str, m.display_name, m.month_date
      ORDER BY m.month_date ASC;
    `;
    const trendResult = await query(trendSql, [userId, accName]);

    res.json({
      account: accName,
      categories: catResult.rows,
      trends: trendResult.rows,
    });
  } catch (error: any) {
    console.error('Error in account analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve account analytics.' });
  }
});
