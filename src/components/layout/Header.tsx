import { useState } from 'react';
import { Sprout, BookOpen, MessageCircle, LogIn, LogOut, Menu, X, User, Library, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const navItems = [
        { label: '도서', path: '/books', icon: ShoppingCart },
        { label: '서재', path: '/library', icon: Library },
        { label: '커뮤니티', path: '/community', icon: MessageCircle },
    ];

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-forest-100 z-50 transition-all duration-300">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

                {/* Logo Area */}
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate('/')}
                >
                    <div className="p-2 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl text-white shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                        <Sprout className="w-5 h-5" fill="currentColor" />
                    </div>
                    <span className="font-serif font-bold text-xl text-forest-900 tracking-tight group-hover:text-forest-700 transition-colors">
                        ReadSync
                    </span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        const Icon = item.icon;

                        return (
                            <Button
                                key={item.label}
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "gap-2 font-medium transition-all duration-200 rounded-full px-4 border border-transparent",
                                    isActive
                                        ? "bg-forest-50 text-forest-700 border-forest-100 shadow-sm"
                                        : "text-slate-600 hover:text-forest-700 hover:bg-forest-50/50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "fill-forest-200" : "")} />
                                {item.label}
                            </Button>
                        );
                    })}
                </nav>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated && user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-forest-50 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-forest-400 to-forest-600 rounded-full flex items-center justify-center text-white shadow-md">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-forest-900">{user.userName}</p>
                                    <p className="text-xs text-forest-500">Lv.{user.level}</p>
                                </div>
                            </button>

                            {/* Dropdown */}
                            {isUserMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-forest-100 py-2">
                                    <button
                                        onClick={() => { navigate('/mypage'); setIsUserMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-forest-700 hover:bg-forest-50 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        마이페이지
                                    </button>
                                    <button
                                        onClick={() => { navigate('/library'); setIsUserMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-forest-700 hover:bg-forest-50 transition-colors"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        내 서재
                                    </button>
                                    <div className="h-px bg-forest-100 my-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/login')}
                            className="rounded-full px-5 shadow-md hover:shadow-lg hover:shadow-forest-500/20 transition-all"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            로그인
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-4">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Button
                                key={item.label}
                                variant="ghost"
                                className="justify-start w-full text-lg h-12"
                                onClick={() => {
                                    navigate(item.path);
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                    <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-forest-400 to-forest-600 rounded-full flex items-center justify-center text-white">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-forest-900">{user?.userName}</p>
                                        <p className="text-sm text-forest-500">Lv.{user?.level}</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="justify-center w-full" onClick={handleLogout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    로그아웃
                                </Button>
                            </>
                        ) : (
                            <Button variant="primary" className="justify-center w-full" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                                <LogIn className="w-4 h-4 mr-2" />
                                로그인 / 회원가입
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop for user menu */}
            {isUserMenuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                />
            )}
        </header>
    );
}
