import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { completeLogin } = useAuth();

    useEffect(() => {
        const processLogin = async () => {
            // URL 파라미터에서 토큰 추출
            const accessToken = searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken');

            if (accessToken) {
                try {
                    // 로그인 처리
                    await completeLogin(accessToken, refreshToken || '');
                    // 성공 시 메인으로 이동
                    navigate('/', { replace: true });
                } catch (error) {
                    console.error('Login processing failed:', error);
                    alert('로그인 처리 중 오류가 발생했습니다.');
                    navigate('/login', { replace: true });
                }
            } else {
                // 토큰이 없으면 로그인 페이지로
                console.error('No tokens found in URL');
                navigate('/login', { replace: true });
            }
        };

        processLogin();
    }, [searchParams, completeLogin, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-forest-50">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-forest-600 mx-auto mb-4" />
                <p className="text-forest-800 font-medium">로그인 처리 중입니다...</p>
            </div>
        </div>
    );
}