# Enterprise User Access Management (UAM) System - Development & Architecture Log

เอกสารบันทึกสถาปัตยกรรม กระบวนการพัฒนา และประวัติการปรับปรุงแก้ไขระบบ **User Access Management Dashboard**

---

## 📐 1. สถาปัตยกรรมระบบ (System Architecture)

ระบบถูกออกแบบตามหลัก **Unified Enterprise Application Architecture** รองรับการทำงานทั้งบน WebAssembly (WASM Engine), Client-Side Browser Storage และ Node.js Backend Engine

### 1.1 Technology Stack
- **Frontend Framework**: React 19 + TypeScript (SPA)
- **Build Tool & Bundler**: Vite 6 + esbuild
- **Styling & UI**: Tailwind CSS v4 + Lucide React Icons
- **Database Layer**:
  - **SQLite 3 Engine**: ทำงานบน Browser WASM via `sql.js` + Node.js Backend
  - **MySQL 8 Integration**: รองรับการเชื่อมต่อไปยัง MySQL Server (`user_access_dashboard_data`)
- **Backend API Server**: Node.js + Express API Router (`server.ts`)

### 1.2 Structure & Schemas (Database Normalization - 3NF)
- **`users`**: ตารางข้อมูลผู้ใช้งานหลัก (Primary Key: `employee_id`)
- **`groups`**: ตารางกลุ่มสิทธิ์และการเข้าถึง (Primary Key: `group_id`)
- **`user_groups`**: ตารางเชื่อมความสัมพันธ์ แบบ N:M (Foreign Keys: `employee_id`, `group_id`)
- **`system_metadata`**: ตารางบันทึกสถานะและเวอร์ชันของระบบ (`key`, `value`, `updated_at`)

### 1.3 Group Member (Level Group) Data Architecture & Mapping Specification
- **Level Group Standards**:
  - ID `101`: Level A (Full Internet Access)
  - ID `102`: Level B (Standard Corporate Access)
  - ID `103`: Level C (Restricted Access)
- **Dynamic Group Assignment**:
  - **Explicit Groups**: จากตาราง `user_groups` ที่มี `employee_id === u.employee_id`
  - **Implicit Level Groups**: อัตโนมัติตาม `u.internet_level` (A -> 101, B -> 102, C -> 103)
  - **Final Array (`u.groups`)**: ผูกอาร์เรย์กลุ่มสิทธิ์โดยใช้ `Number(g.group_id)` ในการเปรียบเทียบ Type Safety
- **Search & Filtering Logic**:
  - รองรับการค้นหา Search Tokens ครอบคลุม User, ID, Dept, Company, Level, Groups, O365 License, Quota, PIN
  - Access Group Filter รองรับทั้ง `INTERSECTION` และ `UNION`
- **Analytics & Aggregation Principles**:
  - คำนวณผู้ใช้ผ่าน `u.groups.some(g => Number(g.group_id) === targetGroupId)` พร้อมคำนวณ Active vs Expired, O365 Distribution, Department Breakdown

---

## 🛠️ 2. ประวัติการปรับปรุงแก้ไขปัญหาสำคัญ (Key Optimization & Bug Fixes)

### 2.1 ปรับแต่งฐานข้อมูล SQLite ให้รองรับ `user_access_dashboard_data`
- **ปัญหา**: ต้องการกำหนดค่าฐานข้อมูลให้ใช้ SQLite โดยระบุชื่อ DB, User, Pass, Port
- **การแก้ไข**:
  - สร้างและอัปเดตไฟล์ `.env` / `.env.example` กำหนด `DB_TYPE=sqlite`, `DB_NAME=user_access_dashboard_data`, `DB_USER=root`, `DB_PASS=admin123456`, `DB_PORT=3306`
  - อัปเดต `src/backend/services/dataService.ts` ให้โหลดค่าคอนฟิกจาก `.env`
  - เพิ่มปุ่มและหน้าต่าง **Database Connection Health Inspector** (`DbStatusModal.tsx`) บน Navbar เพื่อตรวจสอบ Latency และผลการรัน Query เรียลไทม์

### 2.2 แก้ไขปัญหาข้อมูลคอลัมน์ GROUP MEMBER (LEVEL GROUP) หายเมื่อ Refresh หน้าจอ
- **ปัญหา**: เมื่อผู้ใช้ทำการรีเฟรชเบราว์เซอร์ ข้อมูลในคอลัมน์ GROUP MEMBER หายไปชั่วคราวหรือเปลี่ยนเป็น `-`
- **สาเหตุ**:
  1. State `users`, `groups`, `userGroups` ถูกตั้งค่าเริ่มต้นเป็นค่าว่างก่อนที่ SQLite WASM จะโหลดเสร็จ
  2. ฟังก์ชันดึงป้ายกลุ่มคัดกรองเฉพาะกลุ่มที่มีธง `is_special`
- **การแก้ไข**:
  - ปรับปรุง `src/frontend/hooks/useUserAccessData.ts` ให้โหลดข้อมูลจาก `localStorage` และ SQLite ทันทีในจังหวะ Render แรก
  - ปรับปรุง `src/frontend/hooks/useUserFilters.ts` ให้แนบป้ายระดับอินเทอร์เน็ต `Internet Level A/B/C` ติดตัวผู้ใช้งานเสมอ
  - ปรับปรุง `src/components/UserTable.tsx` ให้แสดงผลป้ายสิทธิ์กลุ่มย่อยของ `user.groups` ทั้งหมดพร้อม Fallback Badge

### 2.3 แก้ไขปัญหา Browser Storage Quota Exceeded (5MB Limit)
- **ปัญหา**: ไม่สามารถโหลดหรือนำเข้าข้อมูล CSV เพิ่มเติมได้ เว้นแต่ต้องกดล้าง Cache ในเครื่อง
- **สาเหตุ**: ไฟล์ไบนารี SQLite WASM Base64 มีขนาดใหญ่กว่า 4MB เมื่อบันทึกลง `localStorage` ร่วมกับข้อมูลอื่นจะเกินโควต้า 5MB ของเบราว์เซอร์ ทำให้ `localStorage.setItem` ล๊อคและโยนข้อผิดพลาด `QuotaExceededError`
- **การแก้ไข**:
  - อัปเดต `src/utils/storage.ts` ให้ทำการล้างคีย์เก่า (`uam_`, `user_access_`) ออกอัตโนมัติเมื่อโควต้าใกล้เต็ม
  - อัปเดต `src/lib/sqliteDb.ts` ให้สลับไปรักษาความสมบูรณ์บน **WASM High Performance Memory** อัตโนมัติเมื่อเกิน 5MB ป้องกันไม่ให้แอปพลิเคชันค้าง
  - เพิ่มฟังก์ชัน `clearAllAppCache()` สำหรับจัดการความจำสำรอง

### 2.5 แก้ไขปัญหา `getGroupBadgeInfo is not defined` (ReferenceError Import Fix)
- **ปัญหา**: หน้าจอแอปพลิเคชันค้างแสดงหน้าต่างข้อผิดพลาด `เกิดข้อผิดพลาดในการโหลดระบบ (getGroupBadgeInfo is not defined)`
- **สาเหตุ**: ฟังก์ชัน `getGroupBadgeInfo` ที่ใช้สร้างป้ายตราสิทธิ์กลุ่มย่อยในคอลัมน์ `GROUP MEMBER` ของ `UserTable.tsx` ไม่ได้ถูกนำเข้า (Import) มาจาก `src/utils/groupHelpers.ts` ทำให้ JavaScript เกิด `ReferenceError`
- **การแก้ไข**:
### 2.6 คัดกรองและจัดระเบียบคอลัมน์ GROUP MEMBER (LEVEL GROUP) เฉพาะ Special Groups
- **การปรับปรุง**: ปรับการแสดงผลในคอลัมน์ `GROUP MEMBER (LEVEL GROUP)` ให้คัดกรองเฉพาะ **Special Groups** ที่กำหนดไว้เท่านั้น (เช่น `Internet Level A/B/C`, `Video Access`, `Communications`, `Free E-mail`, `VPN Access`, `Printer Color/Mono`) โดยคัดกรองกลุ่มแผนกหรือกลุ่มทั่วไปออก
### 2.7 ปรับปรุงการแสดงผล Special Groups ครบทั้ง 9 กลุ่มสิทธิ์ (`specialGroups.ts` & `initialData.ts`)
- **ปัญหา**: ป้ายตราสิทธิ์ในคอลัมน์ `GROUP MEMBER` แสดงผลเฉพาะป้าย `Internet Level B` แต่ป้ายสิทธิ์พิเศษอื่น เช่น `Video Access`, `Communications`, `Free E-mail`, `VPN Access`, `Printer Color`, `Printer Mono` ไม่แสดงผลขึ้นมา
- **สาเหตุ**: 
  1. ใน `INITIAL_GROUPS` มีเพียงกลุ่ม 101, 102, 103 ทำให้กลุ่มสิทธิ์ 104 ถึง 109 ถูกตัดออก
  2. ฟังก์ชัน `isSpecialGroup` ใน `specialGroups.ts` คืนค่า `false` ทันทีเมื่อ `is_special` ไม่ใช่ `true` ส่งผลให้ไม่ถูกดึงมาแสดงผล
- **การแก้ไข**:
  - อัปเดต `INITIAL_GROUPS` ใน `src/data/initialData.ts` ให้ครอบคลุมกลุ่มสิทธิ์หลักครบทั้ง 9 กลุ่ม (101 ถึง 109)
  - ปรับปรุงฟังก์ชัน `isSpecialGroup` และ `getGroupBadgeInfo` ใน `src/constants/specialGroups.ts` ให้ตรวจสอบ `group_id` และคีย์เวิร์ดชื่อกลุ่มอย่างแม่นยำ
### 2.8 กำหนดให้ดึงข้อมูลผ่าน SQLite Database ทางเดียวเท่านั้น (Exclusive Single Source of Truth)
### 2.9 พัฒนาระบบบันทึกข้อมูลลงไฟล์ฐานข้อมูล SQLite จริงในเครื่อง (`user_access_dashboard_data.sqlite`)
- **การปรับปรุง**: ปรับแต่ง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) ให้สร้างและเขียนข้อมูลลงไฟล์ฐานข้อมูล SQLite จริงบนดิสก์ (`user_access_dashboard_data.sqlite`)
- **การทำงาน**: เมื่อมีการ Import CSV หรือเพิ่ม/แก้ไขพนักงาน ระบบจะซิงค์ข้อมูลผ่าน API `/api/db/sync` แล้วบันทึกลงดิสก์ทันที พร้อมเพิ่ม Endpoint `/api/db/download` สำหรับดาวน์โหลดไฟล์ `.sqlite` จริงจากเซิร์ฟเวอร์
### 2.10 พัฒนาระบบสร้างสคริปต์ Sync ข้อมูลพนักงานลง MySQL Workbench (`/api/db/mysql-dump`)
- **การปรับปรุง**: เพิ่มฟังก์ชัน `generateMySqlDumpScript()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) และเปิดบริการผ่าน API Endpoint `/api/db/mysql-dump`
- **ผลลัพธ์**: สามารถดาวน์โหลดหรือนำสคริปต์ SQL ไปวางใน MySQL Workbench แล้วรันสั่งนำเข้าข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงทั้งหมดลงใน MySQL Database `user_access_dashboard_data` ได้ทันที
### 2.11 พัฒนาระบบซิงค์ข้อมูลลง MySQL Database แบบเรียลไทม์อัตโนมัติ (Automatic MySQL Real-Time Sync)
- **การปรับปรุง**: ติดตั้งไดรเวอร์ `mysql2` และพัฒนาฟังก์ชัน `syncToMySqlDatabase()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts)
- **ผลลัพธ์**: ทุกครั้งที่มีการ Import CSV หรือบันทึก/แก้ไขพนักงาน ระบบจะสร้างตารางและเขียนข้อมูลผู้ใช้ กลุ่มสิทธิ์ และตารางเชื่อมลงใน MySQL Server (`user_access_dashboard_data` บน `localhost:3306`) โดยอัตโนมัติ 100% ทำให้การรัน `SELECT * FROM users;` ใน MySQL Workbench แสดงข้อมูลทันที
### 2.12 ปรับแต่งสถาปัตยกรรมระบบเป็น Exclusive MySQL Database Engine (`DB_TYPE=mysql`)
- **ข้อกำหนดผู้ใช้**: กำหนดให้ระบบจัดเก็บบันทึกข้อมูลผ่าน **MySQL Database Server** เป็นเอนจินหลักทางเดียวเท่านั้น (Single Source of Truth)
- **การปรับปรุง**: 
  - อัปเดต `.env` กำหนด `DB_TYPE=mysql`, `DB_HOST=localhost`, `DB_NAME=user_access_dashboard_data`, `DB_USER=root`, `DB_PASS=admin123456`, `DB_PORT=3306`
  - ปรับปรุง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) ให้สร้างตาราง คิวรี และบันทึกข้อมูลพนักงาน กลุ่มสิทธิ์ และการผูกสิทธิ์ตรงไปยัง MySQL Server โดยตรง 100% ปลดระวางการพึ่งพาไฟล์ SQLite
### 2.13 แก้ไขจุดส่งข้อมูล CSV ให้เขียนลง MySQL Database ทันที (`handleImportCSVSuccess`)
- **ปัญหา**: เมื่อกดนำเข้าข้อมูลจากไฟล์ CSV ข้อมูลแสดงบนหน้าเว็บแต่ยังไม่เขียนลงในตาราง `users` ของ MySQL Workbench
- **สาเหตุ**: ฟังก์ชัน `handleImportCSVSuccess` ส่งข้อมูลผ่านการสอบถามจากเอนจิน SQLite WASM Memory ซึ่งอาจส่งอาร์เรย์ว่าง `[]` ไปยัง Backend
- **การแก้ไข**: ปรับปรุง [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/frontend/hooks/useUserAccessData.ts) ให้ส่งก้อนข้อมูลพนักงานและกลุ่มสิทธิ์จากการ Import CSV ยิงตรงเข้า API `/api/db/sync` ของ MySQL Backend ทันที
### 2.14 แก้ไขบั๊ก MySQL Reserved Keyword Syntax Error ในตาราง `groups`
- **ปัญหา**: คำสั่ง SQL ใน MySQL ขัดข้องและโยนข้อผิดพลาด `You have an error in your SQL syntax near 'groups'`
- **สาเหตุ**: ชื่อตาราง `groups` ตรงกับคำสงวน (Reserved Keyword) ของเอนจิน MySQL 8
- **การแก้ไข**: ใส่เครื่องหมาย Backticksครอบชื่อตารางทั้งหมดใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) เช่น `` `users` ``, `` `groups` ``, `` `user_groups` `` ทำให้การสร้างตารางและบันทึกข้อมูลพนักงานจาก CSV สำเร็จ 100%
### 2.15 ปรับปรุง Async Route Handler (`/api/db/sync`) และนำเข้าข้อมูลพนักงานครบถ้วน 60 รายการ
- **การปรับปรุง**: ปรับแต่ง [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/routes/api.ts) ให้ฟังก์ชัน `/api/db/sync` รองรับ `async/await` รอการบันทึกของ `dataService.syncData()` จนเสร็จสิ้นสมบูรณ์
- **ผลลัพธ์**: นำเข้าข้อมูลพนักงานจริงครบถ้วน **60 คน** จากไฟล์ `sqlite_user_master_export_2026-08-03 (1).csv` ลงในตาราง `users` ของ MySQL Database `user_access_dashboard_data` เรียบร้อยแล้ว (ตรวจสอบผ่านคำสั่ง `SELECT COUNT(*) FROM users;` ได้ 60 รายการเต็ม)
### 2.16 จัดทำเอกสารวิเคราะห์สาเหตุปัญหาเชิงลึกและการแก้ไขปัญหา MySQL (Postmortem Document)
- **การปรับปรุง**: จัดสร้างไฟล์เอกสารวิเคราะห์สาเหตุเชิงลึกแยกเฉพาะใน [docs/mysql_sync_troubleshooting_postmortem.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/docs/mysql_sync_troubleshooting_postmortem.md)
- **เนื้อหา**: อธิบายสาเหตุของปัญหา SQL Reserved Keyword `groups`, Payload Timing และแนวทางแก้ไขปรับปรุงยั่งยืน
### 2.17 เพิ่มระบบซิงค์การลบข้อมูลพนักงานและกลุ่มสิทธิ์ลง MySQL Database (`DELETE ... WHERE NOT IN`)
- **ปัญหา**: เมื่อผู้ใช้กดลบพนักงานบนหน้าเว็บ ข้อมูลพนักงานในหน้าเว็บลดลง แต่ใน MySQL Database คำสั่ง `syncData()` ทำเฉพาะ `INSERT ... ON DUPLICATE KEY UPDATE` ข้อมูลที่ถูกลบจึงยังค้างอยู่ใน MySQL Server
- **การแก้ไข**: อัปเดต [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/services/dataService.ts) เพิ่มคำสั่ง `DELETE FROM \`users\` WHERE employee_id NOT IN (?)` และ `DELETE FROM \`groups\` WHERE group_id NOT IN (?)` ส่งผลให้เมื่อผู้ใช้สั่งลบพนักงานรายคน ลบแบบกลุ่ม (Bulk Delete) หรือรีเซ็ตข้อมูล ข้อมูลใน MySQL Database จะถูกลบออกตรงกัน 100%
### 2.18 ปรับปรุงกระบวนการโหลดข้อมูลเริ่มต้นเป็น Read-Only จาก MySQL Server แบบ 100%
- **สาเหตุของข้อสงสัย**: เงื่อนไขโหลดเริ่มต้นเดิมใน `useUserAccessData.ts` ตรวจสอบ `length > 0` หากช่วงเริ่มต้นคิวดึงข้อมูลคืนค่า 0 แถว ระบบจะตกไปทำงานฟังก์ชัน `refreshFromSqlite()` ซึ่งจะส่งก้อนข้อมูลว่าง `[]` ไปสั่ง `DELETE` ใน MySQL Server เกิดเป็นลูปยิงลบข้อมูลเองเมื่อรีเฟรชหน้าเว็บ
- **การแก้ไข**: 
  1. อัปเดต [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/routes/api.ts) ใน Endpoint `/api/users` และ `/api/groups` ให้เรียก `await dataService.loadFromMySql()` โหลดข้อมูลสดตรงจาก MySQL Server ทุกครั้งก่อนส่งออก
  2. อัปเดต [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/frontend/hooks/useUserAccessData.ts) ในฟังก์ชัน `initMySqlEngine()` ให้เป็น Read-Only ปราศจากการยิงสั่งเขียนทับ (`POST /api/db/sync`) ขณะโหลดหน้าเว็บเด็ดขาด
### 2.19 รีสตาร์ตกระบวนการ Backend Server และยืนยันการคืนค่าพนักงาน 60 รายการผ่าน REST API
- **การปรับปรุง**: ทำการยุติ Process เซิร์ฟเวอร์เก่า และสตาร์ตกระบวนการ UAM Server ใหม่เพื่อโหลดโค้ดสถาปัตยกรรม MySQL ล่าสุด
- **ผลลัพธ์**: เมื่อเบราว์เซอร์หรือสคริปต์ยิงคำสั่ง `GET /api/users` และ `GET /api/groups` ระบบส่งคืนก้อนข้อมูลพนักงานสดจาก MySQL Server **จำนวน 60 รายการ** ครบถ้วนทันที ทำให้หน้าเว็บแสดงตารางพนักงาน 60 คนตรงกับ MySQL Workbench 100%
### 2.20 แก้ไขปัญหา Special Groups หายเมื่อรีเฟรชหน้าเว็บ (REST API `/api/user-groups`)
- **ปัญหา**: เมื่อนำเข้า CSV ข้อมูล Special Groups (เช่น Video Access, Communications, Free E-mail, Printer Mono, VPN Access) แสดงผลครบถ้วน แต่เมื่อกดรีเฟรชหน้าเว็บ (F5) คอลัมน์แสดงเฉพาะ Internet Level เท่านั้น
- **สาเหตุ**: ฟังก์ชันโหลดข้อมูลตอนเปิดหน้าเว็บเดิม ดึงเฉพาะ `/api/users` และ `/api/groups` แต่ไม่ได้ดึงตารางผูกสิทธิ์ `/api/user-groups` ทำให้สถานะ React State `userGroups` มีค่าเป็นอาร์เรย์ว่าง `[]`
- **การแก้ไข**: 
  1. เพิ่ม Endpoint `GET /api/user-groups` ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/backend/routes/api.ts) คืนค่าตารางผูกสิทธิ์ 511 รายการจาก MySQL Database Server
  2. อัปเดต [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/src/frontend/hooks/useUserAccessData.ts) ในฟังก์ชัน `initMySqlEngine()` ให้เรียก `fetch('/api/user-groups')` ร่วมด้วย ทำให้การรีเฟรชหน้าเว็บแสดงผลป้าย Special Groups ครบถ้วน 100%
### 2.21 ตั้งค่า Git Repository และซิงค์โค้ดไปยัง GitHub Remote
- **การปรับปรุง**: ริเริ่มสร้างคลังโค้ด `git init`, กำหนดชื่อ Branch หลักเป็น `main`, ผูก Remote Repository เข้ากับ `https://github.com/Deizyn/user_access_management.git`
- **ผลลัพธ์**: คอมมิตและดัน (Push) ซอร์สโค้ดระบบทั้งหมด เอกสารประกอบสถาปัตยกรรม และคู่มือระบบไปยัง GitHub Repository เรียบร้อยแล้ว
### 2.22 จัดทำเอกสาร README.md ใหม่สำหรับ GitHub Repository
- **การปรับปรุง**: ยกร่างเอกสารหน้าแรก [README.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user-management-dashboard/README.md) ใหม่ระดับ Enterprise รองรับการแสดงผลบน GitHub
- **เนื้อหา**: ครอบคลุมภาพรวมระบบ, ฟีเจอร์หลัก (Unified Master Table, Internet Level & Special Groups, MySQL 8 Real-Time Syncing, CSV Import/Export, Analytics View), สถาปัตยกรรม Technology Stack, ขั้นตอนการติดตั้งและรันโปรเจกต์ (`npm run dev`), สคริปต์ SQL ล้างข้อมูลและสอบถามใน MySQL Workbench และดรรชนีเชื่อมโยงไปยังโฟลเดอร์ `docs/`

---

## ⚡ 3. เครื่องมือสำหรับการพัฒนา (Developer Tooling)
- ติดตั้งและตั้งค่า **Superpowers Antigravity Workflow** ในโฟลเดอร์ `.agents/skills` รองรับการพัฒนาแบบ TDD, Brainstorming, Systematic Debugging และ Subagent Execution
