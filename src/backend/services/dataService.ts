import mysql from 'mysql2/promise';
import { DEFAULT_MASTER_GROUPS } from '../../constants/specialGroups';
import { JSON_DATABASE_SCHEMA_DOC } from '../../data/databaseSchemaSpec';
import { User, Group, UserGroup, InternetLevel } from '../../types';

export class DataService {
  // Cache synced with MySQL Server for sub-millisecond API response
  private usersCache: User[] = [];
  private groupsCache: Group[] = [...DEFAULT_MASTER_GROUPS];
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
          username VARCHAR(100) NOT NULL UNIQUE,
          display_name VARCHAR(150) NOT NULL,
          email VARCHAR(150) NOT NULL,
          job_title VARCHAR(100) NOT NULL,
          department VARCHAR(100) NOT NULL,
          company VARCHAR(100) NOT NULL,
          device_code VARCHAR(50) NOT NULL,
          authority_group VARCHAR(100) NOT NULL,
          creation_date VARCHAR(50) NOT NULL,
          expiry_date VARCHAR(50) NULL,
          telephone_pass_code VARCHAR(50) NOT NULL,
          o365_license VARCHAR(100) NOT NULL DEFAULT 'Microsoft 365 E3',
          internet_level VARCHAR(10) NULL DEFAULT 'B'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      try {
        await pool.query(`ALTER TABLE \`users\` MODIFY COLUMN \`internet_level\` VARCHAR(10) NULL DEFAULT 'B';`);
      } catch (e) {}
      try {
        await pool.query(`ALTER TABLE \`users\` MODIFY COLUMN \`print_quota_group\` VARCHAR(100) NULL;`);
      } catch (e) {}
      try {
        await pool.query(`ALTER TABLE \`users\` MODIFY COLUMN \`vpn_status\` TINYINT(1) NULL DEFAULT 0;`);
      } catch (e) {}

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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`special_groups\` (
          \`special_group_id\` INT PRIMARY KEY,
          \`group_name\` VARCHAR(100) NOT NULL UNIQUE,
          \`category\` VARCHAR(50) NOT NULL DEFAULT 'RESOURCE',
          \`badge_color\` VARCHAR(100) NULL,
          \`description\` TEXT NULL,
          \`is_active\` TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed Initial Groups & Special Groups Master Catalog if empty
      const [groupRows]: any = await pool.query(`SELECT COUNT(*) as count FROM \`groups\`;`);
      if (groupRows[0].count === 0) {
        for (const g of DEFAULT_MASTER_GROUPS) {
          await pool.query(
            `INSERT INTO \`groups\` (group_id, group_name, description, internet_level, is_special) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE group_name=VALUES(group_name);`,
            [g.group_id, g.group_name, g.description || null, g.internet_level || null, g.is_special ? 1 : 0]
          );
        }
      }

      const [sgRows]: any = await pool.query(`SELECT COUNT(*) as count FROM \`special_groups\`;`);
      if (sgRows[0].count === 0) {
        const initialSpecialCatalog = [
          { id: 101, name: 'Internet Level A', category: 'INTERNET_LEVEL', color: 'bg-amber-100 text-amber-900 border-amber-300', desc: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ A (ไม่จำกัด)' },
          { id: 102, name: 'Internet Level B', category: 'INTERNET_LEVEL', color: 'bg-sky-100 text-sky-900 border-sky-300', desc: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ B (มาตรฐาน)' },
          { id: 103, name: 'Internet Level C', category: 'INTERNET_LEVEL', color: 'bg-slate-100 text-slate-800 border-slate-300', desc: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ C (จำกัดเฉพาะเว็บภายใน)' },
          { id: 104, name: 'Video Access', category: 'RESOURCE', color: 'bg-purple-100 text-purple-900 border-purple-200', desc: 'สิทธิ์เข้าถึงสื่อวิดีโอและสตรีมมิ่ง' },
          { id: 105, name: 'Communications', category: 'RESOURCE', color: 'bg-indigo-100 text-indigo-900 border-indigo-200', desc: 'สิทธิ์ระบบสื่อสาร โทรศัพท์ และแชทองค์กร' },
          { id: 106, name: 'Free E-mail', category: 'RESOURCE', color: 'bg-teal-100 text-teal-900 border-teal-200', desc: 'สิทธิ์รับ-ส่งอีเมลภายนอกองค์กร' },
          { id: 107, name: 'VPN Access', category: 'RESOURCE', color: 'bg-emerald-100 text-emerald-900 border-emerald-200', desc: 'สิทธิ์เชื่อมต่อเครือข่าย VPN จากภายนอก' },
          { id: 108, name: 'Printer Color (ปริ้นสี)', category: 'RESOURCE', color: 'bg-slate-100 text-slate-800 border-slate-200', desc: 'สิทธิ์สั่งพิมพ์งานสีและขาวดำ (Color Printer)' },
          { id: 109, name: 'Printer Mono (ปริ้นขาวดำ)', category: 'RESOURCE', color: 'bg-slate-100 text-slate-800 border-slate-200', desc: 'สิทธิ์สั่งพิมพ์งานขาวดำเท่านั้น (Mono Printer)' },
        ];

        for (const item of initialSpecialCatalog) {
          await pool.query(
            `INSERT INTO \`special_groups\` (special_group_id, group_name, category, badge_color, description) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE group_name=VALUES(group_name);`,
            [item.id, item.name, item.category, item.color, item.desc]
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

      const groupMap = new Map<number, Group>();
      if (groupRows.length > 0) {
        this.groupsCache = groupRows.map((g: any) => {
          const groupObj: Group = {
            group_id: Number(g.group_id),
            group_name: String(g.group_name),
            description: g.description || undefined,
            internet_level: g.internet_level || undefined,
            is_special: Boolean(g.is_special),
          };
          groupMap.set(groupObj.group_id, groupObj);
          return groupObj;
        });
      }

      const userGroupsLookup = new Map<string, Group[]>();
      ugRows.forEach((ug: any) => {
        const empId = String(ug.employee_id);
        const groupId = Number(ug.group_id);
        const groupObj = groupMap.get(groupId);
        if (groupObj) {
          if (!userGroupsLookup.has(empId)) {
            userGroupsLookup.set(empId, []);
          }
          userGroupsLookup.get(empId)!.push(groupObj);
        }
      });

      this.usersCache = userRows.map((u: any) => {
        const userGroups = userGroupsLookup.get(String(u.employee_id)) || [];
        
        // Dynamically compute derived properties from mapped groups
        const hasA = userGroups.some((g) => g.group_id === 101 || g.internet_level === 'A' || g.group_name.toLowerCase().includes('level a'));
        const hasC = userGroups.some((g) => g.group_id === 103 || g.internet_level === 'C' || g.group_name.toLowerCase().includes('level c'));
        const internetLevel: InternetLevel = hasA ? 'A' : hasC ? 'C' : 'B';

        const vpnStatus = userGroups.some((g) => g.group_id === 107 || g.group_name.toLowerCase().includes('vpn'));

        const hasColor = userGroups.some((g) => g.group_id === 108 || g.group_name.toLowerCase().includes('printer color') || g.group_name.includes('ปริ้นสี'));
        const hasMono = userGroups.some((g) => g.group_id === 109 || g.group_name.toLowerCase().includes('printer mono') || g.group_name.includes('ปริ้นขาวดำ'));
        const printQuota = hasColor ? 'Printer Color (ปริ้นสี)' : hasMono ? 'Printer Mono (ปริ้นขาวดำ)' : 'Standard Print';

        return {
          ...u,
          internet_level: u.internet_level || internetLevel,
          vpn_status: u.vpn_status !== undefined ? Boolean(u.vpn_status) : vpnStatus,
          print_quota_group: u.print_quota_group || printQuota,
          o365_license: u.o365_license || 'Microsoft 365 E3',
        };
      });

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

  public async getSpecialGroupsMasterCatalog() {
    try {
      if (this.isMySqlConnected) {
        const pool = await this.getPool();
        const [rows]: any = await pool.query(`SELECT * FROM \`special_groups\` WHERE is_active = 1 ORDER BY special_group_id ASC;`);
        if (Array.isArray(rows) && rows.length > 0) return rows;
      }
    } catch (err) {
      console.error('[MySQL Database Engine] Failed to fetch special groups catalog:', err);
    }
    return [
      { special_group_id: 101, group_name: 'Internet Level A', category: 'INTERNET_LEVEL', badge_color: 'bg-amber-100 text-amber-900 border-amber-300', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ A (ไม่จำกัด)', is_active: 1 },
      { special_group_id: 102, group_name: 'Internet Level B', category: 'INTERNET_LEVEL', badge_color: 'bg-sky-100 text-sky-900 border-sky-300', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ B (มาตรฐาน)', is_active: 1 },
      { special_group_id: 103, group_name: 'Internet Level C', category: 'INTERNET_LEVEL', badge_color: 'bg-slate-100 text-slate-800 border-slate-300', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ C (จำกัดเฉพาะเว็บภายใน)', is_active: 1 },
      { special_group_id: 104, group_name: 'Video Access', category: 'RESOURCE', badge_color: 'bg-purple-100 text-purple-900 border-purple-200', description: 'สิทธิ์เข้าถึงสื่อวิดีโอและสตรีมมิ่ง', is_active: 1 },
      { special_group_id: 105, group_name: 'Communications', category: 'RESOURCE', badge_color: 'bg-indigo-100 text-indigo-900 border-indigo-200', description: 'สิทธิ์ระบบสื่อสาร โทรศัพท์ และแชทองค์กร', is_active: 1 },
      { special_group_id: 106, group_name: 'Free E-mail', category: 'RESOURCE', badge_color: 'bg-teal-100 text-teal-900 border-teal-200', description: 'สิทธิ์รับ-ส่งอีเมลภายนอกองค์กร', is_active: 1 },
      { special_group_id: 107, group_name: 'VPN Access', category: 'RESOURCE', badge_color: 'bg-emerald-100 text-emerald-900 border-emerald-200', description: 'สิทธิ์เชื่อมต่อเครือข่าย VPN จากภายนอก', is_active: 1 },
      { special_group_id: 108, group_name: 'Printer Color (ปริ้นสี)', category: 'RESOURCE', badge_color: 'bg-slate-100 text-slate-800 border-slate-200', description: 'สิทธิ์สั่งพิมพ์งานสีและขาวดำ (Color Printer)', is_active: 1 },
      { special_group_id: 109, group_name: 'Printer Mono (ปริ้นขาวดำ)', category: 'RESOURCE', badge_color: 'bg-slate-100 text-slate-800 border-slate-200', description: 'สิทธิ์สั่งพิมพ์งานขาวดำเท่านั้น (Mono Printer)', is_active: 1 },
    ];
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
            `INSERT INTO \`users\` (employee_id, username, display_name, email, job_title, department, company, device_code, authority_group, creation_date, expiry_date, telephone_pass_code, o365_license, internet_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE username=VALUES(username), display_name=VALUES(display_name), email=VALUES(email), job_title=VALUES(job_title), department=VALUES(department), company=VALUES(company), device_code=VALUES(device_code), authority_group=VALUES(authority_group), creation_date=VALUES(creation_date), expiry_date=VALUES(expiry_date), telephone_pass_code=VALUES(telephone_pass_code), o365_license=VALUES(o365_license), internet_level=VALUES(internet_level);`,
            [
              u.employee_id,
              u.username,
              u.display_name,
              u.email,
              u.job_title,
              u.department,
              u.company,
              u.device_code,
              u.authority_group,
              u.creation_date,
              u.expiry_date || null,
              u.telephone_pass_code,
              u.o365_license || 'Microsoft 365 E3',
              u.internet_level || 'B',
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
    this.usersCache = [];
    this.userGroupsCache = [];
    this.groupsCache = [...DEFAULT_MASTER_GROUPS];

    try {
      if (this.isMySqlConnected) {
        const pool = await this.getPool();

        // Direct SQL Truncate/Delete all rows from database tables
        await pool.query(`DELETE FROM \`user_groups\`;`);
        await pool.query(`DELETE FROM \`users\`;`);
        await pool.query(`DELETE FROM \`groups\`;`);

        // Re-seed default 9 Special Groups (101-109)
        for (const g of DEFAULT_MASTER_GROUPS) {
          await pool.query(
            `INSERT INTO \`groups\` (group_id, group_name, description, internet_level, is_special) VALUES (?, ?, ?, ?, ?);`,
            [g.group_id, g.group_name, g.description || null, g.internet_level || null, g.is_special ? 1 : 0]
          );
        }

        await this.loadFromMySql();
      }

      console.log(`[Database Engine] Direct SQL Reset Executed: Cleared all users and user_groups. Preserved 9 default Special Groups.`);
      return { success: true, message: 'Database reset to clean state successfully.' };
    } catch (err: any) {
      console.error('[Database Engine] Reset error:', err?.message || err);
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
