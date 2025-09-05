import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ConnectionsCRUD } from '../crud/connections.crud';
import { DatabaseConnectionService } from '../../../../shared/services/database-connection.service';
import { 
  createConnectionSchema, 
  updateConnectionSchema, 
  testConnectionSchema,
  type CreateConnection
} from '../schemas/connection.schema';

const connectionsCRUD = new ConnectionsCRUD();
const dbConnectionService = new DatabaseConnectionService();

export const connectionsRoutes = new Hono();

// Create connection
connectionsRoutes.post('/', zValidator('json', createConnectionSchema), async (c) => {
  try {
    const connectionData = c.req.valid('json');
    const result = await connectionsCRUD.create(connectionData);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data }, 201);
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// List connections
connectionsRoutes.get('/', async (c) => {
  try {
    const result = await connectionsCRUD.list();
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Get connection by ID
connectionsRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await connectionsCRUD.getById(id);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 404);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Update connection
connectionsRoutes.put('/:id', zValidator('json', updateConnectionSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const updateData = c.req.valid('json');
    const result = await connectionsCRUD.update(id, updateData);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Delete connection
connectionsRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Close the active connection if it exists
    await dbConnectionService.closeConnection(id);
    
    const result = await connectionsCRUD.delete(id);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, message: 'Connection deleted successfully' });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Test connection
connectionsRoutes.post('/:id/connect', async (c) => {
  try {
    const id = c.req.param('id');
    const connection = await connectionsCRUD.getById(id);
    
    if (!connection.success || !connection.data) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const testResult = await dbConnectionService.testConnection(connection.data);
    
    if (!testResult.success) {
      return c.json({ success: false, error: testResult.error }, 400);
    }

    return c.json({ 
      success: true, 
      message: 'Connection successful',
      info: testResult.info
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Get tables for a connection
connectionsRoutes.get('/:id/tables', async (c) => {
  try {
    const id = c.req.param('id');
    const connection = await connectionsCRUD.getById(id);
    
    if (!connection.success || !connection.data) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const testResult = await dbConnectionService.testConnection(connection.data);
    
    if (!testResult.success) {
      return c.json({ success: false, error: testResult.error }, 400);
    }

    return c.json({ 
      success: true, 
      data: testResult.info?.tables || []
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Get table rows with pagination, search, and sorting
connectionsRoutes.get('/:id/tables/:table/rows', async (c) => {
  try {
    const id = c.req.param('id');
    const table = c.req.param('table');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    const search = c.req.query('q');
    const sortBy = c.req.query('sort');
    const sortOrder = (c.req.query('order') as 'asc' | 'desc') || 'asc';

    const connection = await connectionsCRUD.getById(id);
    
    if (!connection.success || !connection.data) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const result = await dbConnectionService.getTableRows(
      id, 
      table, 
      limit, 
      offset, 
      search, 
      sortBy, 
      sortOrder
    );

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Execute raw query
connectionsRoutes.post('/:id/query', async (c) => {
  try {
    const id = c.req.param('id');
    const { query } = await c.req.json();
    
    if (!query || typeof query !== 'string') {
      return c.json({ success: false, error: 'Query is required and must be a string' }, 400);
    }

    const connection = await connectionsCRUD.getById(id);
    
    if (!connection.success || !connection.data) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const result = await dbConnectionService.executeQuery(id, query);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Get database metrics
connectionsRoutes.get('/:id/metrics', async (c) => {
  try {
    const id = c.req.param('id');
    const connection = await connectionsCRUD.getById(id);
    
    if (!connection.success || !connection.data) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    // First get table information
    const testResult = await dbConnectionService.testConnection(connection.data);
    
    if (!testResult.success) {
      return c.json({ success: false, error: testResult.error }, 400);
    }

    const tableNames = testResult.info?.tables.map(t => t.name) || [];
    
    // Get row counts for all tables
    const rowCountResult = await dbConnectionService.getTableRowCounts(id, tableNames);
    const tableRowCounts = rowCountResult.success ? rowCountResult.data || {} : {};
    
    // Get database size
    const sizeResult = await dbConnectionService.getDatabaseSize(id);
    const totalSize = sizeResult.success ? sizeResult.data || 0 : 0;

    const metrics = {
      tableCount: testResult.info?.tables.length || 0,
      totalSize: totalSize,
      tableRowCounts: tableRowCounts,
      totalRows: Object.values(tableRowCounts).reduce((sum, count) => sum + count, 0)
    };

    return c.json({ success: true, data: metrics });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});

// Toggle favorite status
connectionsRoutes.patch('/:id/favorite', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await connectionsCRUD.toggleFavorite(id);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 500);
  }
});


