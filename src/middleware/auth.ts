import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { dbUser?: any };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch user from DB to attach role and other details
    const dbUser = await db.query.users.findFirst({
      where: eq(users.uid, decodedToken.uid)
    });

    if (!dbUser) {
      if (req.path === '/auth/register') {
        req.user = { ...decodedToken, dbUser: null } as any;
        return next();
      }
      return res.status(403).json({ error: 'User not registered in system' });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Force password change check
    if (dbUser.forcePasswordChange && req.path !== '/auth/change-password' && req.path !== '/user/me') {
      return res.status(403).json({ error: 'PASSWORD_CHANGE_REQUIRED', mustChangePassword: true });
    }

    // Update last login (once per session ideally, but here every auth for simplicity or add a flag)
    if (!req.user) {
       await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, dbUser.id));
    }

    req.user = { ...decodedToken, dbUser };
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.dbUser || !roles.includes(req.user.dbUser.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
