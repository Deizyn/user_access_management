import React, { useState, useMemo } from 'react';
import {
  Users,
  Wifi,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
  RotateCcw,
  ChevronRight,
  UserX,
  Smartphone,
  CheckCircle2,
  Layers,
  TrendingUp,
  AlertCircle,
  Clock,
  Globe,
  Key,
  FileText,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { UserWithGroups, Group } from '../types';

interface AnalyticsOverviewProps {
  users: UserWithGroups[];
  groups: Group[];
  onOpenLevelGroupExplorer?: (groupId?: number) => void;
  onSelectUserForDetail?: (user: UserWithGroups) => void;
  onGoToTableView?: () => void;
}

// Helper to calculate days remaining until expiration
const getDaysToExpiry = (expiryDateStr: string | null): number | null => {
  if (!expiryDateStr) return null;
  const exp = new Date(expiryDateStr);
  if (isNaN(exp.getTime())) return null;
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 3600 * 24));
};

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  users,
  groups,
  onOpenLevelGroupExplorer,
  onSelectUserForDetail,
  onGoToTableView,
}) => {
  // Topic Selector State: 'all' | 'internet_level' | 'license' | 'access'
  const [selectedTopic, setSelectedTopic] = useState<'all' | 'internet_level' | 'license' | 'access'>('all');

  // Top Filter States
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  // Anomaly Watchlist Filter State
  const [anomalyTab, setAnomalyTab] = useState<'all' | 'expiring' | 'unassigned' | 'no_device'>('all');

  // Metadata Lists
  const companies = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.company))).sort();
  }, [users]);

  const departments = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.department))).sort();
  }, [users]);

  // Apply Top Filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Company Filter
      if (selectedCompany !== 'all' && u.company !== selectedCompany) {
        return false;
      }

      // Department Filter
      if (selectedDepartment !== 'all' && u.department !== selectedDepartment) {
        return false;
      }

      // Date Range / Status Filter
      if (selectedDateRange === 'last_30d') {
        if (!u.creation_date) return false;
        const created = new Date(u.creation_date);
        const days = Math.floor((new Date().getTime() - created.getTime()) / (1000 * 3600 * 24));
        if (days > 30 || days < 0) return false;
      } else if (selectedDateRange === 'last_90d') {
        if (!u.creation_date) return false;
        const created = new Date(u.creation_date);
        const days = Math.floor((new Date().getTime() - created.getTime()) / (1000 * 3600 * 24));
        if (days > 90 || days < 0) return false;
      } else if (selectedDateRange === 'expiring_30d') {
        const daysToExp = getDaysToExpiry(u.expiry_date);
        if (daysToExp === null || daysToExp > 30) return false;
      }

      return true;
    });
  }, [users, selectedCompany, selectedDepartment, selectedDateRange]);

  // Reset Filters
  const handleResetTopFilters = () => {
    setSelectedCompany('all');
    setSelectedDepartment('all');
    setSelectedDateRange('all');
  };

  const totalUsersCount = filteredUsers.length;

  // --- 1. Internet Level Data & VPN Rate ---
  const internetLevelData = useMemo(() => {
    const countA = filteredUsers.filter((u) => u.internet_level === 'A').length;
    const countB = filteredUsers.filter((u) => u.internet_level === 'B').length;
    const countC = filteredUsers.filter((u) => u.internet_level === 'C').length;

    const vpnA = filteredUsers.filter((u) => u.internet_level === 'A' && u.vpn_status).length;
    const vpnB = filteredUsers.filter((u) => u.internet_level === 'B' && u.vpn_status).length;
    const vpnC = filteredUsers.filter((u) => u.internet_level === 'C' && u.vpn_status).length;

    return [
      {
        level: 'Level A (Unrestricted)',
        key: 'A',
        total: countA,
        vpnActive: vpnA,
        vpnInactive: countA - vpnA,
        color: '#f59e0b',
        pct: totalUsersCount > 0 ? Math.round((countA / totalUsersCount) * 100) : 0,
      },
      {
        level: 'Level B (Standard)',
        key: 'B',
        total: countB,
        vpnActive: vpnB,
        vpnInactive: countB - vpnB,
        color: '#0284c7',
        pct: totalUsersCount > 0 ? Math.round((countB / totalUsersCount) * 100) : 0,
      },
      {
        level: 'Level C (Restricted)',
        key: 'C',
        total: countC,
        vpnActive: vpnC,
        vpnInactive: countC - vpnC,
        color: '#64748b',
        pct: totalUsersCount > 0 ? Math.round((countC / totalUsersCount) * 100) : 0,
      },
    ];
  }, [filteredUsers, totalUsersCount]);

  const internetDonutData = useMemo(() => {
    return internetLevelData.map((d) => ({
      name: d.level,
      value: d.total,
      color: d.color,
      pct: d.pct,
    }));
  }, [internetLevelData]);

  // --- 2. License Analytics (O365 License) ---
  const licenseData = useMemo(() => {
    const licenseCounts: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      const lic = u.o365_license || 'None';
      licenseCounts[lic] = (licenseCounts[lic] || 0) + 1;
    });

    const licenseColorMap: Record<string, string> = {
      'Microsoft 365 E5': '#8b5cf6', // Purple
      'Microsoft 365 E3': '#6366f1', // Indigo
      'Microsoft 365 E1': '#0284c7', // Sky
      'Microsoft 365 E7': '#ec4899', // Pink
      'None': '#94a3b8', // Slate
    };

    return Object.entries(licenseCounts).map(([lic, count]) => ({
      name: lic,
      value: count,
      color: licenseColorMap[lic] || '#3b82f6',
      pct: totalUsersCount > 0 ? Math.round((count / totalUsersCount) * 100) : 0,
    })).sort((a, b) => b.value - a.value);
  }, [filteredUsers, totalUsersCount]);

  // License distribution by Department
  const licenseDeptData = useMemo(() => {
    const deptMap: Record<string, Record<string, number>> = {};
    filteredUsers.forEach((u) => {
      const dept = u.department || 'Other';
      const lic = u.o365_license || 'None';
      if (!deptMap[dept]) deptMap[dept] = {};
      deptMap[dept][lic] = (deptMap[dept][lic] || 0) + 1;
    });

    return Object.entries(deptMap)
      .map(([dept, lics]) => {
        const total = Object.values(lics).reduce((a, b) => a + b, 0);
        return {
          department: dept.length > 18 ? dept.substring(0, 16) + '…' : dept,
          fullDepartment: dept,
          total,
          ...lics,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredUsers]);

  // --- 3. Access Analytics (Access Groups, Authority Groups, VPN) ---
  const levelGroupData = useMemo(() => {
    return groups.map((g) => {
      const memberCount = filteredUsers.filter((u) => u.groups.some((ug) => ug.group_id === g.group_id)).length;
      let color = '#6366f1';
      if (g.internet_level === 'A' || g.group_id === 101) color = '#f59e0b';
      else if (g.internet_level === 'B' || g.group_id === 102) color = '#0284c7';
      else if (g.internet_level === 'C' || g.group_id === 103) color = '#64748b';

      return {
        group_id: g.group_id,
        group_name: g.group_name.length > 28 ? g.group_name.substring(0, 26) + '…' : g.group_name,
        full_group_name: g.group_name,
        internet_level: g.internet_level || null,
        member_count: memberCount,
        color: color,
      };
    }).sort((a, b) => b.member_count - a.member_count);
  }, [groups, filteredUsers]);

  const vpnStatusData = useMemo(() => {
    const activeCount = filteredUsers.filter((u) => u.vpn_status).length;
    const disabledCount = filteredUsers.length - activeCount;

    return [
      {
        name: 'VPN Active (เปิดใช้)',
        value: activeCount,
        color: '#10b981',
        pct: totalUsersCount > 0 ? Math.round((activeCount / totalUsersCount) * 100) : 0,
      },
      {
        name: 'VPN Disabled (ปิดใช้)',
        value: disabledCount,
        color: '#f43f5e',
        pct: totalUsersCount > 0 ? Math.round((disabledCount / totalUsersCount) * 100) : 0,
      },
    ];
  }, [filteredUsers, totalUsersCount]);

  const authorityGroupData = useMemo(() => {
    const authMap: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      const auth = u.authority_group || 'Unassigned';
      authMap[auth] = (authMap[auth] || 0) + 1;
    });

    return Object.entries(authMap)
      .map(([name, count]) => ({
        name,
        count,
        pct: totalUsersCount > 0 ? Math.round((count / totalUsersCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredUsers, totalUsersCount]);

  // Department / Company Data
  const deptCompanyData = useMemo(() => {
    const deptMap: Record<string, { total: number; companies: Record<string, number> }> = {};

    filteredUsers.forEach((u) => {
      const dept = u.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, companies: {} };
      }
      deptMap[dept].total += 1;
      deptMap[dept].companies[u.company] = (deptMap[dept].companies[u.company] || 0) + 1;
    });

    return Object.entries(deptMap)
      .map(([dept, data]) => ({
        department: dept.length > 18 ? dept.substring(0, 16) + '…' : dept,
        fullDepartment: dept,
        total: data.total,
        ...data.companies,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredUsers]);

  // Timeline Data
  const timelineData = useMemo(() => {
    const monthCounts: Record<string, { month: string; created: number; expiring: number }> = {};

    filteredUsers.forEach((u) => {
      if (u.creation_date) {
        const date = new Date(u.creation_date);
        if (!isNaN(date.getTime())) {
          const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthCounts[mKey]) monthCounts[mKey] = { month: mKey, created: 0, expiring: 0 };
          monthCounts[mKey].created += 1;
        }
      }

      if (u.expiry_date) {
        const date = new Date(u.expiry_date);
        if (!isNaN(date.getTime())) {
          const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthCounts[mKey]) monthCounts[mKey] = { month: mKey, created: 0, expiring: 0 };
          monthCounts[mKey].expiring += 1;
        }
      }
    });

    const sortedMonths = Object.keys(monthCounts).sort();
    return sortedMonths.map((mKey) => {
      const [year, month] = mKey.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedLabel = `${monthNames[parseInt(month, 10) - 1]} ${year.substring(2)}`;

      return {
        monthKey: mKey,
        label: formattedLabel,
        Created: monthCounts[mKey].created,
        Expiring: monthCounts[mKey].expiring,
      };
    });
  }, [filteredUsers]);

  // Anomaly Watchlist Data
  const anomalyUsers = useMemo(() => {
    return filteredUsers.filter((u) => {
      const daysToExp = getDaysToExpiry(u.expiry_date);
      const isExpiredOrExpiring7d = daysToExp !== null && daysToExp <= 7;
      const isUnassignedGroup = u.groups.length === 0;
      const isMissingDeviceCode = !u.device_code || u.device_code.trim() === '';

      if (anomalyTab === 'expiring') return isExpiredOrExpiring7d;
      if (anomalyTab === 'unassigned') return isUnassignedGroup;
      if (anomalyTab === 'no_device') return isMissingDeviceCode;

      return isExpiredOrExpiring7d || isUnassignedGroup || isMissingDeviceCode;
    });
  }, [filteredUsers, anomalyTab]);

  return (
    <div className="space-y-6">

      {/* TOPIC SELECTOR & HEADER CONTROL */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              รายงานเชิงวิเคราะห์ข้อมูล (Analytics & Charts)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกหัวข้อที่ต้องการดูรายงาน: Internet Level, License, หรือ Access Rights
            </p>
          </div>

          {/* TOPIC SWITCHER BUTTONS */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>ภาพรวมทั้งหมด (All)</span>
            </button>

            <button
              onClick={() => setSelectedTopic('internet_level')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === 'internet_level'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-500" />
              <span>Internet Level</span>
            </button>

            <button
              onClick={() => setSelectedTopic('license')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === 'license'
                  ? 'bg-white text-purple-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-500" />
              <span>License (O365)</span>
            </button>

            <button
              onClick={() => setSelectedTopic('access')}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === 'access'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-4 h-4 text-emerald-500" />
              <span>Access & Permissions</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>ตัวกรอง:</span>
          </div>

          {/* Company Filter */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">ทุกบริษัท ({companies.length})</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">ทุกแผนก ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {(selectedCompany !== 'all' || selectedDepartment !== 'all') && (
            <button
              onClick={handleResetTopFilters}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตตัวกรอง</span>
            </button>
          )}

          <div className="ml-auto text-slate-400 text-[11px] font-mono">
            แสดงข้อมูลผู้ใช้งาน: <strong className="text-slate-700">{filteredUsers.length}</strong> / {users.length} คน
          </div>
        </div>
      </div>


      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ========================================== */}
        {/* TOPIC 1: INTERNET LEVEL CHARTS             */}
        {/* ========================================== */}
        {(selectedTopic === 'all' || selectedTopic === 'internet_level') && (
          <>
            {/* Chart: Internet Level Breakdown & VPN Rate */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-500" />
                    สัดส่วน Internet Level (A, B, C) และการเปิดใช้ VPN
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เปรียบเทียบสิทธิ์อินเทอร์เน็ตพร้อมอัตราการเปิดใช้งานสิทธิ์ VPN
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Donut Pie Chart */}
                <div className="h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={internetDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {internetDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs font-mono shadow-lg border border-slate-700">
                                <p className="font-bold text-amber-300">{data.name}</p>
                                <p>จำนวน: {data.value} คน ({data.pct}%)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 font-mono">{totalUsersCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
                  </div>
                </div>

                {/* Level Breakdown Details Cards */}
                <div className="space-y-2.5">
                  {internetLevelData.map((item) => (
                    <div 
                      key={item.key}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          {item.level}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{item.total} คน ({item.pct}%)</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>VPN Enabled: {item.vpnActive} คน</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {item.total > 0 ? Math.round((item.vpnActive / item.total) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${item.total > 0 ? (item.vpnActive / item.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart: Employee Count by Department */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    จำนวนพนักงานจำแนกตามแผนก (Top Departments)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    จำแนกจำนวนพนักงานตามโครงสร้างแผนกในองค์กร
                  </p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    layout="vertical"
                    data={deptCompanyData}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis 
                      type="category" 
                      dataKey="department" 
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
                      width={110}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 font-mono">
                              <p className="font-bold text-emerald-300">{data.fullDepartment}</p>
                              <p className="text-slate-200">รวมทั้งหมด: {data.total} คน</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[0, 6, 6, 0]} name="จำนวนพนักงาน" barSize={16} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}


        {/* ========================================== */}
        {/* TOPIC 2: LICENSE (O365 LICENSE) CHARTS     */}
        {/* ========================================== */}
        {(selectedTopic === 'all' || selectedTopic === 'license') && (
          <>
            {/* Chart: O365 License Distribution (Pie / Donut) */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    สัดส่วน Microsoft 365 License (E1, E3, E5, E7)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    การกระจายตัวของสัญญาอนุญาตใช้งานซอฟต์แวร์ Office 365
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={licenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {licenseData.map((entry, index) => (
                          <Cell key={`cell-lic-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs font-mono shadow-lg border border-slate-700">
                                <p className="font-bold text-purple-300">{data.name}</p>
                                <p>จำนวน: {data.value} บัญชี ({data.pct}%)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 font-mono">{totalUsersCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Licenses</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {licenseData.map((item) => (
                    <div key={item.name} className="p-2 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{item.value} บัญชี ({item.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart: License Distribution by Department */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    การถือครอง License แยกตามแผนก (License by Dept)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    อัตราส่วนการจัดสรรสัญญาอนุญาตในแต่ละแผนก
                  </p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={licenseDeptData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="department" 
                      tick={{ fontSize: 10, fill: '#475569' }} 
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 font-mono">
                              <p className="font-bold text-purple-300">{data.fullDepartment}</p>
                              <p className="text-slate-200">รวมทั้งหมด: {data.total} บัญชี</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={20} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}


        {/* ========================================== */}
        {/* TOPIC 3: ACCESS & PERMISSIONS CHARTS       */}
        {/* ========================================== */}
        {(selectedTopic === 'all' || selectedTopic === 'access') && (
          <>
            {/* Chart: User Count per Access Group (Level Group) */}
            <div className="lg:col-span-12 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    จำนวนพนักงานในแต่ละกลุ่มสิทธิ์ (Groups by Level Group)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แยกตาม Level Group (คลิกเพื่อเปิด Explorer)
                  </p>
                </div>
              </div>

              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={levelGroupData} margin={{ top: 15, right: 20, left: -10, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="group_name" 
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      dx={-2}
                      dy={6}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 font-mono">
                              <p className="font-bold text-amber-300">{data.full_group_name}</p>
                              {data.internet_level && (
                                <p className="text-slate-300">Internet Level: {data.internet_level}</p>
                              )}
                              <p className="font-extrabold text-indigo-300">สมาชิก: {data.member_count} คน</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="member_count" 
                      radius={[6, 6, 0, 0]} 
                      barSize={28}
                      cursor="pointer"
                      onClick={(entry) => {
                        if (entry && entry.group_id && onOpenLevelGroupExplorer) {
                          onOpenLevelGroupExplorer(entry.group_id);
                        }
                      }}
                    >
                      {levelGroupData.map((entry, index) => (
                        <Cell key={`cell-grp-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Internet Level A</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Internet Level B</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Internet Level C / Standard</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* TIMELINE TREND CHART (Creation vs Expiry)   */}
        {/* ========================================== */}
        {selectedTopic === 'all' && (
          <div className="lg:col-span-12 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  แนวโน้มการสร้างบัญชีใหม่ vs Timeline วันหมดอายุ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ติดตามจังหวะการสร้างบัญชีและการครบรอบวันหมดอายุบัญชี
                </p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpiring" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 font-mono">
                            <p className="font-bold text-indigo-300">เดือน {label}</p>
                            <p className="text-indigo-200">สร้างใหม่: {payload[0]?.value || 0} บัญชี</p>
                            <p className="text-rose-300">หมดอายุ: {payload[1]?.value || 0} บัญชี</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Created" name="สร้างบัญชีใหม่" stroke="#6366f1" fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Expiring" name="หมดอายุสัญญา" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpiring)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>


      {/* ANOMALY WATCHLIST WIDGET */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  Anomaly & Security Watchlist
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                    {anomalyUsers.length} Issues Detected
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  รายการบัญชีที่พบความเสี่ยงหรือต้องดำเนินการปรับปรุงด่วน
                </p>
              </div>
            </div>
          </div>

          {/* Anomaly Filter Quick Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setAnomalyTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                anomalyTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setAnomalyTab('expiring')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                anomalyTab === 'expiring' 
                  ? 'bg-white text-rose-700 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              หมดอายุ / ใกล้หมดอายุ (&le; 7 วัน)
            </button>
            <button
              onClick={() => setAnomalyTab('unassigned')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                anomalyTab === 'unassigned' 
                  ? 'bg-white text-amber-800 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไม่มี Group สิทธิ์ (Unassigned)
            </button>
            <button
              onClick={() => setAnomalyTab('no_device')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                anomalyTab === 'no_device' 
                  ? 'bg-white text-sky-800 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไม่มี Device Code
            </button>
          </div>
        </div>

        {/* Anomaly Watchlist Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">พนักงาน (Employee)</th>
                  <th className="py-3 px-4">บริษัท & แผนก</th>
                  <th className="py-3 px-4">ประเภทความเสี่ยง (Detected Anomaly)</th>
                  <th className="py-3 px-4">Internet Level</th>
                  <th className="py-3 px-4">VPN</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {anomalyUsers.slice(0, 10).map((u) => {
                  const daysToExp = getDaysToExpiry(u.expiry_date);
                  const isExpiredOrExpiring7d = daysToExp !== null && daysToExp <= 7;
                  const isUnassignedGroup = u.groups.length === 0;
                  const isMissingDeviceCode = !u.device_code || u.device_code.trim() === '';

                  return (
                    <tr key={u.employee_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                            {u.display_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.display_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{u.employee_id} • {u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{u.company}</span>
                        <span className="text-[10px] text-slate-500">{u.department}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {isExpiredOrExpiring7d && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {daysToExp !== null && daysToExp < 0 ? 'หมดอายุแล้ว' : `หมดอายุใน ${daysToExp} วัน`}
                            </span>
                          )}

                          {isUnassignedGroup && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              <UserX className="w-3 h-3 mr-1" />
                              ยังไม่ผูกกลุ่มสิทธิ์
                            </span>
                          )}

                          {isMissingDeviceCode && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                              <Smartphone className="w-3 h-3 mr-1" />
                              ไม่มี Device Code
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          u.internet_level === 'A' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          u.internet_level === 'B' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Level {u.internet_level}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.vpn_status ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {onSelectUserForDetail && (
                          <button
                            onClick={() => onSelectUserForDetail(u)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>ดูโปรไฟล์</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {anomalyUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">ไม่พบข้อบกพร่องหรือความเสี่ยงในระบบตามเงื่อนไขที่เลือก</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ระบบมีความสมบูรณ์ตามมาตรฐาน Security Policy</p>
            </div>
          )}
        </div>

        {anomalyUsers.length > 10 && (
          <p className="text-[11px] text-slate-400 text-right font-medium">
            * แสดง 10 บัญชีแรกจากทั้งหมด {anomalyUsers.length} บัญชีที่มีข้อบกพร่อง
          </p>
        )}

      </div>

    </div>
  );
};
