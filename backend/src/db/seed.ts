import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { runMigrations } from './migrate.js';

export async function runSeed() {
  await runMigrations();

  const client = await pool.connect();
  try {
    console.log('Seeding initial database records...');
    await client.query('BEGIN');

    // Default categories
    const categories = [
      { name: 'Food & Dining', type: 'expense', color: '#f59e0b', icon: 'Utensils' },
      { name: 'Transportation', type: 'expense', color: '#3b82f6', icon: 'Car' },
      { name: 'Housing & Rent', type: 'expense', color: '#0284c7', icon: 'Home' },
      { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'Film' },
      { name: 'Utilities', type: 'expense', color: '#10b981', icon: 'Zap' },
      { name: 'Healthcare', type: 'expense', color: '#ef4444', icon: 'HeartPulse' },
      { name: 'Shopping', type: 'expense', color: '#06b6d4', icon: 'ShoppingBag' },
      { name: 'Travel', type: 'expense', color: '#f97316', icon: 'Plane' },
      { name: 'Salary', type: 'income', color: '#22c55e', icon: 'Briefcase' },
      { name: 'Freelance', type: 'income', color: '#14b8a6', icon: 'Laptop' },
      { name: 'Investments', type: 'income', color: '#6366f1', icon: 'TrendingUp' },
      { name: 'Other Income', type: 'income', color: '#84cc16', icon: 'PlusCircle' },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (name, type, color, icon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color, icon = EXCLUDED.icon;`,
        [cat.name, cat.type, cat.color, cat.icon]
      );
    }

    // Default users
    const salt = await bcrypt.genSalt(10);
    const demoUsers = [
      {
        email: 'admin@finance.com',
        name: 'Admin User',
        role: 'admin',
        password: 'AdminPassword123!',
      },
      {
        email: 'user@finance.com',
        name: 'Standard User',
        role: 'user',
        password: 'UserPassword123!',
      },
      {
        email: 'readonly@finance.com',
        name: 'Read Only Viewer',
        role: 'read-only',
        password: 'ReadOnlyPassword123!',
      },
    ];

    const userMap: Record<string, number> = {};

    for (const u of demoUsers) {
      const hash = await bcrypt.hash(u.password, salt);
      const res = await client.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, name = EXCLUDED.name
         RETURNING id, email;`,
        [u.email, hash, u.name, u.role]
      );
      userMap[u.email] = res.rows[0].id;
    }

    // Fetch category IDs
    const catRes = await client.query('SELECT id, name FROM categories;');
    const catMap: Record<string, number> = {};
    for (const row of catRes.rows) {
      catMap[row.name] = row.id;
    }

    // Seed default accounts for each user (Tailored for Indian clients with primary INR)
    const defaultAccounts = [
      { name: 'HDFC Salary Account', category: 'Current account', currency: 'INR', initial_balance: 125000.00, credit_limit: 0, default_payment_type: 'Debit card', group_name: 'Day-to-day', color: '#2563eb', icon: 'CreditCard' },
      { name: 'Cash & UPI Wallet', category: 'Cash', currency: 'INR', initial_balance: 15000.00, credit_limit: 0, default_payment_type: 'Cash', group_name: 'Day-to-day', color: '#10b981', icon: 'Wallet' },
      { name: 'ICICI Savings & FD', category: 'Saving account', currency: 'INR', initial_balance: 380000.00, credit_limit: 0, default_payment_type: 'Bank transfer', group_name: 'Savings & Goals', color: '#2563eb', icon: 'PiggyBank' },
      { name: 'SBI Platinum Card', category: 'Credit card', currency: 'INR', initial_balance: -8450.00, credit_limit: 150000.00, default_payment_type: 'Credit card', group_name: 'Liabilities', color: '#ef6a57', icon: 'CreditCard' },
      { name: 'Tata Nexon EV', category: 'Vehicle asset', currency: 'INR', initial_balance: 1450000.00, credit_limit: 0, default_payment_type: 'None', group_name: 'Vehicles', color: '#06b6d4', icon: 'Car' },
    ];

    // Remove legacy accounts if present
    await client.query("DELETE FROM accounts WHERE name IN ('Main Checking', 'Cash', 'Savings & Goals', 'Travel Credit Card', 'BMW X5', 'Toyota Corolla');");

    for (const email of Object.keys(userMap)) {
      const uId = userMap[email];
      for (const acc of defaultAccounts) {
        await client.query(
          `INSERT INTO accounts (user_id, name, category, currency, initial_balance, credit_limit, default_payment_type, group_name, color, icon)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (user_id, name) DO UPDATE SET
            initial_balance = EXCLUDED.initial_balance,
            credit_limit = EXCLUDED.credit_limit,
            category = EXCLUDED.category,
            currency = EXCLUDED.currency,
            group_name = EXCLUDED.group_name;`,
          [uId, acc.name, acc.category, acc.currency, acc.initial_balance, acc.credit_limit, acc.default_payment_type, acc.group_name, acc.color, acc.icon]
        );
      }
    }

    // Seed realistic sample transactions for Indian clients with primary INR and optional foreign currency
    const sampleTransactions = [
      // Standard user data (November 2026)
      { email: 'user@finance.com', cat: 'Salary', type: 'income', amount: 145000.00, currency: 'INR', rate: 1.0, date: '2026-11-01', desc: 'Monthly Salary November', account: 'HDFC Salary Account', payee: 'TechCorp India', tags: ['Salary', 'Primary'] },
      { email: 'user@finance.com', cat: 'Housing & Rent', type: 'expense', amount: 32000.00, currency: 'INR', rate: 1.0, date: '2026-11-02', desc: 'Apartment Monthly Rent', account: 'HDFC Salary Account', payee: 'Prestige Estates', tags: ['Rent', 'Fixed'] },
      { email: 'user@finance.com', cat: 'Food & Dining', type: 'expense', amount: 5450.00, currency: 'INR', rate: 1.0, date: '2026-11-04', desc: 'Monthly Groceries & Essentials', account: 'HDFC Salary Account', payee: 'Blinkit & Zepto', tags: ['Groceries'] },
      { email: 'user@finance.com', cat: 'Utilities', type: 'expense', amount: 2850.00, currency: 'INR', rate: 1.0, date: '2026-11-06', desc: 'Electricity & High-speed Fiber', account: 'HDFC Salary Account', payee: 'BESCOM & JioFiber', tags: ['Utilities', 'Bills'] },
      { email: 'user@finance.com', cat: 'Transportation', type: 'expense', amount: 1200.00, currency: 'INR', rate: 1.0, date: '2026-11-08', desc: 'Metro smart card & Auto rides', account: 'Cash & UPI Wallet', payee: 'Namma Metro & Uber', tags: ['Commute'] },
      // Optional Foreign Currency transactions (USD $100 expense and USD $500 freelance income converted at 83.50)
      { email: 'user@finance.com', cat: 'Entertainment', type: 'expense', amount: 100.00, currency: 'USD', rate: 83.50, date: '2026-11-10', desc: 'Cloud Tools & Media Subscriptions ($100 USD)', account: 'SBI Platinum Card', payee: 'AWS & Netflix US', tags: ['Software', 'USD-Converted'] },
      { email: 'user@finance.com', cat: 'Freelance', type: 'income', amount: 500.00, currency: 'USD', rate: 83.50, date: '2026-11-12', desc: 'International UI/UX Gig ($500 USD)', account: 'HDFC Salary Account', payee: 'Stripe International', tags: ['Freelance', 'USD-Converted'] },
      { email: 'user@finance.com', cat: 'Food & Dining', type: 'expense', amount: 2650.00, currency: 'INR', rate: 1.0, date: '2026-11-13', desc: 'Weekend dining with family', account: 'Cash & UPI Wallet', payee: 'Toit Brewpub', tags: ['Dining'] },
      { email: 'user@finance.com', cat: 'Shopping', type: 'expense', amount: 4800.00, currency: 'INR', rate: 1.0, date: '2026-11-14', desc: 'Winter apparel & running shoes', account: 'SBI Platinum Card', payee: 'Myntra', tags: ['Clothing'] },
      { email: 'user@finance.com', cat: 'Healthcare', type: 'expense', amount: 1850.00, currency: 'INR', rate: 1.0, date: '2026-11-15', desc: 'Health checkup & pharmacy', account: 'HDFC Salary Account', payee: 'Apollo Pharmacy', tags: ['Health'] },

      // Prior month for trend analysis (October 2026)
      { email: 'user@finance.com', cat: 'Salary', type: 'income', amount: 145000.00, currency: 'INR', rate: 1.0, date: '2026-10-01', desc: 'Monthly Salary October', account: 'HDFC Salary Account', payee: 'TechCorp India', tags: ['Salary'] },
      { email: 'user@finance.com', cat: 'Housing & Rent', type: 'expense', amount: 32000.00, currency: 'INR', rate: 1.0, date: '2026-10-02', desc: 'Apartment Monthly Rent', account: 'HDFC Salary Account', payee: 'Prestige Estates', tags: ['Rent'] },
      { email: 'user@finance.com', cat: 'Food & Dining', type: 'expense', amount: 8400.00, currency: 'INR', rate: 1.0, date: '2026-10-15', desc: 'Festival season groceries', account: 'HDFC Salary Account', payee: 'Nature’s Basket', tags: ['Groceries'] },
      { email: 'user@finance.com', cat: 'Travel', type: 'expense', amount: 18500.00, currency: 'INR', rate: 1.0, date: '2026-10-20', desc: 'Diwali getaway trip', account: 'SBI Platinum Card', payee: 'Taj Resorts', tags: ['Travel'] },
      { email: 'user@finance.com', cat: 'Investments', type: 'income', amount: 12500.00, currency: 'INR', rate: 1.0, date: '2026-10-28', desc: 'Mutual Fund SIP & Dividend', account: 'ICICI Savings & FD', payee: 'Zerodha Coin', tags: ['Investments'] },

      // Read-only user data (INR)
      { email: 'readonly@finance.com', cat: 'Salary', type: 'income', amount: 95000.00, currency: 'INR', rate: 1.0, date: '2026-11-01', desc: 'Monthly Salary November', account: 'HDFC Salary Account', payee: 'Infosys Limited', tags: ['Salary'] },
      { email: 'readonly@finance.com', cat: 'Housing & Rent', type: 'expense', amount: 24000.00, currency: 'INR', rate: 1.0, date: '2026-11-02', desc: 'Monthly Rent', account: 'HDFC Salary Account', payee: 'City Properties', tags: ['Rent'] },
      { email: 'readonly@finance.com', cat: 'Food & Dining', type: 'expense', amount: 6200.00, currency: 'INR', rate: 1.0, date: '2026-11-07', desc: 'Supermarket essentials', account: 'Cash & UPI Wallet', payee: 'BigBasket', tags: ['Food'] },
      { email: 'readonly@finance.com', cat: 'Utilities', type: 'expense', amount: 2100.00, currency: 'INR', rate: 1.0, date: '2026-11-12', desc: 'Water and Internet', account: 'HDFC Salary Account', payee: 'Airtel Broadband', tags: ['Utilities'] },
    ];

    // Clear existing sample transactions to avoid duplicates on re-seed
    await client.query('DELETE FROM transactions WHERE user_id IN ($1, $2, $3);', [
      userMap['admin@finance.com'],
      userMap['user@finance.com'],
      userMap['readonly@finance.com'],
    ]);

    for (const tx of sampleTransactions) {
      const uId = userMap[tx.email];
      const cId = catMap[tx.cat];
      if (uId && cId) {
        const rate = tx.rate || 1.0;
        const amountInr = Math.round(tx.amount * rate * 100) / 100;
        await client.query(
          `INSERT INTO transactions (
            user_id, category_id, type, amount, currency, exchange_rate, amount_inr,
            date, description, account, payee, tags, payment_type
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
          [
            uId,
            cId,
            tx.type,
            tx.amount,
            tx.currency || 'INR',
            rate,
            amountInr,
            tx.date,
            tx.desc,
            tx.account || 'HDFC Salary Account',
            tx.payee || tx.desc,
            tx.tags || [],
            tx.currency === 'USD' ? 'Credit card' : (tx.account?.includes('UPI') ? 'UPI' : 'Credit card'),
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully with demo users, categories, and transactions.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('seed.ts')) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
