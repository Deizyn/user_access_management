import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { User, Group, UserGroup } from '../types';
import { JsonDatabaseExport } from '../data/databaseSchemaSpec';

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
const SQLITE_STORAGE_KEY = 'user_access_dashboard_v4';

// WASM CDN URL for sql.js
const WASM_URL = 'https://sql.js.org/dist/sql-wasm.wasm';

/**
 * Initialize sql.js engine and return SQLite Database instance
 */
export async function getOrInitSqliteDb(
  initialUsers: User[],
  initialGroups: Group[],
  initialUserGroups: UserGroup[]
): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    if (!SQL) {
      SQL = await initSqlJs({
        locateFile: () => WASM_URL,
      });
    }

    // Check if SQLite binary DB exists in localStorage
    const savedBinaryBase64 = localStorage.getItem(SQLITE_STORAGE_KEY);
    if (savedBinaryBase64) {
      try {
        const binaryArray = base64ToUint8Array(savedBinaryBase64);
        dbInstance = new SQL.Database(binaryArray);
        console.log('✅ SQLite Database restored from persistent storage.');
        ensureTablesExist(dbInstance);
        return dbInstance;
      } catch (err) {
        console.warn('Could not restore binary SQLite DB, initializing fresh:', err);
      }
    }

    // Create a new in-memory SQLite Database
    dbInstance = new SQL.Database();
    ensureTablesExist(dbInstance);

    // Populate seed data into SQLite tables
    populateInitialData(dbInstance, initialUsers, initialGroups, initialUserGroups);
    persistSqliteDb(dbInstance);

    console.log('✅ SQLite Database successfully initialized and seeded.');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize SQLite engine:', error);
    // Fallback in-memory database if WASM load fails
    if (SQL) {
      dbInstance = new SQL.Database();
      ensureTablesExist(dbInstance);
      return dbInstance;
    }
    throw error;
  }
}

/**
 * Ensure SQLite tables exist with proper schemas and primary keys
 */
function ensureTablesExist(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      employee_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      internet_level TEXT NOT NULL,
      job_title TEXT NOT NULL,
      department TEXT NOT NULL,
      company TEXT NOT NULL,
      device_code TEXT NOT NULL,
      authority_group TEXT NOT NULL,
      creation_date TEXT NOT NULL,
      expiry_date TEXT,
      print_quota_group TEXT NOT NULL,
      telephone_pass_code TEXT NOT NULL,
      vpn_status INTEGER NOT NULL DEFAULT 0,
      o365_license TEXT NOT NULL DEFAULT 'Microsoft 365 E3'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      group_id INTEGER PRIMARY KEY,
      group_name TEXT NOT NULL,
      description TEXT,
      internet_level TEXT,
      is_special INTEGER DEFAULT 0,
      category TEXT DEFAULT 'ORGANIZATIONAL',
      badge_color TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_groups (
      employee_id TEXT NOT NULL,
      group_id INTEGER NOT NULL,
      PRIMARY KEY (employee_id, group_id),
      FOREIGN KEY (employee_id) REFERENCES users(employee_id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS system_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Insert or update version metadata
  db.run(`
    INSERT OR REPLACE INTO system_metadata (key, value, updated_at)
    VALUES ('db_version', '1.0', datetime('now')), ('engine', 'SQLite 3 (sql.js WebAssembly)', datetime('now'));
  `);
}

/**
 * Populate initial seed data into SQLite tables
 */
function populateInitialData(
  db: Database,
  users: User[],
  groups: Group[],
  userGroups: UserGroup[]
) {
  db.run('BEGIN TRANSACTION;');

  try {
    const stmtUser = db.prepare(`
      INSERT OR REPLACE INTO users (
        employee_id, username, display_name, email, internet_level,
        job_title, department, company, device_code, authority_group,
        creation_date, expiry_date, print_quota_group, telephone_pass_code,
        vpn_status, o365_license
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const u of users) {
      stmtUser.run([
        u.employee_id,
        u.username,
        u.display_name,
        u.email,
        u.internet_level,
        u.job_title,
        u.department,
        u.company,
        u.device_code,
        u.authority_group,
        u.creation_date,
        u.expiry_date,
        u.print_quota_group,
        u.telephone_pass_code,
        u.vpn_status ? 1 : 0,
        u.o365_license || 'Microsoft 365 E3',
      ]);
    }
    stmtUser.free();

    const stmtGroup = db.prepare(`
      INSERT OR REPLACE INTO groups (group_id, group_name, description, internet_level, is_special, category, badge_color)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    for (const g of groups) {
      stmtGroup.run([
        g.group_id,
        g.group_name,
        g.description || '',
        g.internet_level || null,
        g.is_special ? 1 : 0,
        g.category || 'ORGANIZATIONAL',
        g.badge_color || null,
      ]);
    }
    stmtGroup.free();

    const stmtUg = db.prepare(`
      INSERT OR REPLACE INTO user_groups (employee_id, group_id) VALUES (?, ?);
    `);

    for (const ug of userGroups) {
      stmtUg.run([ug.employee_id, ug.group_id]);
    }
    stmtUg.free();

    db.run('COMMIT;');
  } catch (err) {
    db.run('ROLLBACK;');
    console.error('Failed to populate initial SQLite data:', err);
  }
}

/**
 * Persist SQLite Database binary to localStorage (Base64 encoded)
 */
export function persistSqliteDb(db?: Database | null) {
  const targetDb = db || dbInstance;
  if (!targetDb) return;

  try {
    const binary = targetDb.export();
    const base64 = uint8ArrayToBase64(binary);
    localStorage.setItem(SQLITE_STORAGE_KEY, base64);
  } catch (err) {
    console.warn('Failed to persist SQLite database binary to localStorage, attempting quota cleanup:', err);
    try {
      // Clean up old binary DB keys to free up 5MB quota
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('sqlite_db') || k.includes('user_access_dashboard_v')) && k !== SQLITE_STORAGE_KEY) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      const binary = targetDb.export();
      const base64 = uint8ArrayToBase64(binary);
      localStorage.setItem(SQLITE_STORAGE_KEY, base64);
    } catch (retryErr) {
      console.warn('SQLite binary exceeds localStorage quota limit; maintaining active database in WASM memory:', retryErr);
    }
  }
}

/**
 * Query all Users from SQLite
 */
export function queryUsersFromSqlite(db?: Database | null): User[] {
  const targetDb = db || dbInstance;
  if (!targetDb) return [];

  try {
    const res = targetDb.exec(`
      SELECT employee_id, username, display_name, email, internet_level,
             job_title, department, company, device_code, authority_group,
             creation_date, expiry_date, print_quota_group, telephone_pass_code,
             vpn_status, o365_license
      FROM users;
    `);

    if (res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;

    return values.map((row) => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return {
        ...obj,
        vpn_status: Boolean(obj.vpn_status),
        o365_license: obj.o365_license || 'Microsoft 365 E3',
      } as User;
    });
  } catch (err) {
    console.error('Error querying users from SQLite:', err);
    return [];
  }
}

/**
 * Query all Groups from SQLite
 */
export function queryGroupsFromSqlite(db?: Database | null): Group[] {
  const targetDb = db || dbInstance;
  if (!targetDb) return [];

  try {
    const res = targetDb.exec(`
      SELECT group_id, group_name, description, internet_level, is_special, category, badge_color
      FROM groups;
    `);

    if (res.length === 0) return [];
    const columns = res[0].columns;
    const values = res[0].values;

    return values.map((row) => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return {
        group_id: Number(obj.group_id),
        group_name: String(obj.group_name),
        description: obj.description || undefined,
        internet_level: obj.internet_level || undefined,
        is_special: Boolean(obj.is_special),
        category: obj.category || undefined,
        badge_color: obj.badge_color || undefined,
      } as Group;
    });
  } catch (err) {
    console.error('Error querying groups from SQLite:', err);
    return [];
  }
}

/**
 * Query all User-Group associations from SQLite
 */
export function queryUserGroupsFromSqlite(db?: Database | null): UserGroup[] {
  const targetDb = db || dbInstance;
  if (!targetDb) return [];

  try {
    const res = targetDb.exec(`SELECT employee_id, group_id FROM user_groups;`);
    if (res.length === 0) return [];
    
    return res[0].values.map((row) => ({
      employee_id: String(row[0]),
      group_id: Number(row[1]),
    }));
  } catch (err) {
    console.error('Error querying user_groups from SQLite:', err);
    return [];
  }
}

/**
 * Sync Users array to SQLite table
 */
export function syncUsersToSqlite(users: User[], db?: Database | null) {
  const targetDb = db || dbInstance;
  if (!targetDb) return;

  targetDb.run('BEGIN TRANSACTION;');
  try {
    targetDb.run('DELETE FROM users;');
    const stmt = targetDb.prepare(`
      INSERT INTO users (
        employee_id, username, display_name, email, internet_level,
        job_title, department, company, device_code, authority_group,
        creation_date, expiry_date, print_quota_group, telephone_pass_code,
        vpn_status, o365_license
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const u of users) {
      stmt.run([
        u.employee_id,
        u.username,
        u.display_name,
        u.email,
        u.internet_level,
        u.job_title,
        u.department,
        u.company,
        u.device_code,
        u.authority_group,
        u.creation_date,
        u.expiry_date,
        u.print_quota_group,
        u.telephone_pass_code,
        u.vpn_status ? 1 : 0,
        u.o365_license || 'Microsoft 365 E3',
      ]);
    }
    stmt.free();
    targetDb.run('COMMIT;');
    persistSqliteDb(targetDb);
  } catch (err) {
    targetDb.run('ROLLBACK;');
    console.error('Failed to sync users to SQLite:', err);
  }
}

/**
 * Sync Groups array to SQLite table
 */
export function syncGroupsToSqlite(groups: Group[], db?: Database | null) {
  const targetDb = db || dbInstance;
  if (!targetDb) return;

  targetDb.run('BEGIN TRANSACTION;');
  try {
    targetDb.run('DELETE FROM groups;');
    const stmt = targetDb.prepare(`
      INSERT INTO groups (group_id, group_name, description, internet_level, is_special)
      VALUES (?, ?, ?, ?, ?);
    `);

    for (const g of groups) {
      stmt.run([
        g.group_id,
        g.group_name,
        g.description || '',
        g.internet_level || null,
        g.is_special ? 1 : 0,
      ]);
    }
    stmt.free();
    targetDb.run('COMMIT;');
    persistSqliteDb(targetDb);
  } catch (err) {
    targetDb.run('ROLLBACK;');
    console.error('Failed to sync groups to SQLite:', err);
  }
}

/**
 * Sync UserGroups array to SQLite table
 */
export function syncUserGroupsToSqlite(userGroups: UserGroup[], db?: Database | null) {
  const targetDb = db || dbInstance;
  if (!targetDb) return;

  targetDb.run('BEGIN TRANSACTION;');
  try {
    targetDb.run('DELETE FROM user_groups;');
    const stmt = targetDb.prepare(`
      INSERT INTO user_groups (employee_id, group_id) VALUES (?, ?);
    `);

    for (const ug of userGroups) {
      stmt.run([ug.employee_id, ug.group_id]);
    }
    stmt.free();
    targetDb.run('COMMIT;');
    persistSqliteDb(targetDb);
  } catch (err) {
    targetDb.run('ROLLBACK;');
    console.error('Failed to sync user_groups to SQLite:', err);
  }
}

/**
 * Export entire SQLite database into structured JSON format
 */
export function exportSqliteToJson(db?: Database | null): JsonDatabaseExport {
  const targetDb = db || dbInstance;
  const users = queryUsersFromSqlite(targetDb);
  const groups = queryGroupsFromSqlite(targetDb);
  const userGroups = queryUserGroupsFromSqlite(targetDb);

  return {
    $schema: 'https://ad-user-management.app/schemas/v1/database-export.schema.json',
    metadata: {
      format_version: '1.0',
      exported_at: new Date().toISOString(),
      system_name: 'Active Directory User Access Management System',
      database_type: 'SQLite 3 (WebAssembly)',
      description: 'Full SQLite database dump in structured JSON format for backup, migration, and restore.',
    },
    summary: {
      total_users: users.length,
      total_groups: groups.length,
      total_user_groups: userGroups.length,
    },
    data: {
      users: users.map((u) => ({
        employee_id: u.employee_id,
        username: u.username,
        display_name: u.display_name,
        email: u.email,
        internet_level: u.internet_level,
        job_title: u.job_title,
        department: u.department,
        company: u.company,
        device_code: u.device_code,
        authority_group: u.authority_group,
        creation_date: u.creation_date,
        expiry_date: u.expiry_date,
        print_quota_group: u.print_quota_group,
        telephone_pass_code: u.telephone_pass_code,
        vpn_status: Boolean(u.vpn_status),
        o365_license: String(u.o365_license || 'Microsoft 365 E3'),
      })),
      groups: groups.map((g) => ({
        group_id: g.group_id,
        group_name: g.group_name,
        description: g.description,
        internet_level: g.internet_level,
        is_special: g.is_special,
      })),
      user_groups: userGroups.map((ug) => ({
        employee_id: ug.employee_id,
        group_id: ug.group_id,
      })),
    },
  };
}

/**
 * Import and replace SQLite database from structured JSON input
 */
export function importSqliteFromJson(
  jsonData: any,
  db?: Database | null
): { users: User[]; groups: Group[]; userGroups: UserGroup[] } {
  const targetDb = db || dbInstance;
  if (!targetDb) {
    throw new Error('SQLite database is not initialized.');
  }

  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Invalid JSON input: Root element must be an object.');
  }

  const data = jsonData.data || jsonData;
  const rawUsers = Array.isArray(data.users) ? data.users : [];
  const rawGroups = Array.isArray(data.groups) ? data.groups : [];
  const rawUserGroups = Array.isArray(data.user_groups) ? data.user_groups : [];

  if (rawUsers.length === 0 && rawGroups.length === 0) {
    throw new Error('Invalid JSON structure: Missing "data.users" or "data.groups" arrays.');
  }

  // Parse and sanitize users
  const parsedUsers: User[] = rawUsers.map((u: any, idx: number) => ({
    employee_id: String(u.employee_id || `EMP${String(idx + 1).padStart(5, '0')}`),
    username: String(u.username || u.employee_id || `user_${idx}`),
    display_name: String(u.display_name || u.username || 'User'),
    email: String(u.email || `${u.username || 'user'}@company.com`),
    internet_level: (u.internet_level === 'A' || u.internet_level === 'C') ? u.internet_level : 'B',
    job_title: String(u.job_title || 'Staff'),
    department: String(u.department || 'General'),
    company: String(u.company || 'Company'),
    device_code: String(u.device_code || 'DEV-000'),
    authority_group: String(u.authority_group || 'Users'),
    creation_date: String(u.creation_date || new Date().toISOString().split('T')[0]),
    expiry_date: u.expiry_date ? String(u.expiry_date) : null,
    print_quota_group: String(u.print_quota_group || 'Quota_Level_1'),
    telephone_pass_code: String(u.telephone_pass_code || '1000'),
    vpn_status: Boolean(u.vpn_status),
    o365_license: String(u.o365_license || 'Microsoft 365 E3'),
  }));

  // Parse and sanitize groups
  const parsedGroups: Group[] = rawGroups.map((g: any, idx: number) => ({
    group_id: Number(g.group_id || idx + 1),
    group_name: String(g.group_name || `Group ${idx + 1}`),
    description: g.description ? String(g.description) : undefined,
    internet_level: (g.internet_level === 'A' || g.internet_level === 'B' || g.internet_level === 'C') ? g.internet_level : undefined,
    is_special: Boolean(g.is_special),
  }));

  // Parse user_groups
  const parsedUserGroups: UserGroup[] = rawUserGroups.map((ug: any) => ({
    employee_id: String(ug.employee_id),
    group_id: Number(ug.group_id),
  }));

  // Sync to SQLite tables
  syncUsersToSqlite(parsedUsers, targetDb);
  syncGroupsToSqlite(parsedGroups, targetDb);
  syncUserGroupsToSqlite(parsedUserGroups, targetDb);

  return {
    users: parsedUsers,
    groups: parsedGroups,
    userGroups: parsedUserGroups,
  };
}

/**
 * Execute raw custom SQL query on SQLite instance
 */
export function executeRawSql(
  query: string,
  db?: Database | null
): { columns: string[]; values: any[][] }[] {
  const targetDb = db || dbInstance;
  if (!targetDb) throw new Error('SQLite database is not initialized.');

  return targetDb.exec(query);
}

/**
 * Reset SQLite Database to initial state
 */
export function resetSqliteDb(
  initialUsers: User[],
  initialGroups: Group[],
  initialUserGroups: UserGroup[]
) {
  localStorage.removeItem(SQLITE_STORAGE_KEY);
  if (dbInstance) {
    dbInstance.run('BEGIN TRANSACTION;');
    try {
      dbInstance.run('DELETE FROM user_groups;');
      dbInstance.run('DELETE FROM users;');
      dbInstance.run('DELETE FROM groups;');
      dbInstance.run('COMMIT;');
    } catch (e) {
      dbInstance.run('ROLLBACK;');
    }
    populateInitialData(dbInstance, initialUsers, initialGroups, initialUserGroups);
    persistSqliteDb(dbInstance);
  }
}

/**
 * Export binary .sqlite file
 */
export function exportSqliteBinaryFile(db?: Database | null): Uint8Array {
  const targetDb = db || dbInstance;
  if (!targetDb) throw new Error('SQLite database is not initialized.');
  return targetDb.export();
}

// Helpers
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
