import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, BookOpen, AlertTriangle,
    TrendingUp, ArrowUpRight, Loader2, Shield, MessageSquareWarning
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { adminUserService, adminReportService, adminBookService } from '../../services/adminService';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingReports: 0,
        todaySignups: 0,
        totalBooks: 0,
    });

    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role]);

    // 오늘 날짜인지 확인하는 헬퍼 함수
    const isToday = (dateString: string): boolean => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
    };

    const loadStats = async () => {
        try {
            const [usersRes, reportsRes, booksRes] = await Promise.all([
                adminUserService.getAllUsers(0, 1000).catch(() => ({ content: [], totalElements: 0 })),
                adminReportService.getReports('PENDING', 0, 1).catch(() => ({ totalElements: 0 })),
                adminBookService.getAllBooks(0, 1).catch(() => ({ totalElements: 0 })),
            ]);

            // 오늘 가입한 유저 수 계산
            const todaySignups = usersRes.content
                ? usersRes.content.filter((user: { createdAt: string }) => isToday(user.createdAt)).length
                : 0;

            setStats({
                totalUsers: usersRes.totalElements || 0,
                pendingReports: reportsRes.totalElements || 0,
                todaySignups,
                totalBooks: booksRes.totalElements || 0,
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const menuItems = [
        { path: '/admin/users', label: '회원 관리', icon: Users },
        { path: '/admin/books', label: '도서 관리', icon: BookOpen },
        { path: '/admin/reports', label: '회원 신고 관리', icon: AlertTriangle },
        { path: '/admin/content-reports', label: '댓글/리뷰 신고 관리', icon: MessageSquareWarning },
        // { path: '/admin/notices', label: '공지 관리', icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-gray-900">
            {/* 사이드바 */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Shield size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">ReadSync</h1>
                        <p className="text-gray-400 text-xs">Admin Panel</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400"
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">대시보드</span>
                    </Link>

                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {/* {item.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.highlight ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'
                                        }`}>
                                        {item.count}
                                    </span>
                                )} */}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <Link
                        to="/"
                        className="block text-center py-3 text-gray-400 hover:text-white transition-colors"
                    >
                        ← 사이트로 돌아가기
                    </Link>
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="ml-64 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">대시보드</h1>
                    <p className="text-gray-400">ReadSync 관리자 페이지에 오신 것을 환영합니다.</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* 통계 카드 */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                label="전체 회원"
                                value={stats.totalUsers}
                                icon={<Users className="text-blue-400" />}
                                color="blue"
                            />
                            <StatCard
                                label="대기 중 신고"
                                value={stats.pendingReports}
                                icon={<AlertTriangle className="text-amber-400" />}
                                color="amber"
                                highlight={stats.pendingReports > 0}
                            />
                            <StatCard
                                label="전체 도서"
                                value={stats.totalBooks}
                                icon={<BookOpen className="text-purple-400" />}
                                color="purple"
                            />
                            <StatCard
                                label="신규 가입"
                                value={stats.todaySignups}
                                icon={<TrendingUp className="text-green-400" />}
                                color="green"
                            />
                        </div>

                        {/* 빠른 링크 */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <QuickLinkCard
                                title="회원 관리"
                                description="회원 목록 조회 및 상태 변경"
                                link="/admin/users"
                                icon={<Users size={24} />}
                            />
                            <QuickLinkCard
                                title="신고 관리"
                                description="신고 내역 확인 및 처리"
                                link="/admin/reports"
                                icon={<AlertTriangle size={24} />}
                                highlight={stats.pendingReports > 0}
                            />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    highlight?: boolean;
}> = ({ label, value, icon, color, highlight }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gray-800 rounded-2xl p-6 border ${highlight ? 'border-red-500' : 'border-gray-700'
            }`}
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-${color}-500/20`}>
                {icon}
            </div>
        </div>
        <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</p>
        <p className="text-gray-400 text-sm">{label}</p>
    </motion.div>
);

const QuickLinkCard: React.FC<{
    title: string;
    description: string;
    link: string;
    icon: React.ReactNode;
    highlight?: boolean;
}> = ({ title, description, link, icon, highlight }) => (
    <Link to={link}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-gray-800 rounded-2xl p-6 border ${highlight ? 'border-red-500' : 'border-gray-700'
                } hover:border-emerald-500 transition-colors`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gray-700 text-emerald-400">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">{title}</h3>
                        <p className="text-gray-400 text-sm">{description}</p>
                    </div>
                </div>
                <ArrowUpRight className="text-gray-500" />
            </div>
        </motion.div>
    </Link>
);

export default AdminDashboard;
