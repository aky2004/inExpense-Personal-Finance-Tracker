import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { swaggerCustomCss, swaggerCustomJs } from './swaggerTheme.js';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { transactionsRouter } from './routes/transactions.js';
import { analyticsRouter } from './routes/analytics.js';
import { usersRouter } from './routes/users.js';
import { accountsRouter } from './routes/accounts.js';
import { pool } from './db/pool.js';
import { redis } from './services/redis.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Security & Standard Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI to load scripts/styles locally
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allows Firebase Google OAuth popup
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile, or reverse proxies)
      if (!origin) return callback(null, true);
      const isAllowed =
        origin === process.env.FRONTEND_URL ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');
      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. Swagger / OpenAPI Interactive Documentation (inExpense Obsidian Dark Theme)
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: swaggerCustomCss,
    customJsStr: swaggerCustomJs,
    customSiteTitle: 'inExpense — Interactive API Documentation',
  } as any)
);

// 3. Health check endpoint (verifies DB & Redis connectivity)
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';

  try {
    await pool.query('SELECT 1');
  } catch (err: any) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  try {
    await redis.ping();
  } catch (err: any) {
    redisStatus = `unhealthy: ${err.message}`;
  }

  res.json({
    status: dbStatus === 'healthy' && redisStatus === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// 4. API Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/users', usersRouter);
app.use('/api/accounts', accountsRouter);

// 5. Global 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 6. Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`inExpense Backend running on http://localhost:${PORT}`);
  console.log(`Swagger OpenAPI Documentation: http://localhost:${PORT}/api/docs`);
});

export default app;
