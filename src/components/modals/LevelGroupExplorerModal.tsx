import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Layers,
  Users,
  Search,
  Building2,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  FolderTree,
  ArrowRight
} from 'lucide-react';
import { Group, UserWithGroups } from '../../types';
import { getGroupBadgeInfo, SPECIAL_GROUP_IDS, getUserPrimaryInternetLevel, isSpecialGroup } from '../../utils/groupHelpers';

interface LevelGroupExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  users: UserWithGroups[];
  initialGroupId?: number | null;
  initialCategoryId?: string | null;
  onSelectUserForDetail: (user: UserWithGroups) => void;
  onAddGroup?: (groupName: string) => void;
  onEditGroup?: (groupId: number, newName: string) => void;
  onDeleteGroup?: (groupId: number) => void;
}

export const LevelGroupExplorerModal: React.FC<LevelGroupExplorerModalProps> = ({
  isOpen,
  onClose,
  groups,
  users,
  initialGroupId = null,
  initialCategoryId = null,
  onSelectUserForDetail,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialGroupId);
  const [categoryTab, setCategoryTab] = useState<'all' | 'special' | 'org'>('all');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberDeptFilter, setMemberDeptFilter] = useState('all');
  const [memberCompanyFilter, setMemberCompanyFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(initialGroupId);
      if (initialCategoryId === 'special') setCategoryTab('special');
      else if (initialCategoryId === 'org') setCategoryTab('org');
      else setCategoryTab('all');
      setGroupSearchQuery('');
      setMemberSearchQuery('');
    }
  }, [isOpen, initialGroupId, initialCategoryId]);

  if (!isOpen) return null;

  // Selected Group details
  const selectedGroup = groups.find((g) => g.group_id === selectedGroupId) || null;

  // Filtered Groups
  const filteredGroups = groups.filter((g) => {
    if (categoryTab === 'special' && !isSpecialGroup(g)) return false;
    if (categoryTab === 'org' && isSpecialGroup(g)) return false;

    if (!groupSearchQuery.trim()) return true;
    const q = groupSearchQuery.toLowerCase();
    return g.group_name.toLowerCase().includes(q) || String(g.group_id).includes(q);
  });

  // Members of selected group
  const groupMembers = users.filter((u) =>
    selectedGroup ? u.groups.some((ug) => ug.group_id === selectedGroup.group_id) : false
  );

  // Companies and Departments of group members
  const memberCompanies = Array.from(new Set(groupMembers.map((m) => m.company))).sort();
  const memberDepartments = Array.from(new Set(groupMembers.map((m) => m.department))).sort();

  // Filtered members inside selected group
  const filteredMembers = groupMembers.filter((m) => {
    if (memberCompanyFilter !== 'all' && m.company !== memberCompanyFilter) return false;
    if (memberDeptFilter !== 'all' && m.department !== memberDeptFilter) return false;
    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase();
      const matchName = m.display_name?.toLowerCase().includes(q);
      const matchEmpId = m.employee_id?.toLowerCase().includes(q);
      const matchEmail = m.user_principal_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmpId && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Level Group Explorer</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                  {groups.length} Level Groups
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                สำรวจและตรวจสอบรายชื่อพนักงานตามกลุ่มสิทธิ์การใช้งานระบบ (Level Group)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Breadcrumb Navigation when group is selected */}
          {selectedGroup && (
            <div className="flex items-center justify-between bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                  className="text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Level Groups ทั้งหมด</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-extrabold">{selectedGroup.group_name}</span>
                <span className="text-slate-500 font-mono text-[11px]">(ID: {selectedGroup.group_id})</span>
              </div>

              {(() => {
                const badge = getGroupBadgeInfo(selectedGroup);
                return (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${badge.variant}`}>
                    {badge.label}
                  </span>
                );
              })()}
            </div>
          )}

          {!selectedGroup ? (
            /* VIEW 1: All Level Groups Grid */
            <div className="space-y-4">

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setCategoryTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${categoryTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  ทั้งหมด ({groups.length})
                </button>
                <button
                  onClick={() => setCategoryTab('special')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${categoryTab === 'special'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Special Level Groups ({groups.filter((g) => isSpecialGroup(g)).length})
                </button>
                <button
                  onClick={() => setCategoryTab('org')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${categoryTab === 'org'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Organizational Groups ({groups.filter((g) => !isSpecialGroup(g)).length})
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    placeholder="ค้นหา Level Group ด้วยชื่อหรือ ID..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="text-xs font-bold text-slate-500 self-center">
                  พบ {filteredGroups.length} กลุ่มสิทธิ์
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                  const memberCount = users.filter((u) =>
                    u.groups.some((ug) => ug.group_id === group.group_id)
                  ).length;
                  const badge = getGroupBadgeInfo(group);

                  return (
                    <div
                      key={group.group_id}
                      onClick={() => setSelectedGroupId(group.group_id)}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          {/* <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.variant}`}>
                            {badge.label}
                          </span> */}
                          {/* <span className="font-mono text-[10px] font-bold text-slate-400">
                            ID: {group.group_id}
                          </span> */}
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {group.group_name}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{memberCount} พนักงาน</span>
                        </span>
                        <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          <span>ดูสมาชิก</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW 2: Members of Selected Level Group */
            <div className="space-y-4">

              {/* Member Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, รหัสพนักงาน, หรือ อีเมล..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={memberCompanyFilter}
                    onChange={(e) => setMemberCompanyFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all">ทุกบริษัท ({memberCompanies.length})</option>
                    {memberCompanies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={memberDeptFilter}
                    onChange={(e) => setMemberDeptFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all">ทุกแผนก ({memberDepartments.length})</option>
                    {memberDepartments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">พนักงาน</th>
                      <th className="p-3">รหัสพนักงาน</th>
                      <th className="p-3">บริษัท / แผนก</th>
                      <th className="p-3">ตำแหน่ง</th>
                      <th className="p-3 text-right">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                          ไม่พบพนักงานในกลุ่มสิทธิ์นี้ตามเงื่อนไขค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr key={member.employee_id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            {member.display_name}
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {member.employee_id}
                          </td>
                          <td className="p-3 text-slate-700">
                            <div>{member.department}</div>
                            <div className="text-[10px] text-slate-400">{member.company}</div>
                          </td>
                          <td className="p-3 text-slate-600">
                            {member.job_title}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectUserForDetail(member);
                              }}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                            >
                              ดูรายละเอียด
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
