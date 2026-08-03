import { User, Group, UserGroup, InternetLevel } from '../types';

/**
 * Configuration Types for external Enterprise Data Sources
 */

export interface ActiveDirectoryConfig {
  serverHost: string;
  domain: string;
  baseDn: string;
  bindDN: string;
  useSslLdaps: boolean;
  syncGroups: boolean;
  userFilter: string;
}

export interface SqlDatabaseConfig {
  dbType: 'sqlite' | 'postgresql' | 'mssql' | 'mysql' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  customQuery: string;
}

export interface RestApiConfig {
  endpointUrl: string;
  authType: 'none' | 'bearer' | 'basic' | 'apiKey';
  authToken?: string;
  httpMethod: 'GET' | 'POST';
  customHeaders?: string;
}

export interface RawAdUserRecord {
  sAMAccountName: string;
  employeeID?: string;
  displayName: string;
  mail?: string;
  department?: string;
  title?: string;
  company?: string;
  memberOf?: string[];
  userAccountControl?: number;
  pwdLastSet?: string;
  accountExpires?: string;
  extensionAttribute1?: string; // e.g. Internet Level 'A'|'B'|'C'
  extensionAttribute2?: string; // e.g. Device Code
  extensionAttribute3?: string; // e.g. Print Quota
  telephoneNumber?: string;
}

export interface RawSqlUserRecord {
  emp_id?: string;
  user_code?: string;
  user_name?: string;
  full_name?: string;
  email_address?: string;
  dept_name?: string;
  position_title?: string;
  company_name?: string;
  inet_level?: string;
  group_names_csv?: string;
  is_vpn_enabled?: number | boolean | string;
  expire_dt?: string;
  quota_code?: string;
  phone_pin?: string;
  device_tag?: string;
}

export interface SyncExecutionResult {
  success: boolean;
  sourceType: 'ActiveDirectory' | 'SqlDatabase' | 'RestApi';
  users: User[];
  groups: Group[];
  userGroups: UserGroup[];
  summary: {
    totalRecordsFetched: number;
    newUsersCreated: number;
    updatedUsersCount: number;
    groupsMappedCount: number;
    durationMs: number;
  };
  logMessages: string[];
}

/**
 * 1. Active Directory / LDAP Mapper & Transformer
 */
export function mapRawAdUserToNormalizedModel(
  adRecord: RawAdUserRecord,
  existingGroupsMap: Map<string, Group>,
  nextGroupIdRef: { current: number }
): { user: User; userGroups: UserGroup[]; newGroupsCreated: Group[] } {
  const empId = adRecord.employeeID || `EMP-${adRecord.sAMAccountName.toUpperCase()}`;
  const username = adRecord.sAMAccountName || empId.toLowerCase();
  const displayName = adRecord.displayName || username;
  const email = adRecord.mail || `${username}@company.co.th`;

  // Parse Internet Level from extensionAttribute1 or memberOf
  let internetLevel: InternetLevel = 'B';
  if (adRecord.extensionAttribute1) {
    const levelUpper = adRecord.extensionAttribute1.toUpperCase();
    if (levelUpper === 'A' || levelUpper === 'C') internetLevel = levelUpper as InternetLevel;
  } else if (adRecord.memberOf && adRecord.memberOf.some((m) => m.toLowerCase().includes('internet level a'))) {
    internetLevel = 'A';
  } else if (adRecord.memberOf && adRecord.memberOf.some((m) => m.toLowerCase().includes('internet level c'))) {
    internetLevel = 'C';
  }

  // VPN status check from userAccountControl or memberOf
  const isVpnActive = adRecord.memberOf
    ? adRecord.memberOf.some((m) => m.toLowerCase().includes('vpn') || m.toLowerCase().includes('remote_access'))
    : true;

  const normalizedUser: User = {
    employee_id: empId,
    username,
    display_name: displayName,
    email,
    internet_level: internetLevel,
    job_title: adRecord.title || 'Specialist',
    department: adRecord.department || 'General',
    company: adRecord.company || 'Alpha Group',
    device_code: adRecord.extensionAttribute2 || `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
    authority_group: adRecord.memberOf?.some((m) => m.includes('Domain Admins')) ? 'Domain Admins' : 'Domain Users',
    creation_date: new Date().toISOString().slice(0, 10),
    expiry_date: adRecord.accountExpires && adRecord.accountExpires !== 'never' ? adRecord.accountExpires : null,
    print_quota_group: adRecord.extensionAttribute3 || (internetLevel === 'A' ? 'VIP_UNLIMITED' : 'STD_500'),
    telephone_pass_code: adRecord.telephoneNumber || `${Math.floor(100000 + Math.random() * 900000)}`,
    vpn_status: isVpnActive,
  };

  const userGroups: UserGroup[] = [];
  const newGroupsCreated: Group[] = [];

  // Mandate Internet Level group assignment
  const internetGroupId = internetLevel === 'A' ? 101 : internetLevel === 'B' ? 102 : 103;
  userGroups.push({ employee_id: empId, group_id: internetGroupId });

  // Map memberOf LDAP Distinguished Names (DNs) e.g., "CN=DevOps,OU=Groups,DC=company,DC=com"
  if (adRecord.memberOf && Array.isArray(adRecord.memberOf)) {
    adRecord.memberOf.forEach((dn) => {
      // Extract Common Name (CN=...)
      const match = dn.match(/CN=([^,]+)/i);
      if (match && match[1]) {
        const groupName = match[1].trim();
        const lowerName = groupName.toLowerCase();

        if (lowerName.startsWith('internet level')) return; // handled by primary internet level

        if (existingGroupsMap.has(lowerName)) {
          const g = existingGroupsMap.get(lowerName)!;
          userGroups.push({ employee_id: empId, group_id: g.group_id });
        } else {
          nextGroupIdRef.current += 1;
          const newG: Group = {
            group_id: nextGroupIdRef.current,
            group_name: groupName,
            description: `ซิงก์อัตโนมัติจาก Active Directory (${dn})`,
          };
          existingGroupsMap.set(lowerName, newG);
          newGroupsCreated.push(newG);
          userGroups.push({ employee_id: empId, group_id: newG.group_id });
        }
      }
    });
  }

  return { user: normalizedUser, userGroups, newGroupsCreated };
}

/**
 * 2. SQL Database Record Mapper & Transformer
 */
export function mapRawSqlRecordToNormalizedModel(
  sqlRecord: RawSqlUserRecord,
  existingGroupsMap: Map<string, Group>,
  nextGroupIdRef: { current: number }
): { user: User; userGroups: UserGroup[]; newGroupsCreated: Group[] } {
  const empId = sqlRecord.emp_id || sqlRecord.user_code || `EMP-${Math.floor(10000 + Math.random() * 90000)}`;
  const username = sqlRecord.user_name || empId.toLowerCase();
  const displayName = sqlRecord.full_name || username;
  const email = sqlRecord.email_address || `${username}@company.co.th`;

  let internetLevel: InternetLevel = 'B';
  if (sqlRecord.inet_level) {
    const lvl = sqlRecord.inet_level.toUpperCase();
    if (lvl === 'A' || lvl === 'C') internetLevel = lvl as InternetLevel;
  }

  const vpnVal = sqlRecord.is_vpn_enabled;
  const isVpnActive = vpnVal === true || vpnVal === 1 || String(vpnVal).toLowerCase() === 'active' || String(vpnVal).toLowerCase() === 'true';

  const normalizedUser: User = {
    employee_id: empId,
    username,
    display_name: displayName,
    email,
    internet_level: internetLevel,
    job_title: sqlRecord.position_title || 'Employee',
    department: sqlRecord.dept_name || 'General',
    company: sqlRecord.company_name || 'Alpha Group',
    device_code: sqlRecord.device_tag || `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
    authority_group: 'Domain Users',
    creation_date: new Date().toISOString().slice(0, 10),
    expiry_date: sqlRecord.expire_dt || null,
    print_quota_group: sqlRecord.quota_code || 'STD_500',
    telephone_pass_code: sqlRecord.phone_pin || `${Math.floor(100000 + Math.random() * 900000)}`,
    vpn_status: isVpnActive,
  };

  const userGroups: UserGroup[] = [];
  const newGroupsCreated: Group[] = [];

  const internetGroupId = internetLevel === 'A' ? 101 : internetLevel === 'B' ? 102 : 103;
  userGroups.push({ employee_id: empId, group_id: internetGroupId });

  if (sqlRecord.group_names_csv) {
    const tokens = sqlRecord.group_names_csv.split(/[,|;]/).map((t) => t.trim()).filter(Boolean);
    tokens.forEach((gName) => {
      const lowerName = gName.toLowerCase();
      if (lowerName.startsWith('internet level')) return;

      if (existingGroupsMap.has(lowerName)) {
        const g = existingGroupsMap.get(lowerName)!;
        userGroups.push({ employee_id: empId, group_id: g.group_id });
      } else {
        nextGroupIdRef.current += 1;
        const newG: Group = {
          group_id: nextGroupIdRef.current,
          group_name: gName,
          description: `ซิงก์อัตโนมัติจาก SQL Database Table`,
        };
        existingGroupsMap.set(lowerName, newG);
        newGroupsCreated.push(newG);
        userGroups.push({ employee_id: empId, group_id: newG.group_id });
      }
    });
  }

  return { user: normalizedUser, userGroups, newGroupsCreated };
}

/**
 * Simulated Live API Fetchers for AD LDAP, SQL DB, and REST API
 */
export async function syncFromActiveDirectory(
  config: ActiveDirectoryConfig,
  currentGroups: Group[]
): Promise<SyncExecutionResult> {
  const startTime = performance.now();
  const logs: string[] = [
    `Connecting to Active Directory LDAP server: ldaps://${config.serverHost}:636`,
    `Authenticated with Bind DN: ${config.bindDN}`,
    `Executing LDAP Search query under Base DN: ${config.baseDn} (Filter: ${config.userFilter})`,
  ];

  // Mock AD records returned from directory server
  const mockAdPayload: RawAdUserRecord[] = [
    {
      sAMAccountName: 'ad.administrator',
      employeeID: 'EMP-99001',
      displayName: 'ผู้ดูแลระบบ Active Directory (AD Admin)',
      mail: 'ad.admin@company.co.th',
      department: 'IT Infrastructure',
      title: 'Principal System Engineer',
      company: 'Alpha Group',
      memberOf: [
        'CN=Domain Admins,OU=Groups,DC=company,DC=com',
        'CN=DevOps & Cloud Engineers,OU=Groups,DC=company,DC=com',
        'CN=IT Security Ops,OU=Groups,DC=company,DC=com',
      ],
      extensionAttribute1: 'A',
      extensionAttribute2: 'DEV-9901',
      extensionAttribute3: 'VIP_UNLIMITED',
    },
    {
      sAMAccountName: 'ananya.p',
      employeeID: 'EMP-99002',
      displayName: 'อนัญญา พงษ์สว่าง',
      mail: 'ananya.p@company.co.th',
      department: 'R&D Innovation',
      title: 'Senior AI Engineer',
      company: 'Alpha Group',
      memberOf: [
        'CN=R&D Innovation Lab,OU=Groups,DC=company,DC=com',
        'CN=DevOps & Cloud Engineers,OU=Groups,DC=company,DC=com',
      ],
      extensionAttribute1: 'A',
      extensionAttribute2: 'DEV-9902',
      extensionAttribute3: 'VIP_UNLIMITED',
    },
    {
      sAMAccountName: 'chatchai.s',
      employeeID: 'EMP-99003',
      displayName: 'ฉัตรชัย สมบูรณ์',
      mail: 'chatchai.s@company.co.th',
      department: 'Finance & Accounting',
      title: 'Senior Financial Analyst',
      company: 'Beta Corp',
      memberOf: [
        'CN=Finance & Audit Core,OU=Groups,DC=company,DC=com',
        'CN=Legal & Compliance Officers,OU=Groups,DC=company,DC=com',
      ],
      extensionAttribute1: 'B',
      extensionAttribute2: 'DEV-9903',
      extensionAttribute3: 'STD_500',
    },
    {
      sAMAccountName: 'external.vendor1',
      employeeID: 'EMP-99004',
      displayName: 'สมศักดิ์ ผู้รับเหมาภายนอก',
      mail: 'contractor.somsak@partner.co.th',
      department: 'Facility & Maintenance',
      title: 'Contractor Technician',
      company: 'Gamma Tech',
      memberOf: [
        'CN=External Contractors,OU=Groups,DC=company,DC=com',
        'CN=Plant Safety & EHS Team,OU=Groups,DC=company,DC=com',
      ],
      extensionAttribute1: 'C',
      accountExpires: '2026-12-31',
      extensionAttribute2: 'DEV-9904',
      extensionAttribute3: 'LIMITED_100',
    },
  ];

  logs.push(`Successfully fetched ${mockAdPayload.length} user records from Active Directory LDAP tree.`);

  const groupsMap = new Map<string, Group>();
  currentGroups.forEach((g) => groupsMap.set(g.group_name.toLowerCase(), g));
  let maxId = Math.max(...currentGroups.map((g) => g.group_id), 200);
  const nextGroupIdRef = { current: maxId };

  const finalUsers: User[] = [];
  const finalUserGroups: UserGroup[] = [];
  const createdGroups: Group[] = [];

  mockAdPayload.forEach((adRec) => {
    const { user, userGroups, newGroupsCreated } = mapRawAdUserToNormalizedModel(adRec, groupsMap, nextGroupIdRef);
    finalUsers.push(user);
    finalUserGroups.push(...userGroups);
    createdGroups.push(...newGroupsCreated);
  });

  const durationMs = Math.round(performance.now() - startTime);
  logs.push(`Normalized ${finalUsers.length} users and mapped ${finalUserGroups.length} relational user-group links.`);

  return {
    success: true,
    sourceType: 'ActiveDirectory',
    users: finalUsers,
    groups: Array.from(groupsMap.values()),
    userGroups: finalUserGroups,
    summary: {
      totalRecordsFetched: mockAdPayload.length,
      newUsersCreated: finalUsers.length,
      updatedUsersCount: 0,
      groupsMappedCount: createdGroups.length,
      durationMs,
    },
    logMessages: logs,
  };
}

export async function syncFromSqlDatabase(
  config: SqlDatabaseConfig,
  currentGroups: Group[]
): Promise<SyncExecutionResult> {
  const startTime = performance.now();
  const logs: string[] = [
    `Establishing JDBC/TCP connection to ${config.dbType.toUpperCase()} database at ${config.host}:${config.port}/${config.database}`,
    `Executing SQL Query: "${config.customQuery || 'SELECT * FROM view_user_master_directory'}"`,
  ];

  const mockSqlPayload: RawSqlUserRecord[] = [
    {
      emp_id: 'SQL-1001',
      user_name: 'narong.t',
      full_name: 'ณรงค์ ตั้งประเสริฐ (SQL DB Sync)',
      email_address: 'narong.t@company.co.th',
      dept_name: 'Supply Chain Ops',
      position_title: 'Logistics Manager',
      company_name: 'Alpha Group',
      inet_level: 'B',
      group_names_csv: 'Supply Chain & Logistics Ops, Quality & ISO Committee',
      is_vpn_enabled: 1,
      quota_code: 'STD_500',
    },
    {
      emp_id: 'SQL-1002',
      user_name: 'preecha.v',
      full_name: 'ปรีชา วงศ์สุวรรณ (SQL DB Sync)',
      email_address: 'preecha.v@company.co.th',
      dept_name: 'Quality Assurance',
      position_title: 'QA Lead Auditor',
      company_name: 'Beta Corp',
      inet_level: 'A',
      group_names_csv: 'Quality & ISO Committee, Legal & Compliance Officers',
      is_vpn_enabled: 1,
      quota_code: 'VIP_UNLIMITED',
    },
  ];

  logs.push(`Query executed successfully. Returned ${mockSqlPayload.length} rows.`);

  const groupsMap = new Map<string, Group>();
  currentGroups.forEach((g) => groupsMap.set(g.group_name.toLowerCase(), g));
  let maxId = Math.max(...currentGroups.map((g) => g.group_id), 200);
  const nextGroupIdRef = { current: maxId };

  const finalUsers: User[] = [];
  const finalUserGroups: UserGroup[] = [];

  mockSqlPayload.forEach((sqlRec) => {
    const { user, userGroups } = mapRawSqlRecordToNormalizedModel(sqlRec, groupsMap, nextGroupIdRef);
    finalUsers.push(user);
    finalUserGroups.push(...userGroups);
  });

  const durationMs = Math.round(performance.now() - startTime);

  return {
    success: true,
    sourceType: 'SqlDatabase',
    users: finalUsers,
    groups: Array.from(groupsMap.values()),
    userGroups: finalUserGroups,
    summary: {
      totalRecordsFetched: mockSqlPayload.length,
      newUsersCreated: finalUsers.length,
      updatedUsersCount: 0,
      groupsMappedCount: 0,
      durationMs,
    },
    logMessages: logs,
  };
}

export interface RawAdGroupRecord {
  cn: string;
  distinguishedName: string;
  description?: string;
  members: string[]; // List of usernames or DNs belonging to this group
}

export interface HybridPipelineConfig {
  userSourceType: 'SQL' | 'REST';
  groupSourceType: 'AD_LDAP' | 'REST';
  correlationStrategy: 'username_match' | 'employee_id_match' | 'group_name_tokens';
  sqlConfig: SqlDatabaseConfig;
  adConfig: ActiveDirectoryConfig;
  restConfig: RestApiConfig;
}

export function detectInternetLevelFromGroupNames(groupNames: string[]): InternetLevel | null {
  for (const name of groupNames) {
    const lower = name.toLowerCase();
    if (
      lower.includes('internet level a') ||
      lower.includes('level a') ||
      lower.includes('inet_a') ||
      lower.includes('inet-a') ||
      lower.includes('policy_a')
    ) {
      return 'A';
    }
    if (
      lower.includes('internet level b') ||
      lower.includes('level b') ||
      lower.includes('inet_b') ||
      lower.includes('inet-b') ||
      lower.includes('policy_b')
    ) {
      return 'B';
    }
    if (
      lower.includes('internet level c') ||
      lower.includes('level c') ||
      lower.includes('inet_c') ||
      lower.includes('inet-c') ||
      lower.includes('policy_c')
    ) {
      return 'C';
    }
  }
  return null;
}

/**
 * Fully Automated Enterprise Zero-Config Pipeline:
 * Auto-detects schema, auto-discovers User & Group endpoints across SQL & Active Directory LDAP,
 * auto-resolves Join Keys (Username/EMP ID), and auto-derives Internet Level A/B/C from Group names.
 */
export async function syncAutoDiscoverPipeline(
  currentGroups: Group[]
): Promise<SyncExecutionResult> {
  const startTime = performance.now();
  const logs: string[] = [
    `[⚡ Auto Engine] Starting Automated Enterprise Multi-Source Discovery Pipeline...`,
    `[⚡ Auto Engine] Scanning Active Directory LDAP tree (dc01.company.co.th) & SQL Database View (enterprise_uam_db)...`,
    `[⚡ Auto Engine] Auto-detecting Schema & Identity Join Keys...`,
  ];

  // 1. Auto-Discovered Users (e.g. from SQL / REST Endpoint)
  const autoUsersRaw = [
    {
      emp_id: 'EMP-AUTO-001',
      user_name: 'tanawat.k',
      full_name: 'ธนวัฒน์ กิตติสุข (Auto Discovered)',
      email_address: 'tanawat.k@company.co.th',
      dept_name: 'Information Technology',
      position_title: 'Principal Systems Architect',
      company_name: 'Alpha Group',
      ad_group_membership_raw: [
        'CN=Internet Level A,OU=LevelGroups,DC=company,DC=co,DC=th',
        'CN=Cloud Architects Core,OU=SecurityGroups,DC=company,DC=co,DC=th',
        'CN=IT Security Ops,OU=SecurityGroups,DC=company,DC=co,DC=th'
      ],
      is_vpn_enabled: 1,
    },
    {
      emp_id: 'EMP-AUTO-002',
      user_name: 'suphatra.m',
      full_name: 'สุพัตรา มงคลอนันต์ (Auto Discovered)',
      email_address: 'suphatra.m@company.co.th',
      dept_name: 'Corporate Accounting',
      position_title: 'Senior Financial Analyst',
      company_name: 'Beta Corp',
      ad_group_membership_raw: [
        'CN=Internet Level B,OU=LevelGroups,DC=company,DC=co,DC=th',
        'CN=Finance & Audit Core,OU=SecurityGroups,DC=company,DC=co,DC=th',
        'CN=ERP SAP Power Users,OU=SecurityGroups,DC=company,DC=co,DC=th'
      ],
      is_vpn_enabled: 1,
    },
    {
      emp_id: 'EMP-AUTO-003',
      user_name: 'prasert.c',
      full_name: 'ประเสริฐ ชัยชนะ (Auto Discovered)',
      email_address: 'prasert.c@company.co.th',
      dept_name: 'Factory Operations',
      position_title: 'Production Line Operator',
      company_name: 'Gamma Tech',
      ad_group_membership_raw: [
        'CN=Internet Level C,OU=LevelGroups,DC=company,DC=co,DC=th',
        'CN=Plant Safety & EHS Team,OU=SecurityGroups,DC=company,DC=co,DC=th'
      ],
      is_vpn_enabled: 0,
    },
  ];

  logs.push(`[⚡ Auto Engine] Successfully discovered ${autoUsersRaw.length} raw user entities.`);

  // 2. Pure AD Security & Level Groups
  const autoAdGroupsRaw: RawAdGroupRecord[] = [
    {
      cn: 'Internet Level A',
      distinguishedName: 'CN=Internet Level A,OU=LevelGroups,DC=company,DC=co,DC=th',
      description: 'ระดับอินเทอร์เน็ตกลุ่ม Level A - สิทธิ์ใช้งานอินเทอร์เน็ตไม่จำกัด (VIP / Executives / IT)',
      members: ['tanawat.k', 'EMP-AUTO-001'],
    },
    {
      cn: 'Internet Level B',
      distinguishedName: 'CN=Internet Level B,OU=LevelGroups,DC=company,DC=co,DC=th',
      description: 'ระดับอินเทอร์เน็ตกลุ่ม Level B - สิทธิ์ใช้งานอินเทอร์เน็ตมาตรฐานพนักงานทั่วไป',
      members: ['suphatra.m', 'EMP-AUTO-002'],
    },
    {
      cn: 'Internet Level C',
      distinguishedName: 'CN=Internet Level C,OU=LevelGroups,DC=company,DC=co,DC=th',
      description: 'ระดับอินเทอร์เน็ตกลุ่ม Level C - สิทธิ์ใช้งานจำกัดเฉพาะเว็บไซต์ภายในองค์กร',
      members: ['prasert.c', 'EMP-AUTO-003'],
    },
    {
      cn: 'Cloud Architects Core',
      distinguishedName: 'CN=Cloud Architects Core,OU=SecurityGroups,DC=company,DC=co,DC=th',
      description: 'กลุ่มสิทธิ์บริหารจัดการระบบ คลาวด์ และ Infrastructure Enterprise',
      members: ['tanawat.k'],
    },
    {
      cn: 'ERP SAP Power Users',
      distinguishedName: 'CN=ERP SAP Power Users,OU=SecurityGroups,DC=company,DC=co,DC=th',
      description: 'กลุ่มสิทธิ์เข้าถึงโมดูลการเงินและบัญชี SAP ERP System',
      members: ['suphatra.m'],
    },
  ];

  logs.push(`[⚡ Auto Engine] Successfully discovered ${autoAdGroupsRaw.length} Active Directory Groups (including Internet Level Groups A/B/C).`);

  // Master Group Map Initialization
  const groupsMap = new Map<string, Group>();
  currentGroups.forEach((g) => groupsMap.set(g.group_name.toLowerCase(), g));
  let maxId = Math.max(...currentGroups.map((g) => g.group_id), 200);

  // Register Level Groups 101, 102, 103 if not present
  if (!groupsMap.has('internet level a')) {
    groupsMap.set('internet level a', { group_id: 101, group_name: 'Internet Level A', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ A (ไม่จำกัด)' });
  }
  if (!groupsMap.has('internet level b')) {
    groupsMap.set('internet level b', { group_id: 102, group_name: 'Internet Level B', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ B (มาตรฐาน)' });
  }
  if (!groupsMap.has('internet level c')) {
    groupsMap.set('internet level c', { group_id: 103, group_name: 'Internet Level C', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ C (จำกัด)' });
  }

  // Register other discovered AD groups
  autoAdGroupsRaw.forEach((adGroup) => {
    const lower = adGroup.cn.toLowerCase();
    if (!groupsMap.has(lower)) {
      maxId++;
      groupsMap.set(lower, {
        group_id: maxId,
        group_name: adGroup.cn,
        description: adGroup.description || `Group from AD LDAP (${adGroup.distinguishedName})`,
      });
    }
  });

  const finalUsers: User[] = [];
  const finalUserGroups: UserGroup[] = [];

  // Build AD Member Lookup Index
  const adMemberIndex = new Map<string, Set<string>>();
  autoAdGroupsRaw.forEach((adG) => {
    const set = new Set(adG.members.map((m) => m.toLowerCase()));
    adMemberIndex.set(adG.cn.toLowerCase(), set);
  });

  logs.push(`[⚡ Auto Engine] Executing Auto Internet Level Inference & Cross-System Correlation...`);

  autoUsersRaw.forEach((rawUser) => {
    const empId = rawUser.emp_id;
    const username = rawUser.user_name;

    // Auto-detect Internet Level A/B/C from assigned group names or AD group memberOf strings!
    const groupNameList = [
      ...rawUser.ad_group_membership_raw,
      ...Array.from(adMemberIndex.entries())
        .filter(([_, memberSet]: [string, Set<string>]) => memberSet.has(username.toLowerCase()) || memberSet.has(empId.toLowerCase()))
        .map(([groupLowerName]) => groupLowerName)
    ];

    const detectedLevel = detectInternetLevelFromGroupNames(groupNameList) || 'B';
    logs.push(`  🎯 Auto Detected Internet Level for [${username}]: Level [${detectedLevel}] (Inferred from AD Groups/Attributes)`);

    const user: User = {
      employee_id: empId,
      username,
      display_name: rawUser.full_name,
      email: rawUser.email_address,
      internet_level: detectedLevel,
      job_title: rawUser.position_title,
      department: rawUser.dept_name,
      company: rawUser.company_name,
      device_code: `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
      authority_group: 'Domain Users',
      creation_date: new Date().toISOString().slice(0, 10),
      expiry_date: null,
      print_quota_group: detectedLevel === 'A' ? 'VIP_UNLIMITED' : 'STD_500',
      telephone_pass_code: `${Math.floor(100000 + Math.random() * 900000)}`,
      vpn_status: rawUser.is_vpn_enabled === 1,
    };

    finalUsers.push(user);

    // Auto-link to the Internet Level Group ID (101 for A, 102 for B, 103 for C)
    const levelGroupId = detectedLevel === 'A' ? 101 : detectedLevel === 'B' ? 102 : 103;
    finalUserGroups.push({ employee_id: empId, group_id: levelGroupId });

    // Auto-link to all other matching AD Security Groups
    adMemberIndex.forEach((memberSet, groupLowerName) => {
      if (memberSet.has(username.toLowerCase()) || memberSet.has(empId.toLowerCase())) {
        const mappedG = groupsMap.get(groupLowerName);
        if (mappedG && mappedG.group_id !== levelGroupId) {
          finalUserGroups.push({ employee_id: empId, group_id: mappedG.group_id });
          logs.push(`  ✓ Auto Linked User [${username}] -> Group [${mappedG.group_name}] (ID: ${mappedG.group_id})`);
        }
      }
    });
  });

  const durationMs = Math.round(performance.now() - startTime);
  logs.push(`[⚡ Auto Engine] Auto Sync completed in ${durationMs}ms! Total Users: ${finalUsers.length}, Group Memberships: ${finalUserGroups.length}`);

  return {
    success: true,
    sourceType: 'SqlDatabase',
    users: finalUsers,
    groups: Array.from(groupsMap.values()),
    userGroups: finalUserGroups,
    summary: {
      totalRecordsFetched: autoUsersRaw.length + autoAdGroupsRaw.length,
      newUsersCreated: finalUsers.length,
      updatedUsersCount: 0,
      groupsMappedCount: autoAdGroupsRaw.length,
      durationMs,
    },
    logMessages: logs,
  };
}

export async function syncHybridMultiSourcePipeline(
  config: HybridPipelineConfig,
  currentGroups: Group[]
): Promise<SyncExecutionResult> {
  const startTime = performance.now();
  const logs: string[] = [
    `[Unified Gateway] Initializing Multi-Source Pipeline: Users from [${config.userSourceType}], Groups from [${config.groupSourceType}]`,
    `[Correlation Engine] Selected Strategy: ${config.correlationStrategy.toUpperCase()}`,
  ];

  // 1. Fetch Users from User Source (e.g. SQL)
  logs.push(`[Step 1/3] Querying Users from SQL Database (${config.sqlConfig.database})...`);
  const mockSqlUsers: RawSqlUserRecord[] = [
    {
      emp_id: 'EMP-HYBRID-01',
      user_name: 'somchai.p',
      full_name: 'สมชาย ประเสริฐวิทย์ (SQL Source)',
      email_address: 'somchai.p@company.co.th',
      dept_name: 'IT & Infrastructure',
      position_title: 'Senior DevOps Architect',
      company_name: 'Alpha Group',
      inet_level: 'A',
      group_names_csv: 'DevOps & Cloud Engineers, IT Security Ops, Internet Level A',
      is_vpn_enabled: 1,
    },
    {
      emp_id: 'EMP-HYBRID-02',
      user_name: 'kanya.m',
      full_name: 'กัญญา มั่นคง (SQL Source)',
      email_address: 'kanya.m@company.co.th',
      dept_name: 'Legal & Audit',
      position_title: 'Legal Compliance Manager',
      company_name: 'Beta Corp',
      inet_level: 'B',
      group_names_csv: 'Legal & Compliance Officers, Finance & Audit Core, Internet Level B',
      is_vpn_enabled: 1,
    },
    {
      emp_id: 'EMP-HYBRID-03',
      user_name: 'wichai.k',
      full_name: 'วิชัย กิจเจริญ (SQL Source)',
      email_address: 'wichai.k@company.co.th',
      dept_name: 'Plant Operations',
      position_title: 'Safety Inspector',
      company_name: 'Gamma Tech',
      inet_level: 'C',
      group_names_csv: 'Plant Safety & EHS Team, Internet Level C',
      is_vpn_enabled: 0,
    }
  ];
  logs.push(`Fetched ${mockSqlUsers.length} raw user records from SQL.`);

  // 2. Fetch Pure Groups from Active Directory LDAP Directory
  logs.push(`[Step 2/3] Querying Groups directly from Active Directory LDAP tree (${config.adConfig.baseDn})...`);
  const mockAdGroups: RawAdGroupRecord[] = [
    {
      cn: 'Internet Level A',
      distinguishedName: 'CN=Internet Level A,OU=LevelGroups,DC=company,DC=co,DC=th',
      description: 'ระดับอินเทอร์เน็ตกลุ่ม Level A (Active Directory Group)',
      members: ['somchai.p', 'EMP-HYBRID-01'],
    },
    {
      cn: 'Internet Level B',
      distinguishedName: 'CN=Internet Level B,OU=LevelGroups,DC=company,DC=co,DC=th',
      description: 'ระดับอินเทอร์เน็ตกลุ่ม Level B (Active Directory Group)',
      members: ['kanya.m', 'EMP-HYBRID-02'],
    },
    {
      cn: 'Internet Level C',
      distinguishedName: 'CN=Internet Level C,OU=LevelGroups,DC=company,DC=co,DC=th',
      description: 'ระดับอินเทอร์เน็ตกลุ่ม Level C (Active Directory Group)',
      members: ['wichai.k', 'EMP-HYBRID-03'],
    },
    {
      cn: 'DevOps & Cloud Engineers',
      distinguishedName: 'CN=DevOps & Cloud Engineers,OU=SecurityGroups,DC=company,DC=co,DC=th',
      description: 'สิทธิ์จัดการระบบ Cloud Infrastructure และ CI/CD Pipeline (Active Directory)',
      members: ['somchai.p', 'ananya.p', 'EMP-HYBRID-01'],
    },
    {
      cn: 'IT Security Ops',
      distinguishedName: 'CN=IT Security Ops,OU=SecurityGroups,DC=company,DC=co,DC=th',
      description: 'สิทธิ์เข้าถึงระบบ Security Operations Center (Active Directory)',
      members: ['somchai.p', 'ad.administrator'],
    },
    {
      cn: 'Legal & Compliance Officers',
      distinguishedName: 'CN=Legal & Compliance Officers,OU=SecurityGroups,DC=company,DC=co,DC=th',
      description: 'สิทธิ์การเข้าถึงเอกสารทางกฎหมายและสัญญาจ้าง (Active Directory)',
      members: ['kanya.m', 'chatchai.s', 'EMP-HYBRID-02'],
    },
    {
      cn: 'Plant Safety & EHS Team',
      distinguishedName: 'CN=Plant Safety & EHS Team,OU=SecurityGroups,DC=company,DC=co,DC=th',
      description: 'สิทธิ์เข้าถึงแดชบอร์ดความปลอดภัยโรงงาน EHS (Active Directory)',
      members: ['wichai.k', 'external.vendor1', 'EMP-HYBRID-03'],
    },
  ];
  logs.push(`Fetched ${mockAdGroups.length} pure Security Groups from Active Directory LDAP.`);

  // 3. Perform Cross-Source Identity Correlation / Membership Linking
  logs.push(`[Step 3/3] Executing Correlation Join algorithm using strategy: [${config.correlationStrategy}]...`);

  const groupsMap = new Map<string, Group>();
  currentGroups.forEach((g) => groupsMap.set(g.group_name.toLowerCase(), g));
  let maxId = Math.max(...currentGroups.map((g) => g.group_id), 200);

  // Register Level Groups 101, 102, 103
  if (!groupsMap.has('internet level a')) {
    groupsMap.set('internet level a', { group_id: 101, group_name: 'Internet Level A', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ A (ไม่จำกัด)' });
  }
  if (!groupsMap.has('internet level b')) {
    groupsMap.set('internet level b', { group_id: 102, group_name: 'Internet Level B', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ B (มาตรฐาน)' });
  }
  if (!groupsMap.has('internet level c')) {
    groupsMap.set('internet level c', { group_id: 103, group_name: 'Internet Level C', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ C (จำกัด)' });
  }

  // Register all pure AD groups into the master group map
  mockAdGroups.forEach((adGroup) => {
    const lowerName = adGroup.cn.toLowerCase();
    if (!groupsMap.has(lowerName)) {
      maxId++;
      groupsMap.set(lowerName, {
        group_id: maxId,
        group_name: adGroup.cn,
        description: adGroup.description || `Group from AD (${adGroup.distinguishedName})`,
      });
    }
  });

  const finalUsers: User[] = [];
  const finalUserGroups: UserGroup[] = [];

  // Build lookup index for AD Group members
  const adGroupMemberIndex = new Map<string, Set<string>>(); // groupLowerName -> Set of member identifiers
  mockAdGroups.forEach((adG) => {
    const memberSet = new Set(adG.members.map((m) => m.toLowerCase()));
    adGroupMemberIndex.set(adG.cn.toLowerCase(), memberSet);
  });

  mockSqlUsers.forEach((sqlUser) => {
    const empId = sqlUser.emp_id || `EMP-${sqlUser.user_name?.toUpperCase()}`;
    const username = sqlUser.user_name || empId.toLowerCase();

    // Auto-detect Internet Level A/B/C from SQL attributes OR from matched AD Group names!
    const userAdGroups: string[] = [];
    adGroupMemberIndex.forEach((memberSet, groupLowerName) => {
      if (memberSet.has(username.toLowerCase()) || memberSet.has(empId.toLowerCase())) {
        userAdGroups.push(groupLowerName);
      }
    });

    if (sqlUser.group_names_csv) {
      userAdGroups.push(...sqlUser.group_names_csv.split(',').map((s) => s.trim()));
    }

    let inetLevel: InternetLevel = detectInternetLevelFromGroupNames(userAdGroups) || 'B';
    if (sqlUser.inet_level === 'A' || sqlUser.inet_level === 'B' || sqlUser.inet_level === 'C') {
      inetLevel = sqlUser.inet_level;
    }

    const user: User = {
      employee_id: empId,
      username,
      display_name: sqlUser.full_name || username,
      email: sqlUser.email_address || `${username}@company.co.th`,
      internet_level: inetLevel,
      job_title: sqlUser.position_title || 'Employee',
      department: sqlUser.dept_name || 'General',
      company: sqlUser.company_name || 'Alpha Group',
      device_code: `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
      authority_group: 'Domain Users',
      creation_date: new Date().toISOString().slice(0, 10),
      expiry_date: null,
      print_quota_group: inetLevel === 'A' ? 'VIP_UNLIMITED' : 'STD_500',
      telephone_pass_code: `${Math.floor(100000 + Math.random() * 900000)}`,
      vpn_status: sqlUser.is_vpn_enabled === 1,
    };

    finalUsers.push(user);

    // Mandatory Internet Level Group mapping
    const inetGroupId = inetLevel === 'A' ? 101 : inetLevel === 'B' ? 102 : 103;
    finalUserGroups.push({ employee_id: empId, group_id: inetGroupId });

    // Correlate SQL User with AD Groups based on strategy
    if (config.correlationStrategy === 'username_match' || config.correlationStrategy === 'employee_id_match') {
      adGroupMemberIndex.forEach((memberSet, groupLowerName) => {
        const isMember =
          memberSet.has(username.toLowerCase()) ||
          memberSet.has(empId.toLowerCase()) ||
          Array.from(memberSet).some((m) => m.includes(username.toLowerCase()));

        if (isMember) {
          const mappedGroup = groupsMap.get(groupLowerName);
          if (mappedGroup && mappedGroup.group_id !== inetGroupId) {
            finalUserGroups.push({ employee_id: empId, group_id: mappedGroup.group_id });
            logs.push(`  ✓ Linked User [${username}] -> AD Group [${mappedGroup.group_name}] (Matched key: ${username})`);
          }
        }
      });
    } else {
      // Group name token correlation
      if (sqlUser.group_names_csv) {
        const tokens = sqlUser.group_names_csv.split(',').map((t) => t.trim().toLowerCase());
        tokens.forEach((t) => {
          if (groupsMap.has(t)) {
            const mappedG = groupsMap.get(t)!;
            finalUserGroups.push({ employee_id: empId, group_id: mappedG.group_id });
            logs.push(`  ✓ Linked User [${username}] -> AD Group [${mappedG.group_name}] (Matched token: ${t})`);
          }
        });
      }
    }
  });

  const durationMs = Math.round(performance.now() - startTime);
  logs.push(`Correlation completed successfully! Linked ${finalUserGroups.length} total user-group mappings across SQL & AD.`);

  return {
    success: true,
    sourceType: 'SqlDatabase',
    users: finalUsers,
    groups: Array.from(groupsMap.values()),
    userGroups: finalUserGroups,
    summary: {
      totalRecordsFetched: mockSqlUsers.length + mockAdGroups.length,
      newUsersCreated: finalUsers.length,
      updatedUsersCount: 0,
      groupsMappedCount: mockAdGroups.length,
      durationMs,
    },
    logMessages: logs,
  };
}

