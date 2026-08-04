# Database Integration & CSV Specification Guide

คู่มือการตั้งค่าฐานข้อมูล SQLite & MySQL และข้อกำหนดรูปแบบไฟล์ CSV สำหรับการนำเข้าข้อมูล

---

## 🗄️ 1. การตั้งค่าไฟล์คอนฟิกฐานข้อมูล (`.env`)

ไฟล์ `.env` ใน Root Directory ของโปรเจกต์ถูกกำหนดค่าเริ่มต้นดังนี้:

```env
# GEMINI_API_KEY: Required for Gemini AI API calls.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
APP_URL="MY_APP_URL"

# Database Connection Configuration (MySQL / SQLite)
DB_TYPE=sqlite
DB_NAME=user_access_dashboard_data
DB_USER=root
DB_PASS=admin123456
DB_PORT=3306
```

---

## 💻 2. คำสั่งสร้างตารางใน MySQL Workbench (`user_access_dashboard_data`)

หากต้องการสร้างตารางทั้งหมดใน MySQL Workbench ให้เปิด SQL Tab แล้วรันสคริปต์นี้:

```sql
CREATE DATABASE IF NOT EXISTS user_access_dashboard_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE user_access_dashboard_data;

-- 1. ตารางผู้ใช้งาน (users)
CREATE TABLE IF NOT EXISTS users (
  employee_id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  job_title VARCHAR(100) NULL DEFAULT '-',
  department VARCHAR(100) NULL DEFAULT '-',
  company VARCHAR(100) NULL DEFAULT '-',
  device_code VARCHAR(50) NULL DEFAULT '-',
  authority_group VARCHAR(100) NULL DEFAULT '-',
  creation_date VARCHAR(50) NULL DEFAULT '-',
  expiry_date VARCHAR(50) NULL,
  telephone_pass_code VARCHAR(50) NULL DEFAULT '-',
  o365_license VARCHAR(100) NULL DEFAULT 'Microsoft 365 E3'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ตารางกลุ่มสิทธิ์ (groups)
CREATE TABLE IF NOT EXISTS groups (
  group_id INT AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  internet_level VARCHAR(10) NULL,
  is_special TINYINT(1) DEFAULT 0,
  category VARCHAR(50) NULL DEFAULT 'ORGANIZATIONAL',
  badge_color VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ตารางแคตตาล็อกสิทธิ์พิเศษ (special_groups)
CREATE TABLE IF NOT EXISTS special_groups (
  special_group_id INT PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  badge_color VARCHAR(100) NULL,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (special_group_id) REFERENCES groups(group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ตารางเชื่อมความสัมพันธ์หลายต่อหลาย (user_groups)
CREATE TABLE IF NOT EXISTS user_groups (
  employee_id VARCHAR(50) NOT NULL,
  group_id INT NOT NULL,
  PRIMARY KEY (employee_id, group_id),
  FOREIGN KEY (employee_id) REFERENCES users(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ตารางระบบ Metadata
CREATE TABLE IF NOT EXISTS system_metadata (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` TEXT NOT NULL,
  `updated_at` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📊 3. รูปแบบไฟล์ CSV สำหรับการนำเข้าข้อมูล (14-Column Standard Specification)

ระบบใช้รูปแบบ **14 คอลัมน์หลักมาตรฐาน (Normalized AD Groups)** โดยระดับอินเทอร์เน็ต (A/B/C), สถานะ VPN, โควต้าการพิมพ์ และสิทธิ์การเข้าถึงทรัพยากรจะถูกสกัดโดยตรงจากคอลัมน์ **`Groups`**:

| ชื่อคอลัมน์ (Header Name) | ตัวอย่างข้อมูล (Example) | รายละเอียด (Description) |
| :--- | :--- | :--- |
| `Employee ID (รหัสพนักงาน)` | `EMP-88001` | **[Required]** รหัสพนักงาน (Primary Key) |
| `Username (ชื่อผู้ใช้)` | `somchai.p` | **[Required]** ชื่อบัญชีผู้ใช้ Active Directory |
| `Display Name (ชื่อ-นามสกุล)` | `สมชาย ใจดี` | **[Required]** ชื่อและนามสกุลเต็ม |
| `Email (อีเมล)` | `somchai.p@company.co.th` | อีเมลพนักงาน |
| `O365 License (สิทธิ์การใช้งาน O365)` | `Microsoft 365 E5` | ประเภทไลเซนส์ O365 |
| `Job Title (ตำแหน่งงาน)` | `Senior IT Specialist` | ชื่อตำแหน่ง |
| `Department (แผนก)` | `IT` | แผนก/สังกัด |
| `Company (บริษัท)` | `Alpha Group` | บริษัท/องค์กร |
| `Authority Group (กลุ่มสิทธิ์เข้าถึง)` | `Domain Admins` | กลุ่มสิทธิ์บริหาร |
| `Device Code (รหัสอุปกรณ์)` | `DEV-9001` | รหัสเครื่องคอมพิวเตอร์ |
| **`Groups (กลุ่มสิทธิ์/บทบาท)`** | `Internet Level A, VPN Access, Printer Color` | **[Master AD Field]** กลุ่มสิทธิ์ทั้งหมด (คั่นด้วย `,`) |
| `Creation Date (วันสร้างบัญชี)` | `2026-01-15` | วันที่สร้าง (YYYY-MM-DD) |
| `Expiry Date (วันหมดอายุ)` | `2027-01-15` | วันหมดอายุ (หรือ N/A) |
| `Telephone Passcode (รหัสผ่านโทรศัพท์)` | `889001` | รหัส PIN โทรศัพท์ |

