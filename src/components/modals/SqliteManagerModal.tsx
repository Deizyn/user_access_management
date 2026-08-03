import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  Code2, 
  CheckCircle, 
  CheckCircle2,
  AlertTriangle, 
  Copy, 
  Check, 
  FileJson, 
  Play, 
  Server, 
  Table as TableIcon,
  HardDrive,
  RefreshCw,
  FileCode,
  FileSpreadsheet,
  Layers,
  Users,
  Sparkles
} from 'lucide-react';
import { User, Group, UserGroup, UserWithGroups } from '../../types';
import { 
  exportSqliteToJson, 
  importSqliteFromJson, 
  executeRawSql, 
  exportSqliteBinaryFile 
} from '../../lib/sqliteDb';
import { 
  exportUsersToCSV, 
  processImportCSV, 
  downloadCSVTemplate, 
  ParseResult 
} from '../../utils/csvHelpers';
import { JSON_DATABASE_SCHEMA_DOC } from '../../data/databaseSchemaSpec';

interface SqliteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  groups: Group[];
  userGroups: UserGroup[];
  onImportComplete: (importedUsers: User[], importedGroups: Group[], importedUserGroups: UserGroup[]) => void;
  onResetDatabase: (skipConfirm?: boolean) => void;
  initialTab?: 'import' | 'export' | 'schema' | 'sql_console';
}

export const SqliteManagerModal: React.FC<SqliteManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  groups,
  userGroups,
  onImportComplete,
  onResetDatabase,
  initialTab = 'import',
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'schema' | 'sql_console'>(initialTab);
  
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [copiedSchema, setCopiedSchema] = useState(false);

  // CSV Import State
  const [importMode, setImportMode] = useState<'csv' | 'json'>('csv');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null);
  const [isCsvDragOver, setIsCsvDragOver] = useState<boolean>(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // JSON Import State
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState(`SELECT o365_license, COUNT(*) as total_users \nFROM users \nGROUP BY o365_license;`);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  if (!isOpen) return null;

  // CSV Processing Handlers
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processCsvFile(selectedFile);
  };

  const processCsvFile = (selectedFile: File) => {
    setCsvFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = processImportCSV(content, users, groups, userGroups);
        setCsvParseResult(result);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleCsvDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsCsvDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvFile(e.dataTransfer.files[0]);
    }
  };

  const handleResetCsvImport = () => {
    setCsvFile(null);
    setCsvParseResult(null);
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };

  const handleConfirmCsvImport = () => {
    if (!csvParseResult) return;
    onImportComplete(csvParseResult.users, csvParseResult.groups, csvParseResult.userGroups);
    setImportStatus({
      type: 'success',
      message: `นำเข้าไฟล์ CSV ลง SQLite สำเร็จ! (ผู้ใช้ทั้งหมด: ${csvParseResult.users.length} รายการ, กลุ่มสิทธิ์: ${csvParseResult.groups.length} กลุ่ม)`,
    });
    handleResetCsvImport();
  };

  // JSON Export Download
  const handleDownloadJson = () => {
    try {
      const exportData = exportSqliteToJson();
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `uam_sqlite_db_export_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error exporting JSON: ' + (err?.message || err));
    }
  };

  // CSV Export Download
  const handleDownloadCsv = () => {
    try {
      const usersWithGroups: UserWithGroups[] = users.map((u) => {
        const assignedGids = userGroups
          .filter((ug) => ug.employee_id === u.employee_id)
          .map((ug) => ug.group_id);
        const assignedGroups = groups.filter((g) => assignedGids.includes(g.group_id));
        return {
          ...u,
          groups: assignedGroups,
        };
      });
      exportUsersToCSV(usersWithGroups, 'sqlite_user_master_export');
    } catch (err: any) {
      alert('Error exporting CSV: ' + (err?.message || err));
    }
  };

  // SQLite Binary Download (.sqlite)
  const handleDownloadSqliteBinary = () => {
    try {
      const binary = exportSqliteBinaryFile();
      const blob = new Blob([binary.buffer], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `uam_database_${timestamp}.sqlite`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error exporting SQLite binary file: ' + (err?.message || err));
    }
  };

  // JSON File Drop / Selection
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
        setImportStatus({
          type: 'success',
          message: `โหลดไฟล์ ${file.name} เรียบร้อยแล้ว คลิก "ยืนยันนำเข้า JSON" ด้านล่างเพื่ออัปเดต SQLite`,
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: 'อ่านไฟล์ไม่สำเร็จ: ' + (err?.message || err),
        });
      }
    };
    reader.readAsText(file);
  };

  // Process Import JSON
  const handleExecuteJsonImport = () => {
    if (!importJsonText.trim()) {
      setImportStatus({ type: 'error', message: 'กรุณาวางเนื้อหา JSON หรือเลือกไฟล์ JSON ก่อนทำการนำเข้า' });
      return;
    }

    try {
      const parsed = JSON.parse(importJsonText);
      const result = importSqliteFromJson(parsed);
      onImportComplete(result.users, result.groups, result.userGroups);
      setImportStatus({
        type: 'success',
        message: `นำเข้าข้อมูล JSON เข้าสู่ SQLite สำเร็จ! (ผู้ใช้งาน: ${result.users.length} คน, กลุ่ม: ${result.groups.length} กลุ่ม)`,
      });
      setImportJsonText('');
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: 'การนำเข้าข้อมูลล้มเหลว: ' + (err?.message || 'รูปแบบ JSON ไม่ถูกต้อง'),
      });
    }
  };

  // Run SQL Query
  const handleRunSqlQuery = () => {
    setQueryError(null);
    setQueryResult(null);

    if (!sqlQuery.trim()) return;

    try {
      const res = executeRawSql(sqlQuery);
      if (res && res.length > 0) {
        setQueryResult({
          columns: res[0].columns,
          values: res[0].values,
        });
      } else {
        setQueryResult({
          columns: ['Status'],
          values: [['คำสั่ง SQL ทำงานสำเร็จ (ไม่มีแถวข้อมูลส่งกลับ)']],
        });
      }
    } catch (err: any) {
      setQueryError(err?.message || 'SQL Execution Error');
    }
  };

  // Copy Schema Documentation
  const handleCopySchemaDoc = () => {
    navigator.clipboard.writeText(JSON.stringify(JSON_DATABASE_SCHEMA_DOC, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-5.5 h-5.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Data & SQLite Database Management Center
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SQLite v3 (WebAssembly)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ศูนย์กลางนำเข้า-ส่งออกข้อมูล (CSV / JSON), สำรองฐานข้อมูล และจัดการโครงสร้าง SQLite ทั้งหมด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Quick Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200/80">
            <TableIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">Table: users</div>
              <div className="text-sm font-bold text-slate-900">{users.length} พนักงาน</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200/80">
            <HardDrive className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">Table: groups</div>
              <div className="text-sm font-bold text-slate-900">{groups.length} กลุ่มสิทธิ์</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200/80">
            <Server className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">Table: user_groups</div>
              <div className="text-sm font-bold text-slate-900">{userGroups.length} การผูกสิทธิ์</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200/80">
            <FileJson className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium uppercase">Engine Storage</div>
              <div className="text-xs font-bold text-sky-900 truncate">SQLite In-Memory + Local</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>1. นำเข้าข้อมูล (Import CSV / JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>2. ส่งออกและสำรองข้อมูล (Export Data)</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-slate-800 text-slate-900 bg-slate-100/70'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-slate-600" />
            <span>3. โครงสร้าง SQLite Database (Schema)</span>
          </button>
          <button
            onClick={() => setActiveTab('sql_console')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'sql_console'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>4. SQL Terminal (คำสั่ง SQL)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: IMPORT DATA (CSV & JSON) */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              
              {/* Import Sub-mode selector */}
              <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setImportMode('csv')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    importMode === 'csv'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>นำเข้าไฟล์ CSV (CSV Employee Master Data)</span>
                </button>
                <button
                  onClick={() => setImportMode('json')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    importMode === 'json'
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileJson className="w-4 h-4 text-emerald-600" />
                  <span>กู้คืนฐานข้อมูล JSON (Full System Restore)</span>
                </button>
              </div>

              {/* MODE 1: CSV IMPORT WIZARD */}
              {importMode === 'csv' && (
                <div className="space-y-5">
                  
                  {/* CSV Template Banner */}
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Download className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-indigo-950">ยังไม่มีแบบฟอร์มไฟล์ CSV?</p>
                        <p className="text-[11px] text-indigo-700">ดาวน์โหลดแม่แบบ CSV Standard Master File ภาษาไทย UTF-8 เพื่อเตรียมข้อมูลสำหรับนำเข้า</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadCSVTemplate}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด CSV Template</span>
                    </button>
                  </div>

                  {/* CSV Drag & Drop Zone */}
                  {!csvParseResult ? (
                    <div
                      onDrop={handleCsvDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsCsvDragOver(true); }}
                      onDragLeave={() => setIsCsvDragOver(false)}
                      onClick={() => csvFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        isCsvDragOver
                          ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                          : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      <input
                        ref={csvFileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="hidden"
                      />
                      <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                        <Upload className="w-6 h-6 text-indigo-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        ลากไฟล์ CSV มาวางที่นี่ หรือ <span className="text-indigo-600 hover:underline">คลิกเพื่อเลือกไฟล์</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ CSV ภาษาไทย UTF-8 พร้อมตรวจจับคอลัมน์อัตโนมัติ</p>
                    </div>
                  ) : (
                    /* CSV Preview & Verification Result */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <div className="flex items-center space-x-2.5">
                          <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-800">{csvFile?.name}</span>
                          <span className="text-[11px] text-slate-400">({((csvFile?.size || 0) / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={handleResetCsvImport}
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 hover:underline cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>เลือกไฟล์ใหม่</span>
                        </button>
                      </div>

                      {csvParseResult.errors.length > 0 ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-2">
                          <div className="flex items-center space-x-2 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>พบข้อผิดพลาดในโครงสร้าง CSV</span>
                          </div>
                          <ul className="text-xs list-disc list-inside space-y-1 text-red-700">
                            {csvParseResult.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                              <div className="flex items-center justify-between text-slate-500 mb-1">
                                <span className="text-xs font-medium">รวมประมวลผล</span>
                                <Users className="w-4 h-4 text-indigo-500" />
                              </div>
                              <p className="text-xl font-extrabold text-slate-900">{csvParseResult.summary.totalRowsParsed}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">แถวข้อมูลที่ตรวจสอบแล้ว</p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                              <div className="flex items-center justify-between text-emerald-700 mb-1">
                                <span className="text-xs font-medium">ผู้ใช้ใหม่ / อัปเดต</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                              <p className="text-xl font-extrabold text-emerald-950">
                                +{csvParseResult.summary.newUsersCount}{' '}
                                <span className="text-xs font-normal text-emerald-700">(อัปเดต {csvParseResult.summary.updatedUsersCount})</span>
                              </p>
                              <p className="text-[10px] text-emerald-700/80 mt-0.5">ป้องกัน EMP ID ซ้ำ</p>
                            </div>

                            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
                              <div className="flex items-center justify-between text-amber-800 mb-1">
                                <span className="text-xs font-medium">กลุ่มสิทธิ์ใหม่</span>
                                <Layers className="w-4 h-4 text-amber-600" />
                              </div>
                              <p className="text-xl font-extrabold text-amber-950">+{csvParseResult.summary.newGroupsCount}</p>
                              <p className="text-[10px] text-amber-800/80 mt-0.5">สร้างสิทธิ์อัตโนมัติ</p>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleConfirmCsvImport}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>ยืนยันนำเข้าข้อมูลลง SQLite Database ({csvParseResult.summary.totalRowsParsed} รายการ)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* MODE 2: JSON SYSTEM RESTORE */}
              {importMode === 'json' && (
                <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileJson className="w-4.5 h-4.5 text-emerald-600" />
                      กู้คืนฐานข้อมูลจากไฟล์ JSON (JSON System Restore)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เลือกไฟล์ JSON สำรอง หรือวางโค้ด JSON เพื่อเขียนทับฐานข้อมูล SQLite ทั้งระบบ 100%
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">เลือกไฟล์ JSON สำรอง:</span>
                      <label className="inline-flex items-center px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        เลือกไฟล์ JSON จากคอมพิวเตอร์
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleJsonFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <textarea
                        rows={6}
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder={`{\n  "metadata": { "system_name": "UAM" },\n  "data": {\n    "users": [ ... ],\n    "groups": [ ... ],\n    "user_groups": [ ... ]\n  }\n}`}
                        className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleExecuteJsonImport}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        ยืนยัน Restore JSON ลง SQLite Database
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {importStatus.type && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXPORT DATA & BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start space-x-3 text-xs text-emerald-950">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900">เลือกรูปแบบการส่งออกข้อมูล (Export Options):</p>
                  <p className="text-emerald-800">
                    สามารถเลือกส่งออกไฟล์ได้ 3 รูปแบบตามวัตถุประสงค์การใช้งาน ทั้ง Excel CSV, JSON Backup และ SQLite Binary
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. CSV Export */}
                <div className="p-5 rounded-xl bg-white border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">1. CSV Master File (.csv)</h3>
                    <p className="text-xs text-slate-500">
                      เหมาะสำหรับนำไปเปิดดู วิเคราะห์ หรือแก้ไขต่อใน Microsoft Excel / Google Sheets ภาษาไทย UTF-8
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCsv}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-3"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV File</span>
                  </button>
                </div>

                {/* 2. JSON Export */}
                <div className="p-5 rounded-xl bg-white border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">2. Structured JSON (.json)</h3>
                    <p className="text-xs text-slate-500">
                      สำรองข้อมูล SQLite พร้อม Schema Metadata เพื่อใช้นำเข้ากู้คืนระบบกลับสู่สถานะเดิมแบบ 100%
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadJson}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-3"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Export JSON File</span>
                  </button>
                </div>

                {/* 3. SQLite Binary Export */}
                <div className="p-5 rounded-xl bg-white border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                      <Database className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">3. SQLite Database (.sqlite)</h3>
                    <p className="text-xs text-slate-500">
                      ดาวน์โหลดไฟล์ฐานข้อมูลไบนารี SQLite Native ดั้งเดิม เปิดดูผ่าน DB Browser for SQLite ได้โดยตรง
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadSqliteBinary}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer mt-3"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export SQLite (.sqlite)</span>
                  </button>
                </div>

              </div>

              {/* Reset Database section */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">คืนค่าฐานข้อมูลเริ่มต้น (Reset SQLite Database)</div>
                  <div className="text-[11px] text-slate-500">ล้างข้อมูลปัจจุบันและรีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้น</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดและคืนค่า SQLite เป็นค่าเริ่มต้น?')) {
                      onResetDatabase(true);
                      setImportStatus({
                        type: 'success',
                        message: 'คืนค่าฐานข้อมูล SQLite เรียบร้อยแล้ว',
                      });
                    }
                  }}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                  Reset Database
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: DATABASE SCHEMA SPEC */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    SQLite Database Schema & JSON Data Standard Specification
                  </h3>
                  <p className="text-xs text-slate-500">
                    โครงสร้างตารางข้อมูล users, groups และ user_groups ในระบบ SQLite Database
                  </p>
                </div>
                <button
                  onClick={handleCopySchemaDoc}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedSchema ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      คัดลอก Schema แล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      คัดลอก JSON Spec
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-800">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                  {JSON.stringify(JSON_DATABASE_SCHEMA_DOC, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: SQL CONSOLE */}
          {activeTab === 'sql_console' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  SQLite WebAssembly Terminal (SQL Query Console)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  พิมพ์คำสั่ง SQL (SELECT, INSERT, UPDATE, DELETE) เพื่อค้นหาและประมวลผลฐานข้อมูล SQLite ในความเร็วระดับ Native
                </p>
              </div>

              {/* Sample Quick Query Buttons */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400 font-medium text-[11px]">คำสั่ง SQL ตัวอย่าง:</span>
                <button
                  onClick={() => setSqlQuery(`SELECT * FROM users LIMIT 10;`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] cursor-pointer"
                >
                  SELECT users
                </button>
                <button
                  onClick={() => setSqlQuery(`SELECT internet_level, COUNT(*) as count FROM users GROUP BY internet_level;`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] cursor-pointer"
                >
                  Group by Internet Level
                </button>
                <button
                  onClick={() => setSqlQuery(`SELECT g.group_name, COUNT(ug.employee_id) as member_count \nFROM groups g \nLEFT JOIN user_groups ug ON g.group_id = ug.group_id \nGROUP BY g.group_id;`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono text-[11px] cursor-pointer"
                >
                  Group Member Counts (JOIN)
                </button>
              </div>

              {/* SQL Input Area */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM users;"
                  className="w-full p-3 font-mono text-xs border border-slate-800 rounded-xl bg-slate-950 text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                />
                <button
                  onClick={handleRunSqlQuery}
                  className="absolute bottom-3 right-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute SQL</span>
                </button>
              </div>

              {/* Error Output */}
              {queryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{queryError}</span>
                </div>
              )}

              {/* Query Result Table */}
              {queryResult && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>ผลลัพธ์คำสั่ง SQL ({queryResult.values.length} แถว):</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
                        <tr>
                          {queryResult.columns.map((col, idx) => (
                            <th key={idx} className="px-3 py-2 font-bold text-slate-800 border-r border-slate-200 last:border-r-0">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {queryResult.values.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 text-slate-700 border-r border-slate-100 last:border-r-0 truncate max-w-xs">
                                {val === null ? <span className="text-slate-400 italic">null</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            * ระบบทำงานแบบ Synchronous SQLite Engine บน WebAssembly ปลอดภัยและรวดเร็ว
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
