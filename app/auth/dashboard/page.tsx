'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Plus,
    Upload,
    BarChart3,
    HelpCircle,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Types
interface StatsData {
    totalDocuments: number;
    validReferences: number;
    pendingReferences: number;
    validationScore: number;
}

interface Document {
    id: string;
    name: string;
    type: string;
    totalReferences: number;
    validReferences: number;
    pendingReferences: number;
    failedReferences: number;
    validationScore: number;
    status: 'completed' | 'in-progress' | 'failed';
    createdAt: string;
}

interface ValidationStatus {
    name: string;
    value: number;
    color: string;
}

// Stats Card Component
const StatsCard = ({
    icon: Icon,
    title,
    value,
    trend,
    color,
    loading,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    trend?: string;
    color: string;
    loading: boolean;
}) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                    <>
                        <p className={`text-3xl font-bold ${color} mb-2`}>{value}</p>
                        {trend && <p className="text-xs text-green-600 font-medium">{trend}</p>}
                    </>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color === 'text-blue-600' ? 'bg-blue-100' : color === 'text-green-600' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    </div>
);

// Document Row Component
const DocumentRow = ({ doc }: { doc: Document }) => {
    const statusColors = {
        completed: 'bg-green-50 text-green-700 border-green-200',
        'in-progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        failed: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{doc.name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
            <td className="px-6 py-4 text-sm text-center font-medium text-gray-900">
                {doc.totalReferences}
            </td>
            <td className="px-6 py-4 text-sm">
                <span className="font-medium text-green-600">{doc.validReferences}</span>
            </td>
            <td className="px-6 py-4 text-sm">
                <span className="font-medium text-yellow-600">{doc.pendingReferences}</span>
            </td>
            <td className="px-6 py-4 text-sm">
                <span className="font-medium text-red-600">{doc.failedReferences}</span>
            </td>
            <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${doc.validationScore}%` }}
                        ></div>
                    </div>
                    <span className="font-semibold text-gray-900">{doc.validationScore}%</span>
                </div>
            </td>
            <td className="px-6 py-4 text-sm">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[doc.status]}`}
                >
                    {doc.status === 'in-progress' ? 'In Progress' : doc.status === 'completed' ? 'Completed' : 'Failed'}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View
                </button>
            </td>
        </tr>
    );
};

// Main Dashboard
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [validationData, setValidationData] = useState<ValidationStatus[]>([]);

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // TODO: Replace with actual API calls
                // const statsRes = await fetch('/api/dashboard/stats');
                // const docsRes = await fetch('/api/documents?limit=5');

                // Mock data untuk development
                setStats({
                    totalDocuments: 24,
                    validReferences: 187,
                    pendingReferences: 18,
                    validationScore: 92,
                });

                setDocuments([
                    {
                        id: '1',
                        name: 'Annual Report 2024',
                        type: 'PDF',
                        totalReferences: 45,
                        validReferences: 41,
                        pendingReferences: 3,
                        failedReferences: 1,
                        validationScore: 95,
                        status: 'completed',
                        createdAt: '2024-09-01',
                    },
                    {
                        id: '2',
                        name: 'Q3 Financial Statement',
                        type: 'DOCX',
                        totalReferences: 32,
                        validReferences: 30,
                        pendingReferences: 2,
                        failedReferences: 0,
                        validationScore: 94,
                        status: 'completed',
                        createdAt: '2024-08-28',
                    },
                    {
                        id: '3',
                        name: 'Research Paper Draft',
                        type: 'PDF',
                        totalReferences: 67,
                        validReferences: 58,
                        pendingReferences: 8,
                        failedReferences: 1,
                        validationScore: 87,
                        status: 'in-progress',
                        createdAt: '2024-08-25',
                    },
                    {
                        id: '4',
                        name: 'Technical Documentation',
                        type: 'DOCX',
                        totalReferences: 28,
                        validReferences: 28,
                        pendingReferences: 0,
                        failedReferences: 0,
                        validationScore: 100,
                        status: 'completed',
                        createdAt: '2024-08-20',
                    },
                    {
                        id: '5',
                        name: 'Compliance Report',
                        type: 'PDF',
                        totalReferences: 15,
                        validReferences: 14,
                        pendingReferences: 1,
                        failedReferences: 0,
                        validationScore: 93,
                        status: 'completed',
                        createdAt: '2024-08-15',
                    },
                ]);

                setValidationData([
                    { name: 'Valid', value: 187, color: '#00A86B' },
                    { name: 'Pending', value: 18, color: '#F59E0B' },
                    { name: 'Failed', value: 2, color: '#DC2626' },
                ]);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back! Here's your validation overview.</p>
                        </div>
                        <div className="flex gap-3 mt-4 sm:mt-0">
                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
                                <Upload className="w-4 h-4" />
                                <span className="hidden sm:inline">Upload Document</span>
                            </button>
                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">New Document</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        icon={FileText}
                        title="Total Documents"
                        value={stats?.totalDocuments ?? '-'}
                        trend="+3 this week"
                        color="text-blue-600"
                        loading={loading}
                    />
                    <StatsCard
                        icon={CheckCircle}
                        title="Valid References"
                        value={stats?.validReferences ?? '-'}
                        trend="91% validation rate"
                        color="text-green-600"
                        loading={loading}
                    />
                    <StatsCard
                        icon={AlertCircle}
                        title="Pending Review"
                        value={stats?.pendingReferences ?? '-'}
                        trend="9% pending"
                        color="text-yellow-600"
                        loading={loading}
                    />
                    <StatsCard
                        icon={TrendingUp}
                        title="Validation Score"
                        value={`${stats?.validationScore ?? '-'}%`}
                        trend="+5% since last month"
                        color="text-blue-600"
                        loading={loading}
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Documents - Full Width */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
                                <a
                                    href="/dashboard/documents"
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                >
                                    View All <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>

                            {loading ? (
                                <div className="px-6 py-8 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : documents.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                                    Document
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                                                <th className="px-6 py-3 text-center font-semibold text-gray-700">
                                                    Refs
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                                    Valid
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                                    Pend
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                                    Failed
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                                    Score
                                                </th>
                                                <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.map((doc) => (
                                                <DocumentRow key={doc.id} doc={doc} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium mb-2">No documents yet</p>
                                    <p className="text-gray-500 text-sm mb-4">
                                        Upload your first document to get started
                                    </p>
                                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                        <Upload className="w-4 h-4" />
                                        Upload Document
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Validation Status Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Validation Status</h2>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : validationData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={validationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {validationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `${value} refs`}
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="space-y-3 mt-6">
                                    {validationData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                ></div>
                                                <span className="text-sm text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <button className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
                        <div className="p-3 bg-blue-600 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">Generate Report</p>
                            <p className="text-sm text-gray-600">Create detailed validation report</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-600 ml-auto" />
                    </button>

                    <button className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition">
                        <div className="p-3 bg-green-600 rounded-lg">
                            <HelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">Get Help</p>
                            <p className="text-sm text-gray-600">Browse documentation & FAQs</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-green-600 ml-auto" />
                    </button>
                </div>
            </div>
        </div>
    );
}
