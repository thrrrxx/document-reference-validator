export interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: string;
  department: string;
  bio: string;
  timezone: string;
  avatarUrl?: string | null;
  image?: string | null;
  verifiedCount: number;
  accuracyRate: number;
  memberSince: string;

}


export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const INITIAL_USER_PROFILE: UserProfile = {
  name: '',
  email: '',
  role: 'Document Validator & Procurement',
  organization: 'Validex Workspace',
  department: 'Procurement & Reference Validation',
  bio: 'Bertanggung jawab dalam validasi dokumen pengadaan rantai pasok BOM, PR, PO, GRN, PI, dan PP.',
  timezone: 'Asia/Jakarta (GMT+7)',
  verifiedCount: 0,
  accuracyRate: 100,
  memberSince: 'Oktober 2026',
};


export const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'SES-1',
    device: 'ThinkBook 14 G4',
    browser: 'Chrome 128.0',
    os: 'Windows 11 Enterprise',
    ipAddress: '182.253.114.88',
    location: 'Jakarta, Indonesia',
    lastActive: 'Active right now',
    isCurrent: true,
  },
  {
    id: 'SES-2',
    device: 'MacBook Pro 16"',
    browser: 'Safari 18.0',
    os: 'macOS Sequoia',
    ipAddress: '103.111.24.12',
    location: 'Bandung, Indonesia',
    lastActive: '4 hours ago',
    isCurrent: false,
  },
  {
    id: 'SES-3',
    device: 'iPhone 15 Pro',
    browser: 'Validex Mobile PWA',
    os: 'iOS 18.1',
    ipAddress: '182.253.114.88',
    location: 'Jakarta, Indonesia',
    lastActive: 'Yesterday at 08:24 PM',
    isCurrent: false,
  },
];
