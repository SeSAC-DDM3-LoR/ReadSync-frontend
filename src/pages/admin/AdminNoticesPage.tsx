import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bell, Plus, Loader2, Edit2, Trash2
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { noticeService } from '../../services/userService';
import type { Notice } from '../../services/userService';
import { AdminSidebar } from './AdminUsersPage';

const AdminNoticesPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadNotices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role]);

    const loadNotices = async () => {
        setIsLoading(true);
        try {
            const data = await noticeService.getNotices();
            setNotices(data);
        } catch (error) {
            console.error('Failed to load notices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (noticeId: number) => {
        if (!confirm('공지를 삭제하시겠습니까?')) return;
        try {
            await noticeService.deleteNotice(noticeId);
            loadNotices();
        } catch (error) {
            console.error('Failed to delete notice:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const openEditModal = (notice: Notice) => {
        setEditingNotice(notice);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingNotice(null);
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <AdminSidebar active="notices" />

            <main className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">공지 관리</h1>
                        <p className="text-gray-400">공지사항을 관리합니다.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                        <Plus size={20} />
                        공지 작성
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : notices.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell size={64} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">공지사항이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notices.map((notice, index) => (
                            <motion.div
                                key={notice.noticeId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">{notice.title}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(notice)}
                                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(notice.noticeId)}
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-400 mt-2 line-clamp-2">{notice.content}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* 공지 작성/수정 모달 */}
            {showModal && (
                <NoticeModal
                    notice={editingNotice}
                    onClose={() => setShowModal(false)}
                    onSuccess={loadNotices}
                />
            )}
        </div>
    );
};

// 공지 작성/수정 모달
const NoticeModal: React.FC<{
    notice: Notice | null;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ notice, onClose, onSuccess }) => {
    const [title, setTitle] = useState(notice?.title || '');
    const [content, setContent] = useState(notice?.content || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (notice) {
                await noticeService.updateNotice(notice.noticeId, title, content);
            } else {
                await noticeService.createNotice(title, content);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save notice:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gray-800 rounded-3xl p-8 w-full max-w-2xl border border-gray-700"
            >
                <h2 className="text-2xl font-bold text-white mb-6">
                    {notice ? '공지 수정' : '새 공지 작성'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-600 text-gray-300 font-bold rounded-xl hover:bg-gray-700"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {isSubmitting ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminNoticesPage;
