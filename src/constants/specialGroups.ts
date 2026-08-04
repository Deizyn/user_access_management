import { Group } from '../types';

export interface SpecialGroupConfig {
  id: number;
  name: string;
  badgeClass: string;
}

export const DEFAULT_SPECIAL_GROUPS_CONFIG: Record<number, SpecialGroupConfig> = {
  101: {
    id: 101,
    name: 'Internet Level A',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  102: {
    id: 102,
    name: 'Internet Level B',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  103: {
    id: 103,
    name: 'Internet Level C',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  104: {
    id: 104,
    name: 'Video Access',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
  },
  105: {
    id: 105,
    name: 'Communications',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  },
  106: {
    id: 106,
    name: 'Free E-mail',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
  },
  107: {
    id: 107,
    name: 'VPN Access',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  108: {
    id: 108,
    name: 'Printer Color (ปริ้นสี)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  109: {
    id: 109,
    name: 'Printer Mono (ปริ้นขาวดำ)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
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
 * Get all registered Special Group IDs
 */
export function getSpecialGroupIds(): number[] {
  return Object.keys(SPECIAL_GROUPS_CONFIG).map((id) => Number(id));
}

export const SPECIAL_GROUP_IDS = getSpecialGroupIds();
