import React, { useState, useEffect } from 'react';
import { X, Save, User, Shield, Wifi, Layers, Calendar, Printer, Monitor } from 'lucide-react';
import { UserWithGroups, Group, InternetLevel } from '../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<UserWithGroups, 'groups'>, selectedGroupIds: number[]) => void;
  userToEdit: UserWithGroups | null;
  groups: Group[];
  existingEmployeeIds: string[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  groups,
  existingEmployeeIds,
}) => {
  const isEditing = !!userToEdit;

  const [employeeId, setEmployeeId] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [internetLevel, setInternetLevel] = useState<InternetLevel>('B');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('press');
  const [company, setCompany] = useState('AH');
  const [deviceCode, setDeviceCode] = useState('');
  const [authorityGroup, setAuthorityGroup] = useState('Domain Users');
  const [creationDate, setCreationDate] = useState('2026-07-22');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [printQuotaGroup, setPrintQuotaGroup] = useState('ปริ้นขาวดำ/ปริ้นสี');
  const [telephonePassCode, setTelephonePassCode] = useState('');
  const [vpnStatus, setVpnStatus] = useState(true);
  const [o365License, setO365License] = useState('Microsoft 365 E3');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userToEdit) {
      setEmployeeId(userToEdit.employee_id);
      setUsername(userToEdit.username);
      setDisplayName(userToEdit.display_name);
      setEmail(userToEdit.email);
      setInternetLevel(userToEdit.internet_level);
      setJobTitle(userToEdit.job_title);
      setDepartment(userToEdit.department);
      setCompany(userToEdit.company);
      setDeviceCode(userToEdit.device_code);
      setAuthorityGroup(userToEdit.authority_group || 'Domain Users');
      setCreationDate(userToEdit.creation_date);
      setExpiryDate(userToEdit.expiry_date || '');
      setPrintQuotaGroup(userToEdit.print_quota_group);
      setTelephonePassCode(userToEdit.telephone_pass_code);
      setVpnStatus(userToEdit.vpn_status);
      setO365License(userToEdit.o365_license || 'Microsoft 365 E3');
      setSelectedGroupIds(userToEdit.groups.map((g) => g.group_id));
    } else {
      // Auto-generate random new ID in AH format
      const nextNum = Math.floor(10000000 + Math.random() * 90000000);
      setEmployeeId(`AH${nextNum}`);
      setUsername('');
      setDisplayName('');
      setEmail('');
      setInternetLevel('B');
      setJobTitle('engineer');
      setDepartment('press');
      setCompany('AH');
      setDeviceCode(`AH25-IT${Math.floor(1000 + Math.random() * 9000)}`);
      setAuthorityGroup('Domain Users');
      setCreationDate(new Date().toISOString().slice(0, 10));
      setExpiryDate('');
      setPrintQuotaGroup('ปริ้นขาวดำ/ปริ้นสี');
      setTelephonePassCode(`PIN-${Math.floor(1000 + Math.random() * 9000)}`);
      setVpnStatus(false);
      setO365License('Microsoft 365 E3');
      setSelectedGroupIds([]);
    }
    setErrors({});
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleGroup = (groupId: number) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!employeeId.trim()) errs.employeeId = 'กรุณาระบุ Employee ID';
    if (!isEditing && existingEmployeeIds.includes(employeeId.trim())) {
      errs.employeeId = 'Employee ID นี้มีในระบบอยู่แล้ว';
    }
    if (!username.trim()) errs.username = 'กรุณาระบุ Username';
    if (!displayName.trim()) errs.displayName = 'กรุณาระบุ Display Name';
    if (!email.trim() || !email.includes('@')) errs.email = 'กรุณาระบุ Email ที่ถูกต้อง';
    if (!jobTitle.trim()) errs.jobTitle = 'กรุณาระบุตำแหน่งงาน';
    if (!department.trim()) errs.department = 'กรุณาระบุแผนก';
    if (!company.trim()) errs.company = 'กรุณาระบุบริษัท';
    if (!deviceCode.trim()) errs.deviceCode = 'กรุณาระบุรหัสอุปกรณ์';
    if (!authorityGroup.trim()) errs.authorityGroup = 'กรุณาระบุ Authority Group';
    if (!telephonePassCode.trim()) errs.telephonePassCode = 'กรุณาระบุ Phone Passcode';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Synchronize Special Level Groups (101-103 Internet, 107 VPN, 108/109 Printer)
    const internetGroupId = internetLevel === 'A' ? 101 : internetLevel === 'B' ? 102 : 103;
    let cleanedGroupIds = selectedGroupIds.filter((id) => ![101, 102, 103, 107, 108, 109].includes(id));

    // Internet Level
    cleanedGroupIds.push(internetGroupId);

    // VPN Access
    if (vpnStatus) {
      cleanedGroupIds.push(107);
    }

    // Printer Color / Mono
    if (printQuotaGroup === 'Unlimited' || printQuotaGroup === 'ปริ้นขาวดำ/ปริ้นสี') {
      cleanedGroupIds.push(108); // Printer Color
    } else if (printQuotaGroup === 'ปริ้นขาวดำ') {
      cleanedGroupIds.push(109); // Printer Mono
    }

    onSave(
      {
        employee_id: employeeId.trim(),
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        internet_level: internetLevel,
        job_title: jobTitle.trim(),
        department: department.trim(),
        company: company.trim(),
        device_code: deviceCode.trim(),
        authority_group: authorityGroup.trim(),
        creation_date: creationDate,
        expiry_date: expiryDate.trim() ? expiryDate.trim() : null,
        print_quota_group: printQuotaGroup.trim(),
        telephone_pass_code: telephonePassCode.trim(),
        vpn_status: vpnStatus,
        o365_license: o365License,
      },
      cleanedGroupIds
    );
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'แก้ไขข้อมูลพนักงาน (Edit User)' : 'เพิ่มพนักงานใหม่ (Add New User)'}
              </h2>
              <p className="text-xs text-slate-500">
                กรอกข้อมูลตามสกีมาตาราง `users` และ `user_groups`
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Section 1: User Identity */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center">
              <User className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              1. ข้อมูลผู้ใช้งาน (User Identity)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Employee ID (รหัสพนักงาน) *
                </label>
                <input
                  type="text"
                  disabled={isEditing}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className={`w-full p-2 border rounded-lg font-mono focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.employeeId ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="EMP-10024"
                />
                {errors.employeeId && <span className="text-rose-600 text-[10px]">{errors.employeeId}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Username (ชื่อผู้ใช้) *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.username ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="somchai.p"
                />
                {errors.username && <span className="text-rose-600 text-[10px]">{errors.username}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email (อีเมล) *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.email ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="somchai.p@techcorp.co.th"
                />
                {errors.email && <span className="text-rose-600 text-[10px]">{errors.email}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-slate-700 font-semibold mb-1">
                  Display Name (ชื่อ-นามสกุลแสดงผล) *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.displayName ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="Somchai Pattana (สมชาย พัฒนา)"
                />
                {errors.displayName && <span className="text-rose-600 text-[10px]">{errors.displayName}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Title (ตำแหน่งงาน) *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.jobTitle ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="Senior Software Engineer"
                />
                {errors.jobTitle && <span className="text-rose-600 text-[10px]">{errors.jobTitle}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department (แผนก) *</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.department ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="Information Technology"
                />
                {errors.department && <span className="text-rose-600 text-[10px]">{errors.department}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company (บริษัท) *</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.company ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="AH"
                />
                {errors.company && <span className="text-rose-600 text-[10px]">{errors.company}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Authority Group (กลุ่มสิทธิ์เข้าถึง) *</label>
                <select
                  value={authorityGroup}
                  onChange={(e) => setAuthorityGroup(e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white ${
                    errors.authorityGroup ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
                  }`}
                >
                  <option value="Administrators">Administrators</option>
                  <option value="Domain Users">Domain Users</option>
                  <option value="Power Users">Power Users</option>
                  <option value="System Operator">System Operator</option>
                  <option value="Security Auditors">Security Auditors</option>
                </select>
                {errors.authorityGroup && <span className="text-rose-600 text-[10px]">{errors.authorityGroup}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Microsoft 365 License *</label>
                <select
                  value={o365License}
                  onChange={(e) => setO365License(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                >
                  <option value="Microsoft 365 E1">Microsoft 365 E1</option>
                  <option value="Microsoft 365 E3">Microsoft 365 E3</option>
                  <option value="Microsoft 365 E5">Microsoft 365 E5</option>
                  <option value="Microsoft 365 E7">Microsoft 365 E7</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Internet Level & VPN */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center">
              <Wifi className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              2. สิทธิ์อินเทอร์เน็ต และ VPN (Network & Permissions)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Internet Level (A, B, C) *
                </label>
                <select
                  value={internetLevel}
                  onChange={(e) => {
                    setInternetLevel(e.target.value as InternetLevel);
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="A">Level A (Unrestricted / Executive)</option>
                  <option value="B">Level B (Standard Corporate)</option>
                  <option value="C">Level C (Restricted / Operational)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  VPN Status (อนุญาตใช้ VPN)
                </label>
                <label className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg cursor-pointer bg-white">
                  <input
                    type="checkbox"
                    checked={vpnStatus}
                    onChange={(e) => setVpnStatus(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">
                    {vpnStatus ? 'Active (เปิดสิทธิ์ VPN)' : 'Disabled (ปิดสิทธิ์ VPN)'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  Device Code *
                </label>
                <input
                  type="text"
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value)}
                  className={`w-full p-2 border rounded-lg font-mono focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.deviceCode ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="MAC-7C:D1:C3:9F:8B:11"
                />
                {errors.deviceCode && <span className="text-rose-600 text-[10px]">{errors.deviceCode}</span>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Telephone Pass Code *
                </label>
                <input
                  type="text"
                  value={telephonePassCode}
                  onChange={(e) => setTelephonePassCode(e.target.value)}
                  className={`w-full p-2 border rounded-lg font-mono focus:ring-2 focus:ring-slate-900 outline-none ${
                    errors.telephonePassCode ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
                  }`}
                  placeholder="PIN-8839"
                />
                {errors.telephonePassCode && (
                  <span className="text-rose-600 text-[10px]">{errors.telephonePassCode}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Master Groups Selection (Junction Table user_groups) */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              3. กลุ่ม Master (Assign Groups via user_groups)
            </h3>
            <p className="text-slate-500 text-[11px]">
              พนักงาน 1 คนสามารถสังกัดได้หลายกลุ่ม (1 User to Multiple Master Groups)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {groups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.group_id);
                return (
                  <label
                    key={group.group_id}
                    className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleGroup(group.group_id)}
                      className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
                    />
                    <span className="font-semibold text-xs">{group.group_name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Lifecycle & Printing */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              4. วันที่ และโควต้าสิ่งพิมพ์ (Dates & Print Quota)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Creation Date (วันที่สร้างบัญชี) *
                </label>
                <input
                  type="date"
                  value={creationDate}
                  onChange={(e) => setCreationDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Expiry Date (วันหมดอายุ - เว้นว่างถ้าไม่มี)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Print Quota Group</label>
                <select
                  value={printQuotaGroup}
                  onChange={(e) => setPrintQuotaGroup(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="Unlimited Printing">Unlimited Printing</option>
                  <option value="Quota 2,000 Pages/Month">Quota 2,000 Pages/Month</option>
                  <option value="Quota 1,000 Pages/Month">Quota 1,000 Pages/Month</option>
                  <option value="Quota 500 Pages/Month">Quota 500 Pages/Month</option>
                  <option value="Quota 250 Pages/Month">Quota 250 Pages/Month</option>
                  <option value="Quota 100 Pages/Month">Quota 100 Pages/Month</option>
                  <option value="No Print Access">No Print Access</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-100 font-semibold transition-colors"
            >
              ยกเลิก (Cancel)
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isEditing ? 'บันทึกการแก้ไข (Save Changes)' : 'เพิ่มพนักงาน (Create User)'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
