import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building, 
  Shield, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Printer, 
  Copy, 
  Check, 
  IdCard, 
  AtSign, 
  Smartphone, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckSquare, 
  Briefcase, 
  Cloud, 
  User as UserIcon, 
  Clock,
  Key
} from 'lucide-react';
import { UserWithGroups } from '../../types';
import { getExpiryStatus, formatDate } from '../../utils/helpers';

interface UserDetailModalProps {
  user: UserWithGroups | null;
  allUsers?: UserWithGroups[];
  onClose: () => void;
  onEdit?: (user: UserWithGroups) => void;
}

type TabType = 'overview' | 'contact' | 'groups';

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Map Special Groups & attributes to human-readable field attributes
  const derivedProfile = useMemo(() => {
    if (!user) return { printQuota: '', specialPermissions: [], isVpnActive: false };
    const groups = user.groups || [];
    
    // 1. Printer Permissions
    const hasPrinterColor = groups.some(g => g.group_id === 108 || g.group_name.toLowerCase().includes('color') || g.group_name.includes('ปริ้นสี'));
    const hasPrinterMono = groups.some(g => g.group_id === 109 || g.group_name.toLowerCase().includes('mono') || g.group_name.includes('ขาวดำ'));
    
    let printQuota = user.print_quota_group || 'Standard Quota';
    if (hasPrinterColor && hasPrinterMono) {
      printQuota = 'Color & Mono';
    } else if (hasPrinterColor) {
      printQuota = 'Color Only';
    } else if (hasPrinterMono) {
      printQuota = 'Mono Only';
    }

    // 2. Special Features & Network Privileges
    const specialPermissions: string[] = [];
    if (groups.some(g => g.group_id === 104 || g.group_name.toLowerCase().includes('video'))) {
      specialPermissions.push('Video Access');
    }
    if (groups.some(g => g.group_id === 105 || g.group_name.toLowerCase().includes('communication'))) {
      specialPermissions.push('Communications');
    }
    if (groups.some(g => g.group_id === 106 || g.group_name.toLowerCase().includes('free e-mail') || g.group_name.toLowerCase().includes('free email'))) {
      specialPermissions.push('External Free Mail');
    }

    // 3. VPN Access Group
    const hasVpnGroup = groups.some(g => g.group_id === 107 || g.group_name.toLowerCase().includes('vpn'));
    const isVpnActive = user.vpn_status || hasVpnGroup;

    return {
      printQuota,
      specialPermissions,
      isVpnActive
    };
  }, [user]);

  if (!user) return null;

  const expiryStatus = getExpiryStatus(user.expiry_date);
  const o365License = user.o365_license || 'Microsoft 365 E3';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleCopyDetails = () => {
    const text = `
=== User Access Profile ===
Employee ID: ${user.employee_id}
Username: @${user.username}
Display Name: ${user.display_name}
Email: ${user.email}
Job Title: ${user.job_title}
Department: ${user.department}
Company: ${user.company}
Authority Group: ${user.authority_group || 'Domain Users'}
Microsoft 365 License: ${o365License}
Internet Level: Level ${user.internet_level}
VPN Status: ${derivedProfile.isVpnActive ? 'Active' : 'Disabled'}
Device Code: ${user.device_code || 'N/A'}
Telephone PIN: ${user.telephone_pass_code || 'N/A'}
Creation Date: ${user.creation_date}
Expiry Date: ${user.expiry_date || 'No Expiry'}
Print Quota Group: ${derivedProfile.printQuota}
Special Access: ${derivedProfile.specialPermissions.join(', ') || 'None'}
Assigned Groups: ${user.groups.map(g => g.group_name).join(', ')}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 cursor-default flex flex-col max-h-[92vh] border border-slate-200"
      >
        
        {/* MICROSOFT 365 CARD HEADER STYLE */}
        <div className="p-6 pb-2 bg-white relative shrink-0 border-b border-slate-100">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5 pr-10">
            {/* Avatar Circle with Online Checkmark */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-slate-800 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {getInitials(user.display_name)}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
            </div>

            {/* User Main Identity */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {user.display_name}
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                  {o365License}
                </span>
              </div>

              {/* Position & Department Tagline */}
              <div className="text-sm font-medium text-slate-600">
                <span>{user.job_title || 'Employee'}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{user.department}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{user.company}</span>
              </div>
            </div>
          </div>

          {/* MICROSOFT PROFILE TAB BAR */}
          <div className="flex items-center gap-6 mt-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                activeTab === 'overview' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                activeTab === 'contact' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contact & System Profile
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                activeTab === 'groups' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned Groups ({user.groups.length})
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Presence & Work Status Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-900">
                      Active User Account
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 font-medium">Domain User Account</span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    {user.company}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Created: {formatDate(user.creation_date)}</span>
                  <span className="text-slate-300">•</span>
                  <span>Expiry: {user.expiry_date ? formatDate(user.expiry_date) : 'No Expiry Date'}</span>
                </div>
              </div>

              {/* Primary Contact Section */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  Primary Contact Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Work Email */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Work Email</div>
                      <div className="text-sm font-semibold text-indigo-600 truncate">{user.email}</div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Username</div>
                      <div className="text-sm font-semibold text-slate-900">@{user.username}</div>
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Employee ID</div>
                      <div className="text-sm font-semibold text-slate-900 font-mono">{user.employee_id}</div>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Company</div>
                      <div className="text-sm font-semibold text-slate-900">{user.company}</div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Department</div>
                      <div className="text-sm font-semibold text-slate-900">{user.department}</div>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Job Position</div>
                      <div className="text-sm font-semibold text-slate-900">{user.job_title}</div>
                    </div>
                  </div>

                  {/* Device Code */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Device Code</div>
                      <div className="text-sm font-semibold text-slate-900 font-mono">{user.device_code || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Telephone PIN */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Telephone PIN / Passcode</div>
                      <div className="text-sm font-semibold text-slate-900 font-mono">{user.telephone_pass_code || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Credentials & Privileges Summary */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  System Privileges Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Internet Level */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Internet Permission
                    </div>
                    <div className="text-sm font-bold text-slate-900">Level {user.internet_level}</div>
                  </div>

                  {/* VPN Status */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Remote VPN Access
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {derivedProfile.isVpnActive ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>

                  {/* Print Policy */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Print Quota Policy
                    </div>
                    <div className="text-sm font-bold text-slate-900">{derivedProfile.printQuota}</div>
                  </div>

                  {/* Microsoft 365 License */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                      <Cloud className="w-3.5 h-3.5 text-sky-600" />
                      M365 License
                    </div>
                    <div className="text-sm font-bold text-sky-900 truncate">{o365License}</div>
                  </div>
                </div>

                {derivedProfile.specialPermissions.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-medium text-slate-500 mb-2">Special Entitlements</div>
                    <div className="flex flex-wrap gap-2">
                      {derivedProfile.specialPermissions.map((perm, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Technical Attributes & Device Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium mb-1">Corporate Email Address</div>
                    <div className="text-sm font-semibold text-slate-900">{user.email}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium mb-1">Microsoft 365 License SKU</div>
                    <div className="text-sm font-semibold text-slate-900">{o365License}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium mb-1">Authority Group</div>
                    <div className="text-sm font-semibold text-slate-900">{user.authority_group || 'Domain Users'}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium mb-1">Device Code</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">{user.device_code || 'N/A'}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium mb-1">Phone PIN / Passcode</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono">{user.telephone_pass_code || '****'}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium mb-1">Creation & Expiry Date</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatDate(user.creation_date)} → {user.expiry_date ? formatDate(user.expiry_date) : 'No Expiry'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Assigned Access Groups</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {user.groups.length} Groups Total
                </span>
              </div>

              {user.groups.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No security groups assigned to this user.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {user.groups.map((g) => (
                    <div
                      key={g.group_id}
                      className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 text-slate-800 text-xs flex flex-col justify-between transition-all"
                    >
                      <div className="font-bold text-slate-900 leading-snug">
                        {g.group_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                        <span>Group ID: {g.group_id}</span>
                        {g.internet_level && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Level {g.internet_level}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={handleCopyDetails}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Profile Data</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};



