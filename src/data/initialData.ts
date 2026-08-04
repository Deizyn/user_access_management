import { Group, User, UserGroup } from '../types';

/**
 * ------------------------------------------------------------------
 * 1. Active Directory Raw API JSON Interfaces (Schema from AD / LDAP API)
 * ------------------------------------------------------------------
 * Represents the structure of raw JSON payload received from Active Directory
 * LDAP / Entra ID Gateway API endpoint (e.g., GET /api/v1/ad-sync/payload)
 */
export interface RawAdGroupRecord {
  objectGUID: string;
  cn: string; // Common Name e.g. "Internet Level A", "IT Administrators"
  gidNumber: number; // AD GID / Group ID e.g. 101, 1, 2
  description: string;
  distinguishedName: string; // e.g. "CN=Internet Level A,OU=LevelGroups,DC=corp,DC=aapico,DC=com"
  isSpecialGroup?: boolean;
}

export interface RawAdUserRecord {
  objectGUID: string;
  employeeID: string; // e.g. "AH10000101"
  sAMAccountName: string; // e.g. "somchai.p"
  userPrincipalName: string; // e.g. "somchai.p@aapico.com"
  displayName: string; // e.g. "Somchai Pattana"
  title: string; // Job Title from AD e.g. "Senior IT Supervisor"
  department: string; // Department e.g. "IT"
  company: string; // Company / OU e.g. "AH"
  whenCreated: string; // AD Creation Timestamp (ISO Format) e.g. "2021-03-15T08:30:00Z"
  accountExpires: string | null; // AD Account Expiration Timestamp or null

  // Mapped Active Directory Custom Schema Attributes
  extensionAttribute1?: string; // Device Code e.g. "AH24-IT01001"
  extensionAttribute2?: string; // Telephone Passcode e.g. "PIN-4819"
  extensionAttribute3?: string; // Authority Group e.g. "Administrators"
  extensionAttribute4?: string; // Print Quota Group e.g. "Unlimited"
  extensionAttribute5?: string; // VPN Access Enabled e.g. "true" / "false"
  extensionAttribute6?: string; // Microsoft O365 License e.g. "Microsoft 365 E5"

  // Active Directory LDAP "memberOf" array containing Distinguished Names (DN)
  memberOf: string[];
}

export interface RawAdSyncApiResponse {
  status: 'success';
  source: 'Active Directory LDAP / Entra ID API Bridge';
  syncTimestamp: string;
  totalRecords: {
    groupsCount: number;
    usersCount: number;
  };
  data: {
    groups: RawAdGroupRecord[];
    users: RawAdUserRecord[];
  };
}

/**
 * ------------------------------------------------------------------
 * 2. Raw AD Data Generators (Simulating AD API Data Payload)
 * ------------------------------------------------------------------
 */
const rawFirstNames = [
  'Somchai', 'Kanya', 'Narong', 'Porntip', 'Anan', 'Siriporn', 'Thana', 'Chanida', 'Pitak', 'Pimchanok',
  'Supachai', 'Nattapong', 'Prasert', 'Wipa', 'Voravit', 'Chutima', 'Manus', 'Ratchanee', 'Suthep', 'Boonmee',
  'Patcharee', 'Tawatchai', 'Sombat', 'Duangjai', 'Wichai', 'Pensri', 'Thanavat', 'Laddawan', 'Chaiwat', 'Montree',
  'Apinya', 'Kittisak', 'Sureeporn', 'Sarawut', 'Anchalee', 'Panya', 'Busaba', 'Wisut', 'Ratana', 'Natthawut',
  'Jintana', 'Phongsak', 'Malee', 'Piyawat', 'Sunisa', 'Teerapat', 'Uraiwan', 'Surasak', 'Wannapa', 'Somchit',
  'Krittin', 'Pornchai', 'Saran', 'Nipon', 'Chatchai', 'Korn', 'Thanawat', 'Piraya', 'Bhanu', 'Sittichai',
  'Panida', 'Natasha', 'Veerapat', 'Piyaporn', 'Warut', 'Sakda', 'Chalerm', 'Suphakit', 'Pawinee', 'Chatri',
  'Attaphol', 'Bussaba', 'Chana', 'Danai', 'Ekkachai', 'Garn', 'Issara', 'Jatuporn', 'Kriangkrai', 'Likit',
  'Methee', 'Napon', 'Oran', 'Paitoon', 'Rungroj', 'Sakchai', 'Thaworn', 'Udom', 'Viroj', 'Winai',
  'Yuttana', 'Krit', 'Kamontip', 'Kasem', 'Metha', 'Navin', 'Narumol', 'Parinya', 'Pricha', 'Ratchaneekorn'
];

const rawLastNames = [
  'Pattana', 'Somprasong', 'Wongsuwan', 'Kijja', 'Thanakorn', 'Meesuk', 'Saetang', 'Ratanapol', 'Udom', 'Varang',
  'Siriporn', 'Suwan', 'Kaewmanee', 'Saelim', 'Phoncharoen', 'Tangsiri', 'Boonprasert', 'Chaiyachet', 'Wongsawat', 'Srikaset',
  'Rotjanakit', 'Prasertkul', 'Bunyarat', 'Techawong', 'Limpisathian', 'Srisawat', 'Wongamat', 'Phongphet', 'Rattanatada', 'Choosri',
  'Insuwan', 'Vongchaluem', 'Phungphian', 'Kittisophon', 'Charoensuk', 'Sukprasert', 'Phetchaburi', 'Srichai', 'Thongkum', 'Bunserm',
  'Chaiprasert', 'Srikampan', 'Piyatham', 'Sinchai', 'Tantrakul', 'Wongphaet', 'Akapat', 'Ruangroj', 'Charoenphon', 'Suwanarat',
  'Vattanachai', 'Songkram', 'Thongchai', 'Phakdeesuwan', 'Sricharoen', 'Thongprasert', 'Sookjai', 'Wongsawatkul', 'Srikong', 'Chaimongkol'
];

const companies = ['AH', 'AF', 'AICO', 'AL', 'AAT', 'AS'];
const printQuotas = ['Unlimited', 'ปริ้นขาวดำ/ปริ้นสี', 'ปริ้นขาวดำ', 'No Print Access'];

const jobTitlesByDept: Record<string, string[]> = {
  IT: ['Chief Information Officer', 'Senior IT Supervisor', 'Cybersecurity Engineer', 'DevOps Specialist', 'Network Administrator', 'Systems Analyst', 'Database Admin', 'Helpdesk Lead', 'IT Support Officer', 'Infrastructure Engineer'],
  press: ['Press Specialist', 'Press Engineer', 'Press Operator Supervisor', 'Senior Press Specialist', 'Press Machine Technician', 'Tooling Engineer', 'Press Line Technician'],
  finance: ['Chief Financial Officer', 'Senior Accountant', 'Internal Auditor', 'Financial Analyst', 'Accounting Officer', 'Tax Specialist', 'Treasury Manager', 'Cost Controller', 'Accounts Payable Lead'],
  hr: ['HR Director', 'HR Manager', 'Talent Acquisition Specialist', 'HR Business Partner', 'Payroll Supervisor', 'Training Coordinator', 'Employee Relations Officer', 'HR Operations Analyst'],
  assembly: ['Assembly Inspector', 'Plant Operations Manager', 'Line Assembly Supervisor', 'Process Engineer', 'Manufacturing Specialist', 'Assembly Technician', 'Production Planner'],
  qa: ['QA Manager', 'QA Engineer', 'Quality Control Inspector', 'Compliance Tester', 'ISO Auditor Specialist', 'Quality Assurance Analyst', 'Metrology Inspector'],
  sales: ['VP of Sales', 'Sales Executive', 'Account Manager', 'Regional Sales Lead', 'Business Development Analyst', 'Key Account Supervisor', 'Inside Sales Rep', 'Sales Coordinator'],
  legal: ['General Counsel', 'Legal Counsel', 'Compliance Officer', 'Legal Manager', 'Contract Specialist', 'IP Specialist', 'Corporate Governance Lead'],
  rd: ['Head of R&D', 'R&D Engineer', 'Product Designer', 'Innovation Researcher', 'Prototyping Lead', 'CAD Engineer', 'Materials Scientist'],
  purchasing: ['Procurement Manager', 'Procurement Officer', 'Purchasing Supervisor', 'Buyer Specialist', 'Vendor Manager', 'Supply Sourcing Lead', 'Inventory Specialist'],
  logistics: ['Logistics Director', 'Logistics Coordinator', 'Warehouse Supervisor', 'Supply Chain Analyst', 'Fleet Operations Officer', 'Customs Clearance Specialist', 'Materials Handler']
};

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function getWeightedCompany(r: number): string {
  if (r < 0.38) return 'AH';
  if (r < 0.62) return 'AF';
  if (r < 0.80) return 'AICO';
  if (r < 0.91) return 'AL';
  if (r < 0.97) return 'AAT';
  return 'AS';
}

function getWeightedDepartment(r: number): string {
  if (r < 0.30) return 'assembly';
  if (r < 0.50) return 'press';
  if (r < 0.64) return 'qa';
  if (r < 0.74) return 'IT';
  if (r < 0.82) return 'sales';
  if (r < 0.88) return 'logistics';
  if (r < 0.925) return 'finance';
  if (r < 0.96) return 'hr';
  if (r < 0.985) return 'purchasing';
  if (r < 0.995) return 'rd';
  return 'legal';
}

function getWeightedGroupId(r: number): number {
  if (r < 0.30) return 7;
  if (r < 0.52) return 6;
  if (r < 0.67) return 8;
  if (r < 0.77) return 10;
  if (r < 0.85) return 5;
  if (r < 0.91) return 3;
  if (r < 0.95) return 1;
  if (r < 0.98) return 4;
  if (r < 0.995) return 2;
  return 9;
}

/**
 * Generate Raw AD API JSON Response (Simulating REST API payload from Active Directory)
 */
export function generateRawAdApiResponse(): RawAdSyncApiResponse {
  const rawGroups: RawAdGroupRecord[] = [
    { objectGUID: '10100000-0000-0000-0000-000000000101', cn: 'Internet Level A', gidNumber: 101, description: 'สิทธิ์อินเทอร์เน็ตระดับ A (ปลดล็อกสูงสุด)', distinguishedName: 'CN=Internet Level A,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10200000-0000-0000-0000-000000000102', cn: 'Internet Level B', gidNumber: 102, description: 'สิทธิ์อินเทอร์เน็ตระดับ B (มาตรฐานงานทั่วไป)', distinguishedName: 'CN=Internet Level B,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10300000-0000-0000-0000-000000000103', cn: 'Internet Level C', gidNumber: 103, description: 'สิทธิ์อินเทอร์เน็ตระดับ C (จำกัดเฉพาะเว็บจำเป็น)', distinguishedName: 'CN=Internet Level C,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10400000-0000-0000-0000-000000000104', cn: 'Video Access', gidNumber: 104, description: 'สิทธิ์เข้าถึงสื่อวิดีโอและสตรีมมิ่ง', distinguishedName: 'CN=Video Access,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10500000-0000-0000-0000-000000000105', cn: 'Communications', gidNumber: 105, description: 'สิทธิ์ระบบสื่อสาร โทรศัพท์ และแชทองค์กร', distinguishedName: 'CN=Communications,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10600000-0000-0000-0000-000000000106', cn: 'Free E-mail', gidNumber: 106, description: 'สิทธิ์รับ-ส่งอีเมลภายนอกองค์กร', distinguishedName: 'CN=Free E-mail,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10700000-0000-0000-0000-000000000107', cn: 'VPN Access', gidNumber: 107, description: 'สิทธิ์เชื่อมต่อเครือข่าย VPN จากภายนอก', distinguishedName: 'CN=VPN Access,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10800000-0000-0000-0000-000000000108', cn: 'Printer Color', gidNumber: 108, description: 'สิทธิ์สั่งพิมพ์งานสีและขาวดำ (Color Printer)', distinguishedName: 'CN=Printer Color,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '10900000-0000-0000-0000-000000000109', cn: 'Printer Mono', gidNumber: 109, description: 'สิทธิ์สั่งพิมพ์งานขาวดำเท่านั้น (Mono Printer)', distinguishedName: 'CN=Printer Mono,OU=SpecialGroups,DC=corp,DC=aapico,DC=com', isSpecialGroup: true },
    { objectGUID: '00100000-0000-0000-0000-000000000001', cn: 'IT Administrators', gidNumber: 1, description: 'ผู้ดูแลระบบโครงสร้างไอที สิทธิ์จัดการสูงสุด', distinguishedName: 'CN=IT Administrators,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00200000-0000-0000-0000-000000000002', cn: 'Executive Management', gidNumber: 2, description: 'คณะผู้บริหารระดับสูง สิทธิ์เข้าถึงข้อมูลยุทธศาสตร์', distinguishedName: 'CN=Executive Management,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00300000-0000-0000-0000-000000000003', cn: 'Finance & Audit Approvers', gidNumber: 3, description: 'ผู้อนุมัติวงเงินงบประมาณ ตรวจสอบบัญชีและการเงิน', distinguishedName: 'CN=Finance & Audit Approvers,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00400000-0000-0000-0000-000000000004', cn: 'DevOps & Cloud Engineers', gidNumber: 4, description: 'วิศวกรคลาวด์และการปรับปรุงระบบอัตโนมัติ', distinguishedName: 'CN=DevOps & Cloud Engineers,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00500000-0000-0000-0000-000000000005', cn: 'HR & Personnel Admins', gidNumber: 5, description: 'เจ้าหน้าที่บริหารทรัพยากรบุคคลและประวัติพนักงาน', distinguishedName: 'CN=HR & Personnel Admins,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00600000-0000-0000-0000-000000000006', cn: 'Sales & Marketing Team', gidNumber: 6, description: 'ทีมงานฝ่ายขายและวางแผนกลยุทธ์การตลาด', distinguishedName: 'CN=Sales & Marketing Team,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00700000-0000-0000-0000-000000000007', cn: 'Customer Support Specialists', gidNumber: 7, description: 'ทีมสนับสนุนและบริการลูกค้าประจำศูนย์', distinguishedName: 'CN=Customer Support Specialists,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00800000-0000-0000-0000-000000000008', cn: 'External Contractors', gidNumber: 8, description: 'ผู้รับเหมาและที่ปรึกษาภายนอกองค์กร', distinguishedName: 'CN=External Contractors,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '00900000-0000-0000-0000-000000000009', cn: 'Legal & Compliance Officers', gidNumber: 9, description: 'เจ้าหน้าที่กำกับดูแลกฎหมายและข้อบังคับ', distinguishedName: 'CN=Legal & Compliance Officers,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01000000-0000-0000-0000-000000000010', cn: 'R&D Innovation Lab', gidNumber: 10, description: 'ห้องปฏิบัติการวิจัยและพัฒนานวัตกรรมผลิตภัณฑ์', distinguishedName: 'CN=R&D Innovation Lab,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01100000-0000-0000-0000-000000000011', cn: 'Supply Chain & Logistics Ops', gidNumber: 11, description: 'ทีมบริหารจัดการห่วงโซ่อุปทานและคลังสินค้า', distinguishedName: 'CN=Supply Chain & Logistics Ops,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01200000-0000-0000-0000-000000000012', cn: 'Quality & ISO Committee', gidNumber: 12, description: 'คณะกรรมการควบคุมคุณภาพและมาตรฐาน ISO', distinguishedName: 'CN=Quality & ISO Committee,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01300000-0000-0000-0000-000000000013', cn: 'InfoSec Steering Group', gidNumber: 13, description: 'คณะทำงานความมั่นคงปลอดภัยสารสนเทศ', distinguishedName: 'CN=InfoSec Steering Group,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01400000-0000-0000-0000-000000000014', cn: 'ERP System Key Users', gidNumber: 14, description: 'ผู้ใช้งานหลักระบบบริหารจัดการองค์กร ERP', distinguishedName: 'CN=ERP System Key Users,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01500000-0000-0000-0000-000000000015', cn: 'Plant Safety & EHS Team', gidNumber: 15, description: 'ทีมงานอาชีวอนามัย ความปลอดภัย และสิ่งแวดล้อม', distinguishedName: 'CN=Plant Safety & EHS Team,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01600000-0000-0000-0000-000000000016', cn: 'General Guest Access', gidNumber: 16, description: 'กลุ่มสิทธิ์ผู้ใช้งานทั่วไป / บุคคลภายนอก', distinguishedName: 'CN=General Guest Access,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
    { objectGUID: '01700000-0000-0000-0000-000000000017', cn: 'Temporary Project Members', gidNumber: 17, description: 'กลุ่มสิทธิ์โครงการชั่วคราว', distinguishedName: 'CN=Temporary Project Members,OU=SecurityGroups,DC=corp,DC=aapico,DC=com' },
  ];

  const groupDnMap = new Map<number, string>();
  rawGroups.forEach(g => groupDnMap.set(g.gidNumber, g.distinguishedName));

  const TOTAL_USERS = 60;
  const rawUsers: RawAdUserRecord[] = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    const fnIndex = (i * 17 + Math.floor(seededRandom(i * 3) * 50)) % rawFirstNames.length;
    const lnIndex = (i * 23 + Math.floor(seededRandom(i * 7) * 50)) % rawLastNames.length;
    const fn = rawFirstNames[fnIndex];
    const ln = rawLastNames[lnIndex];

    const rCompany = seededRandom(i * 13 + 1);
    const company = getWeightedCompany(rCompany);

    const empIdNum = 10000101 + i;
    const empId = `${company}${empIdNum}`;
    
    const uniqueSuffix = i >= 30 ? String((i % 999) + 1) : '';
    const username = `${fn.toLowerCase()}.${ln.charAt(0).toLowerCase()}${uniqueSuffix}`;
    const displayName = `${fn} ${ln}`;
    const email = `${username}@aapico.com`;

    const rDept = seededRandom(i * 19 + 2);
    const dept = getWeightedDepartment(rDept);

    const titles = jobTitlesByDept[dept] || ['Specialist'];
    const titleIndex = Math.floor(seededRandom(i * 29 + 3) * titles.length);
    const jobTitle = titles[titleIndex];

    const rInternet = seededRandom(i * 31 + 5);
    let internetLevel: 'A' | 'B' | 'C' = 'B';
    if (dept === 'IT' || dept === 'rd' || jobTitle.includes('Chief') || jobTitle.includes('VP') || jobTitle.includes('Director') || jobTitle.includes('Head')) {
      internetLevel = rInternet < 0.55 ? 'A' : 'B';
    } else if (dept === 'assembly' || dept === 'press') {
      internetLevel = rInternet < 0.58 ? 'C' : 'B';
    } else {
      if (rInternet < 0.08) internetLevel = 'A';
      else if (rInternet < 0.72) internetLevel = 'B';
      else internetLevel = 'C';
    }

    let levelGroup = 'General Staff';
    const jtLower = jobTitle.toLowerCase();
    if (jtLower.includes('chief') || jtLower.includes('vp') || jtLower.includes('director') || jtLower.includes('head')) {
      levelGroup = 'Executive';
    } else if (jtLower.includes('manager') || jtLower.includes('lead') || jtLower.includes('supervisor')) {
      levelGroup = 'Management';
    } else if (jtLower.includes('senior') || jtLower.includes('specialist') || jtLower.includes('analyst')) {
      levelGroup = 'Senior Professional';
    } else if (jtLower.includes('engineer') || jtLower.includes('officer') || jtLower.includes('administrator')) {
      levelGroup = 'Professional';
    } else if (jtLower.includes('operator') || jtLower.includes('technician') || jtLower.includes('assembly')) {
      levelGroup = 'Operational Staff';
    } else {
      levelGroup = 'General Staff';
    }

    const devCodePrefix = company;
    const deviceCode = `${devCodePrefix}${24 + (i % 3)}-${dept.substring(0, 3).toUpperCase()}${String(i + 1001).padStart(5, '0')}`;

    const rAuth = seededRandom(i * 37 + 7);
    let authorityGroup = 'Domain Users';
    if (dept === 'IT' && rAuth < 0.40) {
      authorityGroup = 'Administrators';
    } else if (rAuth < 0.05) {
      authorityGroup = 'Administrators';
    } else if (rAuth < 0.21) {
      authorityGroup = 'Power Users';
    } else if (rAuth < 0.25) {
      authorityGroup = 'Security Auditors';
    } else if (rAuth < 0.29) {
      authorityGroup = 'Guest Users';
    } else {
      authorityGroup = 'Domain Users';
    }

    const year = 2015 + Math.floor(seededRandom(i * 41 + 11) * 12);
    const month = String(Math.floor(seededRandom(i * 43 + 13) * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(seededRandom(i * 47 + 17) * 28) + 1).padStart(2, '0');
    const whenCreatedIso = `${year}-${month}-${day}T08:30:00.000Z`;

    const rExpiry = seededRandom(i * 53 + 19);
    let accountExpiresIso: string | null = null;
    if (rExpiry < 0.08) {
      const expMonth = String(Math.floor(seededRandom(i * 59 + 23) * 12) + 1).padStart(2, '0');
      const expDay = String(Math.floor(seededRandom(i * 61 + 29) * 28) + 1).padStart(2, '0');
      accountExpiresIso = `2025-${expMonth}-${expDay}T23:59:59.000Z`;
    } else if (rExpiry < 0.22) {
      const expDay = String(Math.floor(seededRandom(i * 67 + 31) * 28) + 1).padStart(2, '0');
      accountExpiresIso = `2026-08-${expDay}T23:59:59.000Z`;
    } else if (rExpiry < 0.50) {
      const expYear = 2027 + Math.floor(seededRandom(i * 71 + 37) * 3);
      accountExpiresIso = `${expYear}-12-31T23:59:59.000Z`;
    } else {
      accountExpiresIso = null;
    }

    let printQuota = printQuotas[i % printQuotas.length];
    if (internetLevel === 'A') {
      printQuota = 'Unlimited';
    } else if (internetLevel === 'C') {
      printQuota = i % 2 === 0 ? 'ปริ้นขาวดำ' : 'No Print Access';
    }

    const pin = `PIN-${String(1000 + Math.floor(seededRandom(i * 73 + 41) * 8999))}`;

    const rVpn = seededRandom(i * 79 + 43);
    const vpnStatus = internetLevel === 'A' || dept === 'IT' || dept === 'finance' || rVpn < 0.38;

    // AD "memberOf" array containing group Distinguished Names (DN)
    const userGroupSet = new Set<number>();

    if (i === 0) {
      userGroupSet.add(101); userGroupSet.add(102); userGroupSet.add(103);
      userGroupSet.add(104); userGroupSet.add(105); userGroupSet.add(106);
      userGroupSet.add(107); userGroupSet.add(108); userGroupSet.add(1);
      userGroupSet.add(3);   userGroupSet.add(11);  userGroupSet.add(16);
    } else if (i === 1) {
      userGroupSet.add(101); userGroupSet.add(102); userGroupSet.add(104);
      userGroupSet.add(105); userGroupSet.add(106); userGroupSet.add(108);
      userGroupSet.add(2);   userGroupSet.add(5);   userGroupSet.add(14);
    } else if (i === 2) {
      userGroupSet.add(102); userGroupSet.add(103); userGroupSet.add(105);
      userGroupSet.add(106); userGroupSet.add(109); userGroupSet.add(6);
      userGroupSet.add(7);   userGroupSet.add(15);
    } else {
      if (internetLevel === 'A') {
        userGroupSet.add(101);
        if (i % 3 === 0) userGroupSet.add(102);
        if (i % 5 === 0) userGroupSet.add(103);
      } else if (internetLevel === 'B') {
        userGroupSet.add(102);
        if (i % 4 === 0) userGroupSet.add(103);
      } else if (internetLevel === 'C') {
        userGroupSet.add(103);
      }

      if (internetLevel === 'A' || internetLevel === 'B' || i % 2 === 0) userGroupSet.add(104);
      if (dept === 'IT' || dept === 'sales' || dept === 'hr' || dept === 'finance' || i % 3 !== 0) userGroupSet.add(105);
      if (email || i % 5 !== 0) userGroupSet.add(106);
      if (vpnStatus) userGroupSet.add(107);
      if (printQuota === 'Unlimited' || printQuota === 'ปริ้นขาวดำ/ปริ้นสี') userGroupSet.add(108);
      else if (printQuota === 'ปริ้นขาวดำ') userGroupSet.add(109);
    }

    const targetGroupCount = 5 + Math.floor(seededRandom(i * 101 + 17) * 6);
    const rGroup = seededRandom(i * 83 + 47);
    const primaryGroupId = getWeightedGroupId(rGroup);
    userGroupSet.add(primaryGroupId);

    if (dept === 'IT') { userGroupSet.add(1); userGroupSet.add(4); userGroupSet.add(13); }
    else if (dept === 'finance') { userGroupSet.add(3); userGroupSet.add(14); }
    else if (dept === 'legal') { userGroupSet.add(9); userGroupSet.add(13); }
    else if (dept === 'sales') { userGroupSet.add(6); userGroupSet.add(14); }
    else if (dept === 'hr') { userGroupSet.add(5); userGroupSet.add(15); }
    else if (dept === 'rd') { userGroupSet.add(10); userGroupSet.add(12); }
    else if (dept === 'purchasing' || dept === 'logistics') { userGroupSet.add(7); userGroupSet.add(11); }
    else if (dept === 'qa' || dept === 'press' || dept === 'assembly') { userGroupSet.add(12); userGroupSet.add(15); }

    if (internetLevel === 'A' || jobTitle.includes('Chief') || jobTitle.includes('VP') || jobTitle.includes('Director') || jobTitle.includes('Head') || jobTitle.includes('Manager') || jobTitle.includes('Lead')) {
      userGroupSet.add(2);
    }

    let step = 1;
    while (userGroupSet.size < targetGroupCount) {
      const candidateId = ((primaryGroupId + step * 3 + Math.floor(seededRandom(i * 107 + step * 13) * 15)) % 15) + 1;
      userGroupSet.add(candidateId);
      step++;
    }

    const memberOfDns: string[] = [];
    userGroupSet.forEach((gid) => {
      const dn = groupDnMap.get(gid);
      if (dn) memberOfDns.push(dn);
    });

    const guidHex = String(i + 1000).padStart(12, '0');

    // Generate O365 License attribute (E1, E3, E5, E7) for ALL users
    let o365Lic = 'Microsoft 365 E3';
    const rLic = seededRandom(i * 97 + 53);
    if (jobTitle.includes('Chief') || jobTitle.includes('VP') || jobTitle.includes('Director') || jobTitle.includes('Head')) {
      o365Lic = rLic < 0.4 ? 'Microsoft 365 E7' : 'Microsoft 365 E5';
    } else if (dept === 'IT' || authorityGroup === 'Administrators' || jobTitle.includes('Manager')) {
      o365Lic = rLic < 0.6 ? 'Microsoft 365 E5' : 'Microsoft 365 E3';
    } else if (levelGroup === 'Senior Professional' || levelGroup === 'Professional') {
      o365Lic = rLic < 0.8 ? 'Microsoft 365 E3' : 'Microsoft 365 E1';
    } else {
      o365Lic = rLic < 0.7 ? 'Microsoft 365 E1' : 'Microsoft 365 E3';
    }

    rawUsers.push({
      objectGUID: `88888888-4444-4444-4444-${guidHex}`,
      employeeID: empId,
      sAMAccountName: username,
      userPrincipalName: email,
      displayName: displayName,
      title: jobTitle,
      department: dept,
      company,
      whenCreated: whenCreatedIso,
      accountExpires: accountExpiresIso,
      extensionAttribute1: deviceCode,
      extensionAttribute2: pin,
      extensionAttribute3: authorityGroup,
      extensionAttribute4: printQuota,
      extensionAttribute5: String(vpnStatus),
      extensionAttribute6: o365Lic,
      memberOf: memberOfDns,
    });
  }

  return {
    status: 'success',
    source: 'Active Directory LDAP / Entra ID API Bridge',
    syncTimestamp: new Date().toISOString(),
    totalRecords: {
      groupsCount: rawGroups.length,
      usersCount: rawUsers.length,
    },
    data: {
      groups: rawGroups,
      users: rawUsers,
    },
  };
}

/**
 * ------------------------------------------------------------------
 * 3. Transformer Engine (Parses Raw AD JSON -> Internal App Models)
 * ------------------------------------------------------------------
 * Simulates backend API transformer that extracts Active Directory LDAP
 * response payload into clean application relational models.
 */
export function transformAdApiResponseToAppModel(apiResponse: RawAdSyncApiResponse) {
  const groups: Group[] = apiResponse.data.groups.map((g) => ({
    group_id: g.gidNumber,
    group_name: g.cn,
    description: g.description,
    internet_level: g.cn.includes('Internet Level A') ? 'A' : g.cn.includes('Internet Level B') ? 'B' : g.cn.includes('Internet Level C') ? 'C' : undefined,
    is_special: g.isSpecialGroup,
  }));

  // Create a DN (Distinguished Name) to GID lookup map
  const dnToGidMap = new Map<string, number>();
  apiResponse.data.groups.forEach((g) => {
    dnToGidMap.set(g.distinguishedName.toLowerCase(), g.gidNumber);
  });

  const users: User[] = [];
  const userGroups: UserGroup[] = [];

  apiResponse.data.users.forEach((u) => {
    // 1. Determine Internet Level from AD memberOf DNs
    let internetLevel: 'A' | 'B' | 'C' = 'B';
    const memberOfLower = u.memberOf.map((dn) => dn.toLowerCase());

    if (memberOfLower.some((dn) => dn.includes('internet level a'))) {
      internetLevel = 'A';
    } else if (memberOfLower.some((dn) => dn.includes('internet level c'))) {
      internetLevel = 'C';
    } else if (memberOfLower.some((dn) => dn.includes('internet level b'))) {
      internetLevel = 'B';
    }

    // 2. Parse ISO timestamp to YYYY-MM-DD
    const creationDate = u.whenCreated ? u.whenCreated.split('T')[0] : '2022-01-01';
    const expiryDate = u.accountExpires ? u.accountExpires.split('T')[0] : null;

    users.push({
      employee_id: u.employeeID,
      username: u.sAMAccountName,
      display_name: u.displayName,
      email: u.userPrincipalName,
      internet_level: internetLevel,
      job_title: u.title,
      department: u.department,
      company: u.company,
      device_code: u.extensionAttribute1 || '',
      authority_group: u.extensionAttribute3 || 'Domain Users',
      creation_date: creationDate,
      expiry_date: expiryDate,
      print_quota_group: u.extensionAttribute4 || 'No Print Access',
      telephone_pass_code: u.extensionAttribute2 || '',
      vpn_status: u.extensionAttribute5 === 'true',
      o365_license: u.extensionAttribute6 || 'Microsoft 365 E1',
    });

    // 3. Extract UserGroup junction table entries from AD memberOf Distinguished Names
    u.memberOf.forEach((dn) => {
      const gid = dnToGidMap.get(dn.toLowerCase());
      if (gid !== undefined) {
        userGroups.push({
          employee_id: u.employeeID,
          group_id: gid,
        });
      }
    });
  });

  return { groups, users, userGroups };
}

/**
 * ------------------------------------------------------------------
 * 4. Export Initial Application Data derived from transformed AD Payload
 * ------------------------------------------------------------------
 */
// Step 1: Simulate receiving raw JSON payload from AD Sync API
export const RAW_AD_API_JSON_RESPONSE: RawAdSyncApiResponse = generateRawAdApiResponse();

// Step 2: Transform raw AD JSON payload into internal application data
const transformedData = transformAdApiResponseToAppModel(RAW_AD_API_JSON_RESPONSE);

export const INITIAL_GROUPS: Group[] = transformedData.groups;
export const INITIAL_USERS: User[] = transformedData.users;
export const INITIAL_USER_GROUPS: UserGroup[] = transformedData.userGroups;
