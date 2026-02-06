import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquareWarning, ChevronLeft, ChevronRight, Loader2,
    Check, X, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import adminContentReportService from '../../services/adminContentReportService';
import type {
    ContentReport,
    ContentReportDetail,
    ContentReportProcessStatus,
    ContentReportTargetType
} from '../../services/adminContentReportService';
import AdminSidebar from '../../components/layout/AdminSidebar';

const AdminContentReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [reports, setReports] = useState<ContentReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState<ContentReportProcessStatus | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<ContentReportTargetType | undefined>(undefined);

    // 상세 모달
    const [selectedReport, setSelectedReport] = useState<ContentReportDetail | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role, currentPage, statusFilter, typeFilter]);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const response = await adminContentReportService.getContentReports(
                statusFilter,
                typeFilter,
                currentPage,
                20
            );
            // API 응답 검증
            if (response && response.content) {
                setReports(response.content);
                setTotalPages(response.totalPages || 0);
            } else {
                console.warn('Invalid response format:', response);
                setReports([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Failed to load content reports:', error);
            // 에러 발생 시 빈 배열로 초기화
            setReports([]);
            setTotalPages(0);
            alert('신고 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowDetail = async (reportId: number) => {
        try {
            const detail = await adminContentReportService.getContentReportDetail(reportId);
            setSelectedReport(detail);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Failed to load report detail:', error);
            alert('신고 상세 정보를 불러오는데 실패했습니다.');
        }
    };

    const handleProcess = async (reportId: number, intent: 'ACCEPT' | 'REJECT') => {
        const action = intent === 'ACCEPT' ? '승인' : '거부';
        if (!confirm(`신고를 ${action}하시겠습니까?`)) return;

        try {
            await adminContentReportService.updateContentReportStatus(reportId, intent);
            setShowDetailModal(false);
            loadReports();
        } catch (error) {
            console.error('Failed to process report:', error);
            alert('처리에 실패했습니다.');
        }
    };

    const getStatusBadge = (status: ContentReportProcessStatus) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium">대기</span>;
            case 'ACCEPTED':
                return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">승인</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">거부</span>;
        }
    };

    const getTypeBadge = (type: ContentReportTargetType) => {
        switch (type) {
            case 'CHAPTERS_COMMENT':
                return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">챕터 댓글</span>;
            case 'REVIEW':
                return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">리뷰</span>;
        }
    };

    const getReasonTypeName = (reasonType: string) => {
        switch (reasonType) {
            case 'SPOILER': return '스포일러';
            case 'ABUSE': return '욕설/비방';
            case 'ADVERTISEMENT': return '광고';
            default: return reasonType;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <AdminSidebar activePath="/admin/content-reports" />

            <main className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">댓글/리뷰 신고 관리</h1>
                        <p className="text-gray-400">접수된 댓글 및 리뷰 신고를 확인하고 처리합니다.</p>
                    </div>
                </div>

                {/* 필터 */}
                <div className="mb-6">
                    <div className="flex gap-2 mb-3">
                        <span className="text-gray-400 text-sm flex items-center">상태:</span>
                        <button
                            onClick={() => { setStatusFilter(undefined); setCurrentPage(0); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${statusFilter === undefined
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            전체
                        </button>
                        {(['PENDING', 'ACCEPTED', 'REJECTED'] as ContentReportProcessStatus[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setCurrentPage(0); }}
                                className={`px-4 py-2 rounded-xl font-medium transition-colors ${statusFilter === status
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {status === 'PENDING' && '대기'}
                                {status === 'ACCEPTED' && '승인'}
                                {status === 'REJECTED' && '거부'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <span className="text-gray-400 text-sm flex items-center">유형:</span>
                        <button
                            onClick={() => { setTypeFilter(undefined); setCurrentPage(0); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${typeFilter === undefined
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            전체
                        </button>
                        {(['CHAPTERS_COMMENT', 'REVIEW'] as ContentReportTargetType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => { setTypeFilter(type); setCurrentPage(0); }}
                                className={`px-4 py-2 rounded-xl font-medium transition-colors ${typeFilter === type
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {type === 'CHAPTERS_COMMENT' && '챕터 댓글'}
                                {type === 'REVIEW' && '리뷰'}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : !reports || reports.length === 0 ? (
                    <div className="text-center py-20">
                        <MessageSquareWarning size={64} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">신고 내역이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">유형</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">신고자</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">신고 사유</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">일시</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">처리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {reports.map((report) => (
                                        <tr key={report.reportId} className="hover:bg-gray-700/30">
                                            <td className="px-6 py-4 text-gray-300">{report.reportId}</td>
                                            <td className="px-6 py-4">{getTypeBadge(report.targetType)}</td>
                                            <td className="px-6 py-4 text-white">{report.reporterName}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-300 text-sm">
                                                    <span className="font-medium text-emerald-400">
                                                        {getReasonTypeName(report.reasonType)}
                                                    </span>
                                                    {report.reasonDetail && (
                                                        <p className="text-gray-400 mt-1 max-w-xs truncate">
                                                            {report.reasonDetail}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(report.processStatus)}</td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleShowDetail(report.reportId)}
                                                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                                        title="상세 보기"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {report.processStatus === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleProcess(report.reportId, 'ACCEPT')}
                                                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                                                                title="승인"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcess(report.reportId, 'REJECT')}
                                                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                                                title="거부"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
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

            {/* 상세 모달 */}
            <AnimatePresence>
                {showDetailModal && selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white">신고 상세 정보</h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-2 hover:bg-gray-700 rounded-lg"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-gray-400 text-sm">신고 ID</label>
                                    <p className="text-white font-medium">{selectedReport.reportId}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-gray-400 text-sm">유형</label>
                                        <div className="mt-1">{getTypeBadge(selectedReport.targetType)}</div>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm">상태</label>
                                        <div className="mt-1">{getStatusBadge(selectedReport.processStatus)}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm">신고자</label>
                                    <p className="text-white">{selectedReport.reporterName}</p>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm">신고 사유</label>
                                    <p className="text-emerald-400 font-medium">
                                        {getReasonTypeName(selectedReport.reasonType)}
                                    </p>
                                    {selectedReport.reasonDetail && (
                                        <p className="text-gray-300 mt-2">{selectedReport.reasonDetail}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm">신고된 콘텐츠</label>
                                    <div className="mt-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <p className="text-gray-300 whitespace-pre-wrap">
                                            {selectedReport.targetContent}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm">신고일시</label>
                                    <p className="text-gray-300">
                                        {new Date(selectedReport.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {selectedReport.processStatus === 'PENDING' && (
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => handleProcess(selectedReport.reportId, 'ACCEPT')}
                                        className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium"
                                    >
                                        신고 승인
                                    </button>
                                    <button
                                        onClick={() => handleProcess(selectedReport.reportId, 'REJECT')}
                                        className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                                    >
                                        신고 거부
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminContentReportsPage;
