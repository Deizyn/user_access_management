import React, { useState } from 'react';
import { UserWithGroups, SortField } from './types';
import { useUserAccessData } from './frontend/hooks/useUserAccessData';
import { useUserFilters } from './frontend/hooks/useUserFilters';
import { 
  Navbar, 
  KPISummary, 
  FilterBar, 
  UserTable, 
  UserDetailModal, 
  UserFormModal, 
  GroupManagerModal, 
  LevelGroupExplorerModal, 
  CsvImportModal, 
  ApiConnectorModal,
  SqliteManagerModal,
  DbStatusModal
} from './components';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // 1. Core Data State & Persistence Hook
  const {
    groups,
    users,
    userGroups,
    handleSaveUser,
    handleDeleteUser,
    handleAddGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleImportCSVSuccess,
    handleResetData,
  } = useUserAccessData();

  // 2. Filter, Search & Sorting Hook
  const {
    usersWithGroups,
    departments,
    companies,
    authorityGroups,
    printQuotaGroups,
    o365Licenses,
    filters,
    setFilters,
    sortState,
    setSortState,
    filteredUsers,
    sortedUsers,
    activeVpnCount,
    resetFilters,
  } = useUserFilters(users, groups, userGroups);

  // 3. Modals State
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserWithGroups | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserWithGroups | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [isApiConnectorModalOpen, setIsApiConnectorModalOpen] = useState(false);
  const [isSqliteModalOpen, setIsSqliteModalOpen] = useState(false);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState(false);
  const [sqliteInitialTab, setSqliteInitialTab] = useState<'import' | 'export' | 'schema' | 'sql_console'>('import');
  const [isLevelGroupExplorerOpen, setIsLevelGroupExplorerOpen] = useState(false);
  const [levelGroupExplorerInitialGroupId, setLevelGroupExplorerInitialGroupId] = useState<number | null>(null);
  const [levelGroupExplorerInitialCategoryId, setLevelGroupExplorerInitialCategoryId] = useState<string | null>(null);

  // Modal Triggers
  const handleOpenDataCenter = (tab: 'import' | 'export' | 'schema' | 'sql_console' = 'import') => {
    setSqliteInitialTab(tab);
    setIsSqliteModalOpen(true);
  };

  const handleOpenLevelGroupExplorer = (groupId?: number | null, categoryId?: string | null) => {
    setLevelGroupExplorerInitialGroupId(groupId ?? null);
    setLevelGroupExplorerInitialCategoryId(categoryId ?? null);
    setIsLevelGroupExplorerOpen(true);
  };

  // Quick Filter Handler (Single-Select Direct Switch Mode for KPI Cards)
  const handleQuickFilter = (key: string, value: any) => {
    if (key === 'department') {
      const current = filters.departments || [];
      const updated = current.includes(value) ? [] : [value];
      setFilters((prev) => ({ ...prev, departments: updated, department: updated.length === 1 ? value : 'all' }));
      return;
    }
    if (key === 'company') {
      const current = filters.companies || [];
      const updated = current.includes(value) ? [] : [value];
      setFilters((prev) => ({ ...prev, companies: updated, company: updated.length === 1 ? value : 'all' }));
      return;
    }
    if (key === 'internetLevel') {
      const current = filters.internetLevels || [];
      const updated = current.includes(value) ? [] : [value];
      setFilters((prev) => ({ ...prev, internetLevels: updated, internetLevel: updated.length === 1 ? value : 'all' }));
      return;
    }
    if (key === 'groupId') {
      const current = filters.groupIds || [];
      const numericId = Number(value);
      const updated = current.includes(numericId) ? [] : [numericId];
      setFilters((prev) => ({ ...prev, groupIds: updated, groupId: updated.length === 1 ? numericId : 'all' }));
      return;
    }
    if (key === 'vpnStatus') {
      const updated = filters.vpnStatus === value ? 'all' : value;
      setFilters((prev) => ({ ...prev, vpnStatus: updated }));
      return;
    }
    if (key === 'expiryStatus') {
      const updated = filters.expiryStatus === value ? 'all' : value;
      setFilters((prev) => ({ ...prev, expiryStatus: updated }));
      return;
    }

    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (field: SortField) => {
    setSortState((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      
      {/* Top Header Navbar */}
      <Navbar
        totalUsersCount={users.length}
        activeVpnCount={activeVpnCount}
        onOpenManageGroups={() => setIsGroupModalOpen(true)}
        onOpenDataCenter={handleOpenDataCenter}
        onOpenDbStatus={() => setIsDbStatusModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Summary Cards */}
        <KPISummary
          users={filteredUsers}
          totalUsersCount={usersWithGroups.length}
          groups={groups}
          onQuickFilter={handleQuickFilter}
          onOpenLevelGroupExplorer={handleOpenLevelGroupExplorer}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          departments={departments}
          companies={companies}
          groups={groups}
          authorityGroups={authorityGroups}
          printQuotaGroups={printQuotaGroups}
          o365Licenses={o365Licenses}
          totalFilteredCount={sortedUsers.length}
          totalUsersCount={users.length}
        />

        {/* User Table */}
        <UserTable
          users={sortedUsers}
          sortState={sortState}
          onSortChange={handleSortChange}
          onViewUser={(user) => setSelectedUserForDetail(user)}
          onQuickFilter={handleQuickFilter}
          onOpenExplorer={handleOpenLevelGroupExplorer}
          allGroups={groups}
          activeGroupIds={filters.groupIds || (filters.groupId !== 'all' ? [filters.groupId] : [])}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 User Access Management Dashboard • Architecture Cleaned & Modularized</p>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Database: SQLite Engine Active</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Backend & Frontend Separated
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UserDetailModal
        user={selectedUserForDetail}
        allUsers={usersWithGroups}
        onClose={() => setSelectedUserForDetail(null)}
      />

      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setUserToEdit(null);
        }}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        groups={groups}
        existingEmployeeIds={users.map((u) => u.employee_id)}
      />

      <GroupManagerModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        groups={groups}
        users={usersWithGroups}
        onAddGroup={(groupName) => handleAddGroup({ group_name: groupName })}
        onEditGroup={(groupId, newName) => {
          const g = groups.find((grp) => grp.group_id === groupId);
          if (g) handleUpdateGroup({ ...g, group_name: newName });
        }}
        onDeleteGroup={handleDeleteGroup}
      />

      <LevelGroupExplorerModal
        isOpen={isLevelGroupExplorerOpen}
        onClose={() => setIsLevelGroupExplorerOpen(false)}
        groups={groups}
        users={usersWithGroups}
        initialGroupId={levelGroupExplorerInitialGroupId}
        initialCategoryId={levelGroupExplorerInitialCategoryId}
        onSelectUserForDetail={(user) => setSelectedUserForDetail(user)}
        onAddGroup={(groupName) => handleAddGroup({ group_name: groupName })}
        onEditGroup={(groupId, newName) => {
          const g = groups.find((grp) => grp.group_id === groupId);
          if (g) handleUpdateGroup({ ...g, group_name: newName });
        }}
        onDeleteGroup={handleDeleteGroup}
      />

      <CsvImportModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        existingUsers={users}
        existingGroups={groups}
        existingUserGroups={userGroups}
        onImportSuccess={handleImportCSVSuccess}
      />

      <ApiConnectorModal
        isOpen={isApiConnectorModalOpen}
        onClose={() => setIsApiConnectorModalOpen(false)}
        existingUsers={users}
        existingGroups={groups}
        existingUserGroups={userGroups}
        onSyncSuccess={handleImportCSVSuccess}
      />

      <SqliteManagerModal
        isOpen={isSqliteModalOpen}
        onClose={() => setIsSqliteModalOpen(false)}
        users={users}
        groups={groups}
        userGroups={userGroups}
        onImportComplete={handleImportCSVSuccess}
        onResetDatabase={handleResetData}
        initialTab={sqliteInitialTab}
      />

      <DbStatusModal
        isOpen={isDbStatusModalOpen}
        onClose={() => setIsDbStatusModalOpen(false)}
        usersCount={users.length}
        groupsCount={groups.length}
        userGroupsCount={userGroups.length}
      />

    </div>
  );
}
