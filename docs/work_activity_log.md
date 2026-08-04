# Work Activity & Maintenance Changelog

บันทึกกิจกรรมการทำงาน การแก้ไขบั๊ก และประวัติการเปลี่ยนแปลงระบบตามลำดับเวลา (Chronological Log)

---

## 📅 ประวัติการปรับปรุงระบบ (Activity Timeline)

### 🟢 2026-08-03
- **[LOG-001] Setup SQLite & Database Connection Parameters**:
  - ตั้งค่าการใช้งาน SQLite พร้อมกำหนดพารามิเตอร์ `DB_NAME=user_access_dashboard`, `DB_USER=root`, `DB_PASS=admin123456`, `DB_PORT=3306` ในไฟล์ `.env` และ `.env.example`
- **[LOG-002] Implement Database Health Inspector**:
  - สร้างคอมโพเนนต์ `DbStatusModal.tsx` และเพิ่มจุดเชื่อมต่อป้ายสถานะ `SQLite Connected` บน `Navbar.tsx` เพื่อตรวจสอบ Latency และสถานะตารางแบบเรียลไทม์
- **[LOG-003] Update Schema Target to `user_access_dashboard_data`**:
  - อัปเดตการเชื่อมต่อและ Schema เป้าหมายเป็น `user_access_dashboard_data` เพื่อให้ตรงกับ MySQL Workbench
- **[LOG-004] Clear Mockup Seed Data**:
  - ล้างข้อมูลพนักงานจำลองทั้งหมดในระบบออก (0 Users) คงไว้เฉพาะกลุ่มระดับมาตรฐานระบบ (`Internet Level A/B/C`) เพื่อเตรียมพร้อมสำหรับการ Import CSV ข้อมูลจริง
- **[LOG-005] Fix Level Group Badge Refresh Disappearing Bug**:
  - แก้ไขบั๊กข้อมูลในคอลัมน์ `GROUP MEMBER (LEVEL GROUP)` หายเมื่อทำการกด Refresh หน้าจอ
  - ปรับปรุงการโหลด State เริ่มต้นจาก `localStorage` และ SQLite ใน `useUserAccessData.ts`
  - ปรับปรุง `useUserFilters.ts` และ `UserTable.tsx` ให้สร้างและแสดงตราสัญลักษณ์ระดับอินเทอร์เน็ตกำกับตัวผู้ใช้เสมอ
- **[LOG-006] Resolve LocalStorage QuotaExceededError (5MB Browser Limit)**:
  - แก้ไขปัญหาไม่สามารถ Import CSV หรือเพิ่มพนักงานได้เนื่องจากโควต้า `localStorage` เต็ม 5MB จากการเก็บบอร์ดไบนารี SQLite Base64
  - เพิ่มระบบ Quota Auto-Cleanup ใน `storage.ts` และ `sqliteDb.ts` เพื่อสลับไปรันบน WASM Memory ป้องกันไม่ให้แอปค้าง
- **[LOG-007] Integrate Superpowers Antigravity Skills**:
  - ติดตั้งและตั้งค่า Framework `superpowers-antigravity` ลงในโฟลเดอร์ `.agents/skills` และลงทะเบียนกฎระเบียบใน `.agents/AGENTS.md`
- **[LOG-008] Initialize Dedicated Documentation Architecture**:
  - จัดทำโครงสร้างโฟลเดอร์ `docs/` สำหรับบันทึก Log การทำงาน คู่มือการติดตั้ง และประวัติการพัฒนาระบบ
- **[LOG-009] Enforce Mandatory Documentation Protocol (`AGENTS.md`)**:
  - บันทึกกฎระเบียบปฏิบัติบังคับใน `.agents/AGENTS.md` ให้เอเจนต์อ่านเอกสารใน `docs/` ก่อนแก้ไข และอัปเดตเอกสารควบคู่ทุกการเปลี่ยนแปลง
- **[LOG-010] Fix `getGroupBadgeInfo` ReferenceError in UserTable**:
  - เพิ่มการ Import `getGroupBadgeInfo` ใน `UserTable.tsx` แก้ไขปัญหาหน้าจอแอปพลิเคชันค้างแสดง Error `getGroupBadgeInfo is not defined`
- **[LOG-011] Align & Document Group Member (Level Group) Data Architecture**:
  - บันทึกและปรับปรุงหลักเกณฑ์โครงสร้างข้อมูล Group Member / Level Group Data Mapping Specification ใน `docs/system_development_log.md`
  - ยืนยันมาตรฐาน Type Safety (`Number(group_id)`), Implicit Level Group Auto-Assignment (101/102/103), Search Matching และ Analytics Aggregation Logic
- **[LOG-012] Filter Column GROUP MEMBER to Special Groups with 2-Column Grid**:
  - ปรับการคัดกรองใน `UserTable.tsx` ให้แสดงผลเฉพาะ Special Groups (`getSpecialGroupsForUser`)
  - จัดระเบียบการวางเลย์เอาต์ป้ายสิทธิ์กลุ่มให้อยู่ในรูปแบบ 2-Column Grid (`grid grid-cols-2 gap-1.5`) ตรงตามรูปภาพแบบสเปกที่ 2
- **[LOG-013] Restore Full 9 Special Groups Master & Fix Filter Matching**:
  - เพิ่มกลุ่มสิทธิ์หลัก 104 ถึง 109 (`Video Access`, `Communications`, `Free E-mail`, `VPN Access`, `Printer Color`, `Printer Mono`) เข้าไปใน `INITIAL_GROUPS`
  - ปรับแก้ไข `isSpecialGroup` และ `getGroupBadgeInfo` ใน `specialGroups.ts` ไม่ให้คืนค่า false ผิดพลาด และปรับเวอร์ชันแคชเป็น `v21`
- **[LOG-014] Enforce SQLite Database as Exclusive Data Provider**:
  - ปรับปรุง `useUserAccessData.ts` ให้เรียกใช้งาน `queryUsersFromSqlite`, `queryGroupsFromSqlite`, `queryUserGroupsFromSqlite` เป็นแหล่งข้อมูลหลักทางเดียว (Single Source of Truth)
  - ทุกการเพิ่ม/ลบ/แก้ไข และ Import CSV จะถูกเขียนลง SQLite และรัน `SELECT` SQL Query จากเอนจิน SQLite เพื่อนำข้อมูลมาแสดงผลบนเว็บโดยตรง 100%
- **[LOG-015] Implement Physical SQLite File Disk Persistence (`user_access_dashboard_data.sqlite`)**:
  - พัฒนา [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) ให้สร้างและเซฟไฟล์ฐานข้อมูล SQLite จริงลงในเครื่องที่ `user_access_dashboard_data.sqlite`
  - เพิ่ม API Endpoint `/api/db/sync` และ `/api/db/download` สำหรับซิงค์ข้อมูลลงดิสก์และดาวน์โหลดไฟล์ `.sqlite` จริง
- **[LOG-016] Add MySQL Workbench Data Sync Script Generator (`/api/db/mysql-dump`)**:
  - เพิ่มฟังก์ชัน `generateMySqlDumpScript()` ใน `dataService.ts` และเปิดบริการผ่าน API Endpoint `/api/db/mysql-dump`
  - รองรับการดาวน์โหลดสคริปต์ SQL นำข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงทั้งหมดไปรันใน MySQL Workbench เพื่อให้ `select * from users;` แสดงข้อมูลครบถ้วน
- **[LOG-017] Implement Automatic Real-Time MySQL Database Sync (`mysql2`)**:
  - ติดตั้งแพ็กเกจ `mysql2` และพัฒนาฟังก์ชัน `syncToMySqlDatabase()` ใน `dataService.ts`
  - เชื่อมต่อไปยัง MySQL Server (`user_access_dashboard_data` บน `localhost:3306`) เพื่อสร้างตารางและเขียนข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงลงใน MySQL Database โดยอัตโนมัติทุกครั้งที่มีการ Import CSV หรืออัปเดตข้อมูล
- **[LOG-018] Transition System Architecture to Exclusive MySQL Storage Engine**:
  - อัปเดต `.env` กำหนด `DB_TYPE=mysql`, `DB_HOST=localhost`, `DB_NAME=user_access_dashboard_data`, `DB_USER=root`, `DB_PASS=admin123456`, `DB_PORT=3306`
  - ปรับโครงสร้าง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) ให้สร้างตาราง คิวรี และบันทึกข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงตรงเข้า MySQL Database Server เป็นเอนจินหลักทางเดียว 100%
- **[LOG-019] Fix Direct CSV Import Sync Payload to MySQL Backend**:
  - ปรับปรุง `useUserAccessData.ts` ในฟังก์ชัน `handleImportCSVSuccess` ให้ส่งก้อนข้อมูล `importedUsers`, `importedGroups`, `importedUserGroups` ยิงตรงเข้า API `/api/db/sync` ของ Express MySQL Backend ทันที
  - แก้ไขปัญหานำเข้า CSV บนเว็บแล้วข้อมูลในตาราง `users` ของ MySQL Workbench ยังไม่ถูกเขียนลงตาราง
- **[LOG-020] Fix MySQL Reserved Keyword Escaping Bug for Groups Table**:
  - ครอบชื่อตารางใน SQL Query ทั้งหมดของ [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) ด้วยเครื่องหมาย Backticks (`` `groups` ``, `` `users` ``, `` `user_groups` ``) เพื่อแก้ปัญหาคำสั่ง SQL ขัดข้องจากคำสงวน `groups` ใน MySQL 8
  - ยืนยันผลการทดสอบการเขียนและสอบถามข้อมูลพนักงานลงตาราง `users` ของ MySQL Database Server สำเร็จ 100%
- **[LOG-021] Async Sync Endpoint & Populated 60 Employee Records to MySQL Database**:
  - ปรับแต่ง [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/routes/api.ts) ให้ `/api/db/sync` เป็น `async/await` เพื่อให้การซิงค์ข้อมูลเสร็จสิ้นสมบูรณ์
  - นำเข้าข้อมูลพนักงานจากไฟล์ `sqlite_user_master_export_2026-08-03 (1).csv` ลงในตาราง `users` ของ MySQL Database Server (`user_access_dashboard_data`) ครบถ้วนทั้ง 60 คนเรียบร้อยแล้ว
- **[LOG-022] Create Dedicated MySQL Troubleshooting Postmortem Documentation**:
  - จัดทำไฟล์เอกสาร [docs/mysql_sync_troubleshooting_postmortem.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/docs/mysql_sync_troubleshooting_postmortem.md) สรุปสาเหตุเชิงลึกและแนวทางแก้ไขปัญหาสนองความต้องการของผู้ใช้
- **[LOG-023] Implement Real-Time Deletion Syncing for MySQL Database Server**:
  - อัปเดต [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) เพิ่มคำสั่ง `DELETE FROM \`users\` WHERE employee_id NOT IN (?)` และ `DELETE FROM \`groups\` WHERE group_id NOT IN (?)`
  - แก้ไขปัญพาลบพนักงานบนหน้าเว็บแล้วข้อมูลในตาราง `users` ของ MySQL Workbench ยังไม่ลบตาม
- **[LOG-024] Enforce Pure Read-Only Page Initialization from MySQL Server**:
  - ปรับปรุง `useUserAccessData.ts` และ `api.ts` ในฟังก์ชัน `initMySqlEngine()` ให้การดึงข้อมูลตอนเปิดหน้าเว็บเป็นการอ่านข้อมูล (READ-ONLY) จาก MySQL Server 100% ปราศจากการยิงสั่งลบ/สั่งเขียนทับ (`POST /api/db/sync`) ขณะโหลดหน้าเว็บ
- **[LOG-025] Server Process Restart & Verified 60 Employee Records Serving via REST API**:
  - รีสตาร์ตกระบวนการ Express Backend Dev Server ใหม่เพื่อโหลดซอร์สโค้ดเอนจิน MySQL ล่าสุด
  - สอบถามผ่านคำสั่ง `fetch('http://localhost:3000/api/users')` ยืนยันการส่งคืนข้อมูลสดจาก MySQL Database Server จำนวน 60 รายการเต็ม ครบถ้วนตามตาราง MySQL Workbench
- **[LOG-026] Restore Special Groups Mapping on Page Refresh via REST API**:
  - เพิ่ม REST API `/api/user-groups` ใน `api.ts` และดึงข้อมูลตารางผูกสิทธิ์ 511 รายการมาใส่ React State ใน `useUserAccessData.ts` ขณะโหลดหน้าเว็บ
  - แก้ไขปัญหา Special Groups (เช่น Video Access, Communications, Free E-mail, Printer Mono, VPN Access) หายไปเมื่อทำการกดรีเฟรชหน้าเว็บ (F5)
- **[LOG-027] Git Repository Initialization & Push to GitHub Remote**:
  - สร้าง Git Repository (`git init`), ตั้งค่าชื่อ branch หลักเป็น `main`, ผูก remote ไปยัง `https://github.com/Deizyn/user_access_management.git`
  - ทำการ commit และ push ซอร์สโค้ดและเอกสารระบบขึ้นคลัง GitHub เรียบร้อยแล้ว
- **[LOG-028] Create Enterprise-Grade README.md for GitHub Repository**:
  - จัดทำไฟล์ [README.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/README.md) หน้าแรกใหม่ระดับองค์กร สรุปฟีเจอร์ สถาปัตยกรรม วิธีการรัน สคริปต์ SQL และดรรชนีเชื่อมโยงเอกสาร
- **[LOG-029] User Profile Cleanup & 3-Line Group Member Column Layout with Popover**:
  - ลบแท็บและส่วนแสดงผล `Contact & System Profile` ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/components/modals/UserDetailModal.tsx) ออกตามความต้องการของผู้ใช้
  - ปรับโครงสร้างคอลัมน์ `GROUP MEMBER (LEVEL GROUP)` ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/components/UserTable.tsx) ให้แสดง 3 บรรทัดแนวตั้ง (1. Internet Level, 2. Printer, 3. +เพิ่มเติม) โดยปุ่มเพิ่มเติมรองรับการเปิด Popover การ์ดลอยแสดง Special Groups ที่เหลือทั้งหมด
- **[LOG-030] Soft Gray Styling for +More Button & User Profile UI Enhancements**:
  - ปรับสไตล์ปุ่ม `+เพิ่มเติม` ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/components/UserTable.tsx) เป็นโทนสีเทาสว่าง/จางนุ่มตา (`bg-slate-100/80 text-slate-600 border-slate-200/90`) สบายตา
  - ปรับเปลี่ยนไอคอนของ Device Code ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/components/modals/UserDetailModal.tsx) เป็นรูปหน้าจอคอมพิวเตอร์ (`Monitor`)
  - ย้ายข้อมูล M365 License ขึ้นมาไว้ในส่วน **Primary Contact Details** ของหน้า User Profile Modal
- **[LOG-031] Base Gray Tone Uniformity for Printer Badges**:
  - ปรับเปลี่ยนโทนสีป้าย Printer Color และ Printer Mono ใน [specialGroups.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/constants/specialGroups.ts) ให้เป็นสีเทาเบสเนียนนุ่มเดียวกัน (`bg-slate-100 text-slate-800 border-slate-200`) ไม่ฉูดฉาด ป้องกันอาการตาลาย
- **[LOG-032] Remove Analytics View & Simplify Dashboard View Mode**:
  - ถอดส่วนแสดงผลหน้า `AnalyticsOverview.tsx` และ State `viewMode` ออกจาก [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/App.tsx)
  - ซ่อนปุ่มสลับมุมมอง (Table View / Analytics View) ออกจาก [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/components/FilterBar.tsx) ให้ระบบแสดงผลเฉพาะ Table View เป็นมุมมองหลัก
  - ปรับปรุง Type Definitions ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/backend/routes/api.ts) รองรับการตรวจสอบ Type Safety ด้วย `npm run lint` (`tsc --noEmit`) ให้ผ่าน 100%
- **[LOG-033] Fix DbStatusModal Error Handling & Update Header Title**:
  - ปรับแก้ไขการจัดการ Error ใน [DbStatusModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/components/modals/DbStatusModal.tsx) ให้ครอบ `try...catch` รอบการคิวรี SQLite WASM memory เพื่อรองรับระบบที่ดึงข้อมูลผ่าน REST API Engine ไม่ให้ขึ้นกล่องแดง `DATABASE CONNECTION ERROR`
  - ยืนยันการอัปเดตชื่อหัวข้อบน [Navbar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/components/Navbar.tsx) เป็น `User Authorization` และจัดระเบียบบรรทัดคำอธิบาย
- **[LOG-034] Auto-Initialize SQLite WASM Database in SQL Terminal (SqliteManagerModal)**:
  - อัปเดต [SqliteManagerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/components/modals/SqliteManagerModal.tsx) ให้เรียก `getOrInitSqliteDb` และซิงค์ข้อมูล `users`, `groups`, `userGroups` โดยอัตโนมัติเมื่อเปิดหน้าต่างป๊อปอัปและก่อนประมวลผลคำสั่ง SQL ในหน้าแท็บ `4. SQL Terminal`
  - แก้ไขปัญหาป๊อปอัปแจ้งเตือนสีแดง `SQLite database is not initialized.` เมื่อกดปุ่ม Execute SQL
- **[LOG-035] Sync Reset Database Payload to MySQL Server Backend**:
  - อัปเดตฟังก์ชัน `handleResetData` ใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้เรียก `syncToBackendPhysicalFile(INITIAL_USERS, INITIAL_GROUPS, INITIAL_USER_GROUPS)` ยิงก้อนรีเซ็ตเข้า API `/api/db/sync`
  - ลบข้อมูลพนักงานที่ถูกสร้างใหม่ในตาราง `users`, `groups`, `user_groups` บนฐานข้อมูล MySQL Server และคืนค่าเป็น Seed เริ่มต้น 100%
- **[LOG-036] Fix MySQL Database Sync Data Query Logic & React State Reset**:
  - แก้ไขฟังก์ชัน `syncData` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/backend/services/dataService.ts) ให้ทำการล้างข้อมูลตาราง `user_groups` ด้วยคำสั่ง `DELETE FROM user_groups;` ก่อนแทรกความสัมพันธ์ใหม่เสมอ ป้องกันปัญหาคิวรีขัดข้องเมื่อยิงข้อมูลรีเซ็ต
  - อัปเดต `handleResetData` ใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้เซ็ต React state (`setUsers`, `setGroups`, `setUserGroups`) และ `await` การส่ง API เพื่อให้หน้าเว็บและ MySQL Database ลบข้อมูลพนักงานออกพร้อมกันทันที
- **[LOG-037] Implement Direct MySQL Reset Endpoint (`POST /api/db/reset`)**:
  - เพิ่มเมธอด `resetDatabase()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/backend/services/dataService.ts) เพื่อรันคำสั่ง `DELETE FROM user_groups;`, `DELETE FROM users;`, `DELETE FROM groups;` ลบข้อมูลพนักงานและสิทธิ์ทุก Row จากฐานข้อมูล MySQL โดยตรง
  - เพิ่ม REST API Endpoint `POST /api/db/reset` ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/backend/routes/api.ts) และเชื่อมต่อกับปุ่มรีเซ็ตใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/frontend/hooks/useUserAccessData.ts)
- **[LOG-038] Fix MySQL Connection Pool Leak (`Too many connections`)**:
  - แก้ไขการสร้าง connection pool ซ้ำใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/backend/services/dataService.ts) ให้ใช้ Singleton Pattern `this.pool` เพื่อป้องกันการเปิด Connection เกินโควตาทุกครั้งที่มี request เข้ามา
  - ทดสอบรันคำสั่ง `POST /api/db/reset` และตรวจสอบผ่าน `GET /api/users` ยืนยันการลบข้อมูลพนักงานสำเร็จ 100% (`count: 0`)
- **[LOG-039] Add Smart Fallback for Internet Level in CSV Import**:
  - ปรับปรุง [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V2/user_access_management/src/utils/csvHelpers.ts) ให้ตรวจสอบคอลัมน์ `Groups` โดยอัตโนมัติหากคอลัมน์ `Internet Level` ถูกเว้นว่างไว้ เพื่อตรวจจับค่าระดับอินเทอร์เน็ต `A`, `B`, `C` จากชื่อกลุ่มสิทธิ์ ก่อนที่จะตกไปใช้ค่าเริ่มต้น `'B'`



























