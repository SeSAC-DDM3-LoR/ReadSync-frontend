import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Search, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { adminUserService } from '../../services/adminService';
import type { AdminUser } from '../../services/adminService';
import AdminSidebar from '../../components/layout/AdminSidebar';

const AdminUsersPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role, currentPage]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const response = await adminUserService.getAllUsers(currentPage, 20);
            setUsers(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (userId: number, status: 'ACTIVE' | 'BANNED') => {
        const action = status === 'BANNED' ? '정지' : '활성화';
        if (!confirm(`해당 회원을 ${action}하시겠습니까?`)) return;

        try {
            await adminUserService.changeUserStatus(userId, status);
            loadUsers();
        } catch (error) {
            console.error('Failed to change status:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">활성</span>;
            case 'BANNED':
                return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">정지</span>;
            case 'WITHDRAWN':
                return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">탈퇴</span>;
            default:
                return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium">{status}</span>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
            case 'ROLE_ADMIN':
                return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">관리자</span>;
            default:
                return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">사용자</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            {/* 사이드바 */}
            <AdminSidebar activePath="/admin/users" />

            {/* 메인 콘텐츠 */}
            <main className="ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">회원 관리</h1>
                        <p className="text-gray-400">전체 회원 목록을 관리합니다.</p>
                    </div>
                </div>

                {/* 검색 */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="닉네임, 아이디로 검색..."
                        className="w-full max-w-md pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none"
                    />
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* 테이블 */}
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">닉네임</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">로그인 ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">역할</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">상태</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">가입일</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {users.map((u) => (
                                        <tr key={u.userId} className="hover:bg-gray-700/30">
                                            <td className="px-6 py-4 text-gray-300">{u.userId}</td>
                                            <td className="px-6 py-4 text-white font-medium">
                                                {u.nickname}
                                                <span className="text-gray-500">#{u.tag}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">{u.loginId || u.provider}</td>
                                            <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">{u.createdAt}</td>
                                            <td className="px-6 py-4">
                                                {u.role !== 'ADMIN' && u.role !== 'ROLE_ADMIN' && (
                                                    <div className="flex gap-2">
                                                        {u.status === 'ACTIVE' ? (
                                                            <button
                                                                onClick={() => handleStatusChange(u.userId, 'BANNED')}
                                                                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
                                                            >
                                                                정지
                                                            </button>
                                                        ) : u.status === 'BANNED' ? (
                                                            <button
                                                                onClick={() => handleStatusChange(u.userId, 'ACTIVE')}
                                                                className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                                                            >
                                                                해제
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 페이지네이션 */}
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

// [Removed internal AdminSidebar]
export default AdminUsersPage;
