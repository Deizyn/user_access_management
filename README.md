# 🛡️ User Access Management (UAM) Dashboard

> **Enterprise-grade User Access Management & Security Group Authorization Dashboard**  
> Powered by **React 19**, **TypeScript**, **Vite 6**, **Tailwind CSS v4**, and **MySQL 8 Database Engine**.

---

## 📋 Overview

**User Access Management (UAM) Dashboard** เป็นระบบบริหารจัดการสิทธิ์พนักงาน (Identity and Access Management) ระดับองค์กร ออกแบบขึ้นเพื่อตอบโจทย์การจัดการผู้ใช้งาน สิทธิ์อินเทอร์เน็ต (Internet Level Groups A/B/C) สิทธิ์การเข้าถึงระบบเฉพาะทาง (Special Access Groups) สถานะ VPN สิทธิ์การพิมพ์งาน และสิทธิการใช้งาน Microsoft 365 อย่างเป็นระบบ

ระบบเชื่อมต่อตรงกับ **MySQL 8 Database Server** รองรับการซิงค์ข้อมูลสองทาง (2-Way Full Real-Time Synchronization) ทั้งการดึงข้อมูลสด (Read-Only Fetching), การเขียนบันทึก (Upsert), การนำเข้าไฟล์ CSV (Bulk Import) และการลบข้อมูลเรียลไทม์ (Real-Time Deletion Syncing)

---

## ⚡ Key Features

- 👥 **Unified Master User Table**: ตารางจัดการพนักงานแบบศูนย์กลาง รองรับการค้นหาแบบ Multi-token, การกรองหลายมิติ (Filter Bar), การจัดเรียง (Sorting), การแบ่งหน้า (Pagination) และการเปิด/ปิดคอลัมน์ (Column Toggles)
- 🛡️ **Dual Level & Special Access Group Badges**:
  - **Internet Level Groups**: กำหนดระดับสิทธิ์อัตโนมัติ (Level A - 101, Level B - 102, Level C - 103)
  - **Special Access Groups**: สิทธิ์พิเศษ 9 กลุ่ม (Video Access, Communications, Free E-mail, Printer Mono, Printer Color, VPN Access ฯลฯ)
- 💾 **MySQL 8 Exclusive Database Engine**:
  - เชื่อมต่อผ่าน Node.js Connection Pool (`mysql2/promise`)
  - รองรับ Atomic Upsert (`ON DUPLICATE KEY UPDATE`)
  - ลบข้อมูลสอดคล้องกันเรียลไทม์ (`DELETE FROM users WHERE employee_id NOT IN (...)`)
  - ครอบชื่อตารางด้วยเครื่องหมาย Backticks (`` `groups` ``) แก้ปัญหา SQL Reserved Keyword ใน MySQL 8
- 📥 **CSV Bulk Import & Export**: นำเข้าไฟล์พนักงานพร้อมกัน 60+ รายการ พร้อมระบบตรวจสอบคอลัมน์ แมปกลุ่มสิทธิ์อัตโนมัติ และเขียนบันทึกลงดิสก์ MySQL ทันที
- 📊 **Interactive Analytics View**: มุมมองการวิเคราะห์สถิติ สรุปสัดส่วนสิทธิ์ Internet Level, สถิติผู้ใช้งาน VPN Active, สถิติแยกตามบริษัท/แผนก และกลุ่มการพิมพ์
- 🛠️ **Built-in Developer & DB Tools**:
  - **Data & SQLite Center**: หน้าต่างจัดการ Schema SQL Console และ Export/Import
  - **Level Group Explorer**: หน้าต่างสำรวจสมาชิกกลุ่มสิทธิ์และแผนกในรูปแบบ Modal

---

## 🏗️ Technology Stack

| Layer | Technology / Library |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript (Single Page Application) |
| **Build Tool & Bundler** | Vite 6 + esbuild |
| **Styling & UI Components** | Tailwind CSS v4 + Lucide React Icons |
| **Backend API Server** | Node.js + Express API Router (`server.ts`) |
| **Database Engine** | MySQL 8.0 Server (`user_access_dashboard_data`) + SQLite 3 WASM (`sql.js`) |
| **Database Driver** | `mysql2/promise` with Connection Pooling |

---

## 🚀 Getting Started

### 1. Prerequisites (ข้อกำหนดก่อนการติดตั้ง)
- **Node.js**: v18.0.0 ขึ้นไป
- **MySQL Server**: v8.0 ขึ้นไป (เปิดบริการบน `localhost:3306`)

### 2. Environment Configuration (`.env`)
สร้างหรือตรวจสอบไฟล์ `.env` ที่โฟลเดอร์หลักของโปรเจกต์:

```env
# Server Config
PORT=3000

# Database Provider Selection (mysql | sqlite)
DB_TYPE=mysql

# MySQL Server Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=user_access_dashboard_data
DB_USER=root
DB_PASS=admin123456
```

### 3. Installation & Local Development (ติดตั้งและสั่งรัน)

```bash
# 1. ติดตั้ง Dependencies ทั้งหมด
npm install

# 2. สั่งรันเซิร์ฟเวอร์สำหรับพัฒนา (Vite + Express Backend)
npm run dev
```

เปิดเบราว์เซอร์แล้วเข้าใช้งานที่: `http://localhost:3000`

---

## 🗄️ MySQL Database Setup & Queries

### 1. การสร้าง Database ใน MySQL Workbench
เปิดโปรแกรม **MySQL Workbench** แล้วรันคำสั่ง:

```sql
CREATE DATABASE IF NOT EXISTS user_access_dashboard_data DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE user_access_dashboard_data;
```

### 2. คำสั่งตรวจสอบข้อมูล (Verification Queries)

```sql
USE user_access_dashboard_data;

-- เช็คจำนวนพนักงานทั้งหมดใน MySQL Database Server (ต้องได้ 60 แถวเมื่อ Import CSV)
SELECT COUNT(*) FROM `users`;

-- เช็คจำนวนกลุ่มสิทธิ์ทั้งหมด
SELECT COUNT(*) FROM `groups`;

-- เช็ครายการความสัมพันธ์ผูกสิทธิ์พนักงาน
SELECT COUNT(*) FROM `user_groups`;
```

### 3. คำสั่งล้างข้อมูลเพื่อเริ่มทดสอบใหม่ (Clean Slate Script)

```sql
USE user_access_dashboard_data;

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `user_groups`;
TRUNCATE TABLE `users`;

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

SELECT COUNT(*) AS total_users FROM `users`;
```

---

## 📁 Repository Structure

```
user-management-dashboard/
├── .agents/                 # Superpowers Antigravity Agent Skill Suite
├── docs/                    # Mandatory System & Architecture Documentation
│   ├── system_development_log.md        # บันทึกประวัติการพัฒนาและแก้ไขระบบทั้งหมด
│   ├── work_activity_log.md            # บันทึกกิจกรรมการทำงานรายวัน (LOG-001 ถึง LOG-027)
│   ├── mysql_sync_troubleshooting_postmortem.md  # รายงานวิเคราะห์สาเหตุเชิงลึกปัญหา MySQL
│   ├── database_integration_guide.md    # คู่มือสถาปัตยกรรมและฐานข้อมูล
│   └── README.md                        # สรุปภาพรวมเอกสารหมวด docs/
├── src/
│   ├── backend/             # Express API Server & MySQL Data Service Layer
│   │   ├── routes/api.ts    # REST API Endpoints (/api/users, /api/groups, /api/user-groups)
│   │   └── services/dataService.ts  # MySQL Query & Connection Pool Engine
│   ├── components/          # React UI Components (Table, Navbar, KPI, Modals)
│   ├── frontend/hooks/      # React Hooks (useUserAccessData, useUserFilters)
│   ├── data/                # Initial Data & Database Schemas Specification
│   ├── utils/               # CSV Helpers, Group Helpers, Storage Utilities
│   └── App.tsx              # Main Application Entrypoint
├── server.ts                # Express Integration Server with Vite HMR
├── package.json             # NPM Package Dependencies & Build Scripts
└── README.md                # Main Project GitHub Documentation
```

---

## 📚 Documentation Index

สำหรับคู่มือและประวัติสถาปัตยกรรมระบบเพิ่มเติม สามารถอ่านได้ที่โฟลเดอร์ `docs/`:

- 📖 **[System Development Log](docs/system_development_log.md)**: บันทึกสถาปัตยกรรมและประวัติการพัฒนา (ข้อ 2.1 ถึง 2.21)
- 📝 **[Work Activity Log](docs/work_activity_log.md)**: บันทึกการทำงานและประวัติการแก้บั๊ก (LOG-001 ถึง LOG-027)
- 🔍 **[MySQL Troubleshooting Postmortem](docs/mysql_sync_troubleshooting_postmortem.md)**: สรุปสาเหตุเชิงลึกและการแก้ไขปัญหา SQL Reserved Keyword `groups` และ Payload Sync
- 💡 **[Database Integration Guide](docs/database_integration_guide.md)**: คู่มือโครงสร้างตารางและการเชื่อมต่อเอนจิน MySQL 8

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---
<div align="center">
  <sub>Built with ❤️ by AAPICO IT Team | Unified Access Management Enterprise Solution</sub>
</div>
