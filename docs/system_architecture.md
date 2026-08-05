# User Access Management System - System Architecture & Structure Specification

## 1. Overview & System Design Philosophy

The **User Access Management Dashboard (V4 Clean Architecture)** is designed following **Clean Architecture** principles and **Single Source of Truth** data management. It provides enterprise-grade identity, access entitlement tracking, CSV/Active Directory integration, and WebAssembly SQLite offline compatibility.

### Core Technology Stack
- **Frontend Layer:** React (TypeScript), Tailwind CSS, Lucide Icons, WASM SQLite In-Memory Database (`sql.js`).
- **Backend API Layer:** Express.js REST API (`server.ts`, `api.ts`), MySQL 8.0 Connection Pool (`mysql2/promise`).
- **Data Persistence:** Relational MySQL Server Database (`user_access_dashboard_data`), WASM SQLite in-memory cache.

---

## 2. Relational Database Architecture (Clean Schema 2.0 Spec)

All permission entitlement calculations (Internet Level A/B/C, VPN Access, Print Quota Policy, Special Entitlements) are derived dynamically via the junction mapping table `` `user_groups` `` $\rightarrow$ `` `groups` ``. Redundant permission columns are removed from `` `users` `` table to maintain a clean 3NF database schema.

### 2.1 Database Tables Schema (`user_access_dashboard_data`)

#### Table 1: `` `groups` ``
Stores all access group definitions, entitlement categories, and badge styling.

```sql
CREATE TABLE IF NOT EXISTS `groups` (
  `group_id` INT PRIMARY KEY,
  `group_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `internet_level` VARCHAR(10) NULL,
  `is_special` TINYINT(1) DEFAULT 0,
  `category` VARCHAR(50) NULL DEFAULT 'ORGANIZATIONAL',
  `badge_color` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- **`is_special` = 1:** Special Entitlement Group (System Master Catalog IDs 101–109 or special entitlement).
- **`is_special` = 0:** Standard Organizational Security Group (IDs 200+ created via UI/CSV).
- **`category` Options:** `INTERNET_LEVEL`, `RESOURCE_ENTITLEMENT`, `NETWORK_VPN`, `PRINT_QUOTA`, `ORGANIZATIONAL`.

#### Table 2: `` `users` `` (Clean 13-Column Schema)
Stores employee profile records without permission columns (all permissions including internet level, VPN, print quota are derived dynamically from groups).

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `employee_id` VARCHAR(50) PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `display_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `job_title` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `company` VARCHAR(100) NOT NULL,
  `device_code` VARCHAR(50) NOT NULL,
  `authority_group` VARCHAR(100) NOT NULL,
  `creation_date` VARCHAR(50) NOT NULL,
  `expiry_date` VARCHAR(50) NULL,
  `telephone_pass_code` VARCHAR(50) NOT NULL,
  `o365_license` VARCHAR(100) NOT NULL DEFAULT 'Microsoft 365 E3'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table 3: `` `user_groups` `` (Junction Table)
Maps many-to-many relationships between employees and access groups.

```sql
CREATE TABLE IF NOT EXISTS `user_groups` (
  `employee_id` VARCHAR(50) NOT NULL,
  `group_id` INT NOT NULL,
  PRIMARY KEY (`employee_id`, `group_id`),
  FOREIGN KEY (`employee_id`) REFERENCES `users` (`employee_id`) ON DELETE CASCADE,
  FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Key Architectural Systems

### 3.1 Hybrid Dual-Mode Filtering Architecture
The filtering system operates in two distinct, non-conflicting modes:
1. **Dropdown UI & Dashboard KPI Cards (Single-Select Direct Switch Mode):**
   - Clicking an Internet Level (Level A / B / C), Company, Department, or Group from Dropdown UI or KPI Summary Cards replaces the filter instantly in 1 click without accumulating.
2. **Omni Token Popup & Token Bar (Multi-Token Accumulator Mode):**
   - Selecting tokens from the Token Popup Overlay or typing in the search bar accumulates tokens into multi-value filter arrays (e.g. `Company: Alpha Group` + `Company: Beta Corp`).

### 3.2 Dynamic Profile Derivation Engine
Instead of storing static permission strings in the `users` table, employee entitlements are dynamically computed from mapped groups:
- **Primary Internet Level:** Evaluated via `getUserPrimaryInternetLevel(user.groups)` (Level A > B > C).
- **VPN Access:** Evaluated via `getUserVpnStatus(user.groups)` (Group ID 107 or category `NETWORK_VPN`).
- **Print Quota Policy:** Evaluated via `getUserPrintQuotaGroup(user.groups)` (Group ID 108/109 or category `PRINT_QUOTA`).
- **Special Entitlements:** Contextual grid card layout in `UserDetailModal` with custom Lucide icons (`<Video />`, `<MessageSquare />`, `<Mail />`, `<Sparkles />`).

---

## 4. Strict Fallback & Data Policy

### 4.1 Zero Mock Data Rule (No Fake Data Generation)
To ensure strict enterprise compliance:
- **No auto-generated mock values:** `Math.random()`, fake codes (`DEV-xxxx`, `PIN-xxxx`), or domain fallbacks (`@company.co.th`) are strictly prohibited.
- **Missing Field Fallback:** Any empty string or missing field in CSV/API payload strictly defaults to **`"-"`** (or `null` for date types).

### 4.2 Clean Database Reset & Auto-Sync Behavior
- Clicking **"Reset Data"** executes `DELETE FROM user_groups` and `DELETE FROM users`, returning employee count to **0**.
- Default Master Groups (IDs 101–109) are preserved and re-seeded in `` `groups` `` with full `category` and `badge_color` attributes so the system remains immediately ready for new imports.

---

## 5. Dedicated Group Management REST API Specification

The system exposes dedicated RESTful endpoints specifically designed for group CRUD operations, entitlement management, and employee assignment:

| Method | Endpoint | Query / Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/groups` | `?is_special=true/false`<br>`?category=PRINT_QUOTA` | Returns all groups from `` `groups` `` table with optional category/special filters |
| `POST` | `/api/groups` | `{ group_name, description?, is_special?, category?, badge_color? }` | Creates a new group in database |
| `PUT` | `/api/groups/:id` | `{ group_name?, description?, is_special?, category?, badge_color? }` | Updates an existing group by ID |
| `DELETE` | `/api/groups/:id` | None | Deletes a group by ID (cascades `user_groups` mappings) |
| `POST` | `/api/groups/:id/assign` | `{ employee_ids: ["EMP-88004"] }` | Assigns employee(s) to a group |
| `POST` | `/api/groups/:id/unassign` | `{ employee_ids: ["EMP-88004"] }` | Unassigns employee(s) from a group |
| `GET` | `/api/users` | None | Returns list of all employee records |
| `GET` | `/api/user-groups` | None | Returns relational mappings from `` `user_groups` `` |
| `POST` | `/api/db/sync` | `{ users, groups, userGroups }` | Atomically upserts users, groups, and user_groups to MySQL |
| `POST` | `/api/db/reset` | None | Clears all employee records (`DELETE FROM users`) |

---

## 6. Extensibility & Maintenance Guide

### How to Add a New Special Group via SQL
To register a new Special Group (e.g. `AI & ChatGPT Access`), run:

```sql
USE `user_access_dashboard_data`;

INSERT INTO `groups` (`group_id`, `group_name`, `description`, `is_special`, `category`, `badge_color`)
VALUES (
  110,
  'AI & ChatGPT Access',
  'สิทธิ์เข้าใช้งานระบบ AI Enterprise ขององค์กร',
  1,
  'RESOURCE_ENTITLEMENT',
  'bg-rose-100 text-rose-900 border-rose-300'
);
```

### How to Add an Organizational Group via SQL
To add a standard security group (e.g. `DevOps Engineering`):

```sql
INSERT INTO `groups` (`group_id`, `group_name`, `description`, `is_special`, `category`, `badge_color`)
VALUES (
  201,
  'DevOps Engineering Team',
  'กลุ่มสิทธิ์สำหรับทีมพัฒนาและดูแลระบบโครงสร้างพื้นฐาน',
  0,
  'ORGANIZATIONAL',
  'bg-indigo-50 text-indigo-900 border-indigo-200'
);
```
