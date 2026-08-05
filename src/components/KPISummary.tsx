import React from 'react';
import { Users, Wifi, Shield, Clock, Layers, ChevronRight } from 'lucide-react';
import { UserWithGroups, Group } from '../types';
import { getExpiryStatus } from '../utils/helpers';

interface KPISummaryProps {
  users: UserWithGroups[];
  totalUsersCount?: number;
  groups: Group[];
  onQuickFilter: (key: string, value: string) => void;
  onOpenLevelGroupExplorer?: (groupId?: number) => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  users,
  totalUsersCount = users.length,
  groups,
  onQuickFilter,
  onOpenLevelGroupExplorer
}) => {
  const filteredUsersCount = users.length;

  const levelA = users.filter((u) => u.internet_level === 'A').length;
  const levelB = users.filter((u) => u.internet_level === 'B').length;
  const levelC = users.filter((u) => u.internet_level === 'C').length;

  const vpnActive = users.filter((u) => u.vpn_status).length;
  const vpnDisabled = filteredUsersCount - vpnActive;

  const expiringSoon = users.filter((u) => getExpiryStatus(u.expiry_date) === 'expiring_soon').length;
  const expired = users.filter((u) => getExpiryStatus(u.expiry_date) === 'expired').length;
  const activeUsers = filteredUsersCount - expired;
  const pct = totalUsersCount > 0 ? ((filteredUsersCount / totalUsersCount) * 100).toFixed(1) : '100';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Employee Count Widget */}
      <div
        onClick={() => onQuickFilter('all', '')}
        className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">จำนวนพนักงาน</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-900 group-hover:text-white transition-colors">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1 font-mono">
          <span className="text-2xl font-extrabold text-slate-900">{filteredUsersCount}</span>
          <span className="text-sm font-bold text-slate-500">/ {totalUsersCount} คน</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 text-[10px]">({activeUsers} Active)</span>
          <span className="text-slate-400 text-[10px]">สูงสุด {totalUsersCount} คน</span>
        </div>
      </div>

      {/* Internet Level Widget */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internet Level</span>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Wifi className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <button
            onClick={() => onQuickFilter('internetLevel', 'A')}
            className="flex-1 text-center py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-lg transition-colors"
          >
            <span className="block text-[10px] text-amber-700 font-semibold">Level A</span>
            <span className="text-sm font-bold text-amber-900">{levelA}</span>
          </button>
          <button
            onClick={() => onQuickFilter('internetLevel', 'B')}
            className="flex-1 text-center py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200/90 rounded-lg transition-colors"
          >
            <span className="block text-[10px] text-sky-700 font-semibold">Level B</span>
            <span className="text-sm font-bold text-sky-900">{levelB}</span>
          </button>
          <button
            onClick={() => onQuickFilter('internetLevel', 'C')}
            className="flex-1 text-center py-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-300/80 rounded-lg transition-colors"
          >
            <span className="block text-[10px] text-slate-600 font-semibold">Level C</span>
            <span className="text-sm font-bold text-slate-800">{levelC}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">สิทธิ์การใช้งานอินเทอร์เน็ต</p>
      </div>

      {/* VPN Status Widget */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">VPN Status</span>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <button
            onClick={() => onQuickFilter('vpnStatus', 'active')}
            className="text-left group"
          >
            <span className="text-2xl font-bold text-emerald-600 group-hover:underline">{vpnActive}</span>
            <span className="text-xs text-slate-500 block">เปิดใช้งาน (Active)</span>
          </button>
          <button
            onClick={() => onQuickFilter('vpnStatus', 'disabled')}
            className="text-right group"
          >
            <span className="text-lg font-semibold text-slate-400 group-hover:underline">{vpnDisabled}</span>
            <span className="text-xs text-slate-400 block">ปิดสิทธิ์</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {filteredUsersCount > 0 ? Math.round((vpnActive / filteredUsersCount) * 100) : 0}% ของกลุ่มผู้ใช้งานที่เลือก
        </p>
      </div>

      {/* Account Expiry Alert Widget */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Expiry</span>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuickFilter('expiryStatus', 'expiring_30')}
            className="flex-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-lg transition-colors text-left"
          >
            <span className="text-[10px] text-amber-700 font-semibold block">หมดอายุเร็วๆ นี้</span>
            <span className="text-base font-bold text-amber-900">{expiringSoon}</span>
          </button>
          <button
            onClick={() => onQuickFilter('expiryStatus', 'expired')}
            className="flex-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-lg transition-colors text-left"
          >
            <span className="text-[10px] text-rose-700 font-semibold block">หมดอายุแล้ว</span>
            <span className="text-base font-bold text-rose-900">{expired}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">ต้องการการตรวจสอบหรือต่ออายุ</p>
      </div>

      {/* Level Group Widget */}
      <div
        onClick={() => {
          if (onOpenLevelGroupExplorer) {
            onOpenLevelGroupExplorer();
          } else {
            onQuickFilter('groupId', 'all');
          }
        }}
        className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:text-indigo-600 transition-colors flex items-center gap-1">
              Level Group
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-900">{groups.length}</span>
            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
              {groups.length} Groups
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
          <span>ดูรายชื่อ Group & สมาชิก</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
