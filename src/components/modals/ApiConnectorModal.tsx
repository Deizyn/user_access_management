import React, { useState } from 'react';
import { User, Group, UserGroup } from '../../types';
import {
  ActiveDirectoryConfig,
  SqlDatabaseConfig,
  RestApiConfig,
  HybridPipelineConfig,
  SyncExecutionResult,
  syncFromActiveDirectory,
  syncFromSqlDatabase,
  syncHybridMultiSourcePipeline,
  syncAutoDiscoverPipeline,
} from '../../services/apiAdapter';
import { Database, Network, Globe, RefreshCw, CheckCircle2, Server, Play, X, Shield, Terminal, ArrowRight, Layers, Cpu, Link2, Info, Zap, Sparkles, Check } from 'lucide-react';

interface ApiConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: User[];
  existingGroups: Group[];
  existingUserGroups: UserGroup[];
  onSyncSuccess: (importedUsers: User[], importedGroups: Group[], importedUserGroups: UserGroup[]) => void;
}

export const ApiConnectorModal: React.FC<ApiConnectorModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  existingGroups,
  existingUserGroups,
  onSyncSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'HYBRID' | 'AD' | 'SQL' | 'REST'>('AUTO');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncExecutionResult | null>(null);

  // Hybrid Multi-Source Pipeline state
  const [hybridConfig, setHybridConfig] = useState<HybridPipelineConfig>({
    userSourceType: 'SQL',
    groupSourceType: 'AD_LDAP',
    correlationStrategy: 'username_match',
    sqlConfig: {
      dbType: 'postgresql',
      host: 'db-master.internal.net',
      port: 5432,
      database: 'enterprise_uam_db',
      username: 'uam_readonly_app',
      customQuery: 'SELECT emp_id, user_name, full_name, email_address, dept_name, position_title, inet_level FROM view_active_employees',
    },
    adConfig: {
      serverHost: 'dc01.company.co.th',
      domain: 'company.co.th',
      baseDn: 'OU=SecurityGroups,DC=company,DC=co,DC=th',
      bindDN: 'CN=svc_uam_sync,OU=ServiceAccounts,DC=company,DC=co,DC=th',
      useSslLdaps: true,
      syncGroups: true,
      userFilter: '(objectClass=group)',
    },
    restConfig: {
      endpointUrl: 'https://api.internal.company.com/v1/identity/users',
      authType: 'bearer',
      authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      httpMethod: 'GET',
    },
  });

  // Active Directory Config state
  const [adConfig, setAdConfig] = useState<ActiveDirectoryConfig>({
    serverHost: 'dc01.company.co.th',
    domain: 'company.co.th',
    baseDn: 'OU=Employees,DC=company,DC=co,DC=th',
    bindDN: 'CN=svc_uam_sync,OU=ServiceAccounts,DC=company,DC=co,DC=th',
    useSslLdaps: true,
    syncGroups: true,
    userFilter: '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
  });

  // SQL Config state
  const [sqlConfig, setSqlConfig] = useState<SqlDatabaseConfig>({
    dbType: 'sqlite',
    host: 'localhost',
    port: 3306,
    database: 'user_access_dashboard_data',
    username: 'root',
    customQuery: 'SELECT emp_id, user_name, full_name, email_address, dept_name, position_title, inet_level, group_names_csv FROM view_active_employees',
  });

  // REST API Config state
  const [restConfig, setRestConfig] = useState<RestApiConfig>({
    endpointUrl: 'https://api.internal.company.com/v1/identity/users',
    authType: 'bearer',
    authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    httpMethod: 'GET',
  });

  if (!isOpen) return null;

  const handleExecuteSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      let result: SyncExecutionResult;
      if (activeTab === 'AUTO') {
        result = await syncAutoDiscoverPipeline(existingGroups);
      } else if (activeTab === 'HYBRID') {
        result = await syncHybridMultiSourcePipeline(hybridConfig, existingGroups);
      } else if (activeTab === 'AD') {
        result = await syncFromActiveDirectory(adConfig, existingGroups);
      } else if (activeTab === 'SQL') {
        result = await syncFromSqlDatabase(sqlConfig, existingGroups);
      } else {
        result = await syncFromActiveDirectory(adConfig, existingGroups);
      }
      setSyncResult(result);
    } catch (err) {
      console.error('API Sync Error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplySyncToApp = () => {
    if (!syncResult) return;
    
    // Case-insensitive user lookup to prevent duplicate Employee ID creation
    const canonicalEmpIdMap = new Map<string, string>(); // lowercased_emp_id -> canonical_emp_id
    const usernameMap = new Map<string, string>(); // lowercased_username -> canonical_emp_id
    const userMap = new Map<string, User>();

    existingUsers.forEach((u) => {
      userMap.set(u.employee_id, u);
      canonicalEmpIdMap.set(u.employee_id.trim().toLowerCase(), u.employee_id);
      if (u.username) {
        usernameMap.set(u.username.trim().toLowerCase(), u.employee_id);
      }
    });

    syncResult.users.forEach((u) => {
      const lowerEmpId = u.employee_id.trim().toLowerCase();
      const lowerUser = u.username ? u.username.trim().toLowerCase() : '';

      let targetKey = u.employee_id;
      if (canonicalEmpIdMap.has(lowerEmpId)) {
        targetKey = canonicalEmpIdMap.get(lowerEmpId)!;
      } else if (lowerUser && usernameMap.has(lowerUser)) {
        targetKey = usernameMap.get(lowerUser)!;
      }

      const mergedUser: User = {
        ...u,
        employee_id: targetKey,
      };
      userMap.set(targetKey, mergedUser);
    });

    // Merge groups
    const groupMap = new Map<number, Group>();
    existingGroups.forEach((g) => groupMap.set(g.group_id, g));
    syncResult.groups.forEach((g) => groupMap.set(g.group_id, g));

    // Merge userGroups relationships
    const ugSet = new Set<string>();
    const mergedUserGroups: UserGroup[] = [...existingUserGroups];
    existingUserGroups.forEach((ug) => ugSet.add(`${ug.employee_id}_${ug.group_id}`));

    syncResult.userGroups.forEach((ug) => {
      const lowerEmpId = ug.employee_id.trim().toLowerCase();
      const canonicalId = canonicalEmpIdMap.get(lowerEmpId) || ug.employee_id;
      const key = `${canonicalId}_${ug.group_id}`;
      if (!ugSet.has(key)) {
        ugSet.add(key);
        mergedUserGroups.push({
          employee_id: canonicalId,
          group_id: ug.group_id,
        });
      }
    });

    onSyncSuccess(Array.from(userMap.values()), Array.from(groupMap.values()), mergedUserGroups);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Enterprise API & Directory Integration Bridge</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/30 text-indigo-300 font-mono border border-indigo-500/40">
                  Unified Gateway v3.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                รองรับ Multi-Source Aggregation: ดึง User จาก Database และ Correlate กับ Security Groups จาก Active Directory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selector Tabs */}
        <div className="bg-slate-100/80 px-6 pt-3 border-b border-slate-200 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('AUTO'); setSyncResult(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'AUTO'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold border-t-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-900 fill-amber-300" />
            <span>⚡ Auto Sync (Zero Configuration)</span>
          </button>

          <button
            onClick={() => { setActiveTab('HYBRID'); setSyncResult(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'HYBRID'
                ? 'bg-white text-indigo-600 shadow-2xs border-t-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Hybrid Pipeline (Manual Settings)</span>
          </button>

          <button
            onClick={() => { setActiveTab('AD'); setSyncResult(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'AD'
                ? 'bg-white text-indigo-600 shadow-2xs border-t-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Active Directory Only</span>
          </button>

          <button
            onClick={() => { setActiveTab('SQL'); setSyncResult(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'SQL'
                ? 'bg-white text-indigo-600 shadow-2xs border-t-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SQL Database Only</span>
          </button>

          <button
            onClick={() => { setActiveTab('REST'); setSyncResult(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'REST'
                ? 'bg-white text-indigo-600 shadow-2xs border-t-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>REST API Endpoint</span>
          </button>
        </div>

        {/* Configuration Area */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {activeTab === 'AUTO' && (
            <div className="space-y-5">
              
              {/* Zero Config Smart Sync Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                        <span>1-Click Auto Enterprise Multi-Source Sync</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-mono border border-amber-400/30">
                          Zero Setup
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        ระบบจะทำการสแกนและจับคู่ข้อมูลจากทั้ง SQL Database และ Active Directory LDAP อัตโนมัติในคลิกเดียว
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  ⚡ <b>ไม่ต้องตั้งค่า SQL Query หรือ LDAP Filter เอง!</b> ระบบ Auto Engine จะตรวจสอบโครงสร้างข้อมูล, ค้นหา Join Key (Username / Employee ID) อัตโนมัติ และแมปกลุ่ม <b>Internet Level A, Internet Level B, Internet Level C</b> เข้ากับระบบ UAM โดยตรง
                </p>

                {/* Intelligent Feature List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-100">Auto Schema & Entity Discovery</p>
                      <p className="text-[11px] text-slate-400">ค้นหาคอลัมน์ User, Full Name, Email, Dept จาก SQL & LDAP โดยอัตโนมัติ</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-100">Auto Internet Level A / B / C Inference</p>
                      <p className="text-[11px] text-slate-400">อ่านชื่อกลุ่ม "Internet Level A/B/C" แล้วตั้งค่าระดับอินเทอร์เน็ตให้ User ทันที</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-100">Auto Cross-Source Identity Join</p>
                      <p className="text-[11px] text-slate-400">ดึง User จาก SQL และผูก Security Group จาก Active Directory ให้อัตโนมัติ</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-100">Auto Level Group Assignment (101, 102, 103)</p>
                      <p className="text-[11px] text-slate-400">เชื่อมโยง Level Group สิทธิ์ของ WebApp (Level A=101, B=102, C=103)</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'HYBRID' && (
            <div className="space-y-5">
              
              {/* Architecture Explanation Banner */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 text-indigo-950 font-bold">
                    <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>สถาปัตยกรรม Identity Correlation Engine (Cross-Source Identity Aggregation)</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded font-mono text-[10px] font-bold">
                    Join Key: {hybridConfig.correlationStrategy}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  หากข้อมูล User ถูกเก็บอยู่ใน <b>SQL Database</b> แต่ข้อมูล Group สิทธิ์ถูกบริหารเพียวๆ ใน <b>Active Directory (AD LDAP)</b> ระบบจะดึงรายชื่อ User จาก SQL และดึง Security Groups จาก AD แล้วจับคู่ความสัมพันธ์ผ่าน <b>Correlation Key (Join Key)</b> อัตโนมัติ!
                </p>

                {/* Visual Flow Pipeline Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Source 1: Users</p>
                      <p className="text-[10px] text-slate-500">PostgreSQL Table / View</p>
                    </div>
                  </div>

                  <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-2xs flex items-center space-x-2 justify-center">
                    <Link2 className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                    <div className="text-center">
                      <p className="font-bold">Correlation Engine</p>
                      <p className="text-[10px] text-indigo-200">Match by {hybridConfig.correlationStrategy}</p>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs flex items-center space-x-2">
                    <Network className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">Source 2: Groups</p>
                      <p className="text-[10px] text-slate-500">Active Directory LDAP Trees</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Correlation Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* 1. User Source */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>1. แหล่งข้อมูล User (Users Source)</span>
                  </label>
                  <select
                    value={hybridConfig.userSourceType}
                    onChange={(e) => setHybridConfig({ ...hybridConfig, userSourceType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SQL">SQL Database (PostgreSQL / MSSQL)</option>
                    <option value="REST">REST API Endpoint</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    ดึง attribute: emp_id, user_name, full_name, email, dept, inet_level
                  </p>
                </div>

                {/* 2. Group Source */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                    <Network className="w-4 h-4 text-indigo-600" />
                    <span>2. แหล่งข้อมูล Group (Groups Source)</span>
                  </label>
                  <select
                    value={hybridConfig.groupSourceType}
                    onChange={(e) => setHybridConfig({ ...hybridConfig, groupSourceType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AD_LDAP">Active Directory (LDAP / Security Groups)</option>
                    <option value="REST">REST API SCIM Directory</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    ดึง Security Groups + member array (distinguishedName, CN)
                  </p>
                </div>

                {/* 3. Correlation Strategy */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                    <Link2 className="w-4 h-4 text-amber-600" />
                    <span>3. วิธีการจับคู่ (Correlation Join Key)</span>
                  </label>
                  <select
                    value={hybridConfig.correlationStrategy}
                    onChange={(e) => setHybridConfig({ ...hybridConfig, correlationStrategy: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-indigo-700 border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="username_match">Match by sAMAccountName / Username</option>
                    <option value="employee_id_match">Match by Employee ID (EMP-ID)</option>
                    <option value="group_name_tokens">Match by Group Name CSV Tokens</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    ใช้อัลกอริทึมค้นหา <code className="text-indigo-600 font-mono">user.username</code> อยู่ใน AD Group <code className="text-indigo-600 font-mono">member</code> list หรือไม่
                  </p>
                </div>

              </div>

              {/* Detailed Technical Field Information */}
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs space-y-2 font-mono border border-slate-800">
                <p className="text-indigo-400 font-bold flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>คำอธิบายกลไกการจับคู่แบบละเอียด (How User-Group Correlation Works):</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                  <li>
                    <b className="text-amber-300">Option 1 (sAMAccountName / Username Match):</b> เมื่อดึง User จาก SQL (เช่น <code className="text-emerald-400">user_name = "somchai.p"</code>) ระบบจะค้นหาใน AD Group objects ซึ่งมีสมาชิกระบุใน attribute <code className="text-emerald-400">member: CN=somchai.p,OU=Users...</code> หากตรงกันจะสร้างความสัมพันธ์ User-Group อัตโนมัติ
                  </li>
                  <li>
                    <b className="text-amber-300">Option 2 (Employee ID Match):</b> หากองค์กรใช้รหัสพนักงานในการอ้างอิง ระบบจะเทียบ <code className="text-emerald-400">emp_id = "EMP-HYBRID-01"</code> กับสมาชิกใน AD Group
                  </li>
                  <li>
                    <b className="text-amber-300">Option 3 (Group Name Tokens):</b> เทียบชื่อกลุ่มใน SQL <code className="text-emerald-400">group_names_csv</code> กับ <code className="text-emerald-400">CN</code> ของ Active Directory Security Group
                  </li>
                </ul>
              </div>

            </div>
          )}

          {activeTab === 'AD' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Active Directory / LDAP Schema Mapper</span>
                </p>
                <p className="text-slate-500">
                  ระบบแปลง attribute จาก AD เช่น <code className="text-indigo-600 font-mono">sAMAccountName</code> → Username, <code className="text-indigo-600 font-mono">memberOf</code> → กลุ่มสิทธิ์ (Groups), <code className="text-indigo-600 font-mono">extensionAttribute1</code> → Internet Level (A/B/C)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Domain Controller Host</label>
                  <input
                    type="text"
                    value={adConfig.serverHost}
                    onChange={(e) => setAdConfig({ ...adConfig, serverHost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Base DN (User Search Tree)</label>
                  <input
                    type="text"
                    value={adConfig.baseDn}
                    onChange={(e) => setAdConfig({ ...adConfig, baseDn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Bind DN Account</label>
                  <input
                    type="text"
                    value={adConfig.bindDN}
                    onChange={(e) => setAdConfig({ ...adConfig, bindDN: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">LDAP Filter</label>
                  <input
                    type="text"
                    value={adConfig.userFilter}
                    onChange={(e) => setAdConfig({ ...adConfig, userFilter: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SQL' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>SQL Relational Database Integration</span>
                </p>
                <p className="text-slate-500">
                  รองรับ PostgreSQL, MS SQL Server, MySQL โดยทำการ Query View/Table แล้ว Map เข้า UAM Relational Data Model อัตโนมัติ
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Engine</label>
                  <select
                    value={sqlConfig.dbType}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, dbType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="sqlite">SQLite 3 (user_access_dashboard)</option>
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mssql">MS SQL Server</option>
                    <option value="mysql">MySQL / MariaDB</option>
                    <option value="oracle">Oracle Database</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Host / Server IP</label>
                  <input
                    type="text"
                    value={sqlConfig.host}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, host: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Database Name</label>
                  <input
                    type="text"
                    value={sqlConfig.database}
                    onChange={(e) => setSqlConfig({ ...sqlConfig, database: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-700 font-medium mb-1">Custom SQL Query (Select View/Table)</label>
                <textarea
                  rows={2}
                  value={sqlConfig.customQuery}
                  onChange={(e) => setSqlConfig({ ...sqlConfig, customQuery: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-900 text-amber-300"
                />
              </div>
            </div>
          )}

          {activeTab === 'REST' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>REST API & SCIM Enterprise Webhook Connector</span>
                </p>
                <p className="text-slate-500">
                  ดึงข้อมูลจาก Endpoint ภายนอกผ่าน HTTP Header Bearer Token แล้วแปลง JSON เป็น Relational Entities
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">API Endpoint URL</label>
                  <input
                    type="text"
                    value={restConfig.endpointUrl}
                    onChange={(e) => setRestConfig({ ...restConfig, endpointUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Authentication</label>
                  <select
                    value={restConfig.authType}
                    onChange={(e) => setRestConfig({ ...restConfig, authType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bearer">Bearer Token (JWT)</option>
                    <option value="apiKey">X-API-KEY Header</option>
                    <option value="basic">Basic Auth</option>
                    <option value="none">No Auth</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sync Trigger Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleExecuteSync}
              disabled={isSyncing}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 ${
                activeTab === 'AUTO'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black ring-2 ring-amber-400/50'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังประมวลผล Multi-Source Auto Engine...</span>
                </>
              ) : (
                <>
                  {activeTab === 'AUTO' ? (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>⚡ 1-Click Auto Sync & Correlate (Zero Config)</span>
                    </>
                  ) : activeTab === 'HYBRID' ? (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>ประมวลผล Multi-Source Pipeline (Live Correlation)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>ทดสอบเชื่อมต่อ & Sync ข้อมูลจริง</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Sync Execution Output Terminal Logs */}
          {syncResult && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-indigo-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-1.5 font-bold">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>EXECUTION LOGS [{syncResult.sourceType}]</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">{syncResult.summary.durationMs} ms</span>
                </div>
                <div className="space-y-1 text-[11px] leading-relaxed max-h-44 overflow-y-auto">
                  {syncResult.logMessages.map((msg, i) => (
                    <p key={i} className="text-slate-300">
                      <span className="text-slate-500">&gt;</span> {msg}
                    </p>
                  ))}
                </div>
              </div>

              {/* Sync Summary Result Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-emerald-950">
                      ประมวลผลข้อมูลเสร็จสิ้น! ดึงข้อมูลสำเร็จ {syncResult.summary.totalRecordsFetched} รายการ
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      พร้อมแปลงลง UAM Normalized Model ({syncResult.users.length} Users, {syncResult.userGroups.length} Group Relations)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleApplySyncToApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
                >
                  <span>นำเข้าสู่ตาราง WebApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>* ระบบใช้ Multi-Source Normalization Engine 3NF Standard เพื่อป้องกันข้อมูลซ้ำซ้อน</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/50"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};

