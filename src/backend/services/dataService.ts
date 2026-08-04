import mysql from 'mysql2/promise';
import { INITIAL_USERS, INITIAL_GROUPS, INITIAL_USER_GROUPS } from '../../data/initialData';
import { JSON_DATABASE_SCHEMA_DOC } from '../../data/databaseSchemaSpec';
import { User, Group, UserGroup } from '../../types';

export class DataService {
  // Cache synced with MySQL Server for sub-millisecond API response
  private usersCache: User[] = [];
  private groupsCache: Group[] = [...INITIAL_GROUPS];
  private userGroupsCache: UserGroup[] = [];
  private isMySqlConnected = false;

  public readonly dbConfig = {
    dbType: process.env.DB_TYPE || 'mysql',
    dbHost: process.env.DB_HOST || 'localhost',
    dbName: process.env.DB_NAME || 'user_access_dashboard_data',
    dbUser: process.env.DB_USER || 'root',
    dbPass: process.env.DB_PASS || 'admin123456',
    dbPort: Number(process.env.DB_PORT || 3306),
  };

  constructor() {
    this.initMySqlDatabase();
  }

  private pool: mysql.Pool | null = null;

  private async getPool() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: this.dbConfig.dbHost,
        port: this.dbConfig.dbPort,
        user: this.dbConfig.dbUser,
        password: this.dbConfig.dbPass,
        database: this.dbConfig.dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
    return this.pool;
  }

  public async initMySqlDatabase() {
    try {
      // First connect without DB specified to create database if not exists
      const initConnection = await mysql.createConnection({
        host: this.dbConfig.dbHost,
        port: this.dbConfig.dbPort,
        user: this.dbConfig.dbUser,
        password: this.dbConfig.dbPass,
      });

      await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${this.dbConfig.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await initConnection.end();

      const pool = await this.getPool();

      // Create 3NF Tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          employee_id VARCHAR(50) PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          display_name VARCHAR(150) NOT NULL,
          email VARCHAR(150) NOT NULL,
          internet_level VARCHAR(10) NOT NULL,
          job_title VARCHAR(100) NOT NULL,
          department VARCHAR(100) NOT NULL,
          company VARCHAR(100) NOT NULL,
          device_code VARCHAR(50) NOT NULL,
          authority_group VARCHAR(100) NOT NULL,
          creation_date VARCHAR(50) NOT NULL,
          expiry_date VARCHAR(50) NULL,
          print_quota_group VARCHAR(100) NOT NULL,
          telephone_pass_code VARCHAR(50) NOT NULL,
          vpn_status TINYINT(1) NOT NULL DEFAULT 0,
          o365_license VARCHAR(100) NOT NULL DEFAULT 'Microsoft 365 E3'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`groups\` (
          group_id INT PRIMARY KEY,
          group_name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          internet_level VARCHAR(10) NULL,
          is_special TINYINT(1) DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`user_groups\` (
          employee_id VARCHAR(50) NOT NULL,
          group_id INT NOT NULL,
          PRIMARY KEY (employee_id, group_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`system_metadata\` (
          \`key\` VARCHAR(50) PRIMARY KEY,
          \`value\` TEXT NOT NULL,
          \`updated_at\` VARCHAR(50) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed Initial Groups if empty
      const [groupRows]: any = await pool.query(`SELECT COUNT(*) as count FROM \`groups\`;`);
      if (groupRows[0].count === 0) {
        for (const g of INITIAL_GROUPS) {
          await pool.query(
            `INSERT INTO \`groups\` (group_id, group_name, description, internet_level, is_special) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE group_name=VALUES(group_name);`,
            [g.group_id, g.group_name, g.description || null, g.internet_level || null, g.is_special ? 1 : 0]
          );
        }
      }

      this.isMySqlConnected = true;
      console.log(`[MySQL Database Engine] Connected & initialized MySQL database '${this.dbConfig.dbName}' on ${this.dbConfig.dbHost}:${this.dbConfig.dbPort}`);
      await this.loadFromMySql();
    } catch (err: any) {
      console.error(`[MySQL Database Engine] Failed to initialize MySQL Server:`, err?.message || err);
      this.isMySqlConnected = false;
    }
  }

  public async loadFromMySql() {
    try {
      const pool = await this.getPool();
      const [userRows]: any = await pool.query(`SELECT * FROM \`users\`;`);
      const [groupRows]: any = await pool.query(`SELECT * FROM \`groups\`;`);
      const [ugRows]: any = await pool.query(`SELECT * FROM \`user_groups\`;`);

      this.usersCache = userRows.map((u: any) => ({
        ...u,
        vpn_status: Boolean(u.vpn_status),
        o365_license: u.o365_license || 'Microsoft 365 E3',
      }));

      if (groupRows.length > 0) {
        this.groupsCache = groupRows.map((g: any) => ({
          group_id: Number(g.group_id),
          group_name: String(g.group_name),
          description: g.description || undefined,
          internet_level: g.internet_level || undefined,
          is_special: Boolean(g.is_special),
        }));
      }

      this.userGroupsCache = ugRows.map((ug: any) => ({
        employee_id: String(ug.employee_id),
        group_id: Number(ug.group_id),
      }));

      console.log(`[MySQL Database Engine] Loaded ${this.usersCache.length} users, ${this.groupsCache.length} groups, ${this.userGroupsCache.length} user_groups from MySQL.`);
    } catch (err: any) {
      console.error('[MySQL Database Engine] Load error:', err?.message || err);
    }
  }

  public getAllUsers(): User[] {
    return this.usersCache;
  }

  public getAllGroups(): Group[] {
    return this.groupsCache;
  }

  public getAllUserGroups(): UserGroup[] {
    return this.userGroupsCache;
  }

  public async syncData(users: User[], groups: Group[], userGroups: UserGroup[]) {
    this.usersCache = users;
    this.groupsCache = groups;
    this.userGroupsCache = userGroups;

    try {
      const pool = await this.getPool();

      // 1. Sync Groups (Delete removed groups, then Upsert remaining)
      if (groups.length === 0) {
        await pool.query(`DELETE FROM \`groups\`;`);
      } else {
        const groupIds = groups.map((g) => g.group_id);
        await pool.query(`DELETE FROM \`groups\` WHERE group_id NOT IN (?);`, [groupIds]);
        for (const g of groups) {
          await pool.query(
            `INSERT INTO \`groups\` (group_id, group_name, description, internet_level, is_special)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE group_name=VALUES(group_name), description=VALUES(description), internet_level=VALUES(internet_level), is_special=VALUES(is_special);`,
            [g.group_id, g.group_name, g.description || null, g.internet_level || null, g.is_special ? 1 : 0]
          );
        }
      }

      // 2. Sync Users (Delete removed users, then Upsert remaining)
      if (users.length === 0) {
        await pool.query(`DELETE FROM \`user_groups\`;`);
        await pool.query(`DELETE FROM \`users\`;`);
      } else {
        const empIds = users.map((u) => u.employee_id);
        await pool.query(`DELETE FROM \`user_groups\` WHERE employee_id NOT IN (?);`, [empIds]);
        await pool.query(`DELETE FROM \`users\` WHERE employee_id NOT IN (?);`, [empIds]);

        for (const u of users) {
          await pool.query(
            `INSERT INTO \`users\` (employee_id, username, display_name, email, internet_level, job_title, department, company, device_code, authority_group, creation_date, expiry_date, print_quota_group, telephone_pass_code, vpn_status, o365_license)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE username=VALUES(username), display_name=VALUES(display_name), email=VALUES(email), internet_level=VALUES(internet_level), job_title=VALUES(job_title), department=VALUES(department), company=VALUES(company), device_code=VALUES(device_code), authority_group=VALUES(authority_group), creation_date=VALUES(creation_date), expiry_date=VALUES(expiry_date), print_quota_group=VALUES(print_quota_group), telephone_pass_code=VALUES(telephone_pass_code), vpn_status=VALUES(vpn_status), o365_license=VALUES(o365_license);`,
            [
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
              u.expiry_date || null,
              u.print_quota_group,
              u.telephone_pass_code,
              u.vpn_status ? 1 : 0,
              u.o365_license || 'Microsoft 365 E3',
            ]
          );
        }
      }

      // 3. Sync User Groups Mapping (Clear first, then re-insert active relationships)
      await pool.query(`DELETE FROM \`user_groups\`;`);
      if (userGroups.length > 0) {
        for (const ug of userGroups) {
          await pool.query(
            `INSERT IGNORE INTO \`user_groups\` (employee_id, group_id) VALUES (?, ?);`,
            [ug.employee_id, Number(ug.group_id)]
          );
        }
      }

      console.log(`[MySQL Database Engine] Successfully synced state (${users.length} users, ${groups.length} groups, ${userGroups.length} user_groups) to MySQL Server.`);
    } catch (err: any) {
      console.error('[MySQL Database Engine] Sync error:', err?.message || err);
      throw err;
    }
  }

  public async resetDatabase() {
    try {
      const pool = await this.getPool();

      // Direct SQL Truncate/Delete all rows from database tables
      await pool.query(`DELETE FROM \`user_groups\`;`);
      await pool.query(`DELETE FROM \`users\`;`);
      await pool.query(`DELETE FROM \`groups\`;`);

      // Re-seed default 9 Special Groups (101-109)
      for (const g of INITIAL_GROUPS) {
        await pool.query(
          `INSERT INTO \`groups\` (group_id, group_name, description, internet_level, is_special) VALUES (?, ?, ?, ?, ?);`,
          [g.group_id, g.group_name, g.description || null, g.internet_level || null, g.is_special ? 1 : 0]
        );
      }

      this.usersCache = [];
      this.groupsCache = [...INITIAL_GROUPS];
      this.userGroupsCache = [];

      console.log(`[MySQL Database Engine] Direct SQL Reset Executed: Deleted all rows from 'users' and 'user_groups' tables.`);
      return { success: true, message: 'MySQL Database reset to initial state successfully.' };
    } catch (err: any) {
      console.error('[MySQL Database Engine] Reset error:', err?.message || err);
      throw err;
    }
  }

  public getSystemStats() {
    const users = this.getAllUsers();
    const groups = this.getAllGroups();

    return {
      totalUsers: users.length,
      activeVpn: users.filter((u) => u.vpn_status).length,
      levelAUsers: users.filter((u) => u.internet_level === 'A').length,
      totalGroups: groups.length,
      sqliteStatus: 'MYSQL_EXCLUSIVE',
      dbConfig: {
        database: this.dbConfig.dbName,
        user: this.dbConfig.dbUser,
        host: this.dbConfig.dbHost,
        port: this.dbConfig.dbPort,
        engine: 'MySQL 8 Database Server (Exclusive)',
      },
      timestamp: new Date().toISOString(),
    };
  }

  public getSchemaSpec() {
    return JSON_DATABASE_SCHEMA_DOC;
  }
}

export const dataService = new DataService();
