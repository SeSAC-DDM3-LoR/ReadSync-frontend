import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    BookOpen, 
    LogOut, 
    Home, 
    Settings 
} from 'lucide-react';

export function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">RS</span>
                        Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</div>
                    
                    {/* 대시보드 (현재 페이지) */}
                    <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl">
                        <LayoutDashboard className="w-5 h-5" />
                        대시보드
                    </Link>
                    
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors text-left opacity-50 cursor-not-allowed">
                        <Users className="w-5 h-5" />
                        회원 관리
                    </button>
                    
                    {/* [수정됨] 도서 관리 페이지로 이동하는 링크 활성화 */}
                    <Link to="/admin/books" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors">
                        <BookOpen className="w-5 h-5" />
                        도서 관리
                    </Link>

                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors text-left opacity-50 cursor-not-allowed">
                        <Settings className="w-5 h-5" />
                        시스템 설정
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-emerald-400 rounded-xl transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        메인 사이트 이동
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-red-400 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">대시보드</h2>
                        <p className="text-slate-500 mt-1">
                            접속 계정: <span className="font-semibold text-blue-600">{user?.userName} ({user?.loginId})</span>
                        </p>
                    </div>
                </header>

                {/* Status Cards (Dummy Data) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-sm font-medium mb-2">총 사용자</h3>
                        <p className="text-3xl font-bold text-slate-800">1,234</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-sm font-medium mb-2">오늘 방문자</h3>
                        <p className="text-3xl font-bold text-slate-800">128</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-slate-500 text-sm font-medium mb-2">신규 콘텐츠</h3>
                        <p className="text-3xl font-bold text-slate-800">12</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                    <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                        <LayoutDashboard className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">관리자 기능 준비 중</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        현재 관리자 로그인 기능이 정상적으로 연동되었습니다.<br/>
                        좌측 메뉴의 <strong>'도서 관리'</strong>를 눌러 책을 등록하거나 조회할 수 있습니다.
                    </p>
                </div>
            </main>
        </div>
    );
}