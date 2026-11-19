import { pool } from './pool.js';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    await client.query('BEGIN');

    // 1. Users table with role field (default: 'user')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'read-only')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
        color VARCHAR(30) DEFAULT '#6366f1',
        icon VARCHAR(50) DEFAULT 'Tag',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT,
        account VARCHAR(100) DEFAULT 'Main Checking',
        to_account VARCHAR(100),
        payee VARCHAR(255),
        tags TEXT[] DEFAULT '{}',
        payment_type VARCHAR(50) DEFAULT 'Credit card',
        note TEXT,
        external_url VARCHAR(500),
        external_ref VARCHAR(100),
        location VARCHAR(255),
        exclude_from_stats BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure columns and constraints exist if table was previously created
    await client.query(`
      DO $$
      BEGIN
        -- Update type check constraint to include 'transfer'
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense', 'transfer'));

        -- Add extended transaction options
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account') THEN
          ALTER TABLE transactions ADD COLUMN account VARCHAR(100) DEFAULT 'Main Checking';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'to_account') THEN
          ALTER TABLE transactions ADD COLUMN to_account VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payee') THEN
          ALTER TABLE transactions ADD COLUMN payee VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'tags') THEN
          ALTER TABLE transactions ADD COLUMN tags TEXT[] DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_type') THEN
          ALTER TABLE transactions ADD COLUMN payment_type VARCHAR(50) DEFAULT 'Credit card';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'note') THEN
          ALTER TABLE transactions ADD COLUMN note TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'external_url') THEN
          ALTER TABLE transactions ADD COLUMN external_url VARCHAR(500);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'external_ref') THEN
          ALTER TABLE transactions ADD COLUMN external_ref VARCHAR(100);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'location') THEN
          ALTER TABLE transactions ADD COLUMN location VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'exclude_from_stats') THEN
          ALTER TABLE transactions ADD COLUMN exclude_from_stats BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'currency') THEN
          ALTER TABLE transactions ADD COLUMN currency VARCHAR(10) DEFAULT 'INR';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'exchange_rate') THEN
          ALTER TABLE transactions ADD COLUMN exchange_rate NUMERIC(12, 4) DEFAULT 1.0000;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount_inr') THEN
          ALTER TABLE transactions ADD COLUMN amount_inr NUMERIC(12, 2) DEFAULT 0.00;
          UPDATE transactions SET amount_inr = amount WHERE amount_inr = 0.00 OR amount_inr IS NULL;
        END IF;
      END $$;
    `);

    // 4. Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'General',
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        default_payment_type VARCHAR(50) DEFAULT 'None',
        group_name VARCHAR(100) DEFAULT 'Day-to-day',
        color VARCHAR(30) DEFAULT '#2563eb',
        icon VARCHAR(50) DEFAULT 'Wallet',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, name)
      );
    `);

    // 5. Import Batches Table for CSV Ingestion Audit History
    await client.query(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        total_records INTEGER NOT NULL DEFAULT 0,
        inflow_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        outflow_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        account VARCHAR(100) DEFAULT 'Main Checking',
        status VARCHAR(50) DEFAULT 'SETTLED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure batch_id column on transactions
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'batch_id') THEN
          ALTER TABLE transactions ADD COLUMN batch_id VARCHAR(50);
        END IF;
      END $$;
    `);

    // 6. Indexes for fast search, filter, pagination, analytics and import batches
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(user_id, account);
      CREATE INDEX IF NOT EXISTS idx_transactions_batch_id ON transactions(batch_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_import_batches_user ON import_batches(user_id, created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('Migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
