# User Access Management System - System Architecture & Structure Specification

## 1. Overview & System Design Philosophy

The **User Access Management Dashboard (V3 Architecture)** is designed following **Clean Architecture** principles and **Single Source of Truth** data management. It provides enterprise-grade identity, access entitlement tracking, and CSV/Active Directory integration.

### Core Technology Stack
- **Frontend Layer:** React (TypeScript), Tailwind CSS, Lucide Icons, WASM SQLite In-Memory Database.
- **Backend API Layer:** Express.js REST API (`server.ts`, `api.ts`), MySQL 8.0 Connection Pool (`mysql2/promise`).
- **Data Persistence:** Relational MySQL Server Database (`user_access_dashboard_data`), WASM SQLite in-memory cache.

---

## 2. Single-Table Database Architecture

All group definitions (both System Special Groups and Custom Organizational Groups) are consolidated into a single unified table: `` `groups` ``.

### 2.1 Database Tables Schema (`user_access_dashboard_data`)

#### Table 1: `` `groups` ``
Stores all access group definitions, badge styling, and entitlement categories.

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

#### Table 1.5: `` `special_groups` ``
Master catalog for system special groups, rules, categories, and badge styling.

```sql
CREATE TABLE IF NOT EXISTS `special_groups` (
  `special_group_id` INT PRIMARY KEY,
  `group_name` VARCHAR(100) NOT NULL UNIQUE,
  `category` VARCHAR(50) NOT NULL,
  `badge_color` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  FOREIGN KEY (`special_group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table 2: `` `users` ``

Stores employee profile records.

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `employee_id` VARCHAR(50) PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `job_title` VARCHAR(100) NULL DEFAULT '-',
  `department` VARCHAR(100) NULL DEFAULT '-',
  `company` VARCHAR(100) NULL DEFAULT '-',
  `device_code` VARCHAR(100) NULL DEFAULT '-',
  `authority_group` VARCHAR(100) NULL DEFAULT '-',
  `creation_date` VARCHAR(50) NULL DEFAULT '-',
  `expiry_date` VARCHAR(50) NULL,
  `telephone_pass_code` VARCHAR(100) NULL DEFAULT '-',
  `o365_license` VARCHAR(100) NULL DEFAULT '-',
  `internet_level` VARCHAR(10) NULL DEFAULT 'B'
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

## 3. Strict Fallback & Data Policy

### 3.1 Zero Mock Data Rule (No Fake Data Generation)
To ensure strict enterprise compliance:
- **No auto-generated mock values:** `Math.random()`, fake codes (`DEV-xxxx`, `PIN-xxxx`), or domain fallbacks (`@company.co.th`) are strictly prohibited.
- **Missing Field Fallback:** Any empty string or missing field in CSV/API payload strictly defaults to **`"-"`** (or `null` for date types).

### 3.2 Clean Database Reset Behavior
- Clicking **"Reset Data"** executes `DELETE FROM user_groups` and `DELETE FROM users`, returning the employee count to **0**.
- Default Master Groups (IDs 101–109) are preserved in `` `groups` `` so the system remains ready for new imports.

---

## 4. Dedicated Group Management REST API Specification

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

## 5. Extensibility & Maintenance Guide

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
