import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-forest-200 border-t-forest-500 rounded-full animate-spin" />
                    <p className="text-forest-600 animate-pulse">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // 로그인 후 원래 페이지로 리다이렉트하기 위해 현재 경로 저장
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
