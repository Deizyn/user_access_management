import { Group, InternetLevel, UserWithGroups } from '../types';
import { isSpecialGroup, getGroupBadgeInfo } from './specialGroupHelpers';

export type { SpecialGroupConfig } from '../constants/specialGroups';
export {
  DEFAULT_SPECIAL_GROUPS_CONFIG,
  SPECIAL_GROUPS_CONFIG,
  registerSpecialGroup,
  getSpecialGroupIds,
} from '../constants/specialGroups';

export * from './specialGroupHelpers';

export interface SpecialGroupItem {
  id: string;
  name: string;
  active: boolean;
  variant: string;
}

export function getSpecialGroupsForUser(user: UserWithGroups): SpecialGroupItem[] {
  const items: SpecialGroupItem[] = [];
  if (!user.groups || user.groups.length === 0) return items;

  user.groups.forEach((g) => {
    if (isSpecialGroup(g)) {
      const badgeInfo = getGroupBadgeInfo(g);

      items.push({
        id: `special_${g.group_id}`,
        name: badgeInfo.label,
        active: true,
        variant: badgeInfo.variant,
      });
    }
  });

  return items;
}

export function getInternetLevelBadgeClasses(level: string): string {
  switch (level?.toUpperCase()) {
    case 'A':
      return 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200';
    case 'B':
      return 'bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200';
    case 'C':
      return 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getDarkInternetLevelBadgeClasses(level: string): string {
  switch (level?.toUpperCase()) {
    case 'A':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'B':
      return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    case 'C':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getUserPrimaryInternetLevel(groups: Group[], fallbackLevel: InternetLevel = 'B'): InternetLevel {
  if (!groups || groups.length === 0) return fallbackLevel;
  const hasA = groups.some((g) => g.group_id === 101 || g.internet_level === 'A' || (g.group_name && g.group_name.toLowerCase().includes('level a')));
  if (hasA) return 'A';
  const hasC = groups.some((g) => g.group_id === 103 || g.internet_level === 'C' || (g.group_name && g.group_name.toLowerCase().includes('level c')));
  if (hasC) return 'C';
  const hasB = groups.some((g) => g.group_id === 102 || g.internet_level === 'B' || (g.group_name && g.group_name.toLowerCase().includes('level b')));
  if (hasB) return 'B';
  return fallbackLevel;
}

export function getGroupHighestInternetLevel(groups: Group[]): InternetLevel {
  return getUserPrimaryInternetLevel(groups, 'B');
}

export function getUserVpnStatus(groups: Group[]): boolean {
  if (!groups || groups.length === 0) return false;
  return groups.some((g) => g.group_id === 107 || (g.group_name && g.group_name.toLowerCase().includes('vpn')));
}

export function getUserPrintQuotaGroup(groups: Group[]): string {
  if (!groups || groups.length === 0) return 'Standard Print';
  const hasColor = groups.some(
    (g) => g.group_id === 108 || (g.group_name && (g.group_name.toLowerCase().includes('printer color') || g.group_name.includes('ปริ้นสี')))
  );
  if (hasColor) return 'Printer Color (ปริ้นสี)';
  const hasMono = groups.some(
    (g) => g.group_id === 109 || (g.group_name && (g.group_name.toLowerCase().includes('printer mono') || g.group_name.includes('ปริ้นขาวดำ')))
  );
  if (hasMono) return 'Printer Mono (ปริ้นขาวดำ)';
  return 'Standard Print';
}
