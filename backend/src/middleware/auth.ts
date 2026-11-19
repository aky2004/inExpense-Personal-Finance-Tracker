import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'read-only';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt';

export function signToken(payload: UserPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): UserPayload {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (allowedRoles: ('admin' | 'user' | 'read-only')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: role '${req.user.role}' does not have sufficient permissions.`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);

export const requireCanMutate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role === 'read-only') {
    res.status(403).json({
      error: 'Forbidden: read-only users cannot add, edit, or delete transactions.',
    });
    return;
  }

  next();
};
