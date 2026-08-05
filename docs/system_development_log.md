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
- **การปรับปรุง**: ปรับแต่ง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้สร้างและเขียนข้อมูลลงไฟล์ฐานข้อมูล SQLite จริงบนดิสก์ (`user_access_dashboard_data.sqlite`)
- **การทำงาน**: เมื่อมีการ Import CSV หรือเพิ่ม/แก้ไขพนักงาน ระบบจะซิงค์ข้อมูลผ่าน API `/api/db/sync` แล้วบันทึกลงดิสก์ทันที พร้อมเพิ่ม Endpoint `/api/db/download` สำหรับดาวน์โหลดไฟล์ `.sqlite` จริงจากเซิร์ฟเวอร์
### 2.10 พัฒนาระบบสร้างสคริปต์ Sync ข้อมูลพนักงานลง MySQL Workbench (`/api/db/mysql-dump`)
- **การปรับปรุง**: เพิ่มฟังก์ชัน `generateMySqlDumpScript()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) และเปิดบริการผ่าน API Endpoint `/api/db/mysql-dump`
- **ผลลัพธ์**: สามารถดาวน์โหลดหรือนำสคริปต์ SQL ไปวางใน MySQL Workbench แล้วรันสั่งนำเข้าข้อมูลพนักงาน กลุ่มสิทธิ์ และตารางเชื่อมโยงทั้งหมดลงใน MySQL Database `user_access_dashboard_data` ได้ทันที
### 2.11 พัฒนาระบบซิงค์ข้อมูลลง MySQL Database แบบเรียลไทม์อัตโนมัติ (Automatic MySQL Real-Time Sync)
- **การปรับปรุง**: ติดตั้งไดรเวอร์ `mysql2` และพัฒนาฟังก์ชัน `syncToMySqlDatabase()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts)
- **ผลลัพธ์**: ทุกครั้งที่มีการ Import CSV หรือบันทึก/แก้ไขพนักงาน ระบบจะสร้างตารางและเขียนข้อมูลผู้ใช้ กลุ่มสิทธิ์ และตารางเชื่อมลงใน MySQL Server (`user_access_dashboard_data` บน `localhost:3306`) โดยอัตโนมัติ 100% ทำให้การรัน `SELECT * FROM users;` ใน MySQL Workbench แสดงข้อมูลทันที
### 2.12 ปรับแต่งสถาปัตยกรรมระบบเป็น Exclusive MySQL Database Engine (`DB_TYPE=mysql`)
- **ข้อกำหนดผู้ใช้**: กำหนดให้ระบบจัดเก็บบันทึกข้อมูลผ่าน **MySQL Database Server** เป็นเอนจินหลักทางเดียวเท่านั้น (Single Source of Truth)
- **การปรับปรุง**: 
  - อัปเดต `.env` กำหนด `DB_TYPE=mysql`, `DB_HOST=localhost`, `DB_NAME=user_access_dashboard_data`, `DB_USER=root`, `DB_PASS=admin123456`, `DB_PORT=3306`
  - ปรับปรุง [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้สร้างตาราง คิวรี และบันทึกข้อมูลพนักงาน กลุ่มสิทธิ์ และการผูกสิทธิ์ตรงไปยัง MySQL Server โดยตรง 100% ปลดระวางการพึ่งพาไฟล์ SQLite
### 2.13 แก้ไขจุดส่งข้อมูล CSV ให้เขียนลง MySQL Database ทันที (`handleImportCSVSuccess`)
- **ปัญหา**: เมื่อกดนำเข้าข้อมูลจากไฟล์ CSV ข้อมูลแสดงบนหน้าเว็บแต่ยังไม่เขียนลงในตาราง `users` ของ MySQL Workbench
- **สาเหตุ**: ฟังก์ชัน `handleImportCSVSuccess` ส่งข้อมูลผ่านการสอบถามจากเอนจิน SQLite WASM Memory ซึ่งอาจส่งอาร์เรย์ว่าง `[]` ไปยัง Backend
- **การแก้ไข**: ปรับปรุง [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้ส่งก้อนข้อมูลพนักงานและกลุ่มสิทธิ์จากการ Import CSV ยิงตรงเข้า API `/api/db/sync` ของ MySQL Backend ทันที
### 2.14 แก้ไขบั๊ก MySQL Reserved Keyword Syntax Error ในตาราง `groups`
- **ปัญหา**: คำสั่ง SQL ใน MySQL ขัดข้องและโยนข้อผิดพลาด `You have an error in your SQL syntax near 'groups'`
- **สาเหตุ**: ชื่อตาราง `groups` ตรงกับคำสงวน (Reserved Keyword) ของเอนจิน MySQL 8
- **การแก้ไข**: ใส่เครื่องหมาย Backticksครอบชื่อตารางทั้งหมดใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) เช่น `` `users` ``, `` `groups` ``, `` `user_groups` `` ทำให้การสร้างตารางและบันทึกข้อมูลพนักงานจาก CSV สำเร็จ 100%
### 2.15 ปรับปรุง Async Route Handler (`/api/db/sync`) และนำเข้าข้อมูลพนักงานครบถ้วน 60 รายการ
- **การปรับปรุง**: ปรับแต่ง [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) ให้ฟังก์ชัน `/api/db/sync` รองรับ `async/await` รอการบันทึกของ `dataService.syncData()` จนเสร็จสิ้นสมบูรณ์
- **ผลลัพธ์**: นำเข้าข้อมูลพนักงานจริงครบถ้วน **60 คน** จากไฟล์ `sqlite_user_master_export_2026-08-03 (1).csv` ลงในตาราง `users` ของ MySQL Database `user_access_dashboard_data` เรียบร้อยแล้ว (ตรวจสอบผ่านคำสั่ง `SELECT COUNT(*) FROM users;` ได้ 60 รายการเต็ม)
### 2.16 จัดทำเอกสารวิเคราะห์สาเหตุปัญหาเชิงลึกและการแก้ไขปัญหา MySQL (Postmortem Document)
- **การปรับปรุง**: จัดสร้างไฟล์เอกสารวิเคราะห์สาเหตุเชิงลึกแยกเฉพาะใน [docs/mysql_sync_troubleshooting_postmortem.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/mysql_sync_troubleshooting_postmortem.md)
- **เนื้อหา**: อธิบายสาเหตุของปัญหา SQL Reserved Keyword `groups`, Payload Timing และแนวทางแก้ไขปรับปรุงยั่งยืน
### 2.17 เพิ่มระบบซิงค์การลบข้อมูลพนักงานและกลุ่มสิทธิ์ลง MySQL Database (`DELETE ... WHERE NOT IN`)
- **ปัญหา**: เมื่อผู้ใช้กดลบพนักงานบนหน้าเว็บ ข้อมูลพนักงานในหน้าเว็บลดลง แต่ใน MySQL Database คำสั่ง `syncData()` ทำเฉพาะ `INSERT ... ON DUPLICATE KEY UPDATE` ข้อมูลที่ถูกลบจึงยังค้างอยู่ใน MySQL Server
- **การแก้ไข**: อัปเดต [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) เพิ่มคำสั่ง `DELETE FROM \`users\` WHERE employee_id NOT IN (?)` และ `DELETE FROM \`groups\` WHERE group_id NOT IN (?)` ส่งผลให้เมื่อผู้ใช้สั่งลบพนักงานรายคน ลบแบบกลุ่ม (Bulk Delete) หรือรีเซ็ตข้อมูล ข้อมูลใน MySQL Database จะถูกลบออกตรงกัน 100%
### 2.18 ปรับปรุงกระบวนการโหลดข้อมูลเริ่มต้นเป็น Read-Only จาก MySQL Server แบบ 100%
- **สาเหตุของข้อสงสัย**: เงื่อนไขโหลดเริ่มต้นเดิมใน `useUserAccessData.ts` ตรวจสอบ `length > 0` หากช่วงเริ่มต้นคิวดึงข้อมูลคืนค่า 0 แถว ระบบจะตกไปทำงานฟังก์ชัน `refreshFromSqlite()` ซึ่งจะส่งก้อนข้อมูลว่าง `[]` ไปสั่ง `DELETE` ใน MySQL Server เกิดเป็นลูปยิงลบข้อมูลเองเมื่อรีเฟรชหน้าเว็บ
- **การแก้ไข**: 
  1. อัปเดต [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) ใน Endpoint `/api/users` และ `/api/groups` ให้เรียก `await dataService.loadFromMySql()` โหลดข้อมูลสดตรงจาก MySQL Server ทุกครั้งก่อนส่งออก
  2. อัปเดต [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ในฟังก์ชัน `initMySqlEngine()` ให้เป็น Read-Only ปราศจากการยิงสั่งเขียนทับ (`POST /api/db/sync`) ขณะโหลดหน้าเว็บเด็ดขาด
### 2.19 รีสตาร์ตกระบวนการ Backend Server และยืนยันการคืนค่าพนักงาน 60 รายการผ่าน REST API
- **การปรับปรุง**: ทำการยุติ Process เซิร์ฟเวอร์เก่า และสตาร์ตกระบวนการ UAM Server ใหม่เพื่อโหลดโค้ดสถาปัตยกรรม MySQL ล่าสุด
- **ผลลัพธ์**: เมื่อเบราว์เซอร์หรือสคริปต์ยิงคำสั่ง `GET /api/users` และ `GET /api/groups` ระบบส่งคืนก้อนข้อมูลพนักงานสดจาก MySQL Server **จำนวน 60 รายการ** ครบถ้วนทันที ทำให้หน้าเว็บแสดงตารางพนักงาน 60 คนตรงกับ MySQL Workbench 100%
### 2.20 แก้ไขปัญหา Special Groups หายเมื่อรีเฟรชหน้าเว็บ (REST API `/api/user-groups`)
- **ปัญหา**: เมื่อนำเข้า CSV ข้อมูล Special Groups (เช่น Video Access, Communications, Free E-mail, Printer Mono, VPN Access) แสดงผลครบถ้วน แต่เมื่อกดรีเฟรชหน้าเว็บ (F5) คอลัมน์แสดงเฉพาะ Internet Level เท่านั้น
- **สาเหตุ**: ฟังก์ชันโหลดข้อมูลตอนเปิดหน้าเว็บเดิม ดึงเฉพาะ `/api/users` และ `/api/groups` แต่ไม่ได้ดึงตารางผูกสิทธิ์ `/api/user-groups` ทำให้สถานะ React State `userGroups` มีค่าเป็นอาร์เรย์ว่าง `[]`
- **การแก้ไข**: 
  1. เพิ่ม Endpoint `GET /api/user-groups` ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) คืนค่าตารางผูกสิทธิ์ 511 รายการจาก MySQL Database Server
  2. อัปเดต [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ในฟังก์ชัน `initMySqlEngine()` ให้เรียก `fetch('/api/user-groups')` ร่วมด้วย ทำให้การรีเฟรชหน้าเว็บแสดงผลป้าย Special Groups ครบถ้วน 100%
### 2.21 ตั้งค่า Git Repository และซิงค์โค้ดไปยัง GitHub Remote
- **การปรับปรุง**: ริเริ่มสร้างคลังโค้ด `git init`, กำหนดชื่อ Branch หลักเป็น `main`, ผูก Remote Repository เข้ากับ `https://github.com/Deizyn/user_access_management.git`
- **ผลลัพธ์**: คอมมิตและดัน (Push) ซอร์สโค้ดระบบทั้งหมด เอกสารประกอบสถาปัตยกรรม และคู่มือระบบไปยัง GitHub Repository เรียบร้อยแล้ว
### 2.22 จัดทำเอกสาร README.md ใหม่สำหรับ GitHub Repository
- **การปรับปรุง**: ยกร่างเอกสารหน้าแรก [README.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/README.md) ใหม่ระดับ Enterprise รองรับการแสดงผลบน GitHub
- **เนื้อหา**: ครอบคลุมภาพรวมระบบ, ฟีเจอร์หลัก (Unified Master Table, Internet Level & Special Groups, MySQL 8 Real-Time Syncing, CSV Import/Export, Analytics View), สถาปัตยกรรม Technology Stack, ขั้นตอนการติดตั้งและรันโปรเจกต์ (`npm run dev`), สคริปต์ SQL ล้างข้อมูลและสอบถามใน MySQL Workbench และดรรชนีเชื่อมโยงไปยังโฟลเดอร์ `docs/`
### 2.23 ปรับปรุง User Profile Modal และเปลี่ยนโครงสร้าง Group Member เป็น 3 บรรทัดพร้อม Popover
- **การปรับปรุง**: 
  1. ลบแท็บและส่วนแสดงผล `Contact & System Profile` ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) ตามความต้องการของผู้ใช้
  2. อัปเดตการแสดงผลในคอลัมน์ `GROUP MEMBER (LEVEL GROUP)` ของ [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) ให้จัดเรียงเป็น 3 บรรทัดแนวตั้ง:
     - **บรรทัดที่ 1**: ป้ายสิทธิ์ Internet Level (Level A / B / C)
     - **บรรทัดที่ 2**: ป้ายสิทธิ์การพิมพ์ Printer (เช่น Printer Color / Printer Mono)
     - **บรรทัดที่ 3**: ปุ่มป้ายสิทธิ์เพิ่มเติม `+เพิ่มเติม (จำนวน)` ซึ่งเมื่อคลิกจะเปิด Popover Card แสดงสิทธิ์ Special Groups ที่เหลือทั้งหมด (*Video Access, Communications, Free E-mail, VPN Access ฯลฯ*)
### 2.24 ปรับโทนสีปุ่มเพิ่มเติม และย้าย M365 License พร้อมปรับไอคอน Device Code ใน User Profile Modal
- **การปรับปรุง**: 
  1. **ปรับโทนสีปุ่มเพิ่มเติม**: เปลี่ยนกรอบและพื้นหลังของปุ่ม `+เพิ่มเติม (จำนวน)` ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) จากโทนสีม่วงเข้มให้เป็น **โทนสีเทาสว่าง/สีจางนุ่มตา (`bg-slate-100/80 text-slate-600 border-slate-200/90`)** เพื่อไม่ให้ตารางดูลายตา
  2. **เปลี่ยนไอคอน Device Code**: ปรับไอคอนหน้าข้อมูล Device Code ในส่วน Primary Contact Details ของ [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) จากรูปสมาร์ตโฟน (`Smartphone`) ให้เป็น **รูปหน้าจอคอมพิวเตอร์ (`Monitor`)**
  3. **ย้ายตำแหน่ง M365 License**: ย้ายข้อมูลสิทธิ์ Microsoft 365 License จากส่วน System Privileges Summary ขึ้นมาจัดเรียงในส่วน **Primary Contact Details** เพื่อความสะดวกและต่อเนื่องในการดูโปรไฟล์ผู้ใช้
### 2.25 ปรับโทนสีป้ายสิทธิ์การพิมพ์ (Printer Badge) ให้เป็นสีเทาเบสเรียบเดียวกันทั้งหมด
- **การปรับปรุง**: ปรับเปลี่ยน Class สีของกลุ่มสิทธิ์การพิมพ์ (Printer Color และ Printer Mono) ใน [specialGroups.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/constants/specialGroups.ts) จากเดิมที่เป็นสีฟ้า/น้ำเงินตัดกัน ให้เป็น **โทนสีเทาสว่างเบสเดียวกันทั้งหมด (`bg-slate-100 text-slate-800 border-slate-200`)** ช่วยให้ตารางข้อมูลพนักงานดูสะอาด สบายตา และไม่ก่อให้เกิดความสับสนหรือตาลายจากการฉูดฉาดของสี
### 2.26 ถอดหน้า Analytics View และปรับรูปแบบการแสดงผลเป็น Table View ทางเดียว
- **การปรับปรุง**: 
  1. ถอดส่วนแสดงผล `AnalyticsOverview.tsx` และ State `viewMode` ออกจาก [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx)
  2. ลบชุดปุ่มสลับมุมมอง (Table View / Analytics View) และ Props ที่เกี่ยวข้องออกจาก [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx)
  3. ปรับแต่ง Type Checking ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) รองรับการตรวจลินต์ `npm run lint` ผ่าน 100%
### 2.27 แก้ไขการตรวจสอบสถานะฐานข้อมูลใน DbStatusModal และอัปเดตชื่อหัวข้อ Navbar
- **การปรับปรุง**: 
  1. ปรับปรุงฟังก์ชัน `runConnectionCheck` ใน [DbStatusModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/DbStatusModal.tsx) ให้จัดการ Error กรณี client WASM memory ไม่ได้ถูก Initialize (ในโหมดที่เชื่อมต่อกับ REST API Engine) อย่างละมุน ไม่ให้โยนข้ามไปแสดงกล่องแดง `DATABASE CONNECTION ERROR`
  2. ยืนยันการเปลี่ยนชื่อหัวข้อบน [Navbar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/Navbar.tsx) เป็น `User Authorization` และจัดรูปแบบการเว้นบรรทัดสโลแกนระบบ
### 2.28 Auto-Initialize และ ซิงค์ข้อมูลลง SQLite WASM ในหน้า SQL Terminal (SqliteManagerModal)
- **การปรับปรุง**: 
  1. อัปเดต `useEffect` และฟังก์ชัน `handleRunSqlQuery` ใน [SqliteManagerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/SqliteManagerModal.tsx) ให้เรียก `getOrInitSqliteDb` และซิงค์ข้อมูล `users`, `groups`, `userGroups` เข้าเอนจิน SQLite WASM memory เสมอเมื่อเปิดหน้าต่างหรือกดปุ่ม Execute SQL
  2. แก้ไขปัญหาป๊อปอัปแจ้งเตือนสีแดง `SQLite database is not initialized.` ในแท็บ `4. SQL Terminal (คำสั่ง SQL)` ทำให้ผู้ใช้สามารถรัน SQL Query (`SELECT`, `GROUP BY` ฯลฯ) ประมวลผลข้อมูลสด 60 รายการได้ทันที 100%
### 2.29 ซิงค์คำสั่งรีเซ็ตข้อมูลลงฐานข้อมูล MySQL / SQLite Server Backend (`/api/db/sync`)
- **การปรับปรุง**: 
  1. อัปเดตฟังก์ชัน `handleResetData` ใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้เรียก `syncToBackendPhysicalFile(INITIAL_USERS, INITIAL_GROUPS, INITIAL_USER_GROUPS)` ยิงก้อนรีเซ็ตตรงเข้า REST API `/api/db/sync`
  2. ทำให้เมื่อผู้ใช้กดปุ่มรีเซ็ตข้อมูล ระบบจะทำการลบข้อมูลพนักงานที่เคยเพิ่ม/นำเข้าใหม่ในตาราง `users`, `groups`, `user_groups` บน MySQL Database Server ออกทั้งหมด คืนค่ากลับไปเป็น Seed เริ่มต้นในตาราง 100%
### 2.30 ปรับปรุง SQL Sync Engine ให้ทำความสะอาดตาราง `user_groups` และอัปเดต React State ทันที
- **การปรับปรุง**: 
  1. แก้ไข `syncData` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) โดยสั่ง `DELETE FROM user_groups;` เคลียร์ความสัมพันธ์เก่าออกทั้งหมดก่อนเขียนค่าใหม่เข้าตาราง ป้องกันปัญหา SQL Syntax Error จากการทำ `NOT IN ()` เมื่อข้อมูลเป็นอาร์เรย์ว่าง `[]`
  2. ปรับปรุง `handleResetData` ใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ให้สั่งลบข้อมูลใน React State ทันทีและ `await` คำสั่งยิงซิงค์ไปยัง MySQL Database Server
### 2.31 พัฒนา Direct Database Reset Endpoint (`POST /api/db/reset`) ลบข้อมูลทุก Row โดยตรง
- **การปรับปรุง**: 
  1. พัฒนาเมธอด `resetDatabase()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) รันคำสั่ง SQL `DELETE FROM user_groups;`, `DELETE FROM users;`, `DELETE FROM groups;` ลบข้อมูลพนักงานและกลุ่มสิทธิ์ทุก Row ออกจากตารางของ MySQL Server โดยตรง
  2. เพิ่ม REST API Route `POST /api/db/reset` ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) และเชื่อมต่อปุ่มกดรีเซ็ตใน [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) เพื่อลบข้อมูลทุก Row บน MySQL Server 100%
### 2.32 แก้ไขปัญหา MySQL Connection Pool Leak (`Too many connections`)
- **การปรับปรุง**: 
  1. แก้ไข `getPool()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) จากการสร้าง connection pool ใหม่ทุกครั้งที่มีการคิวรี เปลี่ยนเป็น Singleton Pattern โดยการใช้ตัวแปร `this.pool` เพื่อนำ Connection Pool เดิมมาใช้งานซ้ำ
  2. ป้องกันข้อผิดพลาด `Too many connections` ซึ่งเคยทำให้คำสั่ง SQL `DELETE` ไม่ถูกส่งไปยัง MySQL Server
  3. ทดสอบเรียก `POST /api/db/reset` และตรวจสอบ `GET /api/users` ผลลัพธ์ยืนยันการลบข้อมูลพนักงานในตารางสำเร็จ 100% (`count: 0`)
### 2.33 ปรับปรุงระบบสกัดระดับอินเทอร์เน็ต (Internet Level Smart Fallback) จากคอลัมน์ Groups
- **การปรับปรุง**: 
  1. อัปเดตฟังก์ชันนำเข้า CSV ใน [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts) กรณีคอลัมน์ `Internet Level` ถูกเว้นว่างไว้ (`""`) ระบบจะตรวจเช็กชื่อกลุ่มสิทธิ์ในคอลัมน์ `Groups` โดยอัตโนมัติ (เช่น `"Internet Level C, Sales Team"`) เพื่อสกัดค่าระดับอินเทอร์เน็ต `A`, `B`, `C` ที่ระบุในชื่อกลุ่ม ก่อนตกไปใช้ค่า Default `'B'`
### 2.34 พัฒนา Normalized Active Directory Groups Engine & ลดจำนวนคอลัมน์ CSV เหลือ 14 คอลัมน์หลัก
- **การปรับปรุง**: 
  1. **ลดคอลัมน์ CSV ซ้ำซ้อน**: ตัดคอลัมน์ `Level Group`, `Internet Level`, `Print Quota Group`, `VPN Status` ออกจากไฟล์ CSV ทำให้คอลัมน์คงเหลือเพียง **14 คอลัมน์หลักมาตรฐาน**
  2. **สกัดข้อมูลจาก Active Directory Groups อัตโนมัติ**: ปรับปรุงเอนจินใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts), [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts) และ [groupHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/groupHelpers.ts) ให้ประมวลผลระดับอินเทอร์เน็ต (A/B/C), สถานะ VPN (Active/Disabled), โควต้าการพิมพ์ (Printer Color/Mono) และทรัพยากรอื่นๆ จากคอลัมน์ **`Groups`** โดยตรง
  3. **เพิ่มตาราง Master Catalog `special_groups` & API Endpoint**: สร้างตาราง `special_groups` ใน MySQL Database และเพิ่ม REST API `GET /api/special-groups` เพื่อให้ระบบนำกฎสิทธิ์พิเศษไปแมปกับกลุ่มสิทธิ์พนักงานอย่างยืดหยุ่นและรองรับการขยายตัวในอนาคต
### 2.35 ปรับปรุงไฟล์เทมเพลต CSV เพิ่มข้อมูลจำลอง 8 แถวครอบคลุมทุกแผนกและสิทธิ์
- **การปรับปรุง**: 
  1. อัปเดต `downloadCSVTemplate` ใน [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts) เพิ่มข้อมูลจำลอง 8 แถวครอบคลุมตำแหน่ง CTO, HR Manager, Financial Controller, Security Specialist, Marketing Lead, Supply Chain, R&D Scientist, Intern
  2. ครอบคลุมการใช้งานทุกระดับสิทธิ์อินเทอร์เน็ต (A/B/C), สถานะ VPN, ปริ้นสี/ขาวดำ, ไลเซนส์ Office 365 (E5/E3/E1) และสิทธิ์กลุ่มพิเศษครบถ้วน
### 2.36 ปรับปรุงเอนจินตัวกรอง Filter Custom Hook ให้สอดคล้องกับสถาปัตยกรรม AD Groups
- **การปรับปรุง**: 
  1. อัปเดต [useUserFilters.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserFilters.ts) เชื่อมต่อฟังก์ชันสกัดค่าสิทธิ์แบบคำนวณสด (`getUserPrimaryInternetLevel`, `getUserVpnStatus`, `getUserPrintQuotaGroup`) กับชุดข้อมูลกลุ่มสิทธิ์ใน `groups`
  2. ทำให้ตัวกรองทุกเมนู (ระดับอินเทอร์เน็ต A/B/C, สถานะ VPN Active/Disabled, โควต้าการพิมพ์ Printer Color/Mono, กลุ่มสิทธิ์เฉพาะ) ทำงานอย่างถูกต้อง 100%
### 2.37 พัฒนาระบบ Hideable Navbar UI Toggle & Floating Restore Pill Button
- **การปรับปรุง**:
  1. อัปเดต [Navbar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/Navbar.tsx) เพิ่มสเตตควบคุมการซ่อน `isHidden`
  2. เพิ่มปุ่ม "ซ่อนเมนู" พร้อมไอคอน `EyeOff` และ `ChevronUp` สำหรับซ่อนส่วนแถบเมนูด้านบนเพื่อเพิ่มพื้นที่การมองเห็นบนหน้าจอ
  3. เพิ่มปุ่มลอย "แสดงแถบเมนู (Show Navbar)" สไตล์ Glassmorphism บริเวณมุมขวาบนเมื่อ Navbar ถูกซ่อนอยู่ เพื่อเปิดคืนค่า Navbar ได้สะดวก
### 2.38 อัปเดตสถาปัตยกรรม Git Branch Release V3 (`user_dashboard_V3`)
- **การปรับปรุง**:
  1. รวมการปรับปรุงทั้งหมดเข้าสู่ Remote Branch `user_dashboard_V3`
  2. อัปเดตเอกสารสถาปัตยกรรมและคู่มือการใช้งาน Git Clone / Push / Branch Management ทั้งหมดในระบบ
### 2.39 ปรับปรุงแม่แบบข้อมูล CSV Template เพิ่มตัวอย่างวันหมดอายุแล้ว (Expired) และใกล้หมดอายุ (Expiring Soon)
- **การปรับปรุง**:
  1. อัปเดตฟังก์ชันดาวน์โหลดแม่แบบ CSV `downloadCSVTemplate` ใน [csvHelpers.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/utils/csvHelpers.ts) เพิ่มข้อมูลพนักงานตัวอย่างจาก 8 แถวเป็น 10 แถว
  2. ครอบคลุมสถานะการหมดอายุ (Expiry Status) ครบทั้ง 4 ประเภทหลัก:
     - **Active (ปกติ)**: เช่น `2027-12-31`, `2028-03-01`, `2029-04-15`
     - **No Expiry (ไม่มีวันหมดอายุ)**: เช่น `N/A`
     - **Expiring Soon (ใกล้หมดอายุภายใน 30 วัน)**: เช่น `2026-08-10`, `2026-08-15`
     - **Expired (หมดอายุแล้ว)**: เช่น `2026-05-31`, `2026-06-30`
### 2.41 พัฒนาระบบ Multi-Token Accumulation รองรับการกรองตาม Token หลายตัวในทุกหมวดหมู่
- **การปรับปรุง**:
  1. อัปเดตเอนจินการจัดการ Token ใน [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx) และ [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx)
  2. เปิดใช้งานระบบ **Multi-Token Accumulation Mode**: เมื่อผู้ใช้อัปเดต Token ใน Token Bar (เช่น เลือก Company หรือ Internet Level เพิ่ม) ระบบจะทำการเก็บสะสม Token เหล่านั้นร่วมกันในหมวดหมู่เดียวกัน เช่น:
     - เมื่อมี Token `Company: Alpha Group` และ `Company: Beta Corp` ระบบจะกรองและแสดงเฉพาะพนักงานจาก 2 บริษัทนี้ออกมา
     - เมื่อมี Token `Internet: Level A` และ `Internet: Level B` ระบบจะแสดงเฉพาะพนักงานระดับ A และ B พร้อมกัน
  3. เมนูดรอปดาวน์ (Dropdown Menu UI) ทำหน้าที่เป็นตัวเลือกปกติ ขณะที่แถบ Token Bar ทำหน้าที่จัดการเงื่อนไขการกรองแบบ Multi-Token Unionได้อย่างแม่นยำ 100%
### 2.42 สถาปัตยกรรม Hybrid Dual-Mode Filtering (แยกพฤติกรรม Dropdown Single-Select กับ Token Field Accumulator)
- **การปรับปรุง**:
  1. แก้ไขและแยกพฤติกรรมการใช้งานตัวกรองอย่างเด็ดขาดเพื่อตอบโจทย์ทั้ง 2 รูปแบบอย่างสมบูรณ์:
     - **รูปแบบที่ 1 (Dropdown & Dashboard Clicks)**: เมื่อผู้ใช้งานเลือกหมวดหมู่จาก Dropdown Menu (`<select>`) หรือคลิกการ์ด KPI บน Dashboard ระบบจะทำหน้าที่เป็น **Single-Select Direct Switch** (สลับเปลี่ยนค่าตัวกรองทันทีใน 1 คลิก เช่น จาก Level A สลับเป็น B โดยไม่ต้องกดปลดเลือก A ก่อน)
     - **รูปแบบที่ 2 (Omni Token Popup & Token Field)**: เมื่อผู้ใช้งานเลือกรายการจาก Token Popup Overlay หรือพิมพ์สร้าง Token ในช่องค้นหา ระบบจะทำหน้าที่เป็น **Multi-Token Accumulator** (เก็บสะสม Token หลายตัวพร้อมกันในหมวดหมู่เดียวกัน เช่น มีทั้ง `Company: Alpha Group` และ `Company: Beta Corp` พร้อมกัน)
  2. เพิ่มชุดฟังก์ชัน `selectSingle...` แยกจาก `toggle...` ใน [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx) และ [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx) ทำให้ทั้งสองระบบทำงานได้อย่างลงตัว ปราศจากการทับซ้อนหรือขัดแย้งกัน 100%
### 2.43 ปรับปรุงปุ่มการ์ด KPI Summary บน Dashboard ให้สลับเลือก Internet Level แบบ Single-Select
- **การปรับปรุง**:
  1. อัปเดต `handleQuickFilter` ใน [App.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/App.tsx) เมื่อผู้ใช้งานกดปุ่ม **Level A / Level B / Level C** บนการ์ด **INTERNET LEVEL** ([KPISummary.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/KPISummary.tsx)) ระบบจะทำหน้าที่เป็น **Single-Select Direct Switch**
  2. เมื่อกด Level A ระบบจะแสดงพนักงานสิทธิ์ A และเมื่อกด Level B ต่อทันที ระบบจะสลับมาแสดงพนักงานสิทธิ์ B ใน 1 คลิกโดยอัตโนมัติ (ไม่เอาค่า A และ B มาสะสมรวมกัน) หากกดที่ปุ่ม Level B ซ้ำอีกครั้ง ระบบจะสลับปลดการกรองออกให้โดยอัตโนมัติ
### 2.44 ปรับปรุงโทนสี Clean Aesthetic สำหรับ POPUP HEADER & CATEGORY TABS ใน FilterBar
- **การปรับปรุง**:
  1. อัปเดตสไตล์สีของส่วน **POPUP HEADER & CATEGORY TABS** ใน [FilterBar.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/FilterBar.tsx):
     - ปรับพื้นหลัง Header เป็น `bg-slate-900` พร้อม `border-b border-slate-800` ที่ให้ความสะอาด ตา และดูเป็นมืออาชีพ
     - ปรับเปลี่ยนโทนสี Category Tabs ฝั่ง Active ให้เป็นโทนสี Indigo โมเดิร์น (`bg-indigo-600 text-white font-extrabold shadow-2xs border border-indigo-500`) สอดคล้องกับธีมสีหลักของแอปพลิเคชัน
     - ปรับเปลี่ยนปุ่ม Tab Inactive ให้เป็น `bg-slate-800/80 text-slate-300 hover:bg-slate-800` อ่านง่าย สบายตา และดู Clean เป็นระเบียบเรียบร้อย
### 2.45 อัปเดตข้อกำหนดสคีมาฐานข้อมูล (Database Specification) ให้ตรงกับโครงสร้างจริงใน MySQL
- **การปรับปรุง**:
  1. อัปเดตไฟล์ [databaseSchemaSpec.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/data/databaseSchemaSpec.ts) ให้ตรงกับโครงสร้างจริงของตาราง `user_access_dashboard_data.users` ใน MySQL 100%:
     - ประกอบด้วย 13 คอลัมน์หลัก: `employee_id` (PRI), `username`, `display_name`, `email`, `job_title`, `department`, `company`, `device_code`, `authority_group`, `creation_date`, `expiry_date`, `telephone_pass_code`, `o365_license`
     - ยืนยันการถอดฟิลด์สิทธิ์ซ้ำซ้อน (`internet_level`, `vpn_status`, `print_quota_group`) ออกจากตาราง `users` เพื่อให้อ่านสิทธิ์แบบ Dynamic ผ่านตาราง `groups` และ `user_groups` อย่างสะอาดและเป็นระเบียบเรียบร้อย
### 2.46 ถอดไอคอน Sparkles บนป้าย Badge หน้าต่างรายละเอียดพนักงาน (UserDetailModal)
- **การปรับปรุง**:
  1. อัปเดต [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) โดยถอดโค้ดแสดงไอคอน `<Sparkles />` ด้านหน้าป้าย Badge ประเภทกลุ่มออก ตามความต้องการของผู้ใช้ เพื่อความ Clean และเป็นระเบียบเรียบร้อยยิ่งขึ้น
### 2.47 จัดรูปแบบ Special Entitlements ใน System Privileges Summary เป็นการ์ดตาราง (Grid Card Format)
- **การปรับปรุง**:
  1. อัปเดตโครงสร้างส่วน **System Privileges Summary** ใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx):
     - นำรายการ **Special Entitlements** (เช่น Video Access, Communications ฯลฯ) มาเรนเดอร์ลงในตาราง Grid ควบคู่กับ Internet Permission, Remote VPN Access และ Print Quota Policy
     - กำหนดให้ใช้การ์ดดีไซน์เดียวกัน 100% (`p-3 rounded-lg bg-slate-50 border border-slate-200/80`) พร้อมไอคอน Sparkles สีอัมพัน (`text-amber-500`) ให้มีความสวยงาม ดูเป็นระเบียบ และสมดุลสอดคล้องกันทั้งหน้าต่าง modal
### 2.48 แมปไอคอนประจำสิทธิ์ (Contextual Icons & Colors) สำหรับการ์ด Special Entitlements
- **การปรับปรุง**:
  1. อัปเดตการแสดงผลไอคอนการ์ดใน [UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx) โดยเพิ่มฟังก์ชัน `getSpecialEntitlementMeta` เพื่อเลือกไอคอนและโทนสีที่สื่อความหมายเฉพาะของแต่ละสิทธิ์:
     - **Video / Media Access**: ไอคอน `<Video />` สื่อถึงมีเดีย/วิดีโอ (สีม่วง `text-purple-600`) พร้อมชื่อ `Media & Video Access`
     - **Communications**: ไอคอน `<MessageSquare />` สื่อถึงการสื่อสาร/แชต (สีฟ้า `text-sky-600`) พร้อมชื่อ `Communications & VoIP`
     - **External Mail**: ไอคอน `<Mail />` สื่อถึงการรับส่งอีเมล (สีส้มอัมพัน `text-amber-600`) พร้อมชื่อ `External Email Privilege`
     - **สิทธิ์พิเศษอื่นๆ**: ไอคอน `<Sparkles />` (สีอินดิโก้ `text-indigo-600`) พร้อมชื่อ `Special Entitlement`
### 2.49 ปรับปรุงระบบซิงค์ข้อมูลหมวดหมู่ Group คอลัมน์ `category` อัตโนมัติใน Backend Data Engine
- **การปรับปรุง**:
  1. อัปเดตคำสั่ง SQL `ON DUPLICATE KEY UPDATE` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts):
     - ซิงค์และอัปเดตค่าคอลัมน์ `category` และ `description` สำหรับ Special Groups (101 - 109) ลงตาราง `groups` ใน MySQL อัตโนมัติเมื่อ Server ทำการเริ่มต้นระบบ (Init Database)
     - กำหนดให้กลุ่มสิทธิ์ Internet เป็น `INTERNET_LEVEL`, กลุ่มสิทธิ์สื่อสาร/มีเดีย/อีเมล เป็น `RESOURCE_ENTITLEMENT`, กลุ่ม VPN เป็น `NETWORK_VPN`, กลุ่มเครื่องพิมพ์เป็น `PRINT_QUOTA` และกลุ่มแผนกทั่วไปที่ไม่ใช่สิทธิ์พิเศษให้เป็น `ORGANIZATIONAL` โดยอัตโนมัติ 100%
### 2.50 กำหนดค่าหมวดหมู่ `category` ในฟังก์ชันสร้างข้อมูลเริ่มต้น (Data Transformer & SQLite Seed)
- **การปรับปรุง**:
  1. อัปเดตฟังก์ชัน `transformAdApiResponseToAppModel` ใน [initialData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/data/initialData.ts) ให้แมปค่า `category` และ `badge_color` สำหรับ Special Groups (101 - 109) จาก `DEFAULT_SPECIAL_GROUPS_CONFIG` ทันทีเมื่อสร้างข้อมูลเริ่มต้น หรือเมื่อกด Reset Data
  2. อัปเดตโครงสร้างสคีมาและคำสั่งบันทึก/ดึงข้อมูลใน [sqliteDb.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/lib/sqliteDb.ts) ให้รองรับคอลัมน์ `category` และ `badge_color` ในตาราง `groups` สอดคล้องกับ MySQL 100%
### 2.51 แก้ไขคำสั่ง Re-Seeding ใน resetDatabase() & ตรวจสอบคุณภาพระบบทั้งโปรเจกต์ (Full Project Review Audit)
- **การปรับปรุง**:
  1. แก้ไขคำสั่ง `INSERT INTO groups` ในเมธอด `resetDatabase()` ของ [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) โดยเพิ่มการบันทึกคอลัมน์ `category` และ `badge_color` เมื่อกดรีเซ็ตฐานข้อมูลผ่าน API หรือปุ่มบน UI
  2. ดำเนินการตรวจสอบคุณภาพโค้ด สถาปัตยกรรมระบบ และระบบประเภทข้อมูล (Type Check) ทั้งโปรเจกต์ด้วยคำสั่ง `npx tsc --noEmit` ได้ผลลัพธ์ผ่าน 0 Errors สมบูรณ์แบบ 100%
### 2.52 อัปเดตเอกสารข้อกำหนดสถาปัตยกรรมระบบ (System Architecture Specification 2.0)
- **การปรับปรุง**:
  1. อัปเดตเอกสาร [docs/system_architecture.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture.md) ให้เป็นข้อกำหนด Clean Schema 2.0 ล่าสุด 100%
  2. สรุปโครงสร้าง **14 คอลัมน์** ของตาราง `users` (รวม `internet_level`), โครงสร้างหมวดหมู่สิทธิ์ (Group Category System), สถาปัตยกรรมระบบกรอง Hybrid Dual-Mode Filtering และ Dynamic Profile Derivation Engine ไว้อย่างครบถ้วนและสมบูรณ์แบบ
### 2.53 จัดทำเอกสารคู่มือ Active Directory & API Data Pipeline Integration Guide
- **การปรับปรุง**:
  1. สร้างเอกสารคู่มือ [docs/ad_sync_data_pipeline_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/ad_sync_data_pipeline_guide.md) อธิบายกระบวนการนำเข้าข้อมูล 5 ขั้นตอน (Active Directory LDAP Fetch ➔ Data Transformation Engine ➔ MySQL Clean 3NF Schema ➔ Express REST API Endpoints ➔ Frontend Dynamic Calculation & Table UI) พร้อม Mermaid Architecture Diagram แสดงผังการทำงานชัดเจน 100%
### 2.54 ปรับปรุงเอกสารไดอะแกรมและสคีมา Clean 3NF ปลดตารางซ้ำซ้อน special_groups ออก 100%
- **การปรับปรุง**:
  1. แก้ไขและปรับปรุงเอกสารไดอะแกรม ERD ใน [docs/system_architecture_diagrams.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture_diagrams.md) โดยปลดตาราง `special_groups` ออกคงเหลือตารางสัมพันธ์ 3NF แท้จริง 3 ตารางหลัก (`users`, `groups`, `user_groups`)
  2. อัปเดตสคริปต์ SQL DDL ใน [docs/database_integration_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/database_integration_guide.md) และข้อกำหนดสถาปัตยกรรมใน [docs/system_architecture.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_architecture.md) ให้เป็นไปตามโครงสร้างยุบรวมตารางเดียว (Single-Table Consolidated Group Architecture) ตรงตามระบบจริง 100%
### 2.55 Docs-vs-Code Full Consistency Audit (2026-08-05, Checkpoint 4)
- **การตรวจสอบ**: ทำกระบวนการ Audit ตรวจสอบทุกไฟล์เอกสารใน `docs/` เทียบกับโค้ดจริงทั้งโปรเจกต์
- **ผลการแก้ไข**:
  1. **[system_architecture.md]** อัปเดตหัวข้อ Table 2 จาก `13-Column Schema` เป็น `14-Column Schema` และเพิ่มคอลัมน์ `internet_level` ใน SQL DDL
  2. **[database_integration_guide.md]** อัปเดต DDL ของ users table ให้ตรงกับโค้ด `dataService.ts` จริง: เปลี่ยน `NULL DEFAULT '-'` เป็น `NOT NULL`, เพิ่ม `internet_level` และแก้เลขลำดับ comment `-- 4.` (ก่อนหน้าเป็น `-- 5.`)
  3. **[system_architecture_diagrams.md]** เพิ่ม `internet_level` field ใน ERD Mermaid Diagram ของ entity `users`
  4. **[work_activity_log.md]** เพิ่ม LOG-063 และ LOG-064 บันทึกผล Audit และการชี้แจงความแตกต่างระหว่าง SQLite (16 cols) และ MySQL (14 cols)
- **สถานะ**: เอกสารทั้ง 4 ไฟล์ตรงกับโครงสร้างโค้ดจริง 100% ✅

### 2.56 ถอดคอลัมน์ `internet_level` ออกจากตาราง `users` ให้เป็นไปตาม 13-Column Clean Schema 3NF
- **การปรับปรุง**:
  1. ยืนยันสถาปัตยกรรม Clean 3NF Schema โดยกำหนดให้ตาราง `users` มีเฉพาะ **13 คอลัมน์หลักมาตรฐาน** (ถอด `internet_level` ออกจากตาราง `users` ใน MySQL)
  2. ระดับอินเทอร์เน็ต (A/B/C) จะถูกอ่านและประมวลผลแบบ Dynamic ใน Backend/Frontend จากการจับคู่กลุ่มสิทธิ์ในตาราง `user_groups` -> `groups` โดยไม่ต้องมีคอลัมน์เก็บซ้ำซ้อนในตาราง `users`
  3. แก้ไขคำสั่ง `INSERT INTO users` ใน `syncData()` ของ [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) ให้เหลือ 13 ฟิลด์ ป้องกันข้อผิดพลาด `Unknown column 'internet_level' in 'field list'` (Error 1054)
  4. อัปเดตเอกสารระบบทั้งหมด (`docs/system_architecture.md`, `docs/database_integration_guide.md`, `docs/system_architecture_diagrams.md`) ให้เป็น 13 คอลัมน์ตรงตามโครงสร้างฐานข้อมูลจริง 100%
### 2.57 ปรับปรุงการคงสถานะ Level Group Explorer Modal เมื่อปิดหน้าต่างรายละเอียดพนักงาน
- **การปรับปรุง**:
  1. แก้ไขปุ่ม "ดูรายละเอียด" ในหน้าต่าง [LevelGroupExplorerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/LevelGroupExplorerModal.tsx) โดยถอดคำสั่ง `onClose()` ออก
  2. เมื่อคลิกดูรายละเอียดพนักงาน หน้าต่าง `UserDetailModal` (ที่ตั้งค่า `z-index` ไว้ที่ `z-[70]`) จะเปิดขึ้นมาแสดงซ้อนทับหน้าต่าง `LevelGroupExplorerModal` (`z-50`)
  3. เมื่อผู้ใช้กดปิดหน้าต่างรายละเอียดพนักงาน `UserDetailModal` หน้าต่าง `LevelGroupExplorerModal` จะคงเปิดอยู่ พร้อมแสดงกลุ่มสิทธิ์ ตารางรายชื่อ และตัวกรองเดิมที่เพิ่งเปิดดูอยู่ล่วงหน้าโดยไม่ต้องค้นหาใหม่
### 2.58 ดำเนินการอัปเดตศูนย์รวมเอกสารระบบทั้งหมด (Full System Documentation V4 Audit & Sweep)
- **การปรับปรุง**:
  1. ดำเนินการตรวจสอบและอัปเดตเอกสารทั้งหมดในโฟลเดอร์ `docs/` ทั้ง 8 ไฟล์ ให้ตรงตามสถาปัตยกรรม V4 Clean Architecture ล่าสุด
  2. แก้ไขลิงก์อ้างอิงไฟล์และเส้นทางไดเรกทอรีจากเวอร์ชันเก่าเป็น `user_management_dashboard_V4/user_access_management` ทุกจุด
  3. อัปเดตดรรชนีรวมเอกสารใน [docs/README.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/README.md) ครบถ้วนทั้ง 8 เอกสาร
  4. ยืนยันสเปกตาราง `users` (13 คอลัมน์หลักมาตรฐาน) และสเปก CSV Import (14 คอลัมน์มาตรฐานรวม `Groups`) อย่างเป็นเอกภาพ 100%
- **สถานะ**: อัปเดตศูนย์รวมเอกสารระบบทั้งหมดสมบูรณ์เรียบร้อย 100% ✅

### 2.59 แก้ไขปัญหาการแสดงผล Popover สิทธิ์เพิ่มเติม (+เพิ่มเติม) ซ้อนทับกับ Modal รายละเอียดพนักงาน
- **การปรับปรุง**:
  1. เพิ่ม `useEffect` Event Listener สำหรับ Click Outside บน `document` ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) ให้ซ่อน Popover อัตโนมัติเมื่อคลิกพื้นที่อื่นบนหน้าจอ
  2. ปรับลด `z-index` ของ Special Groups Popover ใน [UserTable.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/UserTable.tsx) จาก `z-[80]` ลงมาเป็น `z-30`
  3. ปรับเพิ่ม `z-index` ของ Modal ทั้งหมด ([UserDetailModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserDetailModal.tsx), [UserFormModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/UserFormModal.tsx), [LevelGroupExplorerModal.tsx](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/components/modals/LevelGroupExplorerModal.tsx), ฯลฯ) ขึ้นเป็น `z-[100]` เพื่อให้ Modal แสดงผลทับทุกส่วนประกอบในหน้าเว็บอย่างถูกต้อง 100%
  4. เพิ่มคำสั่ง `setOpenPopoverUserId(null)` เมื่อผู้ใช้กดปุ่ม "ดู Profile"
- **สถานะ**: แก้ไขปัญหาสกรีนซ้อนทับเรียบร้อย 100% ✅

---


---

---

## ⚡ 3. เครื่องมือสำหรับการพัฒนา (Developer Tooling)
- ติดตั้งและตั้งค่า **Superpowers Antigravity Workflow** ในโฟลเดอร์ `.agents/skills` รองรับการพัฒนาแบบ TDD, Brainstorming, Systematic Debugging และ Subagent Execution
