export interface TrendDataPoint {
  date: string;
  valid: number;
  pending: number;
  failed: number;
  total: number;
  rate: number; // percentage
}

export interface CategoryAccuracy {
  category: string;
  total: number;
  valid: number;
  failed: number;
  rate: number; // percentage
  avgConfidence: number;
}

export interface RegistrySourceStat {
  source: string;
  queries: number;
  successRate: number;
  avgLatencyMs: number;
}

export interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
  impactLevel: 'critical' | 'moderate' | 'low';
}

export interface DocumentStatItem {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOCX' | 'LaTeX';
  fileSize: string;
  referenceCount: number;
  validationRate: number;
  healthScore: number; // 0-100
  processingTimeSec: number;
  updatedAt: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'Executive Summary' | 'Full Audit Log' | 'Broken References' | 'Citation Coverage';
  format: 'CSV' | 'PDF' | 'JSON';
  size: string;
  dateRange: string;
  generatedAt: string;
  downloadUrl: string;
}

export const MOCK_TREND_DATA: TrendDataPoint[] = [
  { date: '16 Sep', valid: 110, pending: 4, failed: 8, total: 122, rate: 90.2 },
  { date: '17 Sep', valid: 135, pending: 3, failed: 7, total: 145, rate: 93.1 },
  { date: '18 Sep', valid: 158, pending: 6, failed: 9, total: 173, rate: 91.3 },
  { date: '19 Sep', valid: 180, pending: 5, failed: 10, total: 195, rate: 92.3 },
  { date: '20 Sep', valid: 215, pending: 8, failed: 12, total: 235, rate: 91.5 },
  { date: '21 Sep', valid: 192, pending: 3, failed: 6, total: 201, rate: 95.5 },
  { date: '22 Sep', valid: 190, pending: 5, failed: 4, total: 199, rate: 95.4 },
];

export const MOCK_MONTHLY_TREND: TrendDataPoint[] = [
  { date: 'Apr', valid: 620, pending: 30, failed: 55, total: 705, rate: 87.9 },
  { date: 'May', valid: 780, pending: 25, failed: 48, total: 853, rate: 91.4 },
  { date: 'Jun', valid: 910, pending: 22, failed: 44, total: 976, rate: 93.2 },
  { date: 'Jul', valid: 1040, pending: 18, failed: 52, total: 1110, rate: 93.7 },
  { date: 'Aug', valid: 1120, pending: 15, failed: 58, total: 1193, rate: 93.9 },
  { date: 'Sep', valid: 1180, pending: 12, failed: 56, total: 1248, rate: 94.5 },
];

export const MOCK_CATEGORY_ACCURACY: CategoryAccuracy[] = [
  { category: 'Journal Articles', total: 640, valid: 618, failed: 22, rate: 96.6, avgConfidence: 97.4 },
  { category: 'Standards & Specs', total: 285, valid: 268, failed: 17, rate: 94.0, avgConfidence: 94.8 },
  { category: 'Technical Reports', total: 175, valid: 156, failed: 19, rate: 89.1, avgConfidence: 88.5 },
  { category: 'Books & Chapters', total: 96, valid: 91, failed: 5, rate: 94.8, avgConfidence: 93.2 },
  { category: 'Web & Online Docs', total: 52, valid: 47, failed: 5, rate: 90.4, avgConfidence: 89.0 },
];

export const MOCK_REGISTRY_STATS: RegistrySourceStat[] = [
  { source: 'Crossref DOI Index', queries: 814, successRate: 98.4, avgLatencyMs: 240 },
  { source: 'PubMed / NCBI', queries: 320, successRate: 97.2, avgLatencyMs: 310 },
  { source: 'IEEE Xplore API', queries: 210, successRate: 95.8, avgLatencyMs: 420 },
  { source: 'Semantic Scholar', queries: 450, successRate: 93.5, avgLatencyMs: 380 },
  { source: 'ISO Standards Catalog', queries: 140, successRate: 91.0, avgLatencyMs: 510 },
];

export const MOCK_FAILURE_REASONS: FailureReason[] = [
  { reason: 'Broken DOI or Unresolved URL (404/410)', count: 24, percentage: 42.8, impactLevel: 'critical' },
  { reason: 'Author / Editor Name Discrepancy', count: 14, percentage: 25.0, impactLevel: 'moderate' },
  { reason: 'Outdated or Superseded Standard Edition', count: 9, percentage: 16.1, impactLevel: 'moderate' },
  { reason: 'Missing Publication Year or Journal Name', count: 6, percentage: 10.7, impactLevel: 'low' },
  { reason: 'Notice of Retraction / Withdrawn Document', count: 3, percentage: 5.4, impactLevel: 'critical' },
];

export const MOCK_DOCUMENT_STATS: DocumentStatItem[] = [
  {
    id: 'DOC-1001',
    title: 'Annual_AI_Research_Report_2026.pdf',
    fileType: 'PDF',
    fileSize: '4.8 MB',
    referenceCount: 142,
    validationRate: 97.8,
    healthScore: 98,
    processingTimeSec: 2.4,
    updatedAt: '15 mins ago',
  },
  {
    id: 'DOC-1002',
    title: 'Enterprise_Compliance_Doc_v4.docx',
    fileType: 'DOCX',
    fileSize: '2.1 MB',
    referenceCount: 88,
    validationRate: 94.3,
    healthScore: 93,
    processingTimeSec: 1.8,
    updatedAt: '2 hours ago',
  },
  {
    id: 'DOC-1003',
    title: 'Security_Architecture_Blueprint.pdf',
    fileType: 'PDF',
    fileSize: '8.4 MB',
    referenceCount: 95,
    validationRate: 95.8,
    healthScore: 96,
    processingTimeSec: 3.1,
    updatedAt: '4 hours ago',
  },
  {
    id: 'DOC-1004',
    title: 'Medical_Device_Submission_Draft.pdf',
    fileType: 'PDF',
    fileSize: '12.0 MB',
    referenceCount: 184,
    validationRate: 88.6,
    healthScore: 84,
    processingTimeSec: 4.8,
    updatedAt: '1 day ago',
  },
  {
    id: 'DOC-1005',
    title: 'NextGen_Cryptography_Whitepaper.tex',
    fileType: 'LaTeX',
    fileSize: '850 KB',
    referenceCount: 64,
    validationRate: 98.4,
    healthScore: 99,
    processingTimeSec: 1.2,
    updatedAt: '2 days ago',
  },
  {
    id: 'DOC-1006',
    title: 'Cloud_Infrastructure_Policy_2026.docx',
    fileType: 'DOCX',
    fileSize: '1.4 MB',
    referenceCount: 42,
    validationRate: 92.9,
    healthScore: 91,
    processingTimeSec: 1.1,
    updatedAt: '3 days ago',
  },
];

export const MOCK_EXPORT_REPORTS: GeneratedReport[] = [
  {
    id: 'REP-701',
    name: 'Validex_Monthly_Audit_Summary_Sep2026.pdf',
    type: 'Executive Summary',
    format: 'PDF',
    size: '1.8 MB',
    dateRange: '01 Sep 2026 - 22 Sep 2026',
    generatedAt: 'Today at 09:30 AM',
    downloadUrl: '#',
  },
  {
    id: 'REP-702',
    name: 'All_Failed_Broken_Citations_Q3.csv',
    type: 'Broken References',
    format: 'CSV',
    size: '420 KB',
    dateRange: '01 Jul 2026 - 22 Sep 2026',
    generatedAt: 'Yesterday at 04:15 PM',
    downloadUrl: '#',
  },
  {
    id: 'REP-703',
    name: 'Enterprise_Citation_Dataset_Full.json',
    type: 'Full Audit Log',
    format: 'JSON',
    size: '3.4 MB',
    dateRange: '01 Jan 2026 - 22 Sep 2026',
    generatedAt: '18 Sep 2026',
    downloadUrl: '#',
  },
  {
    id: 'REP-704',
    name: 'Document_Validation_Coverage_Matrix.pdf',
    type: 'Citation Coverage',
    format: 'PDF',
    size: '2.1 MB',
    dateRange: 'Last 90 Days',
    generatedAt: '15 Sep 2026',
    downloadUrl: '#',
  },
];
