import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { completeLogin } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const isNewUser = searchParams.get('isNewUser') === 'true';

        if (accessToken && refreshToken) {
            // 토큰 저장 및 로그인 상태 업데이트
            completeLogin(accessToken, refreshToken);

            if (isNewUser) {
                // 신규 유저는 정보 입력 페이지로 이동
                navigate('/signup', { replace: true });
            } else {
                // 기존 유저는 원래 보던 페이지 또는 메인으로 이동
                const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
                sessionStorage.removeItem('redirectUrl'); // 사용 후 제거
                navigate(redirectUrl, { replace: true });
            }
        } else {
            // 토큰이 없으면 로그인 실패 처리
            alert('로그인에 실패했습니다.');
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate, completeLogin]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-forest-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-forest-800 font-medium">로그인 처리 중...</p>
            </div>
        </div>
    );
}
