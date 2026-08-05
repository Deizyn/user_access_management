import { User, Group, UserGroup, UserWithGroups, InternetLevel } from '../types';

/**
 * Standard CSV Headers mapping for normalization (Streamlined 14 Columns)
 */
export const CSV_HEADERS = [
  'Employee ID (รหัสพนักงาน)',
  'Username (ชื่อผู้ใช้)',
  'Display Name (ชื่อ-นามสกุล)',
  'Email (อีเมล)',
  'O365 License (สิทธิ์การใช้งาน O365)',
  'Job Title (ตำแหน่งงาน)',
  'Department (แผนก)',
  'Company (บริษัท)',
  'Authority Group (กลุ่มสิทธิ์เข้าถึง)',
  'Device Code (รหัสอุปกรณ์)',
  'Groups (กลุ่มสิทธิ์/บทบาท)',
  'Creation Date (วันสร้างบัญชี)',
  'Expiry Date (วันหมดอายุ)',
  'Telephone Passcode (รหัสผ่านโทรศัพท์)',
];

/**
 * Helper to escape fields for CSV output
 */
export const escapeCsvField = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Export Users to CSV with UTF-8 BOM for Thai language Excel support (14 Columns)
 */
export function exportUsersToCSV(users: UserWithGroups[], filenamePrefix = 'user_master_directory') {
  if (!users || users.length === 0) {
    alert('ไม่มีข้อมูลสำหรับส่งออก (No data to export)');
    return;
  }

  const rows = users.map((u) => [
    escapeCsvField(u.employee_id),
    escapeCsvField(u.username),
    escapeCsvField(u.display_name),
    escapeCsvField(u.email),
    escapeCsvField(u.o365_license || 'Microsoft 365 E3'),
    escapeCsvField(u.job_title),
    escapeCsvField(u.department),
    escapeCsvField(u.company),
    escapeCsvField(u.authority_group || 'Domain Users'),
    escapeCsvField(u.device_code),
    escapeCsvField(u.groups.map((g) => g.group_name).join(', ')),
    escapeCsvField(u.creation_date),
    escapeCsvField(u.expiry_date || 'N/A'),
    escapeCsvField(u.telephone_pass_code),
  ]);

  const csvContent = '\uFEFF' + [CSV_HEADERS.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download standard CSV template for import (Streamlined 14 Columns)
 */
export function downloadCSVTemplate() {
  const sampleRows = [
    [
      escapeCsvField('EMP-88001'),
      escapeCsvField('somchai.p'),
      escapeCsvField('สมชาย ใจดี'),
      escapeCsvField('somchai.p@company.co.th'),
      escapeCsvField('Microsoft 365 E5'),
      escapeCsvField('Chief Technology Officer'),
      escapeCsvField('Information Technology'),
      escapeCsvField('Alpha Group'),
      escapeCsvField('Domain Admins'),
      escapeCsvField('DEV-9001'),
      escapeCsvField('Internet Level A, VPN Access, Printer Color (ปริ้นสี), Video Access, Communications, Free E-mail, DevOps & Cloud Engineers, IT Executive Committee'),
      escapeCsvField('2026-01-15'),
      escapeCsvField('2027-12-31'),
      escapeCsvField('889001'),
    ],
    [
      escapeCsvField('EMP-88002'),
      escapeCsvField('wanida.k'),
      escapeCsvField('วนิดา กิจเจริญ'),
      escapeCsvField('wanida.k@company.co.th'),
      escapeCsvField('Microsoft 365 E3'),
      escapeCsvField('Senior HR Operations Manager'),
      escapeCsvField('Human Resources'),
      escapeCsvField('Beta Corp'),
      escapeCsvField('Domain Users'),
      escapeCsvField('DEV-9002'),
      escapeCsvField('Internet Level B, Printer Mono (ปริ้นขาวดำ), Free E-mail, HR Operations & Payroll Mgmt, Talent Acquisition'),
      escapeCsvField('2026-02-01'),
      escapeCsvField('N/A'),
      escapeCsvField('889002'),
    ],
    [
      escapeCsvField('EMP-88003'),
      escapeCsvField('prasert.s'),
      escapeCsvField('ประเสริฐ สุขสวัสดิ์'),
      escapeCsvField('prasert.s@company.co.th'),
      escapeCsvField('Microsoft 365 E1'),
      escapeCsvField('Senior Financial Controller'),
      escapeCsvField('Finance & Accounting'),
      escapeCsvField('Alpha Group'),
      escapeCsvField('Domain Users'),
      escapeCsvField('DEV-9003'),
      escapeCsvField('Internet Level C, Printer Color (ปริ้นสี), Financial Controllers & SAP ERP, Treasury & Auditing'),
      escapeCsvField('2026-02-10'),
      escapeCsvField('2026-08-15'),
      escapeCsvField('889003'),
    ],
    [
      escapeCsvField('EMP-88004'),
      escapeCsvField('nattapong.c'),
      escapeCsvField('ณัฐพงษ์ ชัยชนะ'),
      escapeCsvField('nattapong.c@company.co.th'),
      escapeCsvField('Microsoft 365 E5'),
      escapeCsvField('Cyber Security Lead Specialist'),
      escapeCsvField('Information Security'),
      escapeCsvField('Alpha Group'),
      escapeCsvField('Security Admins'),
      escapeCsvField('DEV-9004'),
      escapeCsvField('Internet Level A, VPN Access, Printer Color (ปริ้นสี), Video Access, Communications, IT Security Ops & SOC Center, Incident Response Team'),
      escapeCsvField('2026-03-01'),
      escapeCsvField('2028-03-01'),
      escapeCsvField('889004'),
    ],
    [
      escapeCsvField('EMP-88005'),
      escapeCsvField('kamonwan.t'),
      escapeCsvField('กมลวรรณ ธนบดี'),
      escapeCsvField('kamonwan.t@company.co.th'),
      escapeCsvField('Microsoft 365 E5'),
      escapeCsvField('Digital Marketing Manager'),
      escapeCsvField('Marketing & Corporate Comms'),
      escapeCsvField('Beta Corp'),
      escapeCsvField('Domain Users'),
      escapeCsvField('DEV-9005'),
      escapeCsvField('Internet Level B, Printer Color (ปริ้นสี), Video Access, Communications, Free E-mail, Digital Content & Social Media, PR Campaign Ops'),
      escapeCsvField('2026-03-15'),
      escapeCsvField('2026-05-31'),
      escapeCsvField('889005'),
    ],
    [
      escapeCsvField('EMP-88006'),
      escapeCsvField('chaiwat.m'),
      escapeCsvField('ชัยวัฒน์ เมธาคุณ'),
      escapeCsvField('chaiwat.m@company.co.th'),
      escapeCsvField('Microsoft 365 E3'),
      escapeCsvField('Supply Chain Lead Analyst'),
      escapeCsvField('Logistics & Operations'),
      escapeCsvField('Gamma Logistics'),
      escapeCsvField('Domain Users'),
      escapeCsvField('DEV-9006'),
      escapeCsvField('Internet Level B, Printer Mono (ปริ้นขาวดำ), Warehouse & Logistics WMS, Customs & Global Trade'),
      escapeCsvField('2026-04-01'),
      escapeCsvField('N/A'),
      escapeCsvField('889006'),
    ],
    [
      escapeCsvField('EMP-88007'),
      escapeCsvField('sirimanee.r'),
      escapeCsvField('ศิริมณี รัตนไพศาล'),
      escapeCsvField('sirimanee.r@company.co.th'),
      escapeCsvField('Microsoft 365 E5'),
      escapeCsvField('Principal R&D AI Scientist'),
      escapeCsvField('Research & Development'),
      escapeCsvField('Apex Innovations'),
      escapeCsvField('Domain Admins'),
      escapeCsvField('DEV-9007'),
      escapeCsvField('Internet Level A, VPN Access, Printer Color (ปริ้นสี), Video Access, Communications, AI & Quantum Research Labs, Cloud High Performance Compute'),
      escapeCsvField('2026-04-15'),
      escapeCsvField('2029-04-15'),
      escapeCsvField('889007'),
    ],
    [
      escapeCsvField('EMP-88008'),
      escapeCsvField('thanawat.k'),
      escapeCsvField('ธนวัต กิตติคุณ'),
      escapeCsvField('thanawat.k@company.co.th'),
      escapeCsvField('Microsoft 365 E1'),
      escapeCsvField('Software Engineering Intern'),
      escapeCsvField('Information Technology'),
      escapeCsvField('Alpha Group'),
      escapeCsvField('Guest Users'),
      escapeCsvField('DEV-9008'),
      escapeCsvField('Internet Level C, Printer Mono (ปริ้นขาวดำ), Temporary Interns & Trainees, Junior Frontend Development'),
      escapeCsvField('2026-05-01'),
      escapeCsvField('2026-08-10'),
      escapeCsvField('889008'),
    ],
    [
      escapeCsvField('EMP-88009'),
      escapeCsvField('sakda.v'),
      escapeCsvField('ศักดิ์ดา วิชัยดิษฐ์'),
      escapeCsvField('sakda.v@company.co.th'),
      escapeCsvField('Microsoft 365 E3'),
      escapeCsvField('External System Consultant'),
      escapeCsvField('Information Technology'),
      escapeCsvField('Alpha Group'),
      escapeCsvField('Guest Users'),
      escapeCsvField('DEV-9009'),
      escapeCsvField('Internet Level B, Printer Mono (ปริ้นขาวดำ), Temporary Interns & Trainees, ERP Consultants'),
      escapeCsvField('2026-01-10'),
      escapeCsvField('2026-06-30'),
      escapeCsvField('889009'),
    ],
    [
      escapeCsvField('EMP-88010'),
      escapeCsvField('pimonwan.s'),
      escapeCsvField('พิมลวรรณ สุวรรณรัตน์'),
      escapeCsvField('pimonwan.s@company.co.th'),
      escapeCsvField('Microsoft 365 E5'),
      escapeCsvField('UX/UI Design Specialist'),
      escapeCsvField('Product Design'),
      escapeCsvField('Beta Corp'),
      escapeCsvField('Domain Users'),
      escapeCsvField('DEV-9010'),
      escapeCsvField('Internet Level A, Printer Color (ปริ้นสี), Video Access, Communications, Digital Content & Social Media'),
      escapeCsvField('2026-02-15'),
      escapeCsvField('N/A'),
      escapeCsvField('889010'),
    ],
  ];

  const csvContent = '\uFEFF' + [CSV_HEADERS.join(','), ...sampleRows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `user_import_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw CSV text string into a 2D array of string values
 */
export function parseCSVText(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  const text = csvText.startsWith('\uFEFF') ? csvText.slice(1) : csvText;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      currentVal = '';
      if (currentRow.some((field) => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((field) => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

export interface ParseResult {
  users: User[];
  groups: Group[];
  userGroups: UserGroup[];
  summary: {
    totalRowsParsed: number;
    newUsersCount: number;
    updatedUsersCount: number;
    duplicatesPreventedCount: number;
    newGroupsCount: number;
  };
  errors: string[];
}

/**
 * Normalizes headers to key indexes regardless of language variation
 */
function normalizeHeaderKey(header: string): string | null {
  const h = header.toLowerCase().trim();
  if (h.includes('employee') || h.includes('รหัสพนักงาน') || h === 'emp_id' || h === 'employee_id') return 'employee_id';
  if (h.includes('username') || h.includes('ชื่อผู้ใช้')) return 'username';
  if (h.includes('display') || h.includes('ชื่อ-นามสกุล') || h === 'name' || h === 'display_name') return 'display_name';
  if (h.includes('email') || h.includes('อีเมล')) return 'email';
  if (h.includes('o365') || h.includes('license') || h.includes('365') || h === 'o365_license') return 'o365_license';
  if (h.includes('job') || h.includes('ตำแหน่ง') || h === 'job_title') return 'job_title';
  if (h.includes('department') || h.includes('แผนก') || h === 'department') return 'department';
  if (h.includes('company') || h.includes('บริษัท') || h === 'company') return 'company';
  if (h.includes('authority') || h.includes('สิทธิ์เข้าถึง') || h === 'authority_group') return 'authority_group';
  if (h.includes('device') || h.includes('อุปกรณ์') || h === 'device_code') return 'device_code';
  if (h.includes('groups') || h.includes('กลุ่มสิทธิ์') || h === 'group_names') return 'groups';
  if (h.includes('creation') || h.includes('สร้าง') || h === 'creation_date') return 'creation_date';
  if (h.includes('expiry') || h.includes('หมดอายุ') || h === 'expiry_date') return 'expiry_date';
  if (h.includes('passcode') || h.includes('โทรศัพท์') || h === 'telephone_pass_code') return 'telephone_pass_code';
  return null;
}

/**
 * Normalizes raw imported CSV data into strongly-typed relational entities (User, Group, UserGroup)
 */
export function processImportCSV(
  csvText: string,
  existingUsers: User[],
  existingGroups: Group[],
  existingUserGroups: UserGroup[]
): ParseResult {
  const rows = parseCSVText(csvText);

  if (rows.length < 2) {
    return {
      users: existingUsers,
      groups: existingGroups,
      userGroups: existingUserGroups,
      summary: { totalRowsParsed: 0, newUsersCount: 0, updatedUsersCount: 0, duplicatesPreventedCount: 0, newGroupsCount: 0 },
      errors: ['ไฟล์ CSV ว่างเปล่าหรือไม่มีข้อมูลแถว (CSV file is empty or missing data rows)'],
    };
  }

  const rawHeaders = rows[0];
  const headerMap: { [key: string]: number } = {};

  rawHeaders.forEach((col, idx) => {
    const key = normalizeHeaderKey(col);
    if (key) {
      headerMap[key] = idx;
    }
  });

  if (!('employee_id' in headerMap) && !('username' in headerMap) && !('display_name' in headerMap)) {
    return {
      users: existingUsers,
      groups: existingGroups,
      userGroups: existingUserGroups,
      summary: { totalRowsParsed: 0, newUsersCount: 0, updatedUsersCount: 0, duplicatesPreventedCount: 0, newGroupsCount: 0 },
      errors: ['ไม่พบคอลัมน์หลัก เช่น Employee ID, Username หรือ Display Name ในไฟล์ CSV'],
    };
  }

  // Cloned state targets
  const updatedGroupsMap = new Map<number, Group>();
  existingGroups.forEach((g) => updatedGroupsMap.set(g.group_id, { ...g }));

  const groupNameToId = new Map<string, number>();
  existingGroups.forEach((g) => groupNameToId.set(g.group_name.toLowerCase().trim(), g.group_id));

  // Keep track of maximum group ID to allocate new IDs
  let maxGroupId = Math.max(...existingGroups.map((g) => g.group_id), 200);

  const updatedUsersMap = new Map<string, User>();
  const empIdLookupMap = new Map<string, string>();
  const usernameLookupMap = new Map<string, string>();

  existingUsers.forEach((u) => {
    updatedUsersMap.set(u.employee_id, { ...u });
    empIdLookupMap.set(u.employee_id.trim().toLowerCase(), u.employee_id);
    if (u.username) {
      usernameLookupMap.set(u.username.trim().toLowerCase(), u.employee_id);
    }
  });

  const newUserGroupsMap = new Map<string, Set<number>>();
  existingUserGroups.forEach((ug) => {
    if (!newUserGroupsMap.has(ug.employee_id)) {
      newUserGroupsMap.set(ug.employee_id, new Set());
    }
    newUserGroupsMap.get(ug.employee_id)!.add(ug.group_id);
  });

  let newUsersCount = 0;
  let updatedUsersCount = 0;
  let duplicatesPreventedCount = 0;
  let newGroupsCount = 0;
  const processedKeysInBatch = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    const getValue = (key: string, defaultVal = ''): string => {
      const idx = headerMap[key];
      if (idx !== undefined && idx < row.length && row[idx] !== undefined) {
        return row[idx].trim();
      }
      return defaultVal;
    };

    let rawEmpId = getValue('employee_id');
    let rawUsername = getValue('username');
    let displayName = getValue('display_name');

    const normEmpIdKey = rawEmpId ? rawEmpId.toLowerCase() : '';
    const normUsernameKey = rawUsername ? rawUsername.toLowerCase() : '';

    let canonicalEmpId = '';
    let isExisting = false;

    if (normEmpIdKey && empIdLookupMap.has(normEmpIdKey)) {
      canonicalEmpId = empIdLookupMap.get(normEmpIdKey)!;
      isExisting = true;
    } else if (normUsernameKey && usernameLookupMap.has(normUsernameKey)) {
      canonicalEmpId = usernameLookupMap.get(normUsernameKey)!;
      isExisting = true;
    }

    if (!canonicalEmpId) {
      if (rawEmpId) {
        canonicalEmpId = rawEmpId;
      } else if (rawUsername) {
        canonicalEmpId = rawUsername;
      } else {
        canonicalEmpId = '-';
      }
      if (canonicalEmpId !== '-') {
        empIdLookupMap.set(canonicalEmpId.toLowerCase(), canonicalEmpId);
      }
      if (rawUsername) {
        usernameLookupMap.set(rawUsername.toLowerCase(), canonicalEmpId);
      }
    }

    if (!displayName) {
      displayName = rawUsername || (canonicalEmpId !== '-' ? canonicalEmpId : '-');
    }

    let username = rawUsername;
    if (!username) {
      username = '-';
    }

    let email = getValue('email');
    if (!email) {
      email = '-';
    }

    const o365License = getValue('o365_license', '-');
    const jobTitle = getValue('job_title', '-');
    const department = getValue('department', '-');
    const company = getValue('company', '-');
    const authorityGroup = getValue('authority_group', '-');
    const deviceCode = getValue('device_code', '-');
    const creationDate = getValue('creation_date', '-');

    let expiryDateRaw = getValue('expiry_date');
    let expiryDate: string | null = null;
    if (expiryDateRaw && expiryDateRaw !== 'N/A' && expiryDateRaw !== 'null' && expiryDateRaw !== '-') {
      expiryDate = expiryDateRaw;
    }

    const telephonePassCode = getValue('telephone_pass_code', '-');

    const empIdKeyLower = canonicalEmpId.toLowerCase();
    if (isExisting || processedKeysInBatch.has(empIdKeyLower)) {
      duplicatesPreventedCount++;
      updatedUsersCount++;
    } else {
      newUsersCount++;
      processedKeysInBatch.add(empIdKeyLower);
    }

    // Process Groups Relationship from Active Directory Groups column
    const groupsText = getValue('groups');
    const userGroupSet = new Set<number>();

    // Determine internet level group ID (101=A, 102=B, 103=C)
    let internetLevel: InternetLevel = 'B';
    const groupsTextUpper = groupsText.toUpperCase();
    if (groupsTextUpper.includes('INTERNET LEVEL A') || groupsTextUpper.includes('LEVEL A')) {
      internetLevel = 'A';
    } else if (groupsTextUpper.includes('INTERNET LEVEL C') || groupsTextUpper.includes('LEVEL C')) {
      internetLevel = 'C';
    }
    const internetGroupId = internetLevel === 'A' ? 101 : internetLevel === 'B' ? 102 : 103;
    userGroupSet.add(internetGroupId);

    if (groupsText) {
      const groupTokens = groupsText.split(/[,|;]/).map((s) => s.trim()).filter((s) => s.length > 0);
      groupTokens.forEach((token) => {
        const lowerToken = token.toLowerCase();

        if (groupNameToId.has(lowerToken)) {
          userGroupSet.add(groupNameToId.get(lowerToken)!);
        } else if (lowerToken.includes('video access')) {
          userGroupSet.add(104);
        } else if (lowerToken.includes('communication')) {
          userGroupSet.add(105);
        } else if (lowerToken.includes('free e-mail') || lowerToken.includes('free email')) {
          userGroupSet.add(106);
        } else if (lowerToken.includes('vpn')) {
          userGroupSet.add(107);
        } else if (lowerToken.includes('printer color') || lowerToken.includes('ปริ้นสี')) {
          userGroupSet.add(108);
        } else if (lowerToken.includes('printer mono') || lowerToken.includes('ปริ้นขาวดำ')) {
          userGroupSet.add(109);
        } else if (lowerToken.startsWith('internet level')) {
          return;
        } else {
          maxGroupId++;
          const newGroupId = maxGroupId;
          const newGroup: Group = {
            group_id: newGroupId,
            group_name: token,
            description: `กลุ่มสิทธิ์การใช้งาน ${token} (สร้างอัตโนมัติจากการนำเข้า CSV)`,
            is_special: false,
          };
          updatedGroupsMap.set(newGroupId, newGroup);
          groupNameToId.set(lowerToken, newGroupId);
          userGroupSet.add(newGroupId);
          newGroupsCount++;
        }
      });
    }

    const normalizedUser: User = {
      employee_id: canonicalEmpId,
      username,
      display_name: displayName,
      email,
      internet_level: internetLevel,
      job_title: jobTitle,
      department,
      company,
      device_code: deviceCode,
      authority_group: authorityGroup,
      creation_date: creationDate,
      expiry_date: expiryDate,
      telephone_pass_code: telephonePassCode,
      o365_license: o365License,
    };

    updatedUsersMap.set(canonicalEmpId, normalizedUser);
    newUserGroupsMap.set(canonicalEmpId, userGroupSet);
  }

  // Reconstruct UserGroup array
  const finalUserGroups: UserGroup[] = [];
  newUserGroupsMap.forEach((gSet, empId) => {
    gSet.forEach((gId) => {
      finalUserGroups.push({
        employee_id: empId,
        group_id: gId,
      });
    });
  });

  return {
    users: Array.from(updatedUsersMap.values()),
    groups: Array.from(updatedGroupsMap.values()),
    userGroups: finalUserGroups,
    summary: {
      totalRowsParsed: rows.length - 1,
      newUsersCount,
      updatedUsersCount,
      duplicatesPreventedCount,
      newGroupsCount,
    },
    errors: [],
  };
}
