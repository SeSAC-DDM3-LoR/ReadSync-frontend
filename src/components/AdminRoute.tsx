import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // 1. 로딩 중일 때는 리다이렉트 하지 않고 대기
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    // 2. 로그인하지 않은 경우 -> 어드민 로그인 페이지로
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // 3. 로그인했지만 관리자가 아닌 경우 -> 메인 페이지로 튕겨내기
    if (user?.role !== 'ADMIN') {
        // alert('관리자 권한이 없습니다.'); // 필요 시 주석 해제
        return <Navigate to="/" replace />;
    }

    // 4. 관리자 통과
    return <>{children}</>;
}