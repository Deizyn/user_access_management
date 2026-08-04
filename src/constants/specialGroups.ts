import { Group } from '../types';

export interface SpecialGroupConfig {
  id: number;
  name: string;
  badgeClass: string;
  category?: string;
  description?: string;
}

export const DEFAULT_SPECIAL_GROUPS_CONFIG: Record<number, SpecialGroupConfig> = {
  101: {
    id: 101,
    name: 'Internet Level A',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    category: 'INTERNET_LEVEL',
    description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ A (ไม่จำกัด)',
  },
  102: {
    id: 102,
    name: 'Internet Level B',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    category: 'INTERNET_LEVEL',
    description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ B (มาตรฐาน)',
  },
  103: {
    id: 103,
    name: 'Internet Level C',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    category: 'INTERNET_LEVEL',
    description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ C (จำกัดเฉพาะเว็บภายใน)',
  },
  104: {
    id: 104,
    name: 'Video Access',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    category: 'RESOURCE_ENTITLEMENT',
    description: 'สิทธิ์เข้าถึงสื่อวิดีโอและสตรีมมิ่ง',
  },
  105: {
    id: 105,
    name: 'Communications',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    category: 'RESOURCE_ENTITLEMENT',
    description: 'สิทธิ์ระบบสื่อสาร โทรศัพท์ และแชทองค์กร',
  },
  106: {
    id: 106,
    name: 'Free E-mail',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
    category: 'RESOURCE_ENTITLEMENT',
    description: 'สิทธิ์รับ-ส่งอีเมลภายนอกองค์กร',
  },
  107: {
    id: 107,
    name: 'VPN Access',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    category: 'NETWORK_VPN',
    description: 'สิทธิ์เชื่อมต่อเครือข่าย VPN จากภายนอก',
  },
  108: {
    id: 108,
    name: 'Printer Color (ปริ้นสี)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    category: 'PRINT_QUOTA',
    description: 'สิทธิ์สั่งพิมพ์งานสีและขาวดำ (Color Printer)',
  },
  109: {
    id: 109,
    name: 'Printer Mono (ปริ้นขาวดำ)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    category: 'PRINT_QUOTA',
    description: 'สิทธิ์สั่งพิมพ์งานขาวดำเท่านั้น (Mono Printer)',
  },
};

export const DEFAULT_MASTER_GROUPS: Group[] = [
  { group_id: 101, group_name: 'Internet Level A', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ A (ไม่จำกัด)', internet_level: 'A', is_special: true },
  { group_id: 102, group_name: 'Internet Level B', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ B (มาตรฐาน)', internet_level: 'B', is_special: true },
  { group_id: 103, group_name: 'Internet Level C', description: 'สิทธิ์ใช้งานอินเทอร์เน็ตระดับ C (จำกัดเฉพาะเว็บภายใน)', internet_level: 'C', is_special: true },
  { group_id: 104, group_name: 'Video Access', description: 'สิทธิ์เข้าถึงสื่อวิดีโอและสตรีมมิ่ง', is_special: true },
  { group_id: 105, group_name: 'Communications', description: 'สิทธิ์ระบบสื่อสาร โทรศัพท์ และแชทองค์กร', is_special: true },
  { group_id: 106, group_name: 'Free E-mail', description: 'สิทธิ์รับ-ส่งอีเมลภายนอกองค์กร', is_special: true },
  { group_id: 107, group_name: 'VPN Access', description: 'สิทธิ์เชื่อมต่อเครือข่าย VPN จากภายนอก', is_special: true },
  { group_id: 108, group_name: 'Printer Color (ปริ้นสี)', description: 'สิทธิ์สั่งพิมพ์งานสีและขาวดำ (Color Printer)', is_special: true },
  { group_id: 109, group_name: 'Printer Mono (ปริ้นขาวดำ)', description: 'สิทธิ์สั่งพิมพ์งานขาวดำเท่านั้น (Mono Printer)', is_special: true },
];

export const SPECIAL_GROUPS_CONFIG: Record<number, SpecialGroupConfig> = { ...DEFAULT_SPECIAL_GROUPS_CONFIG };

/**
 * Register a new group as Special Group dynamically at runtime or via config
 */
export function registerSpecialGroup(config: SpecialGroupConfig): void {
  SPECIAL_GROUPS_CONFIG[config.id] = config;
}

/**
 * Update Special Groups catalog directly from special_groups database table
 */
export function updateSpecialGroupsCatalog(
  dbRecords: Array<{
    special_group_id: number;
    group_name: string;
    category?: string;
    badge_color?: string;
    description?: string;
  }>
): void {
  dbRecords.forEach((rec) => {
    const gId = Number(rec.special_group_id);
    if (!isNaN(gId) && gId > 0) {
      SPECIAL_GROUPS_CONFIG[gId] = {
        id: gId,
        name: rec.group_name,
        badgeClass: rec.badge_color || 'bg-indigo-100 text-indigo-900 border-indigo-200',
        category: rec.category,
        description: rec.description,
      };
    }
  });
}

/**
 * Get all registered Special Group IDs directly from table catalog
 */
export function getSpecialGroupIds(): number[] {
  return Object.keys(SPECIAL_GROUPS_CONFIG).map((id) => Number(id));
}

export function isRegisteredSpecialGroupId(id: number): boolean {
  return SPECIAL_GROUPS_CONFIG[id] !== undefined;
}

export function isRegisteredSpecialGroupName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return Object.values(SPECIAL_GROUPS_CONFIG).some((cfg) => cfg.name.toLowerCase().trim() === lower);
}

export function getSpecialGroupConfigByName(name: string): SpecialGroupConfig | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return Object.values(SPECIAL_GROUPS_CONFIG).find((cfg) => cfg.name.toLowerCase().trim() === lower);
}

export const SPECIAL_GROUP_IDS = getSpecialGroupIds();
