export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'citations' | 'documents' | 'integrations' | 'account';
  tags: string[];
}

export interface QuickGuideItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  readTime: string;
  steps: string[];
}

export interface SystemServiceStatus {
  service: string;
  status: 'operational' | 'degraded' | 'maintenance';
  latency: string;
  uptime: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

export const MOCK_SYSTEM_STATUSES: SystemServiceStatus[] = [
  { service: 'Crossref DOI Gateway', status: 'operational', latency: '240ms', uptime: '99.98%' },
  { service: 'PubMed / NCBI API', status: 'operational', latency: '310ms', uptime: '99.95%' },
  { service: 'IEEE Xplore Connector', status: 'operational', latency: '420ms', uptime: '99.92%' },
  { service: 'Semantic Scholar Graph', status: 'operational', latency: '380ms', uptime: '99.90%' },
  { service: 'Validex OCR & Parsing Core', status: 'operational', latency: '120ms', uptime: '100.0%' },
];

export const MOCK_QUICK_GUIDES: QuickGuideItem[] = [
  {
    id: 'guide-1',
    title: 'Validating References in 3 Steps',
    description: 'Track citations, initiate automated registry lookup, and inspect flagged errors.',
    badge: 'Beginner',
    readTime: '3 min read',
    steps: [
      'Navigate to References to inspect your bibliography and citations.',
      'Validex automatically extracts DOI metadata and initiates Crossref & PubMed queries.',
      'Inspect the generated validation card, resolve pending references, and export clean datasets.',
    ],
  },
  {
    id: 'guide-2',
    title: 'Resolving Broken & 404/410 Citation Links',
    description: 'How to remediate superseded ISO standards, redirected publisher URLs, and author spelling discrepancies.',
    badge: 'Citations',
    readTime: '5 min read',
    steps: [
      'Filter references by "Failed / Broken" in the References tab.',
      'Check the issue details banner (e.g. Unresolved DOI, superseded edition, or author variance).',
      'Click Revalidate to query Crossref updates or manually update the canonical citation string.',
    ],
  },
  {
    id: 'guide-3',
    title: 'Automating Validation in CI/CD via REST API',
    description: 'Hook Validex into GitHub Actions or Overleaf git repositories to ensure every commit is citation-compliant.',
    badge: 'Developers',
    readTime: '4 min read',
    steps: [
      'Generate a scoped API key from Settings > API Keys.',
      'POST your document or BibTeX file payload to https://api.validex.io/v1/validate.',
      'Assert against the JSON response validationRate >= 95% in your test pipeline.',
    ],
  },
];

export const MOCK_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How does Validex calculate the Citation Confidence Score?',
    answer: 'The Confidence Score (0-100%) is computed via a multi-layered verification algorithm comparing: (1) exact DOI resolution against Crossref, (2) publisher title similarity via Levenshtein string distance, (3) primary author surname matching, and (4) publication year consistency. Matches above 85% are automatically certified as Valid.',
    category: 'citations',
    tags: ['confidence', 'algorithm', 'score', 'matching'],
  },
  {
    id: 'faq-2',
    question: 'What should I do if a valid paper is flagged as "Failed / Broken"?',
    answer: 'This commonly happens when a publisher changes their URL structure or when an older paper lacks a canonical DOI. You can click on the citation in the References view, inspect the exact issue description, and use the "Revalidate" button to trigger an exhaustive Crossref, Semantic Scholar, and PubMed fallback query.',
    category: 'citations',
    tags: ['failed', 'broken', 'doi', 'revalidate'],
  },
  {
    id: 'faq-3',
    question: 'How are retracted or withdrawn academic papers identified?',
    answer: 'Validex integrates with the Retraction Watch database and Crossref Crossmark metadata. If a paper cited in your document has been retracted, an alert badge is placed on the citation with the retraction notice date and reason.',
    category: 'citations',
    tags: ['retraction', 'withdrawn', 'academic', 'integrity'],
  },
  {
    id: 'faq-4',
    question: 'Which file formats and document sizes are supported?',
    answer: 'Validex supports PDF (.pdf), Microsoft Word (.docx), and LaTeX (.tex / .bib) files up to 50 MB per document. Multi-column academic layouts and footnotes are natively parsed using our layout-aware OCR engine.',
    category: 'documents',
    tags: ['pdf', 'docx', 'latex', 'file size', 'formats'],
  },
  {
    id: 'faq-5',
    question: 'How can I connect my Zotero or Mendeley bibliography?',
    answer: 'You can export your .bib or .ris citation file directly from Zotero or Mendeley and import it seamlessly into Validex for instant verification.',
    category: 'integrations',
    tags: ['zotero', 'mendeley', 'bibtex', 'sync'],
  },
  {
    id: 'faq-6',
    question: 'What are the rate limits for the Developer REST API?',
    answer: 'Standard workspace accounts include 1,000 API requests per hour. Enterprise accounts support concurrent bulk validations with up to 100,000 queries per day.',
    category: 'integrations',
    tags: ['api', 'rate limit', 'developer', 'endpoint'],
  },
  {
    id: 'faq-7',
    question: 'Is my manuscript and citation data encrypted?',
    answer: 'Yes. All uploaded manuscripts and extracted citations are encrypted in transit using TLS 1.3 and at rest using AES-256. Validex does not train AI models on your private documents. You can delete documents or export complete workspace archives at any time from Settings > Security.',
    category: 'account',
    tags: ['security', 'encryption', 'privacy', 'gdpr'],
  },
  {
    id: 'faq-8',
    question: 'How do I export audit reports for compliance?',
    answer: 'To export compliance-ready audit summaries, you can filter citations by date range and validation status directly in the References view and export data manifests.',
    category: 'account',
    tags: ['export', 'audit', 'compliance', 'reports'],
  },
];
