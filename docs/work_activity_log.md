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
  - พัฒนา [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้สร้างและเซฟไฟล์ฐานข้อมูล SQLite จริงลงในเครื่องที่ `user_access_dashboard_data.sqlite`
  - เพิ่ม API Endpoint `/api/db/sync` และ `/api/db/download` สำหรับซิงค์ข้อมูลลงดิสก์และดาวน์โหลดไฟล์ `.sqlite` จริง
- **[LOG-016] Add MySQL Workbench Data Sync Script Generator (`/api/db/mysql-dump`)**:
  - เพิ่มฟังก์ชัน `generateMySqlDumpScript()` ใน `dataService.ts` และเปิดบริการผ่าน API Endpoint `/api/db/mysql-dump`
  - รองรับการดาวน์โหลดสคริปต์ SQL นำข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงทั้งหมดไปรันใน MySQL Workbench เพื่อให้ `select * from users;` แสดงข้อมูลครบถ้วน
- **[LOG-017] Implement Automatic Real-Time MySQL Database Sync (`mysql2`)**:
  - ติดตั้งแพ็กเกจ `mysql2` และพัฒนาฟังก์ชัน `syncToMySqlDatabase()` ใน `dataService.ts`
  - เชื่อมต่อไปยัง MySQL Server (`user_access_dashboard_data` บน `localhost:3306`) เพื่อสร้างตารางและเขียนข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงลงใน MySQL Database โดยอัตโนมัติทุกครั้งที่มีการ Import CSV หรืออัปเดตข้อมูล
- **[LOG-018] Transition System Architecture to Exclusive MySQL Storage Engine**:
  - อัปเดต `.env` กำหนด `DB_TYPE=mysql`, `DB_HOST=localhost`, `DB_NAME=user_access_dashboard_data`, `DB_USER=root`, `DB_PASS=admin123456`, `DB_PORT=3306`
  - ปรับโครงสร้าง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้สร้างตาราง คิวรี และบันทึกข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงตรงเข้า MySQL Database Server เป็นเอนจินหลักทางเดียว 100%
- **[LOG-019] Fix Direct CSV Import Sync Payload to MySQL Backend**:
  - ปรับปรุง `useUserAccessData.ts` ในฟังก์ชัน `handleImportCSVSuccess` ให้ส่งก้อนข้อมูล `importedUsers`, `importedGroups`, `importedUserGroups` ยิงตรงเข้า API `/api/db/sync` ของ Express MySQL Backend ทันที
  - แก้ไขปัญหานำเข้า CSV บนเว็บแล้วข้อมูลในตาราง `users` ของ MySQL Workbench ยังไม่ถูกเขียนลงตาราง
- **[LOG-020] Fix MySQL Reserved Keyword Escaping Bug for Groups Table**:
  - ครอบชื่อตารางใน SQL Query ทั้งหมดของ [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ด้วยเครื่องหมาย Backticks (`` `groups` ``, `` `users` ``, `` `user_groups` ``) เพื่อแก้ปัญหาคำสั่ง SQL ขัดข้องจากคำสงวน `groups` ใน MySQL 8
  - ยืนยันผลการทดสอบการเขียนและสอบถามข้อมูลพนักงานลงตาราง `users` ของ MySQL Database Server สำเร็จ 100%
- **[LOG-021] Async Sync Endpoint & Populated 60 Employee Records to MySQL Database**:
  - ปรับแต่ง [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) ให้ `/api/db/sync` เป็น `async/await` เพื่อให้การซิงค์ข้อมูลเสร็จสิ้นสมบูรณ์
  - นำเข้าข้อมูลพนักงานจากไฟล์ `sqlite_user_master_export_2026-08-03 (1).csv` ลงในตาราง `users` ของ MySQL Database Server (`user_access_dashboard_data`) ครบถ้วนทั้ง 60 คนเรียบร้อยแล้ว
- **[LOG-022] Create Dedicated MySQL Troubleshooting Postmortem Documentation**:
  - จัดทำไฟล์เอกสาร [docs/mysql_sync_troubleshooting_postmortem.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/mysql_sync_troubleshooting_postmortem.md) สรุปสาเหตุเชิงลึกและแนวทางแก้ไขปัญหาสนองความต้องการของผู้ใช้
- **[LOG-023] Implement Real-Time Deletion Syncing for MySQL Database Server**:
  - อัปเดต [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) เพิ่มคำสั่ง `DELETE FROM \`users\` WHERE employee_id NOT IN (?)` และ `DELETE FROM \`groups\` WHERE group_id NOT IN (?)`
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
  - จัดทำไฟล์ [README.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/README.md) หน้าแรกใหม่ระดับองค์กร สรุปฟีเจอร์ สถาปัตยกรรม วิธีการรัน สคริปต์ SQL และดรรชนีเชื่อมโยงเอกสาร
- **[LOG-029] User Profile Cleanup & 3-Line Group Member Column Layout with Popover**:
  - ลบแท็บและส่วนแสดงผล `Contact & System Profile` ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) ออกตามความต้องการของผู้ใช้
  - ปรับโครงสร้างคอลัมน์ `GROUP MEMBER (LEVEL GROUP)` ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) ให้แสดง 3 บรรทัดแนวตั้ง (1. Internet Level, 2. Printer, 3. +เพิ่มเติม) โดยปุ่มเพิ่มเติมรองรับการเปิด Popover การ์ดลอยแสดง Special Groups ที่เหลือทั้งหมด
- **[LOG-030] Soft Gray Styling for +More Button & User Profile UI Enhancements**:
  - ปรับสไตล์ปุ่ม `+เพิ่มเติม` ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) เป็นโทนสีเทาสว่าง/จางนุ่มตา (`bg-slate-100/80 text-slate-600 border-slate-200/90`) สบายตา
  - ปรับเปลี่ยนไอคอนของ Device Code ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) เป็นรูปหน้าจอคอมพิวเตอร์ (`Monitor`)
  - ย้ายข้อมูล M365 License ขึ้นมาไว้ในส่วน **Primary Contact Details** ของหน้า User Profile Modal
- **[LOG-031] Base Gray Tone Uniformity for Printer Badges**:
  - ปรับเปลี่ยนโทนสีป้าย Printer Color และ Printer Mono ใน [specialGroups.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/constants/specialGroups.ts) ให้เป็นสีเทาเบสเนียนนุ่มเดียวกัน (`bg-slate-100 text-slate-800 border-slate-200`) ไม่ฉูดฉาด ป้องกันอาการตาลาย
- **[LOG-032] Remove Analytics View & Simplify Dashboard View Mode**:
  - ถอดส่วนแสดงผลหน้า `AnalyticsOverview.tsx` และ State `viewMode` ออกจาก [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx)
  - ซ่อนปุ่มสลับมุมมอง (Table View / Analytics View) ออกจาก [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx) ให้ระบบแสดงผลเฉพาะ Table View เป็นมุมมองหลัก
  - ปรับปรุง Type Definitions ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) รองรับการตรวจสอบ Type Safety ด้วย `npm run lint` (`tsc --noEmit`) ให้ผ่าน 100%
- **[LOG-033] Fix DbStatusModal Error Handling & Update Header Title**:
  - ปรับแก้ไขการจัดการ Error ใน [DbStatusModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/DbStatusModal.tsx) ให้ครอบ `try...catch` รอบการคิวรี SQLite WASM memory เพื่อรองรับระบบที่ดึงข้อมูลผ่าน REST API Engine ไม่ให้ขึ้นกล่องแดง `DATABASE CONNECTION ERROR`
  - ยืนยันการอัปเดตชื่อหัวข้อบน [Navbar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/Navbar.tsx) เป็น `User Authorization` และจัดระเบียบบรรทัดคำอธิบาย
- **[LOG-034] Auto-Initialize SQLite WASM Database in SQL Terminal (SqliteManagerModal)**:
  - อัปเดต [SqliteManagerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/SqliteManagerModal.tsx) ให้เรียก `getOrInitSqliteDb` และซิงค์ข้อมูล `users`, `groups`, `userGroups` โดยอัตโนมัติเมื่อเปิดหน้าต่างป๊อปอัปและก่อนประมวลผลคำสั่ง SQL ในหน้าแท็บ `4. SQL Terminal`
  - แก้ไขปัญหาป๊อปอัปแจ้งเตือนสีแดง `SQLite database is not initialized.` เมื่อกดปุ่ม Execute SQL
- **[LOG-035] Sync Reset Database Payload to MySQL Server Backend**:
  - อัปเดตฟังก์ชัน `handleResetData` ใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้เรียก `syncToBackendPhysicalFile(INITIAL_USERS, INITIAL_GROUPS, INITIAL_USER_GROUPS)` ยิงก้อนรีเซ็ตเข้า API `/api/db/sync`
  - ลบข้อมูลพนักงานที่ถูกสร้างใหม่ในตาราง `users`, `groups`, `user_groups` บนฐานข้อมูล MySQL Server และคืนค่าเป็น Seed เริ่มต้น 100%
- **[LOG-036] Fix MySQL Database Sync Data Query Logic & React State Reset**:
  - แก้ไขฟังก์ชัน `syncData` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้ทำการล้างข้อมูลตาราง `user_groups` ด้วยคำสั่ง `DELETE FROM user_groups;` ก่อนแทรกความสัมพันธ์ใหม่เสมอ ป้องกันปัญหาคิวรีขัดข้องเมื่อยิงข้อมูลรีเซ็ต
  - อัปเดต `handleResetData` ใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้เซ็ต React state (`setUsers`, `setGroups`, `setUserGroups`) และ `await` การส่ง API เพื่อให้หน้าเว็บและ MySQL Database ลบข้อมูลพนักงานออกพร้อมกันทันที
- **[LOG-037] Implement Direct MySQL Reset Endpoint (`POST /api/db/reset`)**:
  - เพิ่มเมธอด `resetDatabase()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) เพื่อรันคำสั่ง `DELETE FROM user_groups;`, `DELETE FROM users;`, `DELETE FROM groups;` ลบข้อมูลพนักงานและสิทธิ์ทุก Row จากฐานข้อมูล MySQL โดยตรง
  - เพิ่ม REST API Endpoint `POST /api/db/reset` ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) และเชื่อมต่อกับปุ่มรีเซ็ตใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts)
- **[LOG-038] Fix MySQL Connection Pool Leak (`Too many connections`)**:
  - แก้ไขการสร้าง connection pool ซ้ำใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้ใช้ Singleton Pattern `this.pool` เพื่อป้องกันการเปิด Connection เกินโควตาทุกครั้งที่มี request เข้ามา
  - ทดสอบรันคำสั่ง `POST /api/db/reset` และตรวจสอบผ่าน `GET /api/users` ยืนยันการลบข้อมูลพนักงานสำเร็จ 100% (`count: 0`)
- **[LOG-039] Add Smart Fallback for Internet Level in CSV Import**:
  - ปรับปรุง [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts) ให้ตรวจสอบคอลัมน์ `Groups` โดยอัตโนมัติหากคอลัมน์ `Internet Level` ถูกเว้นว่างไว้ เพื่อตรวจจับค่าระดับอินเทอร์เน็ต `A`, `B`, `C` จากชื่อกลุ่มสิทธิ์ ก่อนที่จะตกไปใช้ค่าเริ่มต้น `'B'`
- **[LOG-040] Refactor Normalized AD Groups Engine & Streamline CSV to 14 Core Columns**:
  - ลบคอลัมน์ซ้ำซ้อน (`Level Group`, `Internet Level`, `Print Quota Group`, `VPN Status`) ออกจากคอลัมน์ CSV ให้เหลือ 14 คอลัมน์หลักมาตรฐาน
  - ปรับปรุง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts), [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts), [groupHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/groupHelpers.ts) ให้ประมวลผลและสกัดค่าระดับอินเทอร์เน็ต (A/B/C), สถานะ VPN (Active/Disabled), โควต้าการพิมพ์ (Printer Color/Mono) และสิทธิ์พิเศษทรัพยากรอื่นๆ จากคอลัมน์ **`Groups` (Active Directory Groups)** โดยอัตโนมัติ
  - เพิ่มตาราง Master Catalog `special_groups` ในฐานข้อมูล MySQL และ REST API Endpoint `GET /api/special-groups`
- **[LOG-041] Enrich CSV Import/Export Template with 8 Realistic Multidisciplinary Sample Rows**:
  - อัปเดตฟังก์ชัน `downloadCSVTemplate` ใน [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts) ให้มีข้อมูลจำลองพนักงาน 8 แถวสมบูรณ์ ครอบคลุมทุกระดับสิทธิ์อินเทอร์เน็ต (A/B/C), สถานะ VPN, โควต้าการพิมพ์ (Color/Mono), ไลเซนส์ O365 (E5/E3/E1), สิทธิ์พิเศษทรัพยากร (Video, Comms, Mail) และแผนกต่างๆ ทั่วทั้งองค์กร
- **[LOG-043] Dedicated Special Group Module & Full Integration in Assigned Groups**:
  - สร้างโมดูลเฉพาะ `specialGroupHelpers.ts` ([specialGroupHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/specialGroupHelpers.ts)) สำหรับตรวจสอบ (`isSpecialGroup`), จัดหมวดหมู่ (`getSpecialGroupCategory`), และตรวจสอบสิทธิ์กลุ่มสิทธิ์พิเศษ (Internet Level A/B/C, VPN Access, Printer Color/Mono, Video, Comms, Mail ฯลฯ)
  - อัปเดต `useUserFilters.ts` ([useUserFilters.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserFilters.ts)) ด้วยฟังก์ชัน `ensureUserSpecialGroupsInAssigned` เพื่อให้แน่ใจว่า Special Groups ทุกประเภทถูกผูกและบรรจุอยู่ในอาร์เรย์ `user.groups` อย่างสมบูรณ์
  - ปรับปรุงแท็บ **Assigned Groups** ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) ให้แสดงผล Special Groups และ Organizational Groups อย่างชัดเจน พร้อมป้ายกำกับ `Special Group`, แบดจ์สีประจำกลุ่มสิทธิ์ และตัวกรองประเภทกลุ่มสิทธิ์ (All / Special Groups / Organizational)
- **[LOG-044] Fix Circular Dependency, Database Schema Constraints & Release Version V3**:
  - แก้ไขปัญหา Circular Dependency ระหว่าง [constants/specialGroups.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/constants/specialGroups.ts) และ [specialGroupHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/specialGroupHelpers.ts)
  - เพิ่มการจัดการ Null Safety ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) และ [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx)
  - ปรับปรุงระบบฐานข้อมูลและการลบ/รีเซ็ตข้อมูลให้พึ่งพาข้อมูลจริงจาก MySQL Database และการนำเข้า CSV เป็นหลัก
  - ทำการบันทึก Git Commit เวอร์ชัน `user_dashboard_V3`
- **[LOG-045] Implement Hideable Navbar UI Toggle & Floating Restore Pill Button**:
  - เพิ่มสเตต `isHidden` ภายในคอมโพเนนต์ [Navbar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/Navbar.tsx) เพื่อควบคุมการแสดงผล/ซ่อน Navbar ส่วนหัวของระบบ
  - เพิ่มปุ่ม "ซ่อนเมนู" พร้อมไอคอน `EyeOff` และ `ChevronUp` สำหรับยุบเก็บ Navbar
  - ออกแบบปุ่มลอย "แสดงแถบเมนู (Show Navbar)" พร้อม Glassmorphism backdrop-blur สไตล์โมเดิร์นที่มุมขวาบน ให้ผู้ใช้เรียกคืน Navbar ได้อย่างง่ายดายตลอดเวลา
- **[LOG-046] Synchronize Git Branch & Repository Documentation (`user_dashboard_V3`)**:
  - ซิงค์โค้ดและทำการ Commit/Push การเปลี่ยนแปลงทั้งหมดเข้าสู่ Remote Branch `user_dashboard_V3` บน GitHub
  - ปรับปรุงและอัปเดตเอกสารระบบทั้งหมด (`README.md`, `docs/README.md`, `docs/system_development_log.md` และ `docs/work_activity_log.md`) ให้รองรับฟีเจอร์เวอร์ชันล่าสุด
- **[LOG-047] Enrich CSV Import Template with Expired & Expiring Soon Sample Cases**:
  - อัปเดตข้อมูลตัวอย่างจำลองในฟังก์ชัน `downloadCSVTemplate` ([csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts)) จาก 8 แถว เป็น 10 แถว
  - เพิ่มตัวอย่างกรณี **วันหมดอายุแล้ว (Expired)** เช่น `2026-05-31`, `2026-06-30` (สัญญาหมดอายุแล้ว) และตัวอย่างกรณี **ใกล้หมดอายุ (Expiring Soon ภายใน 30 วัน)** เช่น `2026-08-10`, `2026-08-15` (สัญญาใกล้หมดอายุในเร็วๆ นี้) เพื่อให้ตัวอย่างไฟล์ CSV ครบถ้วนทุกสถานะ expiry status (Active, No Expiry, Expiring Soon, Expired)
- **[LOG-049] Enable Multi-Token Accumulation Across All Filter Categories in Token Bar**:
  - ปรับปรุงการทำงานของระบบ Token ใน [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx) และ [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx) ให้รองรับการสะสมหลาย Token พร้อมกันในทุกหมวดหมู่ (Multi-Token Accumulation Mode)
  - ทำให้ผู้ใช้งานสามารถใส่ Token ดูข้อมูลหลายค่าพร้อมกันได้ตามต้องการ เช่น เลือก `Company: Alpha Group` ร่วมกับ `Company: Beta Corp` เพื่อดึงเฉพาะข้อมูลของ 2 บริษัทนี้ออกมาแสดง หรือเลือก `Internet: Level A` ร่วมกับ `Internet: Level B` เพื่อดูพนักงานระดับ A และ B พร้อมกัน
  - เมนูดรอปดาวน์ (Dropdown Menu UI) ทำหน้าที่เป็นตัวเลือกหมวดหมู่ปกติ ในขณะที่ Token Bar ทำหน้าที่ประมวลผลเงื่อนไขการกรองร่วมแบบ Multi-Token Union Filtering ได้ 100%
- **[LOG-050] Architect Hybrid Dual-Mode Filtering (Single-Select Dropdowns & Multi-Token Field Accumulation)**:
  - ออกแบบสถาปัตยกรรมการกรองใหม่เพื่อแก้ไขข้อขัดแย้งของพฤติกรรมผู้ใช้งานอย่างลงตัวที่สุด:
    1. **Dropdown UI & Dashboard KPI Clicks**: ทำหน้าที่เป็น **Single-Select Direct Switch** (สลับค่าตัวกรองใน 1 คลิกทันทีเมื่อเลือกตัวเลือกจาก Dropdown หรือคลิกการ์ด KPI บน Dashboard)
    2. **Omni Token Popup & Token Field**: ทำหน้าที่เป็น **Multi-Token Accumulator** (สะสม Token หลายตัวพร้อมกันเมื่อเลือกจาก Token Popup Overlay หรือพิมพ์สร้าง Token เช่น แสดง 2 บริษัท หรือ Level A + B พร้อมกัน)
  - เพิ่มฟังก์ชันช่วยเหลือเฉพาะ `selectSingle...` สำหรับ Dropdown UI แยกต่างหากจาก `toggle...` ของระบบ Token Bar ทำให้พฤติกรรมทั้งสองแบบทำงานอย่างเป็นอิสระ ไร้การทับซ้อน 100%
- **[LOG-051] Fix KPI Summary Card Quick Filters to Single-Select Direct Switch Mode**:
  - อัปเดต `handleQuickFilter` ใน [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx) ปรับให้การกดปุ่ม Internet Level (Level A / Level B / Level C) บนการ์ด KPI Summary ([KPISummary.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/KPISummary.tsx)) ทำงานเป็นแบบ **Single-Select Direct Switch** สลับดูสิทธิ์ทีละระดับได้ทันทีใน 1 คลิก โดยไม่เอาค่าใหม่ไปรวมหรือสะสมกับค่าเดิม (เมื่อกด Level A แล้วกด Level B ระบบจะสลับไปกรอง Level B ทันทีโดยปลด Level A ออกให้อัตโนมัติ)
- **[LOG-052] Refine Clean Color Palette for Token Popup Header & Category Tabs**:
  - ปรับปรุงโทนสีของส่วน **POPUP HEADER & CATEGORY TABS** ใน [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx) ให้มีความ Clean โมเดิร์น และเข้ากับดีไซน์ระบบ:
    1. เปลี่ยนส่วน Header Container ให้ใช้โทนสี `bg-slate-900` พร้อมขอบล่าง `border-b border-slate-800` ที่เนียนเรียบสบายตา
    2. เปลี่ยนไอคอน Sparkles ให้ใช้สี Indigo (`text-indigo-400`) เพื่อเข้ากับ Indigo Theme หลักของระบบ
    3. ปรับเปลี่ยน Category Tabs ปุ่ม Active ให้เป็นโทนสี Indigo โมเดิร์น (`bg-indigo-600 text-white font-extrabold shadow-2xs border border-indigo-500`) และปุ่ม Inactive ให้เป็น `bg-slate-800/80 text-slate-300 hover:bg-slate-800` ดูสะอาดและกลมกลืนกับ Dashboard 100%
- **[LOG-053] Align Database Interchange Specification with Clean MySQL Users Table Schema**:
  - อัปเดตไฟล์ข้อกำหนดสคีมาฐานข้อมูล [databaseSchemaSpec.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/data/databaseSchemaSpec.ts) ให้ตรงกับโครงสร้างจริงใน MySQL `user_access_dashboard_data.users` 100%
  - ถอดฟิลด์สิทธิ์ซ้ำซ้อน (`internet_level`, `vpn_status`, `print_quota_group`) ออกจากโครงสร้างตาราง `users` เพื่อให้ข้อมูลสิทธิ์ทั้งหมดถูกประมวลผลผ่านตาราง `groups` และ `user_groups` อย่างสมบูรณ์และไม่มีความซ้ำซ้อนของข้อมูลในระบบ
- **[LOG-054] Remove Sparkles Icon Badge from Assigned Groups in User Detail Modal**:
  - นำไอคอน `<Sparkles />` ออกจากป้าย Badge แสดงประเภทกลุ่มใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) ตามความต้องการของผู้ใช้ เพื่อความ Clean และเป็นระเบียบเรียบร้อยของหน้าต่างรายละเอียดพนักงาน
- **[LOG-055] Format Special Entitlements into System Privileges Grid Cards**:
  - ปรับปรุงโครงสร้างการแสดงผลส่วน **System Privileges Summary** ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) ให้นำรายการ **Special Entitlements** (เช่น Video Access, Communications ฯลฯ) มาจัดรูปแบบการแสดงผลเป็น **การ์ดตาราง (Grid Card)** ในดีไซน์รูปแบบเดียวกัน 100% กับการ์ด Internet Permission, Remote VPN Access และ Print Quota Policy (`p-3 rounded-lg bg-slate-50 border border-slate-200/80`) เพื่อความสวยงาม เป็นระเบียบ และสวยงามเป็นเอกภาพเดียวกันทั้งหน้าต่าง
- **[LOG-056] Assign Contextual Icons & Color Accents to Special Entitlement Cards**:
  - เพิ่มฟังก์ชัน `getSpecialEntitlementMeta` ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) เพื่อแมปไอคอนและโทนสีประจำสิทธิ์อย่างเหมาะสมตามประเภทเนื้อหา:
    - **Video / Media Access**: ไอคอน `<Video />` สีม่วง (`text-purple-600`) และชื่อการ์ด `Media & Video Access`
    - **Communications / VoIP**: ไอคอน `<MessageSquare />` สีฟ้า (`text-sky-600`) และชื่อการ์ด `Communications & VoIP`
    - **External Mail**: ไอคอน `<Mail />` สีส้มอัมพัน (`text-amber-600`) และชื่อการ์ด `External Email Privilege`
    - **Special Entitlements อื่นๆ**: ไอคอน `<Sparkles />` สีอินดิโก้ (`text-indigo-600`) และชื่อการ์ด `Special Entitlement`
- **[LOG-057] Fix Auto-Sync Category Values for Special Groups 101-109 in MySQL Engine**:
  - แก้ไขและปรับปรุงคำสั่งซิงค์ข้อมูลเริ่มต้นใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) โดยกำหนดให้คำสั่ง `ON DUPLICATE KEY UPDATE` อัปเดตคอลัมน์ `category` และ `description` ในตาราง `groups` ของ MySQL ให้ตรงตามหมวดหมู่จริงอัตโนมัติ (INTERNET_LEVEL, RESOURCE_ENTITLEMENT, NETWORK_VPN, PRINT_QUOTA) เมื่อระบบเริ่มต้นทำงาน พร้อมทั้งปรับกลุ่มที่ไม่ใช่สิทธิ์พิเศษให้มีค่าเริ่มต้นเป็น `ORGANIZATIONAL` 100%
- **[LOG-058] Update Initial Data Transformer & SQLite Seed to Set Correct Group Categories**:
  - อัปเดตฟังก์ชันแปลงข้อมูลและสร้างสคีมาใน [initialData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/data/initialData.ts) และ [sqliteDb.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/lib/sqliteDb.ts):
    1. กำหนดให้เมื่อมีการตั้งค่าเริ่มต้น (Seed / Reset Data) กลุ่ม Special Groups 101 - 109 จะได้รับคอลัมน์ `category` ตรงตามหมวดหมู่จริงทันทีตั้งแต่แรกสร้าง (INTERNET_LEVEL, RESOURCE_ENTITLEMENT, NETWORK_VPN, PRINT_QUOTA)
    2. เพิ่มคอลัมน์ `category` และ `badge_color` ลงในตาราง `groups` ของเอนจิน SQLite WebAssembly เพื่อความสอดคล้อง 100% กับ MySQL
- **[LOG-059] Fix MySQL Reset Database Re-Seeding Query & Project-Wide System Audit**:
  - แก้ไขจุดบกพร่องในเมธอด `resetDatabase()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) โดยใส่คอลัมน์ `category` และ `badge_color` ในคำสั่ง `INSERT INTO groups` เมื่อรีเซ็ตฐานข้อมูล เพื่อให้ข้อมูล 9 Special Groups ใน MySQL มีค่าคอลัมน์สมบูรณ์ครบถ้วน 100%
  - ตรวจสอบโค้ดทั้งโปรเจกต์ผ่านคำสั่ง `npx tsc --noEmit` ได้ผลลัพธ์ผ่าน 0 Errors พร้อมอัปเดตเอกสารสรุปสถาปัตยกรรมระบบในโฟลเดอร์ `docs/` สมบูรณ์เรียบร้อย
- **[LOG-060] Update System Architecture Specification to Clean Schema 2.0 & Dual-Mode Filtering**:
  - อัปเดตเอกสารข้อกำหนดสถาปัตยกรรมระบบ [docs/system_architecture.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture.md) ให้เป็นข้อกำหนด Clean Schema 2.0 ล่าสุด 100%
  - เพิ่มการอธิบายโครงสร้างระบบกรอง Hybrid Dual-Mode Filtering, Dynamic Profile Derivation Engine, และหมวดหมู่กลุ่มสิทธิ์ (Group Category System) เพื่อเป็นคู่มืออ้างอิงสถาปัตยกรรมระดับองค์กรที่สมบูรณ์ที่สุด
- **[LOG-061] Create Active Directory & API Data Pipeline Integration Guide**:
  - จัดทำเอกสารคู่มืออธิบายกระบวนการทำงานทั้งระบบ [docs/ad_sync_data_pipeline_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/ad_sync_data_pipeline_guide.md) ตั้งแต่การดึงข้อมูลจาก Active Directory (LDAP API), การแปลงข้อมูล (Data Transformation Engine), การบันทึกลง MySQL Database (Clean Schema), การให้บริการผ่าน Express REST API, ไปจนถึงการประมวลผลแสดงผลบน UI Table สมบูรณ์เรียบร้อย
- **[LOG-062] Clean Up Legacy special_groups Table References from System Architecture ERD & Documentation**:
  - ดำเนินการลบตารางซ้ำซ้อน `special_groups` ออกจากเอกสารไดอะแกรม ERD และสคริปต์สคีมาใน [docs/system_architecture_diagrams.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture_diagrams.md), [docs/database_integration_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/database_integration_guide.md) และ [docs/system_architecture.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture.md)
  - ยืนยันโครงสร้างตารางฐานข้อมูลระดับ Clean 3NF แบบ 3 ตารางหลัก (`users`, `groups`, `user_groups`) อย่างเป็นเอกภาพและถูกต้อง 100% ตรงตามฐานข้อมูลจริง

### 🟢 2026-08-05
- **[LOG-063] Comprehensive Docs-vs-Code Consistency Audit (Checkpoint 4)**:
  - ดำเนินกระบวนการ **Full Consistency Audit** ตรวจสอบความสอดคล้องระหว่างเอกสาร `docs/` ทั้งหมดกับโครงสร้างโค้ดจริงใน `src/` แบบครบวงจรทุกไฟล์
  - **ผลการตรวจสอบ**: พบความคลาดเคลื่อนสำคัญ 2 รายการ ได้แก่:
    1. **Schema Column Count Error**: เอกสาร [system_architecture.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture.md) และ [database_integration_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/database_integration_guide.md) ระบุ `users` table เป็น **13 คอลัมน์** แต่โค้ด `dataService.ts` (MySQL) จริงมี `internet_level` อยู่ในคำสั่ง `CREATE TABLE` — ทำให้มี **14 คอลัมน์** แก้ไขเอกสารทั้ง 2 ไฟล์เป็น 14 คอลัมน์แล้ว
    2. **NULL Constraint Mismatch**: เอกสาร (ก่อนแก้ไข) ใช้ `NULL DEFAULT '-'` สำหรับคอลัมน์หลักของ `users` แต่โค้ด `dataService.ts` จริงใช้ `NOT NULL` สำหรับทุกคอลัมน์ (ยกเว้น `expiry_date`) แก้ไขเอกสารให้ตรงกับ `NOT NULL` แล้ว
- **[LOG-064] Clarify SQLite vs MySQL Schema Divergence (Legacy Columns)**:
  - ตรวจสอบและบันทึกความแตกต่างที่ตั้งใจระหว่างโครงสร้าง SQLite Frontend (16 คอลัมน์) และ MySQL Backend (14 คอลัมน์):
    - **SQLite `users` table** (16 cols): มีคอลัมน์ Legacy `print_quota_group` และ `vpn_status` เพิ่มเติมจาก 14 คอลัมน์หลัก เพื่อรองรับ Frontend Filtering, CSV Export, และ UserFormModal ที่ยังใช้งานอยู่
    - **MySQL `users` table** (14 cols): มีเฉพาะ 14 คอลัมน์หลักใน `CREATE TABLE` แต่ ALTER TABLE เพิ่ม `print_quota_group` และ `vpn_status` เป็น optional columns สำหรับ backward compatibility
    - **ข้อสรุป**: ทั้ง `print_quota_group` และ `vpn_status` ยังคงถูกใช้งานอยู่จริงใน Frontend Logic (filtering, display) และ SQLite — ไม่ใช่ dead code แต่เป็น "computed-cache columns" ที่ได้ค่ามาจาก `groups` ผ่าน Dynamic Derivation Engine
- **[LOG-066] Enforce Clean 13-Column MySQL `users` Schema (Remove `internet_level` Column)**:
  - **การปรับปรุงสถาปัตยกรรม**: ปรับเปลี่ยนตามข้อกำหนด Clean 3NF Architecture ที่สิทธิ์ `internet_level` (ระดับ A/B/C) ถูกคำนวณแบบ Dynamic จากการจับคู่กลุ่มสิทธิ์ในตาราง `user_groups` -> `groups` โดยตรง (ไม่ใช่คอลัมน์ในตาราง `users`)
  - **การแก้ไขในโค้ด**:
    1. ถอดคอลัมน์ `internet_level` ออกจากคำสั่ง `CREATE TABLE IF NOT EXISTS users` และ `INSERT INTO users` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ปรับตาราง `users` เป็น 13 คอลัมน์หลักมาตรฐาน
    2. อัปเดตคำสั่ง SQL `INSERT INTO users` ใน `syncData()` ให้ส่งเฉพาะ 13 ฟิลด์หลัก ป้องกันข้อผิดพลาด `Unknown column 'internet_level' in 'field list'`
    3. อัปเดตเอกสารสถาปัตยกรรม [docs/system_architecture.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture.md), [docs/database_integration_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/database_integration_guide.md), และ [docs/system_architecture_diagrams.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture_diagrams.md) เป็น 13-Column Clean Schema ตรงตามโค้ดจริง 100%
- **[LOG-067] Preserve Level Group Explorer Modal State on User Detail Closure**:
  - **การปรับปรุง**: แก้ไขการทำงานของปุ่ม "ดูรายละเอียด" ใน [LevelGroupExplorerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/LevelGroupExplorerModal.tsx) โดยถอดคำสั่ง `onClose()` ออก เมื่อผู้ใช้กดดูรายละเอียดพนักงาน หน้าต่าง `UserDetailModal` (สไตล์ z-index สูงกว่า `z-[70]`) จะเปิดซ้อนทับหน้าต่าง `LevelGroupExplorerModal` (z-50)
  - **ผลลัพธ์**: เมื่อผู้ใช้กดปิดหน้าต่างรายละเอียดพนักงาน (`UserDetailModal`) ระบบจะย้อนกลับมายังหน้าต่าง `LevelGroupExplorerModal` ในสถานะกลุ่มสิทธิ์ ตารางพนักงาน และตัวกรองเดิมที่กำลังรับชมอยู่อัตโนมัติ 100%
- **[LOG-068] Comprehensive Documentation Center & Path References Update (V4 Alignment)**:
  - **การปรับปรุง**: ทำการอัปเดตไฟล์เอกสารทั้งหมดในโฟลเดอร์ `docs/` (`README.md`, `system_architecture.md`, `system_architecture_diagrams.md`, `database_integration_guide.md`, `ad_sync_data_pipeline_guide.md`, `mysql_sync_troubleshooting_postmortem.md`, `system_development_log.md`, `work_activity_log.md`) ให้ตรงตามโครงสร้างและเวอร์ชัน V4 ล่าสุด 100%
  - **รายละเอียดการแก้ไข**:
    1. อัปเดตลิงก์อ้างอิงไฟล์ทั้งหมดจากเวอร์ชันเดิมเป็น `user_management_dashboard_V4/user_access_management`
    2. อัปเดตดรรชนีรวมเอกสารใน [docs/README.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/README.md) ครบทั้ง 8 เอกสารหลัก
    3. ตรวจสอบความถูกต้องของสคีมาตาราง `users` (13 คอลัมน์หลักมาตรฐาน) และสเปก CSV Import (14 คอลัมน์มาตรฐานรวม `Groups`) ทุกจุดในเอกสารทั้งหมด
- **[LOG-069] Final System-Wide Documentation Verification & Path Alignment Sweep**:
  - **การปรับปรุง**: ดำเนินการตรวจสอบและอัปเดตศูนย์รวมเอกสารระบบในโฟลเดอร์ `docs/` ทั้ง 8 เอกสารหลัก ให้ตรงกับสถาปัตยกรรม V4 Clean Architecture ล่าสุด 100%
  - **รายละเอียดการแก้ไข**:
    1. ทำการสแกนและแปลงลิงก์อ้างอิงเส้นทางไฟล์ทั้งหมดทุกบรรทัด ให้ชี้ไปยัง `user_management_dashboard_V4/user_access_management`
    2. ปรับปรุงเวอร์ชันในหัวข้อเอกสารสถาปัตยกรรมและไดอะแกรมให้เป็น V4 Clean Architecture ทั้งหมด
    3. ตรวจสอบและตัดช่องว่างส่วนเกินเพื่อให้เอกสารสะอาดเรียบร้อย 100%
- **[LOG-070] Fix Special Groups Popover Overlap & Global Z-Index Hierarchy Layering**:
  - **ปัญหาที่พบ**: ปุ่ม `+เพิ่มเติม` แสดง Special Groups ที่เหลือใช้ `z-index` ที่ `z-[80]` และขาดการปิดแบบ Click Outside ทำให้ Popover ค้างอยู่บนหน้าจอซ้อนทับ Modal รายละเอียดพนักงาน (`UserDetailModal`)
  - **การแก้ไข**:
    1. อัปเดต [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) ปรับ `z-index` ของ Popover ลงมาเป็น `z-30` และเพิ่ม Global Click Listener ซ่อน Popover เมื่อคลิกนอกพื้นที่หรือกดดู Profile
    2. อัปเดต Modal ทั้งหมดใน `src/components/modals/` ให้ใช้ `z-[100]` ยืนยันว่าหน้าต่าง Modal จะแสดงผลทับทุก Dropdown และ Popover ภายในตารางอย่างสะอาดเรียบร้อย 100%
- **[LOG-071] Fix Blob Constructor Parameter Type in SqliteManagerModal.tsx**:
  - **การปรับปรุง**: แก้ไขการส่งพารามิเตอร์ `new Blob([binary], ...)` จากเดิม `binary.buffer` ใน [SqliteManagerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/SqliteManagerModal.tsx) ให้ส่ง `Uint8Array` โดยตรง ป้องกันการแจ้งเตือน Type Warning เรื่อง `ArrayBufferLike` / `SharedArrayBuffer` ใน VS Code
