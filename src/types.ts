export interface Group {
  group_id: number;
  group_name: string;
  description?: string;
  internet_level?: InternetLevel;
  is_special?: boolean;
}

export type InternetLevel = 'A' | 'B' | 'C';
export type O365License = 'Microsoft 365 E1' | 'Microsoft 365 E3' | 'Microsoft 365 E5' | 'Microsoft 365 E7' | 'None';

export interface User {
  employee_id: string;
  username: string;
  display_name: string;
  email: string;
  internet_level: InternetLevel;
  level_group?: string;
  job_title: string;
  department: string;
  company: string;
  device_code: string;
  authority_group: string;
  creation_date: string;
  expiry_date: string | null;
  print_quota_group: string;
  telephone_pass_code: string;
  vpn_status: boolean;
  o365_license?: O365License | string;
}

export interface UserGroup {
  employee_id: string;
  group_id: number;
}

export interface FilterState {
  search: string;
  searchTokens?: string[];
  searchCategory: 'all' | 'employee_id' | 'username' | 'display_name' | 'email' | 'job_title' | 'department' | 'device_code' | 'authority_group' | 'telephone_pass_code';
  department: string;
  departments?: string[];
  company: string;
  companies?: string[];
  internetLevel: string;
  internetLevels?: string[];
  vpnStatus: string; // 'all' | 'active' | 'disabled'
  groupId: string; // 'all' | single group_id string
  groupIds?: string[]; // multi-token level group IDs e.g. ['1', '2']
  groupLogicMode?: 'UNION' | 'INTERSECTION'; // OR vs AND for level groups
  authorityGroup: string; // 'all' | string
  authorityGroups?: string[];
  expiryStatus: string; // 'all' | 'active' | 'expiring_30' | 'expired' | 'no_expiry'
  printQuotaGroup: string;
  printQuotaGroups?: string[];
  o365License?: string;
  o365Licenses?: string[];
  isSampleOnly?: boolean;
}

export type SortField = keyof User;
export type SortOrder = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  order: SortOrder;
}

export interface UserWithGroups extends User {
  groups: Group[];
}
