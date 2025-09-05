import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createDb } from '../../shared/db';
import { users } from '../../shared/schemas/users.schema';
import { AuthUtils } from '../../shared/utils/auth.utils';
import { authMiddleware, AuthenticatedContext } from '../../shared/middleware/auth.middleware';
import { eq } from 'drizzle-orm';

const authRoutes = new Hono();

// Validation schemas
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  profile: z.string().optional(),
  avatar: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Signup route
authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  try {
    const { name, email, password, profile, avatar } = c.req.valid('json');
    const db = createDb();

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return c.json({ success: false, message: 'User with this email already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      profile,
      avatar,
    }).returning();

    // Generate token
    const token = AuthUtils.generateToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    return c.json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          profile: newUser.profile,
          avatar: newUser.avatar,
        },
        token,
      },
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to create user' 
    }, 500);
  }
});

// Login route
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const db = createDb();

    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, email));
    if (userResult.length === 0) {
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    const user = userResult[0];

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password);
    if (!isValidPassword) {
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    // Generate token
    const token = AuthUtils.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to login' 
    }, 500);
  }
});

// Get user profile (protected route)
authRoutes.get('/profile', authMiddleware, async (c: AuthenticatedContext) => {
  try {
    const db = createDb();
    const userResult = await db.select().from(users).where(eq(users.id, c.user.userId));
    
    if (userResult.length === 0) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    const user = userResult[0];
    return c.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to get profile' 
    }, 500);
  }
});

// Update user profile (protected route)
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  profile: z.string().optional(),
  avatar: z.string().optional(),
});

authRoutes.put('/profile', authMiddleware, zValidator('json', updateProfileSchema), async (c: AuthenticatedContext) => {
  try {
    const updates = c.req.valid('json') as z.infer<typeof updateProfileSchema>;
    const db = createDb();

    const updateData = {
      ...(updates.name && { name: updates.name }),
      ...(updates.profile !== undefined && { profile: updates.profile }),
      ...(updates.avatar !== undefined && { avatar: updates.avatar }),
      updatedAt: new Date(),
    };

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, c.user.userId))
      .returning();

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile: updatedUser.profile,
        avatar: updatedUser.avatar,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to update profile' 
    }, 500);
  }
});

export { authRoutes };
