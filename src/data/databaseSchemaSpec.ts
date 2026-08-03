export interface JsonDatabaseExport {
  $schema: string;
  metadata: {
    format_version: string;
    exported_at: string;
    system_name: string;
    database_type: string;
    description: string;
  };
  summary: {
    total_users: number;
    total_groups: number;
    total_user_groups: number;
  };
  data: {
    users: Array<{
      employee_id: string;
      username: string;
      display_name: string;
      email: string;
      internet_level: 'A' | 'B' | 'C';
      job_title: string;
      department: string;
      company: string;
      device_code: string;
      authority_group: string;
      creation_date: string;
      expiry_date: string | null;
      print_quota_group: string;
      telephone_pass_code: string;
      vpn_status: boolean;
      o365_license: string;
    }>;
    groups: Array<{
      group_id: number;
      group_name: string;
      description?: string;
      internet_level?: 'A' | 'B' | 'C';
      is_special?: boolean;
    }>;
    user_groups: Array<{
      employee_id: string;
      group_id: number;
    }>;
  };
}

export const JSON_DATABASE_SCHEMA_DOC = {
  title: "Active Directory SQLite Database JSON Interchange Specification",
  version: "1.0",
  description: "มาตรฐานโครงสร้างไฟล์ JSON สำหรับการสำรองข้อมูล (Backup) นำเข้า (Import) และส่งออก (Export) ของระบบ SQLite Database",
  format: {
    $schema: "URI ระบุสคีมาของรูปแบบไฟล์ JSON",
    metadata: {
      format_version: "เวอร์ชันของสคีมาข้อมูล (เช่น 1.0)",
      exported_at: "วันเวลาที่ทำการส่งออกข้อมูลในรูปแบบ ISO 8601",
      system_name: "ชื่อระบบต้นทางที่สร้างไฟล์",
      database_type: "ชนิดของฐานข้อมูลต้นทาง (SQLite 3)",
      description: "คำอธิบายวัตถุประสงค์ของไฟล์"
    },
    summary: {
      total_users: "จำนวนแถวทั้งหมดในตาราง users",
      total_groups: "จำนวนแถวทั้งหมดในตาราง groups",
      total_user_groups: "จำนวนความสัมพันธ์ทั้งหมดในตาราง user_groups"
    },
    data: {
      users: "ตารางผู้ใช้งาน (users) ประกอบด้วย employee_id (Primary Key), username, display_name, email, internet_level (A/B/C), job_title, department, company, device_code, authority_group, creation_date, expiry_date, print_quota_group, telephone_pass_code, vpn_status (boolean), o365_license",
      groups: "ตารางกลุ่มผู้ใช้ (groups) ประกอบด้วย group_id (Primary Key), group_name, description, internet_level, is_special",
      user_groups: "ตารางเชื่อมความสัมพันธ์หลายต่อหลาย (user_groups) ประกอบด้วย employee_id และ group_id"
    }
  }
};
