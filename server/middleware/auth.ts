import { ReplitAuthContext } from '@replit/repl-auth';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: ReplitAuthContext;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.headers['X-Replit-User-Id'];
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  
  req.user = {
    id: req.headers['X-Replit-User-Id'] as string,
    name: req.headers['X-Replit-User-Name'] as string,
    roles: req.headers['X-Replit-User-Roles'] as string,
  };
  
  next();
}

export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.user?.roles?.includes('admin') ?? false;
}
