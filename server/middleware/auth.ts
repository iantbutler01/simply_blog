import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // @ts-ignore - checking user in session
  const user = req.session.user;

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  req.user = user;
  next();
}

export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.user?.isAdmin ?? false;
}