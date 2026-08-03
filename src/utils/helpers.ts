import { UserWithGroups } from '../types';

export function getExpiryStatus(expiryDateStr: string | null): 'active' | 'expiring_soon' | 'expired' | 'no_expiry' {
  if (!expiryDateStr) return 'no_expiry';
  
  const today = new Date('2026-07-22'); // Current date anchor
  const expDate = new Date(expiryDateStr);
  
  if (isNaN(expDate.getTime())) return 'no_expiry';
  
  // Calculate difference in days
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No Expiry (ไม่มีวันหมดอายุ)';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function exportUsersToCSV(users: UserWithGroups[]) {
  if (!users || users.length === 0) {
    alert('ไม่มีข้อมูลสำหรับส่งออก (No data to export)');
    return;
  }

  const headers = [
    'Employee ID (รหัสพนักงาน)',
    'Username (ชื่อผู้ใช้)',
    'Display Name (ชื่อ-นามสกุล)',
    'Email (อีเมล)',
    'Internet Level (ระดับอินเทอร์เน็ต)',
    'Level Group (กลุ่มระดับ)',
    'Job Title (ตำแหน่งงาน)',
    'Department (แผนก)',
    'Company (บริษัท)',
    'Authority Group (กลุ่มสิทธิ์เข้าถึง)',
    'Device Code (รหัสอุปกรณ์)',
    'Groups (กลุ่มสิทธิ์)',
    'Creation Date (วันสร้างบัญชี)',
    'Expiry Date (วันหมดอายุ)',
    'Print Quota Group (โควต้าการพิมพ์)',
    'Telephone Passcode (รหัสผ่านโทรศัพท์)',
    'VPN Status (สถานะ VPN)',
  ];

  const escapeCsvField = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = users.map((u) => [
    escapeCsvField(u.employee_id),
    escapeCsvField(u.username),
    escapeCsvField(u.display_name),
    escapeCsvField(u.email),
    escapeCsvField(u.internet_level),
    escapeCsvField(u.job_title),
    escapeCsvField(u.department),
    escapeCsvField(u.company),
    escapeCsvField(u.authority_group || 'Domain Users'),
    escapeCsvField(u.device_code),
    escapeCsvField(u.groups.map((g) => g.group_name).join(', ')),
    escapeCsvField(u.creation_date),
    escapeCsvField(u.expiry_date || 'N/A'),
    escapeCsvField(u.print_quota_group),
    escapeCsvField(u.telephone_pass_code),
    escapeCsvField(u.vpn_status ? 'Active' : 'Disabled'),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `user_master_directory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
