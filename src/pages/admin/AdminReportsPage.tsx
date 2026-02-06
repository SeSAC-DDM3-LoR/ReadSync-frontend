import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, ChevronLeft, ChevronRight, Loader2,
    Check, X
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { adminReportService } from '../../services/adminService';
import type { Report } from '../../services/adminService';
import AdminSidebar from '../../components/layout/AdminSidebar';

const AdminReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');

    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role, currentPage, statusFilter]);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const response = await adminReportService.getReports(statusFilter, currentPage, 20);
            setReports(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async (reportId: number, status: 'PROCESSED' | 'REJECTED') => {
        const action = status === 'PROCESSED' ? '승인' : '반려';
        if (!confirm(`신고를 ${action}하시겠습니까?`)) return;

        try {
            await adminReportService.processReport(reportId, status);
            loadReports();
        } catch (error) {
            console.error('Failed to process report:', error);
            alert('처리에 실패했습니다.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium">대기</span>;
            case 'PROCESSED':
                return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">처리</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">반려</span>;
            default:
                return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <AdminSidebar activePath="/admin/reports" />

            <main className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">신고 관리</h1>
                        <p className="text-gray-400">접수된 신고를 확인하고 처리합니다.</p>
                    </div>
                </div>

                {/* 필터 */}
                <div className="flex gap-2 mb-6">
                    {['PENDING', 'PROCESSED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setCurrentPage(0); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${statusFilter === status
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {status === 'PENDING' && '대기'}
                            {status === 'PROCESSED' && '처리완료'}
                            {status === 'REJECTED' && '반려'}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20">
                        <AlertTriangle size={64} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">신고 내역이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">신고자</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">대상자</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">사유</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">일시</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">처리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {reports.map((report) => (
                                        <tr key={report.reportId} className="hover:bg-gray-700/30">
                                            <td className="px-6 py-4 text-gray-300">{report.reportId}</td>
                                            <td className="px-6 py-4 text-white">{report.reporterName}</td>
                                            <td className="px-6 py-4 text-white">{report.targetUserName}</td>
                                            <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{report.reason}</td>
                                            <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {report.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleProcess(report.reportId, 'PROCESSED')}
                                                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleProcess(report.reportId, 'REJECTED')}
                                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 disabled:opacity-50"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-gray-400 px-4">
                                    {currentPage + 1} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 disabled:opacity-50"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminReportsPage;
