import { Group, User, UserWithGroups, InternetLevel } from '../types';
import {
  SPECIAL_GROUPS_CONFIG,
  SPECIAL_GROUP_IDS,
  isRegisteredSpecialGroupId,
  isRegisteredSpecialGroupName,
  getSpecialGroupConfigByName,
} from '../constants/specialGroups';
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
 * 100% Table-Driven Function to check if a group is a Special Group
 */
export function isSpecialGroup(groupOrIdOrName: Group | number | string | undefined | null): boolean {
  if (!groupOrIdOrName) return false;

  if (typeof groupOrIdOrName === 'number') {
    return isRegisteredSpecialGroupId(groupOrIdOrName);
  }

  if (typeof groupOrIdOrName === 'string') {
    const idNum = Number(groupOrIdOrName);
    if (!isNaN(idNum) && idNum > 0 && isRegisteredSpecialGroupId(idNum)) {
      return true;
    }
    return isRegisteredSpecialGroupName(groupOrIdOrName);
  }

  // Object case: Group
  const idNum = Number(groupOrIdOrName.group_id);
  if (!isNaN(idNum) && isRegisteredSpecialGroupId(idNum)) {
    return true;
  }

  if (groupOrIdOrName.group_name && isRegisteredSpecialGroupName(groupOrIdOrName.group_name)) {
    return true;
  }

  if (groupOrIdOrName.internet_level && idNum >= 101 && idNum <= 103) {
    return true;
  }

  return Boolean(groupOrIdOrName.is_special && idNum < 200);
}

/**
 * Determine the category of a Special Group
 */
export function getSpecialGroupCategory(group: Group | number | string): SpecialGroupCategory {
  const gId = typeof group === 'object' ? Number(group.group_id) : typeof group === 'number' ? group : Number(group);
  const name = typeof group === 'object' ? (group.group_name || '') : typeof group === 'string' ? group : '';

  const cfg = isNaN(gId) ? getSpecialGroupConfigByName(name) : SPECIAL_GROUPS_CONFIG[gId] || getSpecialGroupConfigByName(name);
  if (cfg?.category) {
    return cfg.category as SpecialGroupCategory;
  }

  if (!isSpecialGroup(group)) return 'ORGANIZATIONAL';

  const nameLower = name.toLowerCase();
  if (gId === 101 || gId === 102 || gId === 103 || nameLower.includes('internet level')) {
    return 'INTERNET_LEVEL';
  }
  if (gId === 107 || nameLower.includes('vpn')) {
    return 'NETWORK_VPN';
  }
  if (gId === 108 || gId === 109 || nameLower.includes('printer') || nameLower.includes('ปริ้น')) {
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
 * 100% Table-driven display badge info (label, CSS variant, category) for any group
 */
export function getGroupBadgeInfo(group: Group): SpecialGroupBadgeInfo {
  const idNum = Number(group.group_id);
  const config = SPECIAL_GROUPS_CONFIG[idNum] || getSpecialGroupConfigByName(group.group_name);
  const isSpecial = isSpecialGroup(group);

  if (config) {
    const category = (config.category as SpecialGroupCategory) || getSpecialGroupCategory(group);
    return {
      label: config.name || group.group_name,
      variant: config.badgeClass || 'bg-indigo-100 text-indigo-900 border-indigo-200',
      category,
      categoryLabel: getSpecialGroupCategoryLabel(category),
      isSpecial: true,
    };
  }

  if (isSpecial) {
    const category = getSpecialGroupCategory(group);
    return {
      label: group.group_name,
      variant: 'bg-violet-100 text-violet-900 border-violet-200',
      category,
      categoryLabel: getSpecialGroupCategoryLabel(category),
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
