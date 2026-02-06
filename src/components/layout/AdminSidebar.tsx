import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, AlertTriangle,
    Shield, MessageSquareWarning, Tag, Bell
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

interface AdminSidebarProps {
    activePath?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePath }) => {
    // URL 매칭을 위해 현재 경로 가져오기 (props가 없으면 window location 사용)
    const currentPath = activePath || window.location.pathname;

    const menuItems = [
        { path: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
        { path: '/admin/users', label: '회원 관리', icon: Users },
        { path: '/admin/books', label: '도서 관리', icon: BookOpen },
        { path: '/admin/categories', label: '카테고리 관리', icon: Tag },
        { path: '/admin/reports', label: '회원 신고 관리', icon: AlertTriangle },
        { path: '/admin/content-reports', label: '댓글/리뷰 신고 관리', icon: MessageSquareWarning },
        { path: '/admin/notices', label: '공지 관리', icon: Bell },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 p-6 z-40">
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
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
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
    );
};

export default AdminSidebar;
