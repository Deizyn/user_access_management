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

/**
 * Check whether a group or groupId is considered a Special Group
 */
export function isSpecialGroup(groupOrId: Group | number): boolean {
  if (typeof groupOrId === 'number') {
    return SPECIAL_GROUPS_CONFIG[groupOrId] !== undefined;
  }
  if (groupOrId.is_special === true) {
    return true;
  }
  const idNum = Number(groupOrId.group_id);
  if (SPECIAL_GROUPS_CONFIG[idNum] !== undefined) {
    return true;
  }
  if (groupOrId.internet_level) return true;

  const name = (groupOrId.group_name || '').toLowerCase();
  return (
    name.includes('internet level') ||
    name.includes('video access') ||
    name.includes('communication') ||
    name.includes('free e-mail') ||
    name.includes('free email') ||
    name.includes('vpn') ||
    name.includes('printer') ||
    name.includes('ปริ้น')
  );
}

/**
 * Get display badge info (label and CSS classes) for any group
 */
export function getGroupBadgeInfo(group: Group) {
  const idNum = Number(group.group_id);
  const config = SPECIAL_GROUPS_CONFIG[idNum];
  if (config) {
    return { label: config.name || group.group_name, variant: config.badgeClass };
  }

  const name = (group.group_name || '').toLowerCase();
  if (name.includes('video access')) {
    return { label: 'Video Access', variant: 'bg-purple-100 text-purple-900 border-purple-200' };
  }
  if (name.includes('communication')) {
    return { label: 'Communications', variant: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
  }
  if (name.includes('free e-mail') || name.includes('free email')) {
    return { label: 'Free E-mail', variant: 'bg-teal-100 text-teal-900 border-teal-200' };
  }
  if (name.includes('vpn')) {
    return { label: 'VPN Access', variant: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
  }
  if (name.includes('printer color') || name.includes('ปริ้นสี')) {
    return { label: 'Printer Color (ปริ้นสี)', variant: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
  if (name.includes('printer mono') || name.includes('ปริ้นขาวดำ')) {
    return { label: 'Printer Mono (ปริ้นขาวดำ)', variant: 'bg-slate-100 text-slate-800 border-slate-200' };
  }

  if (group.internet_level || name.includes('internet level')) {
    const level = group.internet_level || (name.includes('level a') ? 'A' : name.includes('level c') ? 'C' : 'B');
    const levelClass =
      level === 'A'
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : level === 'B'
        ? 'bg-sky-100 text-sky-900 border-sky-300'
        : 'bg-slate-100 text-slate-800 border-slate-300';
    return { label: `Internet Level ${level}`, variant: levelClass };
  }

  return { label: group.group_name || 'Access Group', variant: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
}
