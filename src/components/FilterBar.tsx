import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FilterX,
  Sparkles,
  Layers,
  Building2,
  Shield,
  Wifi,
  AlertTriangle,
  Printer,
  Check,
  CornerDownLeft,
  Cloud,
} from 'lucide-react';
import { FilterState, Group } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onResetFilters: () => void;
  departments: string[];
  companies: string[];
  groups: Group[];
  authorityGroups?: string[];
  printQuotaGroups?: string[];
  o365Licenses?: string[];
  totalFilteredCount: number;
  totalUsersCount: number;
}

interface ActiveToken {
  id: string;
  key: keyof FilterState;
  label: string;
  category: string;
  badgeClass: string;
  onRemove: () => void;
}

interface OmniOption {
  id: string;
  category: string;
  categoryKey: 'level_group' | 'company' | 'department' | 'authority' | 'attribute' | 'text';
  icon: React.ElementType;
  label: string;
  sublabel: string;
  isActive?: boolean;
  action: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  departments,
  companies,
  groups,
  authorityGroups = [],
  printQuotaGroups = [],
  o365Licenses = [],
  totalFilteredCount,
  totalUsersCount,
}) => {
  // Popup & Search input local state
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [omniInputVal, setOmniInputVal] = useState('');
  const [omniCategoryTab, setOmniCategoryTab] = useState<
    'all' | 'level_group' | 'company' | 'department' | 'authority' | 'attribute'
  >('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const omniContainerRef = useRef<HTMLDivElement>(null);
  const omniInputRef = useRef<HTMLInputElement>(null);
  const tokensScrollRef = useRef<HTMLDivElement>(null);
  const [showSelectFilters, setShowSelectFilters] = useState<boolean>(false);
  const [isTokenPopupEnabled, setIsTokenPopupEnabled] = useState<boolean>(false);

  // Active dropdown filters count
  // Selected Company array
  const currentCompanies = useMemo(() => {
    if (filters.companies && filters.companies.length > 0) return filters.companies;
    if (filters.company && filters.company !== 'all') return [filters.company];
    return [];
  }, [filters.companies, filters.company]);

  const toggleCompany = (comp: string) => {
    const updated = currentCompanies.includes(comp)
      ? currentCompanies.filter((item) => item !== comp)
      : [...currentCompanies, comp];
    onFilterChange('companies', updated);
    onFilterChange('company', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  // Selected Authority Group array
  const currentAuthorityGroups = useMemo(() => {
    if (filters.authorityGroups && filters.authorityGroups.length > 0) return filters.authorityGroups;
    if (filters.authorityGroup && filters.authorityGroup !== 'all') return [filters.authorityGroup];
    return [];
  }, [filters.authorityGroups, filters.authorityGroup]);

  const toggleAuthorityGroup = (auth: string) => {
    const updated = currentAuthorityGroups.includes(auth)
      ? currentAuthorityGroups.filter((item) => item !== auth)
      : [...currentAuthorityGroups, auth];
    onFilterChange('authorityGroups', updated);
    onFilterChange('authorityGroup', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  // Selected Department array
  const currentDepartments = useMemo(() => {
    if (filters.departments && filters.departments.length > 0) return filters.departments;
    if (filters.department && filters.department !== 'all') return [filters.department];
    return [];
  }, [filters.departments, filters.department]);

  const toggleDepartment = (dept: string) => {
    const updated = currentDepartments.includes(dept)
      ? currentDepartments.filter((item) => item !== dept)
      : [...currentDepartments, dept];
    onFilterChange('departments', updated);
    onFilterChange('department', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  // Selected Internet Level array
  const currentInternetLevels = useMemo(() => {
    if (filters.internetLevels && filters.internetLevels.length > 0) return filters.internetLevels;
    if (filters.internetLevel && filters.internetLevel !== 'all') return [filters.internetLevel];
    return [];
  }, [filters.internetLevels, filters.internetLevel]);

  const toggleInternetLevel = (lvl: string) => {
    const updated = currentInternetLevels.includes(lvl)
      ? currentInternetLevels.filter((item) => item !== lvl)
      : [...currentInternetLevels, lvl];
    onFilterChange('internetLevels', updated);
    onFilterChange('internetLevel', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  // Selected Print Quota Group array
  const currentPrintQuotaGroups = useMemo(() => {
    if (filters.printQuotaGroups && filters.printQuotaGroups.length > 0) return filters.printQuotaGroups;
    if (filters.printQuotaGroup && filters.printQuotaGroup !== 'all') return [filters.printQuotaGroup];
    return [];
  }, [filters.printQuotaGroups, filters.printQuotaGroup]);

  const togglePrintQuotaGroup = (quota: string) => {
    const updated = currentPrintQuotaGroups.includes(quota)
      ? currentPrintQuotaGroups.filter((item) => item !== quota)
      : [...currentPrintQuotaGroups, quota];
    onFilterChange('printQuotaGroups', updated);
    onFilterChange('printQuotaGroup', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  // Selected Microsoft 365 License array
  const currentO365Licenses = useMemo(() => {
    if (filters.o365Licenses && filters.o365Licenses.length > 0) return filters.o365Licenses;
    if (filters.o365License && filters.o365License !== 'all') return [filters.o365License];
    return [];
  }, [filters.o365Licenses, filters.o365License]);

  const toggleO365License = (lic: string) => {
    const updated = currentO365Licenses.includes(lic)
      ? currentO365Licenses.filter((item) => item !== lic)
      : [...currentO365Licenses, lic];
    onFilterChange('o365Licenses', updated);
    onFilterChange('o365License', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  // Selected Level Group IDs normalized as string array
  const currentGroupIds = useMemo(() => {
    if (filters.groupIds && filters.groupIds.length > 0) return filters.groupIds.map(String);
    if (filters.groupId && filters.groupId !== 'all') return [String(filters.groupId)];
    return [];
  }, [filters.groupIds, filters.groupId]);

  const toggleGroupId = (gid: string | number) => {
    const gidStr = String(gid);
    const updated = currentGroupIds.includes(gidStr)
      ? currentGroupIds.filter((id) => id !== gidStr)
      : [...currentGroupIds, gidStr];
    onFilterChange('groupIds', updated);
    onFilterChange('groupId', updated.length === 1 ? updated[0] : updated.length === 0 ? 'all' : updated.join(','));
  };

  const activeDropdownCount = useMemo(() => {
    let count = 0;
    if (currentCompanies.length > 0) count++;
    if (currentAuthorityGroups.length > 0) count++;
    if (currentDepartments.length > 0) count++;
    if (currentInternetLevels.length > 0) count++;
    if (currentGroupIds.length > 0) count++;
    if (filters.vpnStatus !== 'all') count++;
    if (filters.expiryStatus !== 'all') count++;
    if (currentPrintQuotaGroups.length > 0) count++;
    if (currentO365Licenses.length > 0) count++;
    return count;
  }, [
    currentCompanies,
    currentAuthorityGroups,
    currentDepartments,
    currentInternetLevels,
    currentGroupIds,
    filters.vpnStatus,
    filters.expiryStatus,
    currentPrintQuotaGroups,
    currentO365Licenses,
  ]);

  const currentSearchTokens = useMemo(() => {
    return filters.searchTokens || [];
  }, [filters.searchTokens]);

  const addSearchToken = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const updated = currentSearchTokens.includes(trimmed)
      ? currentSearchTokens
      : [...currentSearchTokens, trimmed];
    onFilterChange('searchTokens', updated);
    onFilterChange('search', '');
  };

  const removeSearchToken = (val: string) => {
    const updated = currentSearchTokens.filter((t) => t !== val);
    onFilterChange('searchTokens', updated);
  };

  const isFiltered =
    currentSearchTokens.length > 0 ||
    filters.search !== '' ||
    currentCompanies.length > 0 ||
    currentAuthorityGroups.length > 0 ||
    currentDepartments.length > 0 ||
    currentInternetLevels.length > 0 ||
    currentGroupIds.length > 0 ||
    filters.vpnStatus !== 'all' ||
    filters.expiryStatus !== 'all' ||
    currentPrintQuotaGroups.length > 0 ||
    currentO365Licenses.length > 0;

  // --- DERIVED ACTIVE TOKENS ---
  const activeTokens = useMemo<ActiveToken[]>(() => {
    const list: ActiveToken[] = [];

    // Free Text Search Tokens
    currentSearchTokens.forEach((st, idx) => {
      list.push({
        id: `token-search-${idx}-${st}`,
        key: 'search',
        label: `"${st}"`,
        category: 'Text',
        badgeClass: 'bg-slate-900 text-white border-slate-900',
        onRemove: () => removeSearchToken(st),
      });
    });

    // Company (Multi-Token)
    currentCompanies.forEach((comp) => {
      list.push({
        id: `token-company-${comp}`,
        key: 'companies',
        label: comp,
        category: 'Company',
        badgeClass: 'bg-emerald-800 text-white border-emerald-900',
        onRemove: () => toggleCompany(comp),
      });
    });

    // Authority Group (Multi-Token)
    currentAuthorityGroups.forEach((auth) => {
      list.push({
        id: `token-authority-${auth}`,
        key: 'authorityGroups',
        label: auth,
        category: 'Authority',
        badgeClass: 'bg-amber-800 text-white border-amber-900',
        onRemove: () => toggleAuthorityGroup(auth),
      });
    });

    // Department (Multi-Token)
    currentDepartments.forEach((dept) => {
      list.push({
        id: `token-department-${dept}`,
        key: 'departments',
        label: dept,
        category: 'Dept',
        badgeClass: 'bg-sky-800 text-white border-sky-900',
        onRemove: () => toggleDepartment(dept),
      });
    });

    // Internet Level (Multi-Token)
    currentInternetLevels.forEach((lvl) => {
      list.push({
        id: `token-internet-${lvl}`,
        key: 'internetLevels',
        label: `Level ${lvl}`,
        category: 'Internet',
        badgeClass: 'bg-purple-800 text-white border-purple-900',
        onRemove: () => toggleInternetLevel(lvl),
      });
    });

    // Multi Level Group Tokens
    currentGroupIds.forEach((gid) => {
      const g = groups.find((item) => String(item.group_id) === gid);
      list.push({
        id: `token-group-${gid}`,
        key: 'groupIds',
        label: g ? g.group_name : `Group #${gid}`,
        category: 'Level Group',
        badgeClass: 'bg-indigo-900 text-white border-indigo-900',
        onRemove: () => toggleGroupId(gid),
      });
    });

    // VPN Status
    if (filters.vpnStatus !== 'all') {
      list.push({
        id: 'token-vpn',
        key: 'vpnStatus',
        label: filters.vpnStatus === 'active' ? 'Active VPN' : 'Disabled VPN',
        category: 'VPN',
        badgeClass: 'bg-cyan-800 text-white border-cyan-900',
        onRemove: () => onFilterChange('vpnStatus', 'all'),
      });
    }

    // Expiry Status
    if (filters.expiryStatus !== 'all') {
      const labels: Record<string, string> = {
        active: 'Active (ปกติ)',
        expiring_30: '< 30 วันหมดอายุ',
        expired: 'Expired (หมดอายุ)',
        no_expiry: 'No Expiry',
      };
      list.push({
        id: 'token-expiry',
        key: 'expiryStatus',
        label: labels[filters.expiryStatus] || filters.expiryStatus,
        category: 'Expiry',
        badgeClass: 'bg-rose-800 text-white border-rose-900',
        onRemove: () => onFilterChange('expiryStatus', 'all'),
      });
    }

    // Print Quotas (Multi-Token)
    currentPrintQuotaGroups.forEach((pq) => {
      list.push({
        id: `token-quota-${pq}`,
        key: 'printQuotaGroups',
        label: pq,
        category: 'Quota',
        badgeClass: 'bg-teal-800 text-white border-teal-900',
        onRemove: () => togglePrintQuotaGroup(pq),
      });
    });

    // Microsoft 365 License (Multi-Token)
    currentO365Licenses.forEach((lic) => {
      list.push({
        id: `token-o365-${lic}`,
        key: 'o365Licenses',
        label: lic,
        category: 'M365 Lic',
        badgeClass: 'bg-blue-800 text-white border-blue-900',
        onRemove: () => toggleO365License(lic),
      });
    });

    return list;
  }, [
    filters,
    groups,
    currentSearchTokens,
    currentCompanies,
    currentAuthorityGroups,
    currentDepartments,
    currentInternetLevels,
    currentGroupIds,
    currentPrintQuotaGroups,
    currentO365Licenses,
  ]);

  // Auto scroll token container to right when tokens change
  useEffect(() => {
    if (tokensScrollRef.current) {
      tokensScrollRef.current.scrollLeft = tokensScrollRef.current.scrollWidth;
    }
  }, [activeTokens.length, omniInputVal]);

  // --- AUTOCOMPLETE OPTIONS LIST ---
  const omniSuggestions = useMemo<OmniOption[]>(() => {
    const options: OmniOption[] = [];
    const q = omniInputVal.toLowerCase().trim();

    // 1. Companies (Hierarchy 1)
    if (omniCategoryTab === 'all' || omniCategoryTab === 'company') {
      companies.forEach((comp) => {
        if (q === '' || comp.toLowerCase().includes(q)) {
          const isSelected = currentCompanies.includes(comp);
          options.push({
            id: `comp-${comp}`,
            category: 'Company',
            categoryKey: 'company',
            icon: Building2,
            label: comp,
            sublabel: 'บริษัทสังกัดองค์กร',
            isActive: isSelected,
            action: () => {
              toggleCompany(comp);
              setOmniInputVal('');
            },
          });
        }
      });
    }

    // 3. Authority Groups (Hierarchy 2)
    if (omniCategoryTab === 'all' || omniCategoryTab === 'authority') {
      authorityGroups.forEach((auth) => {
        if (q === '' || auth.toLowerCase().includes(q)) {
          const isSelected = currentAuthorityGroups.includes(auth);
          options.push({
            id: `auth-${auth}`,
            category: 'Authority Group',
            categoryKey: 'authority',
            icon: Shield,
            label: auth,
            sublabel: 'กลุ่มสิทธิ์ระบบบริหารจัดการ',
            isActive: isSelected,
            action: () => {
              toggleAuthorityGroup(auth);
              setOmniInputVal('');
            },
          });
        }
      });
    }

    // 4. Departments (Hierarchy 3)
    if (omniCategoryTab === 'all' || omniCategoryTab === 'department') {
      departments.forEach((dept) => {
        if (q === '' || dept.toLowerCase().includes(q)) {
          const isSelected = currentDepartments.includes(dept);
          options.push({
            id: `dept-${dept}`,
            category: 'Department',
            categoryKey: 'department',
            icon: Building2,
            label: dept,
            sublabel: 'แผนก / ฝ่าย',
            isActive: isSelected,
            action: () => {
              toggleDepartment(dept);
              setOmniInputVal('');
            },
          });
        }
      });
    }

    // 5. Level Groups (Hierarchy 5)
    if (omniCategoryTab === 'all' || omniCategoryTab === 'level_group') {
      groups.forEach((g) => {
        if (q === '' || g.group_name.toLowerCase().includes(q)) {
          const gidStr = String(g.group_id);
          const isSelected = currentGroupIds.includes(gidStr);
          options.push({
            id: `lg-${g.group_id}`,
            category: 'Level Group',
            categoryKey: 'level_group',
            icon: Layers,
            label: g.group_name,
            sublabel: `กลุ่มสิทธิ์การใช้งาน (ID: ${g.group_id})`,
            isActive: isSelected,
            action: () => {
              toggleGroupId(gidStr);
              setOmniInputVal('');
            },
          });
        }
      });
    }

    // 6. Attributes (Hierarchy 4 & 6 & 7)
    if (omniCategoryTab === 'all' || omniCategoryTab === 'attribute') {
      // Internet Levels
      const internetOpts = [
        { key: 'A', name: 'Level A (Full Internet Access)' },
        { key: 'B', name: 'Level B (Standard Internet)' },
        { key: 'C', name: 'Level C (Restricted Intranet)' },
      ];
      internetOpts.forEach((item) => {
        if (q === '' || item.name.toLowerCase().includes(q) || 'internet'.includes(q)) {
          const isSelected = currentInternetLevels.includes(item.key);
          options.push({
            id: `internet-${item.key}`,
            category: 'Internet Level',
            categoryKey: 'attribute',
            icon: Shield,
            label: item.name,
            sublabel: 'ระดับสิทธิ์อินเทอร์เน็ต',
            isActive: isSelected,
            action: () => {
              toggleInternetLevel(item.key);
              setOmniInputVal('');
            },
          });
        }
      });

      // VPN Status
      const vpnOpts = [
        { key: 'active', name: 'Active VPN (เปิดใช้งาน VPN)' },
        { key: 'disabled', name: 'Disabled VPN (ปิดใช้งาน VPN)' },
      ];
      vpnOpts.forEach((v) => {
        if (q === '' || v.name.toLowerCase().includes(q) || 'vpn'.includes(q)) {
          const isSelected = filters.vpnStatus === v.key;
          options.push({
            id: `vpn-${v.key}`,
            category: 'VPN Status',
            categoryKey: 'attribute',
            icon: Wifi,
            label: v.name,
            sublabel: 'สถานะสิทธิ์การเชื่อมต่อ VPN',
            isActive: isSelected,
            action: () => {
              onFilterChange('vpnStatus', isSelected ? 'all' : v.key);
              setOmniInputVal('');
            },
          });
        }
      });

      // Expiry Status
      const expiryOpts = [
        { key: 'expiring_30', name: 'Expires within 30 Days (หมดอายุใน 30 วัน)' },
        { key: 'expired', name: 'Expired (หมดอายุแล้ว)' },
        { key: 'active', name: 'Active (สถานะปกติ)' },
      ];
      expiryOpts.forEach((e) => {
        if (q === '' || e.name.toLowerCase().includes(q) || 'expiry'.includes(q) || 'expire'.includes(q)) {
          const isSelected = filters.expiryStatus === e.key;
          options.push({
            id: `expiry-${e.key}`,
            category: 'Account Expiry',
            categoryKey: 'attribute',
            icon: AlertTriangle,
            label: e.name,
            sublabel: 'สถานะวันหมดอายุบัญชี',
            isActive: isSelected,
            action: () => {
              onFilterChange('expiryStatus', isSelected ? 'all' : e.key);
              setOmniInputVal('');
            },
          });
        }
      });

      // Print Quotas
      printQuotaGroups.forEach((pq) => {
        if (q === '' || pq.toLowerCase().includes(q) || 'print'.includes(q) || 'quota'.includes(q)) {
          const isSelected = currentPrintQuotaGroups.includes(pq);
          options.push({
            id: `quota-${pq}`,
            category: 'Print Quota',
            categoryKey: 'attribute',
            icon: Printer,
            label: pq,
            sublabel: 'กลุ่มโควต้าการพิมพ์',
            isActive: isSelected,
            action: () => {
              togglePrintQuotaGroup(pq);
              setOmniInputVal('');
            },
          });
        }
      });

      // Microsoft 365 License
      const licList = (o365Licenses.length > 0 ? o365Licenses : ['Microsoft 365 E1', 'Microsoft 365 E3', 'Microsoft 365 E5', 'Microsoft 365 E7']).filter(l => l !== 'None');
      licList.forEach((lic) => {
        if (q === '' || lic.toLowerCase().includes(q) || 'license'.includes(q) || 'm365'.includes(q) || 'o365'.includes(q) || 'microsoft'.includes(q)) {
          const isSelected = currentO365Licenses.includes(lic);
          options.push({
            id: `o365-${lic}`,
            category: 'M365 License',
            categoryKey: 'attribute',
            icon: Cloud,
            label: lic,
            sublabel: 'สิทธิ์การใช้งาน Microsoft 365 License',
            isActive: isSelected,
            action: () => {
              toggleO365License(lic);
              setOmniInputVal('');
            },
          });
        }
      });
    }

    // 7. Free Text Search Option (Appended at bottom when user types text)
    if (q !== '') {
      options.push({
        id: `text-${q}`,
        category: 'Free Text Search',
        categoryKey: 'text',
        icon: Search,
        label: `+ เพิ่มข้อความค้นหา: "${omniInputVal}"`,
        sublabel:
          currentSearchTokens.length > 0
            ? `กรองเพิ่มเติมร่วมกับ ${currentSearchTokens.map((t) => `"${t}"`).join(', ')}`
            : 'ค้นหาชื่อ, รหัสพนักงาน, อีเมล, บริษัท, อุปกรณ์',
        action: () => {
          addSearchToken(omniInputVal);
          setOmniInputVal('');
        },
      });
    }

    return options;
  }, [
    omniInputVal,
    omniCategoryTab,
    groups,
    departments,
    companies,
    authorityGroups,
    printQuotaGroups,
    filters,
    onFilterChange,
    currentCompanies,
    currentAuthorityGroups,
    currentDepartments,
    currentInternetLevels,
    currentGroupIds,
    currentPrintQuotaGroups,
    currentO365Licenses,
    currentSearchTokens,
  ]);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (omniContainerRef.current && !omniContainerRef.current.contains(e.target as Node)) {
        setIsOmniOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight reset on search change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [omniInputVal, omniCategoryTab]);

  // Auto-open select filters when any filter is applied/active
  useEffect(() => {
    if (isFiltered || activeDropdownCount > 0) {
      setShowSelectFilters(true);
    }
  }, [isFiltered, activeDropdownCount]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isTokenPopupEnabled && omniSuggestions.length > 0 && omniSuggestions[highlightedIndex]) {
        omniSuggestions[highlightedIndex].action();
      } else if (omniInputVal.trim() !== '') {
        addSearchToken(omniInputVal);
        setOmniInputVal('');
      }
      setIsOmniOpen(false);
      return;
    }

    if (e.key === 'Backspace' && omniInputVal === '') {
      const visibleTokens = isTokenPopupEnabled
        ? activeTokens
        : activeTokens.filter((t) => t.key === 'search');
      if (visibleTokens.length > 0) {
        visibleTokens[visibleTokens.length - 1].onRemove();
      }
      return;
    }

    if (!isTokenPopupEnabled) {
      if (e.key === 'Escape') {
        setIsOmniOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOmniOpen(true);
      setHighlightedIndex((prev) => Math.min(prev + 1, omniSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setIsOmniOpen(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
      
      {/* Row 1: Unified Omni Token Field + Category Select + View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        
        {/* OMNI SEARCH TOKEN FIELD CONTAINER */}
        <div ref={omniContainerRef} className="relative flex-1 min-w-0">
          <div
            onClick={() => {
              if (isTokenPopupEnabled) {
                setIsOmniOpen(true);
              }
              omniInputRef.current?.focus();
            }}
            className={`w-full min-h-[46px] px-3.5 py-1.5 border rounded-xl flex items-center gap-2 transition-all bg-white shadow-2xs cursor-text ${
              isTokenPopupEnabled && isOmniOpen ? 'ring-2 ring-slate-900 border-transparent shadow-md' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0 self-center" />

            {/* Expandable Tokens & Input Container */}
            <div
              className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0 py-0.5"
            >
              {/* Render Active Token Badges */}
              {(isTokenPopupEnabled ? activeTokens : activeTokens.filter((t) => t.key === 'search')).map((token) => (
                <button
                  type="button"
                  key={token.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    token.onRemove();
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs transition-all cursor-pointer hover:opacity-80 active:scale-95 group select-none ${token.badgeClass}`}
                  title={`คลิกเพื่อลบ "${token.label}"`}
                >
                  <span className="text-[10px] opacity-75 uppercase tracking-wider font-extrabold mr-0.5 pointer-events-none">
                    {token.category}:
                  </span>
                  <span className="pointer-events-none whitespace-nowrap">{token.label}</span>
                  <span className="ml-1 p-0.5 rounded-full bg-black/10 group-hover:bg-black/30 text-white/90 group-hover:text-white transition-colors shrink-0 pointer-events-none">
                    <X className="w-3 h-3" />
                  </span>
                </button>
              ))}

              {/* Input Box */}
              <input
                ref={omniInputRef}
                type="text"
                value={omniInputVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setOmniInputVal(val);
                  onFilterChange('search', val);
                }}
                onFocus={() => {
                  if (isTokenPopupEnabled && omniInputVal.trim() === '') {
                    setIsOmniOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeTokens.length === 0
                    ? 'Search by ID, Name, Email... (กด Enter เพื่อสร้าง Token)'
                    : 'พิมพ์ข้อความแล้วกด Enter เพื่อเพิ่ม Token...'
                }
                className="flex-1 min-w-[140px] border-none bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 p-1"
              />
            </div>

            {/* Enter Icon Badge Indicator */}
            {omniInputVal.trim() !== '' && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg shrink-0 pointer-events-none animate-fadeIn"
                title="กด Enter เพื่อสร้าง Token ในการค้นหา"
              >
                <CornerDownLeft className="w-3 h-3 text-slate-500" />
                <span>Enter</span>
              </span>
            )}

            {/* Clear Button */}
            {(omniInputVal !== '' || (isTokenPopupEnabled && activeTokens.length > 0)) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOmniInputVal('');
                  onFilterChange('search', '');
                  onFilterChange('searchTokens', []);
                }}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-100 transition-colors ml-auto shrink-0 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Token Popup Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const nextState = !isTokenPopupEnabled;
                setIsTokenPopupEnabled(nextState);
                if (!nextState) {
                  setIsOmniOpen(false);
                  const plainSearchText =
                    currentSearchTokens.length > 0
                      ? currentSearchTokens.join(' ')
                      : omniInputVal || filters.search;
                  onFilterChange('searchTokens', []);
                  onFilterChange('search', plainSearchText);
                  setOmniInputVal(plainSearchText);
                } else {
                  if (filters.search.trim()) {
                    const tokens = filters.search.trim().split(/\s+/).filter(Boolean);
                    onFilterChange('searchTokens', tokens);
                    setOmniInputVal('');
                  }
                  setIsOmniOpen(true);
                  omniInputRef.current?.focus();
                }
              }}
              className={`hidden sm:flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shrink-0 ml-1 transition-all cursor-pointer select-none ${
                isTokenPopupEnabled
                  ? 'text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 shadow-2xs'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300'
              }`}
              title={isTokenPopupEnabled ? 'คลิกเพื่อปิด Token Popup (เป็นค้นหาปกติ)' : 'คลิกเพื่อเปิด Token Popup Mode'}
            >
              <Sparkles className={`w-3 h-3 ${isTokenPopupEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Token Field: {isTokenPopupEnabled ? 'ON' : 'OFF'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isTokenPopupEnabled && isOmniOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
            </button>
          </div>

          {/* AUTOCOMPLETE SUGGESTIONS POPUP OVERLAY */}
          {isTokenPopupEnabled && isOmniOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] flex flex-col animate-fadeIn">
              
              {/* POPUP HEADER & CATEGORY TABS */}
              <div className="p-3 bg-slate-900 text-white flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Search & Filter Token Popup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-normal text-slate-400">
                      พบ {omniSuggestions.length} รายการ
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOmniOpen(false);
                      }}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="ปิด Token Popup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setOmniCategoryTab('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      omniCategoryTab === 'all'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    ทั้งหมด (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOmniCategoryTab('company')}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      omniCategoryTab === 'company'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setOmniCategoryTab('authority')}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      omniCategoryTab === 'authority'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Authority
                  </button>
                  <button
                    type="button"
                    onClick={() => setOmniCategoryTab('department')}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      omniCategoryTab === 'department'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Department
                  </button>
                  <button
                    type="button"
                    onClick={() => setOmniCategoryTab('level_group')}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      omniCategoryTab === 'level_group'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Groups
                  </button>
                  <button
                    type="button"
                    onClick={() => setOmniCategoryTab('attribute')}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      omniCategoryTab === 'attribute'
                        ? 'bg-amber-400 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Attributes
                  </button>
                </div>
              </div>

              {/* SUGGESTIONS LIST */}
              <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
                {omniSuggestions.length === 0 ? (
                  <div className="p-6 text-center space-y-1">
                    <Search className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">ไม่พบรายการที่ตรงกับคำค้นหา</p>
                    <p className="text-[11px] text-slate-400">กด Enter เพื่อค้นหาข้อความอิสระ หรือเลือกหมวดหมู่อื่น</p>
                  </div>
                ) : (
                  omniSuggestions.map((item, idx) => {
                    const IconComp = item.icon;
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          item.action();
                          setIsOmniOpen(false);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                          isHighlighted ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              item.categoryKey === 'level_group'
                                ? 'bg-indigo-100 text-indigo-700'
                                : item.categoryKey === 'company'
                                ? 'bg-emerald-100 text-emerald-700'
                                : item.categoryKey === 'department'
                                ? 'bg-sky-100 text-sky-700'
                                : item.categoryKey === 'authority'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {item.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate">
                              <span className="font-semibold text-slate-700">{item.category}</span> • {item.sublabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          {item.isActive ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Active Filter
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center">
                              + Add Token
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* POPUP FOOTER */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
                <span>💡 กด ↑ ↓ เพื่อเลือก • Enter เพื่อเพิ่ม Token • Backspace เพื่อลบ Token</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOmniOpen(false);
                  }}
                  className="font-mono bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="ปิด Token Popup (ESC)"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>ESC ปิด</span>
                </button>
              </div>

            </div>
          )}
        </div>



        {/* Filter Toggle & View Switcher Group */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSelectFilters((prev) => !prev)}
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              showSelectFilters
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : activeDropdownCount > 0
                ? 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
            }`}
            title={showSelectFilters ? 'ซ่อนแถบตัวกรองแบบเลือก' : 'แสดงแถบตัวกรองแบบเลือกเพิ่มเติม'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            <span>{showSelectFilters ? 'ซ่อนตัวกรอง' : 'ตัวกรองแบบเลือก'}</span>
            {activeDropdownCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                showSelectFilters ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-white'
              }`}>
                {activeDropdownCount}
              </span>
            )}
            {showSelectFilters ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1.5 opacity-80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-80" />
            )}
          </button>


        </div>

      </div>

      {/* Row 2: Labeled Dropdown Filters (Collapsible) */}
      {showSelectFilters && (
        <div className="flex flex-wrap items-end justify-between gap-3 pt-2 border-t border-slate-100 animate-fadeIn">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 flex-1">
          
          {/* 1. Company Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Company {currentCompanies.length > 1 && `(${currentCompanies.length})`}
            </label>
            <div className="relative">
              <select
                value={
                  currentCompanies.length === 0
                    ? 'all'
                    : currentCompanies.length === 1
                    ? currentCompanies[0]
                    : 'multi'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    onFilterChange('companies', []);
                    onFilterChange('company', 'all');
                  } else if (val !== 'multi') {
                    toggleCompany(val);
                  }
                }}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  currentCompanies.length > 0
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 font-medium">Any Company (ทั้งหมด)</option>
                {currentCompanies.length > 1 && (
                  <option value="multi" disabled hidden className="bg-white text-slate-900 font-medium">
                    {currentCompanies.length} Selected (Union)
                  </option>
                )}
                {companies.map((comp) => {
                  const isSel = currentCompanies.includes(comp);
                  return (
                    <option key={comp} value={comp} className="bg-white text-slate-900 font-medium">
                      {isSel ? `✓ ${comp}` : comp}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  currentCompanies.length > 0 ? 'text-emerald-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 2. Authority Group Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Authority Group {currentAuthorityGroups.length > 1 && `(${currentAuthorityGroups.length})`}
            </label>
            <div className="relative">
              <select
                value={
                  currentAuthorityGroups.length === 0
                    ? 'all'
                    : currentAuthorityGroups.length === 1
                    ? currentAuthorityGroups[0]
                    : 'multi'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    onFilterChange('authorityGroups', []);
                    onFilterChange('authorityGroup', 'all');
                  } else if (val !== 'multi') {
                    toggleAuthorityGroup(val);
                  }
                }}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  currentAuthorityGroups.length > 0
                    ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 font-medium">Any Authority (ทั้งหมด)</option>
                {currentAuthorityGroups.length > 1 && (
                  <option value="multi" disabled hidden className="bg-white text-slate-900 font-medium">
                    {currentAuthorityGroups.length} Selected (Union)
                  </option>
                )}
                {authorityGroups.map((ag) => {
                  const isSel = currentAuthorityGroups.includes(ag);
                  return (
                    <option key={ag} value={ag} className="bg-white text-slate-900 font-medium">
                      {isSel ? `✓ ${ag}` : ag}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  currentAuthorityGroups.length > 0 ? 'text-amber-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 3. Department Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Department {currentDepartments.length > 1 && `(${currentDepartments.length})`}
            </label>
            <div className="relative">
              <select
                value={
                  currentDepartments.length === 0
                    ? 'all'
                    : currentDepartments.length === 1
                    ? currentDepartments[0]
                    : 'multi'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    onFilterChange('departments', []);
                    onFilterChange('department', 'all');
                  } else if (val !== 'multi') {
                    toggleDepartment(val);
                  }
                }}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  currentDepartments.length > 0
                    ? 'bg-sky-900 text-white border-sky-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 font-medium">Any Dept (ทั้งหมด)</option>
                {currentDepartments.length > 1 && (
                  <option value="multi" disabled hidden className="bg-white text-slate-900 font-medium">
                    {currentDepartments.length} Selected (Union)
                  </option>
                )}
                {departments.map((dept) => {
                  const isSel = currentDepartments.includes(dept);
                  return (
                    <option key={dept} value={dept} className="bg-white text-slate-900 font-medium">
                      {isSel ? `✓ ${dept}` : dept}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  currentDepartments.length > 0 ? 'text-sky-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 4. Internet Level Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Internet Level {currentInternetLevels.length > 1 && `(${currentInternetLevels.length})`}
            </label>
            <div className="relative">
              <select
                value={
                  currentInternetLevels.length === 0
                    ? 'all'
                    : currentInternetLevels.length === 1
                    ? currentInternetLevels[0]
                    : 'multi'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    onFilterChange('internetLevels', []);
                    onFilterChange('internetLevel', 'all');
                  } else if (val !== 'multi') {
                    toggleInternetLevel(val);
                  }
                }}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  currentInternetLevels.length > 0
                    ? 'bg-purple-900 text-white border-purple-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 font-medium">Any Level (ทั้งหมด)</option>
                {currentInternetLevels.length > 1 && (
                  <option value="multi" disabled hidden className="bg-white text-slate-900 font-medium">
                    {currentInternetLevels.length} Selected (Union)
                  </option>
                )}
                <option value="A" className="bg-white text-slate-900 font-medium">
                  {currentInternetLevels.includes('A') ? '✓ Level A (Full)' : 'Level A (Full)'}
                </option>
                <option value="B" className="bg-white text-slate-900 font-medium">
                  {currentInternetLevels.includes('B') ? '✓ Level B (Standard)' : 'Level B (Standard)'}
                </option>
                <option value="C" className="bg-white text-slate-900 font-medium">
                  {currentInternetLevels.includes('C') ? '✓ Level C (Restricted)' : 'Level C (Restricted)'}
                </option>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  currentInternetLevels.length > 0 ? 'text-purple-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 5. Group Filter Dropdown */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Group {currentGroupIds.length > 1 && `(${currentGroupIds.length})`}
            </label>
            <div className="relative">
              <select
                value={
                  currentGroupIds.length === 0
                    ? 'all'
                    : currentGroupIds.length === 1
                    ? currentGroupIds[0]
                    : 'multi'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    onFilterChange('groupIds', []);
                    onFilterChange('groupId', 'all');
                  } else if (val !== 'multi') {
                    toggleGroupId(val);
                  }
                }}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  currentGroupIds.length > 0
                    ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 font-medium">Any Group (ทั้งหมด)</option>
                {currentGroupIds.length > 1 && (
                  <option value="multi" disabled hidden className="bg-white text-slate-900 font-medium">
                    {currentGroupIds.length} Selected (Union)
                  </option>
                )}
                {groups.map((g) => {
                  const isSel = currentGroupIds.includes(String(g.group_id));
                  return (
                    <option key={g.group_id} value={String(g.group_id)} className="bg-white text-slate-900 font-medium">
                      {isSel ? `✓ ${g.group_name}` : g.group_name}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  currentGroupIds.length > 0 ? 'text-indigo-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 6. VPN Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              VPN Status
            </label>
            <div className="relative">
              <select
                value={filters.vpnStatus}
                onChange={(e) => onFilterChange('vpnStatus', e.target.value)}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  filters.vpnStatus !== 'all'
                    ? 'bg-cyan-900 text-white border-cyan-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all">Any Status</option>
                <option value="active" className="bg-white text-slate-900 font-medium">Active VPN</option>
                <option value="disabled" className="bg-white text-slate-900 font-medium">Disabled VPN</option>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  filters.vpnStatus !== 'all' ? 'text-cyan-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 7. Account Expiry Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Account Expiry
            </label>
            <div className="relative">
              <select
                value={filters.expiryStatus}
                onChange={(e) => onFilterChange('expiryStatus', e.target.value)}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  filters.expiryStatus !== 'all'
                    ? 'bg-rose-900 text-white border-rose-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all">Any Expiry</option>
                <option value="active" className="bg-white text-slate-900 font-medium">Active (Normal)</option>
                <option value="expiring_30" className="bg-white text-slate-900 font-medium">Expiring in 30 Days</option>
                <option value="expired" className="bg-white text-slate-900 font-medium">Expired Accounts</option>
                <option value="no_expiry" className="bg-white text-slate-900 font-medium">No Expiry Date</option>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  filters.expiryStatus !== 'all' ? 'text-rose-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* 8. Microsoft 365 License Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              M365 License {currentO365Licenses.length > 1 && `(${currentO365Licenses.length})`}
            </label>
            <div className="relative">
              <select
                value={
                  currentO365Licenses.length === 0
                    ? 'all'
                    : currentO365Licenses.length === 1
                    ? currentO365Licenses[0]
                    : 'multi'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    onFilterChange('o365Licenses', []);
                    onFilterChange('o365License', 'all');
                  } else if (val !== 'multi') {
                    toggleO365License(val);
                  }
                }}
                className={`w-full appearance-none border text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer ${
                  currentO365Licenses.length > 0
                    ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 font-medium">Any License (ทั้งหมด)</option>
                {currentO365Licenses.length > 1 && (
                  <option value="multi" disabled hidden className="bg-white text-slate-900 font-medium">
                    {currentO365Licenses.length} Selected (Union)
                  </option>
                )}
                {(o365Licenses.length > 0
                  ? o365Licenses
                  : ['Microsoft 365 E1', 'Microsoft 365 E3', 'Microsoft 365 E5', 'Microsoft 365 E7']
                )
                  .filter((lic) => lic !== 'None')
                  .map((lic) => {
                  const isSel = currentO365Licenses.includes(lic);
                  return (
                    <option key={lic} value={lic} className="bg-white text-slate-900 font-medium">
                      {isSel ? `✓ ${lic}` : lic}
                    </option>
                  );
                })}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  currentO365Licenses.length > 0 ? 'text-blue-200' : 'text-slate-400'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Clear All Filters Dedicated Button */}
        <div className="shrink-0 flex items-end">
          <button
            onClick={onResetFilters}
            disabled={!isFiltered}
            title={isFiltered ? 'Reset all search and dropdown filters' : 'No active filters to clear'}
            className={`inline-flex items-center px-3.5 py-2 border text-xs font-bold rounded-xl transition-all h-[38px] ${
              isFiltered
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-2xs cursor-pointer'
                : 'bg-slate-50 border-slate-200/80 text-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <FilterX className={`w-3.5 h-3.5 mr-1.5 ${isFiltered ? 'text-rose-500' : 'text-slate-300'}`} />
            Clear Filters
          </button>
        </div>

      </div>
      )}

    </div>
  );
};

