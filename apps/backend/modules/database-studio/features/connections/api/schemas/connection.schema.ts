import { z } from 'zod';

export const connectionSchema = z.object({
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

export const createConnectionSchema = connectionSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).required({ 
  name: true,
  type: true 
});

export const updateConnectionSchema = connectionSchema.partial().omit({ 
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
