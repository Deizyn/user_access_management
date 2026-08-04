import { useState, useEffect } from 'react';
import { Group, User, UserGroup, UserWithGroups } from '../../types';
import { DEFAULT_MASTER_GROUPS, updateSpecialGroupsCatalog } from '../../constants/specialGroups';
import { INITIAL_USERS, INITIAL_GROUPS, INITIAL_USER_GROUPS } from '../../data/initialData';
import {
  STORAGE_KEY_GROUPS,
  STORAGE_KEY_USERS,
  STORAGE_KEY_USER_GROUPS,
  safeSaveLocalStorage,
  loadLocalStorage,
} from '../../utils/storage';
import {
  getOrInitSqliteDb,
  syncUsersToSqlite,
  syncGroupsToSqlite,
  syncUserGroupsToSqlite,
  queryUsersFromSqlite,
  queryGroupsFromSqlite,
  queryUserGroupsFromSqlite,
  resetSqliteDb,
} from '../../lib/sqliteDb';

export function useUserAccessData() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isSqliteReady, setIsSqliteReady] = useState<boolean>(false);

  // Helper to sync data directly to Express Backend MySQL Database
  const syncToBackendPhysicalFile = async (uList: User[], gList: Group[], ugList: UserGroup[]) => {
    try {
      await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: uList, groups: gList, userGroups: ugList }),
      });
      console.log(`[MySQL Sync] Sent ${uList.length} users, ${gList.length} groups to backend MySQL database.`);
    } catch (err) {
      console.warn('[MySQL Backend Persistence] Sync notice:', err);
    }
  };

  // Helper to refresh state directly from SQLite SQL Query execution
  const refreshFromSqlite = (dbTarget?: any) => {
    const sqliteUsers = queryUsersFromSqlite(dbTarget);
    const sqliteGroups = queryGroupsFromSqlite(dbTarget);
    const sqliteUserGroups = queryUserGroupsFromSqlite(dbTarget);

    if (sqliteUsers) setUsers(sqliteUsers);
    if (sqliteGroups) setGroups(sqliteGroups);
    if (sqliteUserGroups) setUserGroups(sqliteUserGroups);
  };

  // Initialize: Fetch directly from Express Backend MySQL Server API (Exclusive Source of Truth)
  useEffect(() => {
    async function initMySqlEngine() {
      try {
        // Fetch Special Groups Catalog directly from special_groups database table
        try {
          const sgRes = await fetch('/api/special-groups');
          const sgData = await sgRes.json();
          if (sgData.success && Array.isArray(sgData.data)) {
            updateSpecialGroupsCatalog(sgData.data);
          }
        } catch (e) {
          console.warn('Special groups fetch notice:', e);
        }

        const uRes = await fetch('/api/users');
        const gRes = await fetch('/api/groups');
        const ugRes = await fetch('/api/user-groups');
        const uData = await uRes.json();
        const gData = await gRes.json();
        const ugData = await ugRes.json();

        if (uData.success && Array.isArray(uData.data)) {
          setUsers(uData.data);
          if (gData.success && Array.isArray(gData.data)) setGroups(gData.data);
          if (ugData.success && Array.isArray(ugData.data)) setUserGroups(ugData.data);
          setIsSqliteReady(true);
          console.log(
            `[MySQL Engine] Loaded ${uData.data.length} users, ${gData.data?.length || 0} groups, ${ugData.data?.length || 0} user-groups directly from MySQL Backend Database Server.`
          );
          return;
        }

        const db = await getOrInitSqliteDb(INITIAL_USERS, INITIAL_GROUPS, INITIAL_USER_GROUPS);
        refreshFromSqlite(db);
        setIsSqliteReady(true);
      } catch (err) {
        console.error('MySQL initialization fallback:', err);
        const fallbackUsers = loadLocalStorage(STORAGE_KEY_USERS, INITIAL_USERS);
        const fallbackGroups = loadLocalStorage(STORAGE_KEY_GROUPS, INITIAL_GROUPS);
        const fallbackUserGroups = loadLocalStorage(STORAGE_KEY_USER_GROUPS, INITIAL_USER_GROUPS);
        setUsers(fallbackUsers);
        setGroups(fallbackGroups);
        setUserGroups(fallbackUserGroups);
        setIsSqliteReady(true);
      }
    }

    initMySqlEngine();
  }, []);

  // Sync state changes to LocalStorage backup
  useEffect(() => {
    if (!isSqliteReady) return;
    safeSaveLocalStorage(STORAGE_KEY_GROUPS, groups);
  }, [groups, isSqliteReady]);

  useEffect(() => {
    if (!isSqliteReady) return;
    safeSaveLocalStorage(STORAGE_KEY_USERS, users);
  }, [users, isSqliteReady]);

  useEffect(() => {
    if (!isSqliteReady) return;
    safeSaveLocalStorage(STORAGE_KEY_USER_GROUPS, userGroups);
  }, [userGroups, isSqliteReady]);

  // Handle CRUD actions
  const handleSaveUser = (userData: User, selectedGroupIds: number[]) => {
    const existingIndex = users.findIndex((u) => u.employee_id === userData.employee_id);
    let updatedUsers: User[];
    if (existingIndex >= 0) {
      updatedUsers = [...users];
      updatedUsers[existingIndex] = userData;
    } else {
      updatedUsers = [userData, ...users];
    }

    // Update User-Group Mapping
    const otherUserGroups = userGroups.filter((ug) => ug.employee_id !== userData.employee_id);
    const newUserGroups: UserGroup[] = selectedGroupIds.map((groupId) => ({
      employee_id: userData.employee_id,
      group_id: groupId,
    }));

    const updatedUserGroups = [...otherUserGroups, ...newUserGroups];

    setUsers(updatedUsers);
    setUserGroups(updatedUserGroups);

    syncUsersToSqlite(updatedUsers);
    syncUserGroupsToSqlite(updatedUserGroups);
    syncToBackendPhysicalFile(updatedUsers, groups, updatedUserGroups);
  };

  const handleDeleteUser = (employeeId: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานรหัส ${employeeId}?`)) return;
    const updatedUsers = users.filter((u) => u.employee_id !== employeeId);
    const updatedUserGroups = userGroups.filter((ug) => ug.employee_id !== employeeId);

    setUsers(updatedUsers);
    setUserGroups(updatedUserGroups);

    syncUsersToSqlite(updatedUsers);
    syncUserGroupsToSqlite(updatedUserGroups);
    syncToBackendPhysicalFile(updatedUsers, groups, updatedUserGroups);
  };

  const handleBulkDeleteUsers = (selectedIds: string[]) => {
    if (!selectedIds.length) return;
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน ${selectedIds.length} คนที่เลือกไว้?`)) return;

    const updatedUsers = users.filter((u) => !selectedIds.includes(u.employee_id));
    const updatedUserGroups = userGroups.filter((ug) => !selectedIds.includes(ug.employee_id));

    setUsers(updatedUsers);
    setUserGroups(updatedUserGroups);

    syncUsersToSqlite(updatedUsers);
    syncUserGroupsToSqlite(updatedUserGroups);
    syncToBackendPhysicalFile(updatedUsers, groups, updatedUserGroups);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    const updatedGroups = groups.map((g) => (g.group_id === updatedGroup.group_id ? updatedGroup : g));
    setGroups(updatedGroups);
    syncGroupsToSqlite(updatedGroups);
    syncToBackendPhysicalFile(users, updatedGroups, userGroups);
  };

  const handleAddGroup = (newGroup: Omit<Group, 'group_id'>) => {
    const nextGroupId = groups.length > 0 ? Math.max(...groups.map((g) => g.group_id)) + 1 : 1;
    const groupToAdd: Group = {
      ...newGroup,
      group_id: nextGroupId,
    };
    const updatedGroups = [...groups, groupToAdd];
    setGroups(updatedGroups);
    syncGroupsToSqlite(updatedGroups);
    syncToBackendPhysicalFile(users, updatedGroups, userGroups);
  };

  const handleDeleteGroup = (groupId: number) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่มสิทธิ์ ID: ${groupId}?`)) return;
    const updatedGroups = groups.filter((g) => g.group_id !== groupId);
    const updatedUserGroups = userGroups.filter((ug) => ug.group_id !== groupId);

    setGroups(updatedGroups);
    setUserGroups(updatedUserGroups);

    syncGroupsToSqlite(updatedGroups);
    syncUserGroupsToSqlite(updatedUserGroups);
    syncToBackendPhysicalFile(users, updatedGroups, updatedUserGroups);
  };

  const handleImportCSVSuccess = (
    importedUsers: User[],
    importedGroups: Group[],
    importedUserGroups: UserGroup[]
  ) => {
    setUsers(importedUsers);
    setGroups(importedGroups);
    setUserGroups(importedUserGroups);

    syncUsersToSqlite(importedUsers);
    syncGroupsToSqlite(importedGroups);
    syncUserGroupsToSqlite(importedUserGroups);

    // Immediately send CSV payload directly to Express Backend MySQL Server
    syncToBackendPhysicalFile(importedUsers, importedGroups, importedUserGroups);
  };

  const handleResetData = async (skipConfirm?: boolean) => {
    if (!skipConfirm && !window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลพนักงานทั้งหมดออกจากฐานข้อมูล? (ข้อมูลพนักงานจะถูกลบทั้งหมด)')) return;
    try {
      // 1. Call Backend API Endpoint /api/db/reset to delete all users & user_groups from MySQL
      const res = await fetch('/api/db/reset', { method: 'POST' });
      const resetRes = await res.json();

      if (!resetRes.success) {
        throw new Error(resetRes.error || 'Failed to reset backend database');
      }

      // 2. Fetch fresh empty state from backend API
      const uRes = await fetch('/api/users');
      const gRes = await fetch('/api/groups');
      const ugRes = await fetch('/api/user-groups');
      const uData = await uRes.json();
      const gData = await gRes.json();
      const ugData = await ugRes.json();

      const freshUsers: User[] = (uData.success && Array.isArray(uData.data)) ? uData.data : [];
      const freshGroups: Group[] = (gData.success && Array.isArray(gData.data) && gData.data.length > 0) ? gData.data : DEFAULT_MASTER_GROUPS;
      const freshUserGroups: UserGroup[] = (ugData.success && Array.isArray(ugData.data)) ? ugData.data : [];

      // 3. Update React state to 0 users
      setUsers(freshUsers);
      setGroups(freshGroups);
      setUserGroups(freshUserGroups);

      // 4. Reset WASM SQLite memory with 0 users
      resetSqliteDb(freshUsers, freshGroups, freshUserGroups);

      // 5. Save empty state to LocalStorage
      safeSaveLocalStorage(STORAGE_KEY_USERS, freshUsers);
      safeSaveLocalStorage(STORAGE_KEY_GROUPS, freshGroups);
      safeSaveLocalStorage(STORAGE_KEY_USER_GROUPS, freshUserGroups);

      alert('ลบข้อมูลพนักงานทั้งหมดในฐานข้อมูลเรียบร้อยแล้ว (จำนวนพนักงาน = 0)');
    } catch (err: any) {
      console.error('Failed to reset database:', err);
      alert('เกิดข้อผิดพลาดในการสั่งลบข้อมูลพนักงาน: ' + (err?.message || err));
    }
  };

  return {
    groups,
    users,
    userGroups,
    isSqliteReady,
    setGroups,
    setUsers,
    setUserGroups,
    handleSaveUser,
    handleDeleteUser,
    handleBulkDeleteUsers,
    handleUpdateGroup,
    handleAddGroup,
    handleDeleteGroup,
    handleImportCSVSuccess,
    handleResetData,
  };
}

