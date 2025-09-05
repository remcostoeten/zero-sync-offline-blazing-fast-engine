import { Context, Next } from 'hono';
import { auth } from './auth';

export interface AuthenticatedContext extends Context {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    });

    if (!session?.user) {
      return c.json({ success: false, message: 'Authentication required' }, 401);
    }

    // Add user to context
    (c as AuthenticatedContext).user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    };

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ 
      success: false, 
      message: 'Authentication failed' 
    }, 401);
  }
};
