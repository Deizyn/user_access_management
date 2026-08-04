import React, { useState } from 'react';
import { FolderKanban, Download, Upload, RefreshCw, Users, Database, Sparkles, ChevronUp, ChevronDown, EyeOff, Eye } from 'lucide-react';

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
  const [isHidden, setIsHidden] = useState(true);

  if (isHidden) {
    return (
      <div className="sticky top-2 z-30 flex justify-end px-4 max-w-7xl mx-auto w-full pointer-events-none mb-[-2rem]">
        <button
          onClick={() => setIsHidden(false)}
          title="แสดงแถบเมนู (Show Navbar)"
          className="pointer-events-auto inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/90 hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200/90 text-xs font-semibold rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer hover:scale-105 group"
        >
          <Eye className="w-3.5 h-3.5 text-indigo-600 group-hover:text-indigo-400" />
          <span>แสดงแถบเมนู (Show Navbar)</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs transition-all duration-300">
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
                  User Authorization
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                ระบบแดชบอร์ดดูรายชื่อพนักงาน ข้อมูลสิทธิ์เข้าถึง และกลุ่มผู้ใช้งาน
              </p>
            </div>
          </div>

          {/* Consolidated Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">


            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={onOpenDbStatus}
              title="คลิกเพื่อเช็คสถานะการเชื่อมต่อฐานข้อมูล SQLite (user_access_dashboard)"
              className="inline-flex items-center px-3 py-2 border border-emerald-300 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer space-x-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5 mr-1 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>SQLite Connected</span>
            </button>
            {/* UNIFIED SINGLE DATA & DATABASE CENTER BUTTON */}
            <button
              onClick={() => onOpenDataCenter('import')}
              title="ศูนย์กลางจัดการข้อมูล - นำเข้า/ส่งออก (CSV & JSON), สำรองฐานข้อมูล SQLite และ SQL Console"
              className="inline-flex items-center px-4 py-2 border border-indigo-500/30 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer space-x-2"
            >
              <Database className="w-4 h-4 text-indigo-200" />
              <span>Data & SQLite Center (จัดการข้อมูล & ฐานข้อมูล)</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={() => onResetData()}
              title="รีเซ็ตคืนค่าข้อมูลทั้งหมดในระบบกลับสู่ค่าเริ่มต้น"
              className="inline-flex items-center px-3 py-2 border border-rose-200 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
              Reset Data
            </button>

            {/* Hide Navbar Toggle Button */}
            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={() => setIsHidden(true)}
              title="ซ่อนแถบเมนู (Hide Navbar)"
              className="inline-flex items-center px-2.5 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer space-x-1"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-xs">ซ่อนเมนู</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

