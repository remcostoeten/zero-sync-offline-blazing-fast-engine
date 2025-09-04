import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createDemoSettingsFactory } from '../../shared/db/demo-settings-factory';
import { 
  populateDemoData, 
  clearDemoData, 
  clearAllData, 
  getDemoDataStats 
} from '../../shared/db/demo-data';

const demoToggleRoutes = new Hono();

const demoToggleSchema = z.object({
  userId: z.number().optional().default(1),
  clearUserData: z.boolean().optional().default(false)
});

demoToggleRoutes.get('/', async (c) => {
  try {
    const demoSettingsFactory = createDemoSettingsFactory();
    const userId = parseInt(c.req.query('userId') || '1');
    
    const settings = await demoSettingsFactory.readOrCreate(userId);
    const stats = await getDemoDataStats();
    
    return c.json({
      success: true,
      data: {
        isDemoMode: settings.isDemoMode,
        userId: settings.userId,
        description: settings.description,
        stats,
        lastUpdated: settings.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching demo mode status:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to fetch demo mode status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

demoToggleRoutes.post('/', zValidator('json', demoToggleSchema), async (c) => {
  try {
    const { userId, clearUserData } = c.req.valid('json');
    const demoSettingsFactory = createDemoSettingsFactory();
    
    const currentSettings = await demoSettingsFactory.readOrCreate(userId);
    const newDemoMode = !currentSettings.isDemoMode;
    
    if (newDemoMode) {
      console.log('🎭 Switching TO demo mode...');
      
      if (clearUserData) {
        await clearAllData();
        console.log('🗑️ Cleared all user data');
      }
      
      await populateDemoData();
      console.log('✅ Demo data populated');
      
    } else {
      console.log('🔄 Switching OFF demo mode...');
      
      await clearDemoData();
      console.log('✅ Demo data removed');
    }
    
    const updatedSettings = await demoSettingsFactory.update(userId, {
      isDemoMode: newDemoMode
    });
    
    const newStats = await getDemoDataStats();
    
    return c.json({
      success: true,
      data: {
        isDemoMode: updatedSettings.isDemoMode,
        userId: updatedSettings.userId,
        description: updatedSettings.description,
        stats: newStats,
        lastUpdated: updatedSettings.updatedAt
      },
      message: newDemoMode ? 
        'Demo mode enabled and sample data loaded' : 
        'Demo mode disabled and demo data removed'
    });
    
  } catch (error) {
    console.error('Error toggling demo mode:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to toggle demo mode',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

demoToggleRoutes.delete('/', async (c) => {
  try {
    const userId = parseInt(c.req.query('userId') || '1');
    
    await clearDemoData();
    console.log('✅ Demo data cleared');
    
    const stats = await getDemoDataStats();
    
    return c.json({
      success: true,
      data: {
        stats,
        message: 'Demo data cleared successfully'
      }
    });
    
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return c.json({
      success: false,
      error: {
        message: 'Failed to clear demo data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

export { demoToggleRoutes };
