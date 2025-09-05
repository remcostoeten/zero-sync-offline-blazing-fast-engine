import { db } from '../../../../shared/db/barrel';
import { connections } from '../../../../shared/schemas/connections.schema';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '../../../../shared/utils/generate-id';
import { Connection, NewConnection } from '../../../../shared/schemas/connections.schema';
import { CreateConnection } from '../schemas/connection.schema';

type TCreateConnectionData = CreateConnection;

export class ConnectionsCRUD {
  async create(connection: TCreateConnectionData): Promise<{ success: boolean; data?: Connection; error?: string }> {
    try {
      const newConnection: NewConnection = {
        id: generateId(),
        name: connection.name,
        type: connection.type,
        url: connection.url,
        filePath: connection.filePath,
        token: connection.token,
        isFavorite: connection.isFavorite || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.insert(connections).values(newConnection).returning();
      
      if (result.length === 0) {
        return { success: false, error: 'Failed to create connection' };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while creating connection' 
      };
    }
  }

  async getById(id: string): Promise<{ success: boolean; data?: Connection; error?: string }> {
    try {
      const result = await db.select().from(connections).where(eq(connections.id, id)).limit(1);
      
      if (result.length === 0) {
        return { success: false, error: 'Connection not found' };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while fetching connection' 
      };
    }
  }

  async list(): Promise<{ success: boolean; data?: Connection[]; error?: string }> {
    try {
      const result = await db.select().from(connections).orderBy(desc(connections.isFavorite), desc(connections.updatedAt));
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while listing connections' 
      };
    }
  }

  async update(id: string, updates: Partial<Omit<Connection, 'id' | 'createdAt'>>): Promise<{ success: boolean; data?: Connection; error?: string }> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const result = await db.update(connections)
        .set(updateData)
        .where(eq(connections.id, id))
        .returning();

      if (result.length === 0) {
        return { success: false, error: 'Connection not found' };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while updating connection' 
      };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await db.delete(connections).where(eq(connections.id, id)).returning();
      
      if (result.length === 0) {
        return { success: false, error: 'Connection not found' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while deleting connection' 
      };
    }
  }

  async toggleFavorite(id: string): Promise<{ success: boolean; data?: Connection; error?: string }> {
    try {
      const connection = await this.getById(id);
      if (!connection.success || !connection.data) {
        return { success: false, error: 'Connection not found' };
      }

      const newFavoriteStatus = !connection.data.isFavorite;
      return await this.update(id, { isFavorite: newFavoriteStatus });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while toggling favorite' 
      };
    }
  }

  async getFavorites(): Promise<{ success: boolean; data?: Connection[]; error?: string }> {
    try {
      const result = await db.select()
        .from(connections)
        .where(eq(connections.isFavorite, true))
        .orderBy(desc(connections.updatedAt));
      
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database error while fetching favorites' 
      };
    }
  }
}


