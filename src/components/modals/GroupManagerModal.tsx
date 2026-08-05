import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Layers, Users } from 'lucide-react';
import { Group, UserWithGroups } from '../../types';
import { getInternetLevelBadgeClasses } from '../../utils/groupHelpers';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  users: UserWithGroups[];
  onAddGroup?: (groupName: string) => void;
  onEditGroup?: (groupId: number, newName: string) => void;
  onDeleteGroup?: (groupId: number) => void;
}

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  onClose,
  groups,
  users,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setError('กรุณาระบุชื่อกลุ่ม');
      return;
    }
    if (groups.some((g) => g.group_name.toLowerCase() === newGroupName.trim().toLowerCase())) {
      setError('ชื่อกลุ่มนี้มีอยู่แล้วในระบบ');
      return;
    }

    if (onAddGroup) onAddGroup(newGroupName.trim());
    setNewGroupName('');
    setError('');
  };

  const handleStartEdit = (g: Group) => {
    setEditingGroupId(g.group_id);
    setEditingName(g.group_name);
  };

  const handleSaveEdit = (groupId: number) => {
    if (!editingName.trim()) return;
    if (onEditGroup) onEditGroup(groupId, editingName.trim());
    setEditingGroupId(null);
  };

  const getUserCountForGroup = (groupId: number) => {
    return users.filter((u) => u.groups.some((g) => g.group_id === groupId)).length;
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 cursor-default"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                จัดการกลุ่ม Master (Manage Master Groups)
              </h2>
              <p className="text-xs text-slate-500">
                ตาราง Master `groups` - รวม {groups.length} กลุ่ม
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

        <div className="p-6 space-y-5 text-xs">
          {/* Groups List */}
          <div className="space-y-2">
            <span className="block font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              รายชื่อกลุ่มที่มีอยู่ในระบบ (Master Groups)
            </span>

            <div className="divide-y divide-slate-200 border border-slate-200/90 rounded-xl overflow-hidden max-h-80 overflow-y-auto bg-slate-50/50">
              {groups.map((group) => {
                const userCount = getUserCountForGroup(group.group_id);

                return (
                  <div key={group.group_id} className="p-3 bg-white flex items-center justify-between gap-2 hover:bg-slate-50">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="font-mono font-semibold text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        ID: {group.group_id}
                      </span>
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {group.group_name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <Users className="w-3 h-3 mr-1 text-slate-400" />
                        {userCount} คน
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors"
          >
            เสร็จสิ้น (Done)
          </button>
        </div>

      </div>
    </div>
  );
};
