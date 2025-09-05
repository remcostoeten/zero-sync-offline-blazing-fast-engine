import { z } from 'zod';

// Base connection schema
export const baseConnectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Connection name is required'),
  type: z.enum(['postgres', 'sqlite', 'libsql'], {
    required_error: 'Database type is required'
  }),
  url: z.string().optional(),
  filePath: z.string().optional(),
  token: z.string().optional(),
  isFavorite: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Database-specific validation schemas
export const libsqlConnectionSchema = baseConnectionSchema
  .extend({ type: z.literal('libsql') })
  .refine(
    (data) => data.url && data.token,
    {
      message: 'LibSQL connections require both URL and auth token',
      path: ['url']
    }
  );

export const sqliteConnectionSchema = baseConnectionSchema
  .extend({ type: z.literal('sqlite') })
  .refine(
    (data) => data.filePath,
    {
      message: 'SQLite connections require a file path',
      path: ['filePath']
    }
  );

export const postgresConnectionSchema = baseConnectionSchema
  .extend({ type: z.literal('postgres') })
  .refine(
    (data) => data.url,
    {
      message: 'PostgreSQL connections require a connection URL',
      path: ['url']
    }
  )
  .refine(
    (data) => {
      if (data.url) {
        // Basic PostgreSQL URL validation
        const pgUrlPattern = /^postgres(ql)?:\/\/.+/;
        return pgUrlPattern.test(data.url);
      }
      return true;
    },
    {
      message: 'Invalid PostgreSQL connection URL format',
      path: ['url']
    }
  );

// Combined schema with all validations
export const connectionSchema = z.union([
  libsqlConnectionSchema,
  sqliteConnectionSchema,
  postgresConnectionSchema
]);

export const createConnectionSchema = baseConnectionSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).required({ 
  name: true,
  type: true 
});

export const updateConnectionSchema = baseConnectionSchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const testConnectionSchema = z.object({
  type: z.enum(['postgres', 'sqlite', 'libsql']),
  url: z.string().optional(),
  filePath: z.string().optional(),
  token: z.string().optional()
});

export type Connection = z.infer<typeof connectionSchema>;
export type CreateConnection = z.infer<typeof createConnectionSchema>;
export type UpdateConnection = z.infer<typeof updateConnectionSchema>;
export type TestConnection = z.infer<typeof testConnectionSchema>;
