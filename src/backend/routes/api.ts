import { Router, Request, Response } from 'express';
import { dataService } from '../services/dataService';
import {
  syncFromActiveDirectory,
  syncFromSqlDatabase,
  syncAutoDiscoverPipeline,
  syncHybridMultiSourcePipeline,
} from '../../services/apiAdapter';

export const apiRouter = Router();

// 1. System Health Check Endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Enterprise User Access Management API',
    engine: 'SQLite 3 (user_access_dashboard) + Node.js Backend Engine',
    database: dataService.dbConfig,
    timestamp: new Date().toISOString(),
  });
});

// 2. Data Stats Summary Endpoint
apiRouter.get('/stats', (req: Request, res: Response) => {
  const stats = dataService.getSystemStats();
  res.json(stats);
});

// 3. Master Users Endpoint (Directly from MySQL Database Server)
apiRouter.get('/users', async (req: Request, res: Response) => {
  await dataService.loadFromMySql();
  const users = dataService.getAllUsers();
  res.json({ success: true, count: users.length, data: users });
});

// 4. Master Groups Endpoint (Directly from MySQL Database Server)
apiRouter.get('/groups', async (req: Request, res: Response) => {
  await dataService.loadFromMySql();
  const groups = dataService.getAllGroups();
  res.json({ success: true, count: groups.length, data: groups });
});

// 4.5 Master User Groups Mapping Endpoint (Directly from MySQL Database Server)
apiRouter.get('/user-groups', async (req: Request, res: Response) => {
  await dataService.loadFromMySql();
  const userGroups = dataService.getAllUserGroups();
  res.json({ success: true, count: userGroups.length, data: userGroups });
});

// 5. Database Schema Specification Endpoint
apiRouter.get('/sqlite/schema', (req: Request, res: Response) => {
  const schema = dataService.getSchemaSpec();
  res.json({ success: true, schema });
});

// 6. Direct MySQL Database Server Sync Endpoint
apiRouter.post('/db/sync', async (req: Request, res: Response) => {
  try {
    const { users, groups, userGroups } = req.body;
    if (Array.isArray(users) && Array.isArray(groups) && Array.isArray(userGroups)) {
      await dataService.syncData(users, groups, userGroups);
      console.log(`[Express API /api/db/sync] Persisted ${users.length} users directly to MySQL Server.`);
      res.json({ success: true, message: 'Data synced successfully to MySQL Server database.', count: users.length });
    } else {
      res.status(400).json({ success: false, error: 'Invalid payload: users, groups, and userGroups arrays are required.' });
    }
  } catch (err: any) {
    console.error('[Express API /api/db/sync] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to sync to MySQL database' });
  }
});

// 6.5 Direct Database Reset Endpoint (Executes DELETE/TRUNCATE SQL directly on MySQL Server)
apiRouter.post('/db/reset', async (req: Request, res: Response) => {
  try {
    const result = await dataService.resetDatabase();
    res.json(result);
  } catch (err: any) {
    console.error('[Express API /api/db/reset] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to reset MySQL database' });
  }
});

// 7. Physical SQLite Database File Download Endpoint
apiRouter.get('/db/download', (req: Request, res: Response) => {
  try {
    res.status(400).json({ success: false, error: 'MySQL mode active: SQLite file download is disabled.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to download database file' });
  }
});

// 8. MySQL Workbench Data Sync Script Endpoint
apiRouter.get('/db/mysql-dump', (req: Request, res: Response) => {
  try {
    res.status(400).json({ success: false, error: 'MySQL mode active: Dump script endpoint is disabled.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate MySQL dump script' });
  }
});

// 8. Enterprise Data Sync Trigger Endpoint
apiRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const { mode, adConfig, sqlConfig, hybridConfig } = req.body;
    const currentGroups = dataService.getAllGroups();

    let result;

    if (mode === 'active_directory' && adConfig) {
      result = await syncFromActiveDirectory(adConfig, currentGroups);
    } else if (mode === 'sql_database' && sqlConfig) {
      result = await syncFromSqlDatabase(sqlConfig, currentGroups);
    } else if (mode === 'hybrid' && hybridConfig) {
      result = await syncHybridMultiSourcePipeline(hybridConfig, currentGroups);
    } else {
      // Default to Zero-Config Auto Discover Pipeline
      result = await syncAutoDiscoverPipeline(currentGroups);
    }

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Data sync failed',
    });
  }
});
