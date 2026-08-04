import { useState, useMemo } from 'react';
import { User, Group, UserGroup, UserWithGroups, FilterState, SortState, InternetLevel } from '../../types';
import { getExpiryStatus } from '../../utils/helpers';
import { getUserPrimaryInternetLevel, getUserVpnStatus, getUserPrintQuotaGroup } from '../../utils/groupHelpers';

export function useUserFilters(users: User[], groups: Group[], userGroups: UserGroup[]) {
  // Join Users with Groups and compute dynamic access properties
  const usersWithGroups: UserWithGroups[] = useMemo(() => {
    return users.map((u) => {
      const assignedGroupIds = userGroups
        .filter((ug) => ug.employee_id === u.employee_id)
        .map((ug) => Number(ug.group_id));

      const assignedGroups = groups.filter((g) => assignedGroupIds.includes(Number(g.group_id)));

      // Dynamically derive properties from assigned groups
      const internetLevel: InternetLevel = getUserPrimaryInternetLevel(assignedGroups, u.internet_level || 'B');
      const vpnStatus: boolean = getUserVpnStatus(assignedGroups);
      const printQuotaGroup: string = getUserPrintQuotaGroup(assignedGroups);

      // Always ensure the corresponding Internet Level Group (101 for A, 102 for B, 103 for C) is present in groups array
      const internetGroupId = internetLevel === 'A' ? 101 : internetLevel === 'B' ? 102 : 103;
      const hasLevelGroupBadge = assignedGroups.some((g) => g.group_id === internetGroupId || g.internet_level === internetLevel);
      if (!hasLevelGroupBadge) {
        assignedGroups.unshift({
          group_id: internetGroupId,
          group_name: `Internet Level ${internetLevel}`,
          description: `สิทธิ์ใช้งานอินเทอร์เน็ตระดับ ${internetLevel}`,
          internet_level: internetLevel,
        });
      }

      return {
        ...u,
        internet_level: internetLevel,
        vpn_status: vpnStatus,
        print_quota_group: printQuotaGroup,
        groups: assignedGroups,
      };
    });
  }, [users, userGroups, groups]);

  // Extract unique filter dropdown values
  const departments = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.department))).sort();
  }, [users]);

  const companies = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.company))).sort();
  }, [users]);

  const authorityGroups = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.authority_group))).sort();
  }, [users]);

  const printQuotaGroups = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.print_quota_group))).sort();
  }, [users]);

  const o365Licenses = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.o365_license))).sort();
  }, [users]);

  // Filter & Sort State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    searchTokens: [],
    searchCategory: 'all',
    department: 'all',
    departments: [],
    company: 'all',
    companies: [],
    internetLevel: 'all',
    internetLevels: [],
    vpnStatus: 'all',
    groupId: 'all',
    groupIds: [],
    groupLogicMode: 'UNION',
    authorityGroup: 'all',
    authorityGroups: [],
    expiryStatus: 'all',
    printQuotaGroup: 'all',
    printQuotaGroups: [],
    o365License: 'all',
    o365Licenses: [],
    isSampleOnly: false,
  });

  const [sortState, setSortState] = useState<SortState>({
    field: 'employee_id',
    order: 'asc',
  });

  // Filtered Users Calculation
  const filteredUsers = useMemo(() => {
    return usersWithGroups.filter((u) => {
      // 1. Search Query
      if (filters.search.trim()) {
        const tokens = filters.searchTokens.length > 0 ? filters.searchTokens : [filters.search.trim()];
        const matchAllTokens = tokens.every((token) => {
          const lowerToken = token.toLowerCase();
          if (filters.searchCategory === 'employee_id') return u.employee_id.toLowerCase().includes(lowerToken);
          if (filters.searchCategory === 'name') return u.display_name.toLowerCase().includes(lowerToken) || u.username.toLowerCase().includes(lowerToken);
          if (filters.searchCategory === 'email') return u.email.toLowerCase().includes(lowerToken);
          if (filters.searchCategory === 'device') return u.device_code.toLowerCase().includes(lowerToken);

          return (
            u.employee_id.toLowerCase().includes(lowerToken) ||
            u.username.toLowerCase().includes(lowerToken) ||
            u.display_name.toLowerCase().includes(lowerToken) ||
            u.email.toLowerCase().includes(lowerToken) ||
            u.department.toLowerCase().includes(lowerToken) ||
            u.company.toLowerCase().includes(lowerToken) ||
            u.device_code.toLowerCase().includes(lowerToken) ||
            u.job_title.toLowerCase().includes(lowerToken) ||
            u.authority_group.toLowerCase().includes(lowerToken) ||
            u.internet_level.toLowerCase().includes(lowerToken) ||
            `level ${u.internet_level.toLowerCase()}`.includes(lowerToken) ||
            (u.level_group && u.level_group.toLowerCase().includes(lowerToken)) ||
            (u.o365_license && u.o365_license.toLowerCase().includes(lowerToken)) ||
            (u.print_quota_group && u.print_quota_group.toLowerCase().includes(lowerToken)) ||
            (u.telephone_pass_code && u.telephone_pass_code.toLowerCase().includes(lowerToken)) ||
            u.groups.some(
              (g) =>
                g.group_name.toLowerCase().includes(lowerToken) ||
                String(g.group_id).includes(lowerToken)
            )
          );
        });
        if (!matchAllTokens) return false;
      }

      // 2. Department Filter
      if (filters.departments.length > 0) {
        if (!filters.departments.includes(u.department)) return false;
      } else if (filters.department !== 'all' && u.department !== filters.department) {
        return false;
      }

      // 3. Company Filter
      if (filters.companies.length > 0) {
        if (!filters.companies.includes(u.company)) return false;
      } else if (filters.company !== 'all' && u.company !== filters.company) {
        return false;
      }

      // 4. Internet Level Filter
      if (filters.internetLevels.length > 0) {
        if (!filters.internetLevels.includes(u.internet_level)) return false;
      } else if (filters.internetLevel !== 'all' && u.internet_level !== filters.internetLevel) {
        return false;
      }

      // 5. VPN Status Filter
      if (filters.vpnStatus === 'active' && !u.vpn_status) return false;
      if (filters.vpnStatus === 'disabled' && u.vpn_status) return false;

      // 6. Access Group Filter
      if (filters.groupIds && filters.groupIds.length > 0) {
        const userGroupIds = u.groups.map((g) => Number(g.group_id));
        const targetGroupIds = filters.groupIds.map((id) => Number(id));
        if (filters.groupLogicMode === 'INTERSECTION') {
          const hasAll = targetGroupIds.every((gId) => userGroupIds.includes(gId));
          if (!hasAll) return false;
        } else {
          const hasAny = targetGroupIds.some((gId) => userGroupIds.includes(gId));
          if (!hasAny) return false;
        }
      } else if (filters.groupId && filters.groupId !== 'all') {
        const targetGId = Number(filters.groupId);
        if (!u.groups.some((g) => Number(g.group_id) === targetGId)) return false;
      }

      // 7. Authority Group Filter
      if (filters.authorityGroups.length > 0) {
        if (!filters.authorityGroups.includes(u.authority_group)) return false;
      } else if (filters.authorityGroup !== 'all' && u.authority_group !== filters.authorityGroup) {
        return false;
      }

      // 8. Print Quota Filter
      if (filters.printQuotaGroups.length > 0) {
        if (!filters.printQuotaGroups.includes(u.print_quota_group)) return false;
      } else if (filters.printQuotaGroup !== 'all' && u.print_quota_group !== filters.printQuotaGroup) {
        return false;
      }

      // 9. O365 License Filter
      if (filters.o365Licenses && filters.o365Licenses.length > 0) {
        const matches = filters.o365Licenses.some((targetLic) => {
          if (!u.o365_license) return false;
          const uLic = u.o365_license.toLowerCase();
          const tLic = targetLic.toLowerCase();
          return uLic === tLic || uLic.includes(tLic) || tLic.includes(uLic);
        });
        if (!matches) return false;
      } else if (filters.o365License && filters.o365License !== 'all') {
        if (!u.o365_license) return false;
        const uLic = u.o365_license.toLowerCase();
        const tLic = filters.o365License.toLowerCase();
        const matches = uLic === tLic || uLic.includes(tLic) || tLic.includes(uLic);
        if (!matches) return false;
      }

      // 10. Expiry Status Filter
      if (filters.expiryStatus !== 'all') {
        const status = getExpiryStatus(u.expiry_date);
        if ((filters.expiryStatus === 'expiring_30d' || filters.expiryStatus === 'expiring_30') && status !== 'expiring_soon') return false;
        if (filters.expiryStatus === 'expired' && status !== 'expired') return false;
        if ((filters.expiryStatus === 'normal' || filters.expiryStatus === 'active') && status !== 'active') return false;
        if (filters.expiryStatus === 'no_expiry' && status !== 'no_expiry') return false;
      }

      return true;
    });
  }, [usersWithGroups, filters]);

  // Sorted Users Calculation
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA: any = a[sortState.field];
      let valB: any = b[sortState.field];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string') {
        const comparison = valA.localeCompare(valB, 'th');
        return sortState.order === 'asc' ? comparison : -comparison;
      }

      if (valA < valB) return sortState.order === 'asc' ? -1 : 1;
      if (valA > valB) return sortState.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortState]);

  const activeVpnCount = useMemo(() => {
    return users.filter((u) => u.vpn_status).length;
  }, [users]);

  const resetFilters = () => {
    setFilters({
      search: '',
      searchTokens: [],
      searchCategory: 'all',
      department: 'all',
      departments: [],
      company: 'all',
      companies: [],
      internetLevel: 'all',
      internetLevels: [],
      vpnStatus: 'all',
      groupId: 'all',
      groupIds: [],
      groupLogicMode: 'UNION',
      authorityGroup: 'all',
      authorityGroups: [],
      expiryStatus: 'all',
      printQuotaGroup: 'all',
      printQuotaGroups: [],
      o365License: 'all',
      o365Licenses: [],
      isSampleOnly: false,
    });
  };

  return {
    usersWithGroups,
    departments,
    companies,
    authorityGroups,
    printQuotaGroups,
    o365Licenses,
    filters,
    setFilters,
    sortState,
    setSortState,
    filteredUsers,
    sortedUsers,
    activeVpnCount,
    resetFilters,
  };
}
