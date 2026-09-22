export interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: string;
  department: string;
  bio: string;
  timezone: string;
  avatarUrl?: string;
  verifiedCount: number;
  accuracyRate: number;
  memberSince: string;
}

export interface ValidationPreferences {
  autoVerifyThreshold: number; // percentage (e.g. 85%)
  enableCrossrefLookup: boolean;
  enablePubMedLookup: boolean;
  enableIeeeLookup: boolean;
  enableSemanticScholarLookup: boolean;
  detectDuplicates: boolean;
  strictDoiFormat: boolean;
  flagRetractedPapers: boolean;
  emailWeeklyDigest: boolean;
  emailBrokenLinkAlerts: boolean;
  browserNotifications: boolean;
  tableDensity: 'comfortable' | 'compact';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  keyMasked: string;
  scope: 'Read-only' | 'Full Validator Access' | 'Admin';
  createdAt: string;
  lastUsedAt: string;
  status: 'active' | 'revoked';
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
  name: 'Dr. John Doe',
  email: 'john@company.com',
  role: 'Lead Research Validator & Data Steward',
  organization: 'Validex Research Labs',
  department: 'Academic Integrity & Citations',
  bio: 'Specializing in deep residual neural network citations, automated registry resolution, and academic integrity verification.',
  timezone: 'Asia/Jakarta (GMT+7)',
  verifiedCount: 1248,
  accuracyRate: 94.5,
  memberSince: 'March 2025',
};

export const INITIAL_PREFERENCES: ValidationPreferences = {
  autoVerifyThreshold: 85,
  enableCrossrefLookup: true,
  enablePubMedLookup: true,
  enableIeeeLookup: true,
  enableSemanticScholarLookup: true,
  detectDuplicates: true,
  strictDoiFormat: true,
  flagRetractedPapers: true,
  emailWeeklyDigest: true,
  emailBrokenLinkAlerts: true,
  browserNotifications: false,
  tableDensity: 'comfortable',
  dateFormat: 'YYYY-MM-DD',
};

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'KEY-001',
    name: 'Production Ingestion Service',
    keyPrefix: 'val_live_',
    keyMasked: 'val_live_••••••••••••982a',
    scope: 'Full Validator Access',
    createdAt: '12 Aug 2026',
    lastUsedAt: '2 mins ago',
    status: 'active',
  },
  {
    id: 'KEY-002',
    name: 'CI/CD Pipeline Citation Linter',
    keyPrefix: 'val_live_',
    keyMasked: 'val_live_••••••••••••47fc',
    scope: 'Read-only',
    createdAt: '01 Sep 2026',
    lastUsedAt: 'Yesterday',
    status: 'active',
  },
  {
    id: 'KEY-003',
    name: 'Staging Integration Key',
    keyPrefix: 'val_test_',
    keyMasked: 'val_test_••••••••••••3f1b',
    scope: 'Admin',
    createdAt: '15 Sep 2026',
    lastUsedAt: '3 days ago',
    status: 'active',
  },
];

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
