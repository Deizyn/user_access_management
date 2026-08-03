import React from 'react';
import { FolderKanban, Download, Upload, RefreshCw, Users, Database, Sparkles } from 'lucide-react';

interface NavbarProps {
  totalUsersCount: number;
  activeVpnCount: number;
  onOpenAddUser?: () => void;
  onOpenManageGroups: () => void;
  onOpenDataCenter: (tab?: 'import' | 'export' | 'schema' | 'sql_console') => void;
  onOpenDbStatus?: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalUsersCount,
  activeVpnCount,
  onOpenManageGroups,
  onOpenDataCenter,
  onOpenDbStatus,
  onResetData,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & App Title */}
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  User Access Management Dashboard
                </h1>
                <button
                  onClick={onOpenDbStatus}
                  title="คลิกเพื่อเช็คสถานะการเชื่อมต่อฐานข้อมูล SQLite (user_access_dashboard)"
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Database className="w-3.5 h-3.5 mr-1 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>SQLite Connected</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                ระบบจัดการรายชื่อพนักงาน ข้อมูลสิทธิ์เข้าถึง และกลุ่มผู้ใช้งาน (Unified Master Dashboard)
              </p>
            </div>
          </div>

          {/* Consolidated Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Manage Groups Button */}
            <button
              onClick={onOpenManageGroups}
              className="inline-flex items-center px-3.5 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 mr-1.5 text-slate-500" />
              Manage Groups (กลุ่มสิทธิ์)
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* UNIFIED SINGLE DATA & DATABASE CENTER BUTTON */}
            <button
              onClick={() => onOpenDataCenter('import')}
              title="ศูนย์กลางจัดการข้อมูล - นำเข้า/ส่งออก (CSV & JSON), สำรองฐานข้อมูล SQLite และ SQL Console"
              className="inline-flex items-center px-4 py-2 border border-indigo-500/30 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer space-x-2"
            >
              <Database className="w-4 h-4 text-indigo-200" />
              <span>Data & SQLite Center (จัดการข้อมูล & ฐานข้อมูล)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/50 text-[10px] text-white">
                Full System
              </span>
            </button>

            {/* DB Health Checker Button */}
            <button
              onClick={onOpenDbStatus}
              title="เช็คสถานะการเชื่อมต่อฐานข้อมูลเรียลไทม์ (user_access_dashboard)"
              className="inline-flex items-center px-3 py-2 border border-emerald-300 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer space-x-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>เช็คการเชื่อมต่อ DB</span>
            </button>

            {/* Quick Export Shortcut */}
            <button
              onClick={() => onOpenDataCenter('export')}
              title="ส่งออกข้อมูล (CSV / JSON / SQLite)"
              className="inline-flex items-center px-3 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-600" />
              Export
            </button>

            {/* Reset Button */}
            <button
              onClick={onResetData}
              title="รีเซ็ตข้อมูลทั้งหมดในระบบกลับสู่ค่าเริ่มต้น"
              className="inline-flex items-center p-2 border border-slate-200 text-xs font-medium rounded-xl text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
