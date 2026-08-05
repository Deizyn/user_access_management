import React, { useState, useRef } from 'react';
import { User, Group, UserGroup } from '../../types';
import { processImportCSV, downloadCSVTemplate, ParseResult } from '../../utils/csvHelpers';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, X, RefreshCw, Layers, Users, Database } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: User[];
  existingGroups: Group[];
  existingUserGroups: UserGroup[];
  onImportSuccess: (importedUsers: User[], importedGroups: Group[], importedUserGroups: UserGroup[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  existingGroups,
  existingUserGroups,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content || '');
      if (content) {
        const result = processImportCSV(content, existingUsers, existingGroups, existingUserGroups);
        setParseResult(result);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleReset = () => {
    setFile(null);
    setCsvContent('');
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    onImportSuccess(parseResult.users, parseResult.groups, parseResult.userGroups);
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Import Data (นําเข้าข้อมูล CSV)</h2>
              <p className="text-xs text-slate-500">
                นำเข้าข้อมูลพนักงานและกลุ่มสิทธิ์แบบ Normalized พร้อมการจับคู่คอลัมน์อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Template Banner */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-950">ยังไม่มีรูปแบบไฟล์ CSV?</p>
                <p className="text-[11px] text-indigo-700/80">ดาวน์โหลดแม่แบบ CSV Standard Data Model ที่มีความสัมพันธ์ของข้อมูลครบถ้วน</p>
              </div>
            </div>
            <button
              onClick={downloadCSVTemplate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Template</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          {!parseResult ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                ลากไฟล์ CSV มาวางที่นี่ หรือ <span className="text-indigo-600 hover:underline">คลิกเพื่อเลือกไฟล์</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">รองรับไฟล์ CSV ภาษาไทย UTF-8 หรือ UTF-8 with BOM</p>
            </div>
          ) : (
            /* Parsed Summary & Verification */
            <div className="space-y-4">
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">{file?.name}</span>
                  <span className="text-[11px] text-slate-400">({(file?.size || 0 / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>เปลี่ยนไฟล์</span>
                </button>
              </div>

              {parseResult.errors.length > 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>พบข้อผิดพลาดในการอ่านไฟล์ CSV</span>
                  </div>
                  <ul className="text-xs list-disc list-inside space-y-1 text-red-700">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">
                        ตรวจสอบ Employee ID ป้องกันพนักงานซ้ำแล้ว:
                      </span>
                      <span className="text-emerald-700">
                        พบผู้ใช้ใหม่ {parseResult.summary.newUsersCount} รายการ • อัปเดตข้อมูลทับพนักงานเดิมที่มี Employee ID ตรงกัน {parseResult.summary.updatedUsersCount} รายการ
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-medium">รวมรายการทั้งหมด</span>
                        <Users className="w-4 h-4 text-indigo-500" />
                      </div>
                      <p className="text-xl font-extrabold text-slate-900">{parseResult.summary.totalRowsParsed}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">แถวข้อมูลที่ประมวลผล</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                      <div className="flex items-center justify-between text-emerald-700 mb-1">
                        <span className="text-xs font-medium">ผู้ใช้ใหม่ / อัปเดต</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xl font-extrabold text-emerald-950">
                        +{parseResult.summary.newUsersCount}{' '}
                        <span className="text-xs font-normal text-emerald-700">(อัปเดต {parseResult.summary.updatedUsersCount})</span>
                      </p>
                      <p className="text-[10px] text-emerald-700/80 mt-0.5">ป้องกัน Employee ID ซ้ำ</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
                      <div className="flex items-center justify-between text-amber-800 mb-1">
                        <span className="text-xs font-medium">กลุ่มสิทธิ์ใหม่</span>
                        <Layers className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-xl font-extrabold text-amber-950">+{parseResult.summary.newGroupsCount}</p>
                      <p className="text-[10px] text-amber-800/80 mt-0.5">สร้างกลุ่มสิทธิ์อัตโนมัติ</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Types & Duplicate Status Summary Report */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>รายงานสรุปประเภทข้อมูลและสถานะการซ้ำซ้อน (Data Summary Report)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {/* Data Categories Added */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                    <p className="font-bold text-slate-700 flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>ประเภทข้อมูลที่ถูกประมวลผล:</span>
                    </p>
                    <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside pl-0.5">
                      <li>ข้อมูลโปรไฟล์พนักงาน (EMP ID, Name, Email, Dept)</li>
                      <li>สิทธิ์การใช้งานอินเทอร์เน็ต (Internet Level A / B / C)</li>
                      <li>สิทธิ์เข้าใช้งานระบบสื่อสารและ VPN (VPN Status)</li>
                      <li>โควตาและกลุ่มสิทธิ์ (Print Quota & Authority Groups)</li>
                    </ul>
                  </div>

                  {/* Duplicate & Merge Status */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                    <p className="font-bold text-slate-700 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>สถานะพนักงานใหม่และการตรวจสอบความซ้ำซ้อน:</span>
                    </p>
                    <div className="text-[11px] space-y-1">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-600">พนักงานสร้างใหม่ (New Users):</span>
                        <span className="font-bold text-emerald-700">+{parseResult.summary.newUsersCount} รายการ</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                        <span className="text-slate-600">พบ Employee ID ซ้ำ (Update Existing):</span>
                        <span className="font-bold text-amber-700">{parseResult.summary.updatedUsersCount} รายการ (อัปเดตทับข้อมูลเดิม)</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-600">กลุ่มสิทธิ์ใหม่ที่ถูกค้นพบ:</span>
                        <span className="font-bold text-indigo-700">+{parseResult.summary.newGroupsCount} กลุ่ม</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            ยกเลิก (Cancel)
          </button>

          {parseResult && parseResult.errors.length === 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-[11px] text-emerald-700 font-medium hidden sm:flex items-center">
                <Database className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                บันทึกลง SQLite DB อัตโนมัติ
              </span>
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันนำเข้าลง SQLite Database ({parseResult.summary.totalRowsParsed} รายการ)</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
