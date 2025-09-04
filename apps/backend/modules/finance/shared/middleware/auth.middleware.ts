import { Context, Next } from 'hono';
import { AuthUtils, JWTPayload } from '../utils/auth.utils';

export interface AuthenticatedContext extends Context {
  user: JWTPayload;
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = AuthUtils.extractToken(authHeader);

    if (!token) {
      return c.json({ success: false, message: 'No token provided' }, 401);
    }

    const payload = AuthUtils.verifyToken(token);
    (c as AuthenticatedContext).user = payload;

    await next();
  } catch (error) {
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Authentication failed' 
    }, 401);
  }
};
