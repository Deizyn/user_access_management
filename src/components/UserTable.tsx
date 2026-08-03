import React, { useState, useEffect } from 'react';
import {
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  ShieldOff,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Tag,
  FolderTree,
  Filter,
  X,
  Check
} from 'lucide-react';
import { UserWithGroups, SortState, SortField, Group } from '../types';
import { getExpiryStatus } from '../utils/helpers';
import { getUserPrimaryInternetLevel, getInternetLevelBadgeClasses, getSpecialGroupsForUser, getGroupBadgeInfo, SpecialGroupItem } from '../utils/groupHelpers';

export interface UserTableProps {
  users: UserWithGroups[];
  sortState: SortState;
  onSortChange: (field: SortField) => void;
  onViewUser: (user: UserWithGroups) => void;
  onQuickFilter?: (key: string, value: string) => void;
  onOpenExplorer?: (groupId?: number | null) => void;
  allGroups?: Group[];
  activeGroupIds?: string[];
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  sortState,
  onSortChange,
  onViewUser,
  onQuickFilter,
  onOpenExplorer,
  allGroups = [],
  activeGroupIds = [],
}) => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,            // Name
    company: true,         // Company
    job_title: true,       // Job Title
    department: true,      // Department
    device_code: true,     // Computer (Device)
    level_group: true,     // Group Member (Level Group)
    noted: true,           // Noted (Profile trigger)
    employee_id: false,    // Employee ID
    authority_group: false,// Authority Group
    o365_license: false,   // Microsoft 365 License (hidden by default)
    vpn_status: false,     // VPN Status
    internet_level: false, // Internet Level
    dates: false,          // Dates
    print_phone: false,
  });

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Expanded Level Groups state per user employee_id
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});

  const toggleExpandUser = (employeeId: string) => {
    setExpandedUserIds((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  };

  // Total and Paginated records
  const totalUsers = users.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  // Reset page when filter / users count changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalUsers, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalUsers);
  const paginatedUsers = users.slice(startIndex, endIndex);

  const renderSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />;
    }
    return sortState.order === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-slate-900 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-900 shrink-0" />
    );
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">

      {/* Table Toolbar Header */}
      <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">

        {/* Results Found */}
        <div className="flex items-center space-x-3 text-slate-700">
          <span className="font-bold text-slate-900">
            {totalUsers} Results Found
          </span>
        </div>

        {/* Right Toolbar Controls: Columns Toggle */}
        <div className="flex items-center space-x-2">

          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Columns
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs space-y-1">
                <div className="font-bold text-slate-400 px-2 py-1 uppercase tracking-wider text-[10px]">
                  Toggle Columns (ตั้งค่าคอลัมน์)
                </div>
                {Object.entries({
                  name: 'Name (ชื่อพนักงาน)',
                  company: 'Company (บริษัท)',
                  job_title: 'Job Title (ตำแหน่งงาน)',
                  department: 'Department (แผนก)',
                  device_code: 'Computer / Device (รหัสอุปกรณ์)',
                  level_group: 'Group Member (Level Group)',
                  noted: 'Noted (ดู Profile / รายละเอียด)',
                  employee_id: 'Employee ID (รหัสพนักงาน)',
                  authority_group: 'Authority Group',
                  o365_license: 'O365 License (สิทธิ์ Office 365)',
                  internet_level: 'Internet Level',
                  vpn_status: 'VPN Status',
                  dates: 'Creation & Expiry',
                  print_phone: 'Print Quota & Passcode',
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-800"
                  >
                    <span className="font-medium">{label}</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={() =>
                        setVisibleColumns({
                          ...visibleColumns,
                          [key]: !visibleColumns[key as keyof typeof visibleColumns],
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 select-none">

              {/* 1. NAME */}
              {visibleColumns.name && (
                <th
                  onClick={() => onSortChange('display_name')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>NAME</span>
                    {renderSortIcon('display_name')}
                  </span>
                </th>
              )}

              {/* 2. COMPANY */}
              {visibleColumns.company && (
                <th
                  onClick={() => onSortChange('company')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>COMPANY</span>
                    {renderSortIcon('company')}
                  </span>
                </th>
              )}

              {/* 3. JOB TITLE */}
              {visibleColumns.job_title && (
                <th
                  onClick={() => onSortChange('job_title')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>JOB TITLE</span>
                    {renderSortIcon('job_title')}
                  </span>
                </th>
              )}

              {/* 4. DEPARTMENT */}
              {visibleColumns.department && (
                <th
                  onClick={() => onSortChange('department')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>DEPARTMENT</span>
                    {renderSortIcon('department')}
                  </span>
                </th>
              )}

              {/* 5. COMPUTER(DEVICE) */}
              {visibleColumns.device_code && (
                <th
                  onClick={() => onSortChange('device_code')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>COMPUTER(DEVICE)</span>
                    {renderSortIcon('device_code')}
                  </span>
                </th>
              )}

              {/* 6. GROUP MEMBER (LEVEL GROUP) */}
              {visibleColumns.level_group && (
                <th className="p-3 whitespace-nowrap">GROUP MEMBER (LEVEL GROUP)</th>
              )}

              {/* OPTIONAL: EMPLOYEE ID */}
              {visibleColumns.employee_id && (
                <th
                  onClick={() => onSortChange('employee_id')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>EMPLOYEE ID</span>
                    {renderSortIcon('employee_id')}
                  </span>
                </th>
              )}

              {/* OPTIONAL: AUTHORITY GROUP */}
              {visibleColumns.authority_group && (
                <th className="p-3 whitespace-nowrap">AUTHORITY GROUP</th>
              )}

              {/* OPTIONAL: O365 LICENSE */}
              {visibleColumns.o365_license && (
                <th className="p-3 whitespace-nowrap">O365 LICENSE</th>
              )}

              {/* OPTIONAL: INTERNET LEVEL */}
              {visibleColumns.internet_level && (
                <th
                  onClick={() => onSortChange('internet_level')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>INTERNET LEVEL</span>
                    {renderSortIcon('internet_level')}
                  </span>
                </th>
              )}

              {/* OPTIONAL: VPN STATUS */}
              {visibleColumns.vpn_status && <th className="p-3 whitespace-nowrap">VPN STATUS</th>}

              {/* OPTIONAL: EXPIRY */}
              {visibleColumns.dates && (
                <th
                  onClick={() => onSortChange('creation_date')}
                  className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>EXPIRY</span>
                    {renderSortIcon('creation_date')}
                  </span>
                </th>
              )}

              {/* OPTIONAL: PRINT & PHONE */}
              {visibleColumns.print_phone && <th className="p-3 whitespace-nowrap">QUOTA & PIN</th>}

              {/* 7. NOTED (USER PROFILE ACTION) */}
              {visibleColumns.noted && (
                <th className="p-3 whitespace-nowrap text-center">NOTED</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/70 text-xs text-slate-800">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-10 text-center text-slate-500 font-medium">
                  No user records match your search filter or criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const derivedInternetLevel = user.internet_level || getUserPrimaryInternetLevel(user.groups, 'B');
                const internetBadgeClass = getInternetLevelBadgeClasses(derivedInternetLevel);
                const specialGroups = getSpecialGroupsForUser(user);

                return (
                  <tr
                    key={user.employee_id}
                    className="hover:bg-slate-50/90 transition-colors group"
                  >
                    {/* 1. NAME */}
                    {visibleColumns.name && (
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {user.display_name ? user.display_name.replace(/\s*\([^)]*\)\s*$/, '') : ''}
                        </div>
                      </td>
                    )}

                    {/* 2. COMPANY */}
                    {visibleColumns.company && (
                      <td className="p-3 whitespace-nowrap">
                        {user.company ? (
                          <button
                            type="button"
                            onClick={() => onQuickFilter && onQuickFilter('company', user.company)}
                            title={`คลิกเพื่อกรองบริษัท '${user.company}'`}
                            className="font-bold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80 text-[11px]"
                          >
                            {user.company}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                    )}

                    {/* 3. JOB TITLE */}
                    {visibleColumns.job_title && (
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-medium text-slate-700">{user.job_title}</span>
                      </td>
                    )}

                    {/* 4. DEPARTMENT */}
                    {visibleColumns.department && (
                      <td className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onQuickFilter && onQuickFilter('department', user.department)}
                          title={`Click to filter by department '${user.department}'`}
                          className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer"
                        >
                          {user.department}
                        </button>
                      </td>
                    )}

                    {/* 5. COMPUTER(DEVICE) */}
                    {visibleColumns.device_code && (
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-slate-700 font-bold">{user.device_code || '-'}</span>
                      </td>
                    )}

                    {/* 6. GROUP MEMBER (LEVEL GROUP) */}
                    {visibleColumns.level_group && (
                      <td className="p-3">
                        <div className="grid grid-cols-2 gap-1.5 max-w-[280px] py-0.5">
                          {specialGroups.length > 0 ? (
                            specialGroups.map((sg) => (
                              <span
                                key={sg.id}
                                className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded-md text-[10px] font-bold border truncate ${sg.variant}`}
                                title={sg.name}
                              >
                                {sg.name}
                              </span>
                            ))
                          ) : (
                            <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded-md text-[10px] font-bold border col-span-2 ${getInternetLevelBadgeClasses(derivedInternetLevel)}`}>
                              Internet Level {derivedInternetLevel}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* OPTIONAL: EMPLOYEE ID */}
                    {visibleColumns.employee_id && (
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {user.employee_id}
                        </div>
                      </td>
                    )}

                    {/* OPTIONAL: AUTHORITY GROUP */}
                    {visibleColumns.authority_group && (
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {user.authority_group || 'Domain Users'}
                        </span>
                      </td>
                    )}

                    {/* OPTIONAL: O365 LICENSE */}
                    {visibleColumns.o365_license && (
                      <td className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onQuickFilter && onQuickFilter('o365_license', user.o365_license || 'Microsoft 365 E3')}
                          title={`คลิกเพื่อกรอง Microsoft License '${user.o365_license || 'Microsoft 365 E3'}'`}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold text-[11px] cursor-pointer"
                        >
                          {user.o365_license || 'Microsoft 365 E3'}
                        </button>
                      </td>
                    )}

                    {/* OPTIONAL: INTERNET LEVEL */}
                    {visibleColumns.internet_level && (
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${internetBadgeClass}`}>
                          Level {derivedInternetLevel}
                        </span>
                      </td>
                    )}

                    {/* OPTIONAL: VPN STATUS */}
                    {visibleColumns.vpn_status && (
                      <td className="p-3 whitespace-nowrap">
                        {user.vpn_status ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active VPN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[11px]">
                            <ShieldOff className="w-3 h-3 text-slate-400" /> Disabled
                          </span>
                        )}
                      </td>
                    )}

                    {/* OPTIONAL: EXPIRY */}
                    {visibleColumns.dates && (
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-600">
                          {user.expiry_date ? user.expiry_date : 'No Expiry'}
                        </span>
                      </td>
                    )}

                    {/* OPTIONAL: PRINT & PHONE */}
                    {visibleColumns.print_phone && (
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {user.print_quota_group} • PIN: {user.telephone_pass_code}
                      </td>
                    )}

                    {/* 7. NOTED (PROFILE ACTION BUTTON) */}
                    {visibleColumns.noted && (
                      <td className="p-3 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => onViewUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          title="ดูรายละเอียดเพิ่มเติมของ User Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>ดู Profile</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
        <div className="flex items-center space-x-4 text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{totalUsers > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-900">{endIndex}</strong> of <strong className="text-slate-900">{totalUsers}</strong> entries
          </span>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-normal">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((pg, idx) => {
            if (typeof pg === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs">
                  ...
                </span>
              );
            }

            const isActive = pg === currentPage;
            return (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                {pg}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalUsers === 0}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
