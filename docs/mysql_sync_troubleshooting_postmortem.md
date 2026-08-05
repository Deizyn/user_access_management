# 📄 รายงานวิเคราะห์สาเหตุเชิงลึกและการแก้ไขปัญหาการซิงค์ข้อมูลลง MySQL Workbench
> **เอกสารรายงานย่อย (Dedicated Postmortem & Troubleshooting Guide)**  
> **วันจัดทำ**: 3 สิงหาคม 2026  
> **เป้าหมาย**: อธิบายสาเหตุเชิงลึกของปัญหาข้อมูลไม่ขึ้น / ขึ้นไม่ครบใน MySQL Workbench พร้อมแนวทางแก้ไขยั่งยืน

---

## 📌 1. ภาพรวมของปัญหา (Issue Overview)

ขณะทำการพัฒนาเปลี่ยนสถาปัตยกรรมระบบเป็น **Exclusive MySQL Database Server (`user_access_dashboard_data` บน `localhost:3306`)** พบปัญหาดังนี้:
1. เมื่อทำการนำเข้าไฟล์ CSV บนหน้าเว็บ ข้อมูลพนักงานแสดงบนตารางหน้าเว็บครบถ้วน แต่เมื่อเปิดโปรแกรม **MySQL Workbench** แล้วรันคำสั่ง `SELECT * FROM users;` กลับพบข้อมูลเป็น **0 แถว (NULL / Empty)**
2. มีบางจังหวะที่พบข้อมูลเพียง **1 รายการ** (รหัส `AICO10000101` - Somchai Pattana) ซึ่งเป็นข้อมูลทดสอบชั่วคราวจากสคริปต์ แต่ข้อมูลจริง 60 คนจากไฟล์ CSV ยังไม่ยอมเขียนลงตาราง MySQL

---

## 🔍 2. วิเคราะห์สาเหตุหลัก 3 ประการ (Root Cause Analysis)

### 🚨 สาเหตุที่ 1: ปัญหาคำสงวนของ MySQL 8.0 (MySQL Reserved Keyword Conflict - `groups`)
* **พฤติกรรมปัญหา**: ในเอนจิน MySQL 8.0 คำว่า `groups` ถูกกำหนดให้เป็น **SQL Reserved Keyword** (คำสงวนของระบบภาษา SQL)
* **ข้อผิดพลาด**: คำสั่ง SQL เดิมใน `dataService.ts` เขียนว่า:
  ```sql
  CREATE TABLE IF NOT EXISTS groups (...);
  SELECT COUNT(*) as count FROM groups;
  INSERT INTO groups (group_id, group_name) VALUES (...);
  ```
* **ผลกระทบ**: เมื่อเอนจิน MySQL เจอคำว่า `groups` โดยไม่มีเครื่องหมาย Backticks (`` `groups` ``) ครอบ เอนจินจะโยนข้อผิดพลาด Syntax Error ทันที:
  > `SyntaxError: You have an error in your SQL syntax near 'groups'`
  ทำให้ฟังก์ชัน `initMySqlDatabase()` และ `syncData()` ทำงานล้มเหลวกลางคัน ส่งผลให้คำสั่ง `INSERT INTO users` ถูกยกเลิก (Rollback) ข้อมูลผู้ใช้จึงยังไม่ถูกเขียนลงดิสก์

---

### 🚨 สาเหตุที่ 2: ปัญหา Timing Payload และ Async Execution ใน Express Route
* **พฤติกรรมปัญหา**: Endpoint `/api/db/sync` ใน [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) เดิมยิงฟังก์ชัน `dataService.syncData()` แบบ Synchronous โดยไม่ได้ใส่ `async/await`
* **ผลกระทบ**: Express API ตอบกลับเบราว์เซอร์ไปก่อนที่ MySQL Connection Pool จะประมวลผลคำสั่ง `INSERT` ข้อมูลพนักงาน 60 คนลงตารางดิสก์เสร็จสมบูรณ์ และหาก Frontend ส่งก้อนข้อมูลว่าง `[]` มาเนื่องจากการสอบถามจาก SQLite WASM ความจำเบราว์เซอร์ล้มเหลว MySQL ก็จะถูกสั่งเขียนทับด้วยอาร์เรย์ว่าง `[]` ตามไปด้วย

---

### 🚨 สาเหตุที่ 3: ปัญหา Cache ในเบราว์เซอร์ (Old Bundle In-Memory)
* **พฤติกรรมปัญหา**: หน้าจอเบราว์เซอร์ที่เปิดค้างไว้อาจรันไฟล์ JavaScript บันเดิลเดิมก่อนที่สคริปต์ Backend จะอัปเดต
* **ผลกระทบ**: เมื่อผู้ใช้กดปุ่ม **Import CSV** หน้าจอเดิมจึงเรียกใช้ฟังก์ชัน `refreshFromSqlite()` แบบเก่า ทำให้ยิงเฉพาะ payload ว่างเปล่าไปให้ MySQL Server

---

## 🛠️ 3. การดำเนินการแก้ไขและป้องกันยั่งยืน (Resolution & Implementation)

### ✅ การแก้ไขที่ 1: ครอบเครื่องหมาย Backticks บนชื่อตาราง SQL ทุกจุด
อัปเดตไฟล์ [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) โดยครอบชื่อตารางและชื่อคอลัมน์ด้วย Backticks (`` ` ``) ทั้งหมด:
```sql
CREATE TABLE IF NOT EXISTS `users` (...);
CREATE TABLE IF NOT EXISTS `groups` (...);
CREATE TABLE IF NOT EXISTS `user_groups` (...);

SELECT COUNT(*) as count FROM `groups`;
INSERT INTO `groups` (group_id, group_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE group_name=VALUES(group_name);
```

### ✅ การแก้ไขที่ 2: ปรับปรุง Async Route Handler & Direct CSV Payload
1. อัปเดต [api.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/routes/api.ts) ให้ `/api/db/sync` เป็น `async/await`:
   ```typescript
   apiRouter.post('/db/sync', async (req: Request, res: Response) => {
     const { users, groups, userGroups } = req.body;
     await dataService.syncData(users, groups, userGroups);
     res.json({ success: true, count: users.length });
   });
   ```
2. อัปเดต [useUserAccessData.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/frontend/hooks/useUserAccessData.ts) ในฟังก์ชัน `handleImportCSVSuccess` ให้ส่งก้อนข้อมูล `importedUsers` ยิงตรงเข้า API ยืนยันการลงดิสก์ทันที

### ✅ การแก้ไขที่ 3: เพิ่มคำสั่งลบข้อมูลพนักงานที่ถูกลบออกจากดิสก์ (`DELETE ... WHERE NOT IN`)
1. **ปัญหา**: เดิมคำสั่ง `syncData()` ใน [dataService.ts](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/src/backend/services/dataService.ts) มีเพียงคำสั่ง `INSERT ... ON DUPLICATE KEY UPDATE` เมื่อผู้ใช้สั่งลบพนักงานบนเว็บ ข้อมูลพนักงานใน MySQL Workbench จึงยังคงค้างอยู่
2. **การแก้ไข**: เพิ่มคำสั่งลบพนักงานและกลุ่มสิทธิ์ที่ไม่มีอยู่ในรายการอัปเดตปัจจุบัน:
   ```sql
   DELETE FROM `user_groups` WHERE employee_id NOT IN (?);
   DELETE FROM `users` WHERE employee_id NOT IN (?);
   DELETE FROM `groups` WHERE group_id NOT IN (?);
   ```
   ทำให้การลบพนักงานรายคน (Single Delete), การลบแบบเลือกหลายคน (Bulk Delete) หรือการรีเซ็ตข้อมูล มีผลลัพธ์ลบตรงกันกับ MySQL Database Server ทันที 100%

---

## 📊 4. ผลการพิสูจน์ความถูกต้อง (Verification Results)

1. **การตรวจสอบจำนวนแถวใน MySQL Workbench**:
   ```sql
   USE user_access_dashboard_data;
   SELECT COUNT(*) FROM users;
   ```
   **ผลลัพธ์**: ได้ค่า **60 แถว** ครบถ้วน 100%

2. **การตรวจสอบข้อมูลพนักงานจริง**:
   ```sql
   SELECT employee_id, username, display_name, email, job_title, department FROM users LIMIT 5;
   ```
   **ผลลัพธ์**: แสดงข้อมูลพนักงานจริง เช่น:
   - `AAT10000111` | `anan.s` | Anan Sukprasert | Metrology Inspector | qa
   - `AF10000106` | `chaiwat.k` | Chaiwat Kijja | Manufacturing Specialist | assembly
   - `AF10000110` | `yuttana.s` | Yuttana Sricharoen | Senior Accountant | finance

---

## 📁 5. ดรรชนีไฟล์เอกสารระบบที่เกี่ยวข้อง
- **บันทึกการพัฒนาระบบหลัก**: [docs/system_development_log.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/system_development_log.md)
- **บันทึกประวัติการทำงาน**: [docs/work_activity_log.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/work_activity_log.md)
- **คู่มือโครงสร้างฐานข้อมูล**: [docs/database_integration_guide.md](file:///c:/Users/aapico.intern07/Documents/user_management_dashboard/user_management_dashboard_V4/user_access_management/docs/database_integration_guide.md)
