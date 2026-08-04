import { Group, User, UserWithGroups, InternetLevel } from '../types';
import { SPECIAL_GROUPS_CONFIG, SPECIAL_GROUP_IDS } from '../constants/specialGroups';
export { SPECIAL_GROUP_IDS };

export type SpecialGroupCategory =
  | 'INTERNET_LEVEL'
  | 'NETWORK_VPN'
  | 'PRINT_QUOTA'
  | 'RESOURCE_ENTITLEMENT'
  | 'ORGANIZATIONAL';

export interface SpecialGroupBadgeInfo {
  label: string;
  variant: string;
  category: SpecialGroupCategory;
  categoryLabel: string;
  isSpecial: boolean;
}

/**
 * Dedicated function to check if a group is a Special Group
 */
export function isSpecialGroup(groupOrIdOrName: Group | number | string | undefined | null): boolean {
  if (!groupOrIdOrName) return false;

  if (typeof groupOrIdOrName === 'number') {
    return SPECIAL_GROUP_IDS.includes(groupOrIdOrName) || SPECIAL_GROUPS_CONFIG[groupOrIdOrName] !== undefined;
  }

  if (typeof groupOrIdOrName === 'string') {
    const idNum = Number(groupOrIdOrName);
    if (!isNaN(idNum) && idNum > 0) {
      if (SPECIAL_GROUP_IDS.includes(idNum) || SPECIAL_GROUPS_CONFIG[idNum] !== undefined) return true;
    }
    const nameLower = groupOrIdOrName.toLowerCase();
    return (
      nameLower.includes('internet level') ||
      nameLower.includes('video access') ||
      nameLower.includes('communication') ||
      nameLower.includes('free e-mail') ||
      nameLower.includes('free email') ||
      nameLower.includes('vpn access') ||
      nameLower.includes('vpn') ||
      nameLower.includes('printer color') ||
      nameLower.includes('printer mono') ||
      nameLower.includes('ปริ้นสี') ||
      nameLower.includes('ปริ้นขาวดำ') ||
      nameLower.startsWith('special')
    );
  }

  // Object case: Group
  const idNum = Number(groupOrIdOrName.group_id);
  if (!isNaN(idNum) && (SPECIAL_GROUP_IDS.includes(idNum) || SPECIAL_GROUPS_CONFIG[idNum] !== undefined)) {
    return true;
  }

  if (groupOrIdOrName.internet_level) return true;

  const name = (groupOrIdOrName.group_name || '').toLowerCase();
  if (
    name.includes('internet level') ||
    name.includes('video access') ||
    name.includes('communication') ||
    name.includes('free e-mail') ||
    name.includes('free email') ||
    name.includes('vpn access') ||
    name.includes('vpn') ||
    name.includes('printer color') ||
    name.includes('printer mono') ||
    name.includes('ปริ้นสี') ||
    name.includes('ปริ้นขาวดำ')
  ) {
    return true;
  }

  if (groupOrIdOrName.is_special === true && idNum < 200) return true;

  return false;
}

/**
 * Determine the category of a Special Group
 */
export function getSpecialGroupCategory(group: Group | number | string): SpecialGroupCategory {
  if (!isSpecialGroup(group)) return 'ORGANIZATIONAL';

  const gId = typeof group === 'object' ? Number(group.group_id) : typeof group === 'number' ? group : Number(group);
  const name = typeof group === 'object' ? (group.group_name || '').toLowerCase() : typeof group === 'string' ? group.toLowerCase() : '';

  if (gId === 101 || gId === 102 || gId === 103 || name.includes('internet level')) {
    return 'INTERNET_LEVEL';
  }
  if (gId === 107 || name.includes('vpn')) {
    return 'NETWORK_VPN';
  }
  if (gId === 108 || gId === 109 || name.includes('printer') || name.includes('ปริ้น')) {
    return 'PRINT_QUOTA';
  }
  return 'RESOURCE_ENTITLEMENT';
}

/**
 * Human-readable Thai category labels
 */
export function getSpecialGroupCategoryLabel(category: SpecialGroupCategory): string {
  switch (category) {
    case 'INTERNET_LEVEL':
      return 'สิทธิ์อินเทอร์เน็ต (Internet Level)';
    case 'NETWORK_VPN':
      return 'สิทธิ์เชื่อมต่อเครือข่าย (VPN Access)';
    case 'PRINT_QUOTA':
      return 'สิทธิ์โควต้าสิ่งพิมพ์ (Print Quota)';
    case 'RESOURCE_ENTITLEMENT':
      return 'สิทธิ์พิเศษทรัพยากร (Special Resource)';
    case 'ORGANIZATIONAL':
      return 'กลุ่มสิทธิ์ตามโครงสร้างองค์กร (Organizational Group)';
  }
}

/**
 * Get display badge info (label, CSS variant, category) for any group
 */
export function getGroupBadgeInfo(group: Group): SpecialGroupBadgeInfo {
  const isSpecial = isSpecialGroup(group);
  const category = getSpecialGroupCategory(group);
  const categoryLabel = getSpecialGroupCategoryLabel(category);
  const idNum = Number(group.group_id);

  const config = SPECIAL_GROUPS_CONFIG[idNum];
  if (config) {
    return {
      label: config.name || group.group_name,
      variant: config.badgeClass,
      category,
      categoryLabel,
      isSpecial: true,
    };
  }

  const name = (group.group_name || '').toLowerCase();

  if (name.includes('video access')) {
    return {
      label: 'Video Access',
      variant: 'bg-purple-100 text-purple-900 border-purple-200',
      category: 'RESOURCE_ENTITLEMENT',
      categoryLabel: getSpecialGroupCategoryLabel('RESOURCE_ENTITLEMENT'),
      isSpecial: true,
    };
  }
  if (name.includes('communication')) {
    return {
      label: 'Communications',
      variant: 'bg-indigo-100 text-indigo-900 border-indigo-200',
      category: 'RESOURCE_ENTITLEMENT',
      categoryLabel: getSpecialGroupCategoryLabel('RESOURCE_ENTITLEMENT'),
      isSpecial: true,
    };
  }
  if (name.includes('free e-mail') || name.includes('free email')) {
    return {
      label: 'Free E-mail',
      variant: 'bg-teal-100 text-teal-900 border-teal-200',
      category: 'RESOURCE_ENTITLEMENT',
      categoryLabel: getSpecialGroupCategoryLabel('RESOURCE_ENTITLEMENT'),
      isSpecial: true,
    };
  }
  if (name.includes('vpn')) {
    return {
      label: 'VPN Access',
      variant: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      category: 'NETWORK_VPN',
      categoryLabel: getSpecialGroupCategoryLabel('NETWORK_VPN'),
      isSpecial: true,
    };
  }
  if (name.includes('printer color') || name.includes('ปริ้นสี')) {
    return {
      label: 'Printer Color (ปริ้นสี)',
      variant: 'bg-slate-100 text-slate-800 border-slate-200',
      category: 'PRINT_QUOTA',
      categoryLabel: getSpecialGroupCategoryLabel('PRINT_QUOTA'),
      isSpecial: true,
    };
  }
  if (name.includes('printer mono') || name.includes('ปริ้นขาวดำ')) {
    return {
      label: 'Printer Mono (ปริ้นขาวดำ)',
      variant: 'bg-slate-100 text-slate-800 border-slate-200',
      category: 'PRINT_QUOTA',
      categoryLabel: getSpecialGroupCategoryLabel('PRINT_QUOTA'),
      isSpecial: true,
    };
  }
  if (group.internet_level || name.includes('internet level')) {
    const level = group.internet_level || (name.includes('level a') ? 'A' : name.includes('level c') ? 'C' : 'B');
    const levelClass =
      level === 'A'
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : level === 'B'
        ? 'bg-sky-100 text-sky-900 border-sky-300'
        : 'bg-slate-100 text-slate-800 border-slate-300';
    return {
      label: `Internet Level ${level}`,
      variant: levelClass,
      category: 'INTERNET_LEVEL',
      categoryLabel: getSpecialGroupCategoryLabel('INTERNET_LEVEL'),
      isSpecial: true,
    };
  }

  if (isSpecial) {
    return {
      label: group.group_name,
      variant: 'bg-violet-100 text-violet-900 border-violet-200',
      category,
      categoryLabel,
      isSpecial: true,
    };
  }

  return {
    label: group.group_name || 'Access Group',
    variant: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    category: 'ORGANIZATIONAL',
    categoryLabel: getSpecialGroupCategoryLabel('ORGANIZATIONAL'),
    isSpecial: false,
  };
}

/**
 * Reconciles and ensures ALL Special Groups applicable to a user are explicitly present in their `groups` array
 */
export function ensureUserSpecialGroupsInAssigned(
  assignedGroups: Group[],
  user: User,
  allMasterGroups: Group[] = []
): Group[] {
  const result: Group[] = [];
  const addedIds = new Set<number>();

  // Helper to add group with is_special set
  const addGroup = (g: Group) => {
    if (!addedIds.has(g.group_id)) {
      addedIds.add(g.group_id);
      const isSpec = isSpecialGroup(g);
      result.push({
        ...g,
        is_special: isSpec,
      });
    }
  };

  // 1. First add existing assigned groups from user_groups junction
  assignedGroups.forEach((g) => addGroup(g));

  // 2. Ensure Internet Level Special Group (101=A, 102=B, 103=C)
  const level: InternetLevel = user.internet_level || 'B';
  const internetGroupId = level === 'A' ? 101 : level === 'B' ? 102 : 103;
  if (!addedIds.has(internetGroupId)) {
    const masterIntGroup = allMasterGroups.find((g) => g.group_id === internetGroupId);
    if (masterIntGroup) {
      addGroup(masterIntGroup);
    } else {
      addGroup({
        group_id: internetGroupId,
        group_name: `Internet Level ${level}`,
        description: `สิทธิ์ใช้งานอินเทอร์เน็ตระดับ ${level}`,
        internet_level: level,
        is_special: true,
      });
    }
  }

  // 3. Ensure VPN Access Special Group (107) if vpn_status is true
  if (user.vpn_status && !addedIds.has(107)) {
    const masterVpnGroup = allMasterGroups.find((g) => g.group_id === 107);
    if (masterVpnGroup) {
      addGroup(masterVpnGroup);
    } else {
      addGroup({
        group_id: 107,
        group_name: 'VPN Access',
        description: 'สิทธิ์เชื่อมต่อเครือข่าย VPN จากภายนอก',
        is_special: true,
      });
    }
  }

  // 4. Ensure Printer Special Group (108 Color / 109 Mono) if print_quota_group is set
  const quota = (user.print_quota_group || '').toLowerCase();
  if ((quota.includes('color') || quota.includes('ปริ้นสี') || quota.includes('unlimited') || quota.includes('ขาวดำ/ปริ้นสี')) && !addedIds.has(108)) {
    const masterColor = allMasterGroups.find((g) => g.group_id === 108);
    if (masterColor) addGroup(masterColor);
    else {
      addGroup({
        group_id: 108,
        group_name: 'Printer Color (ปริ้นสี)',
        description: 'สิทธิ์สั่งพิมพ์งานสีและขาวดำ (Color Printer)',
        is_special: true,
      });
    }
  } else if ((quota.includes('mono') || quota.includes('ขาวดำ')) && !addedIds.has(109)) {
    const masterMono = allMasterGroups.find((g) => g.group_id === 109);
    if (masterMono) addGroup(masterMono);
    else {
      addGroup({
        group_id: 109,
        group_name: 'Printer Mono (ปริ้นขาวดำ)',
        description: 'สิทธิ์สั่งพิมพ์งานขาวดำเท่านั้น (Mono Printer)',
        is_special: true,
      });
    }
  }

  return result;
}

/**
 * Separate a list of groups into Special Groups and Organizational Level Groups
 */
export function partitionGroups(groups: Group[]): { specialGroups: Group[]; organizationalGroups: Group[] } {
  const specialGroups: Group[] = [];
  const organizationalGroups: Group[] = [];

  groups.forEach((g) => {
    if (isSpecialGroup(g)) {
      specialGroups.push(g);
    } else {
      organizationalGroups.push(g);
    }
  });

  return { specialGroups, organizationalGroups };
}
