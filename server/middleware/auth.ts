import { Request, Response, NextFunction } from 'express';

interface ReplitUser {
  id: string;
  name: string;
  roles: string;
}

export interface AuthenticatedRequest extends Request {
  user?: ReplitUser;
}

// Development mode: Always authenticate as admin
const DEV_MODE = process.env.NODE_ENV === 'development';

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (DEV_MODE) {
    // In development, always authenticate as admin
    req.user = {
      id: 'dev-1',
      name: 'Developer',
      roles: 'admin',
    };
    next();
    return;
  }

  const userId = req.headers['x-replit-user-id'];
  const userName = req.headers['x-replit-user-name'];
  const userRoles = req.headers['x-replit-user-roles'];

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  req.user = {
    id: userId as string,
    name: userName as string,
    roles: userRoles as string,
  };

  next();
}

export function isAdmin(req: AuthenticatedRequest): boolean {
  if (DEV_MODE) return true;
  return req.user?.roles?.includes('admin') ?? false;
}