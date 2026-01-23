import { useAuth } from '../contexts/AuthContext';
import { Sprout, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginPage() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleLogin = (provider: 'kakao' | 'naver' | 'google') => {
        sessionStorage.setItem('redirectUrl', from);
        login(provider);
    };

    // 이미 로그인된 경우 메인으로 리다이렉트
    if (isAuthenticated) {
        navigate(from, { replace: true });
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-forest-50 via-forest-100/50 to-forest-200/30 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-forest-300/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-forest-400/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-forest-200/30 to-transparent rounded-full" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Back button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute -top-16 left-0 flex items-center gap-2 text-forest-600 hover:text-forest-800 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">홈으로 돌아가기</span>
                </button>

                {/* Login Card */}
                <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl shadow-forest-500/10 border border-white/50 p-10">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <div className="inline-flex p-4 bg-gradient-to-br from-forest-500 to-forest-600 rounded-2xl text-white shadow-lg shadow-forest-500/30 mb-6 transform hover:scale-105 transition-transform">
                            <Sprout className="w-10 h-10" fill="currentColor" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-forest-900 mb-2">
                            ReadSync
                        </h1>
                        <p className="text-forest-600">함께 읽는 즐거움, 성장하는 나</p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-4">
                        {/* Kakao */}
                        <button
                            onClick={() => handleLogin('kakao')}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-[#191919] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                            style={{ backgroundColor: '#FEE500' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#191919">
                                <path d="M12 3C6.477 3 2 6.463 2 10.692c0 2.627 1.753 4.93 4.397 6.27-.193.68-.703 2.517-.807 2.912-.126.487.18.478.38.352.157-.1 2.5-1.63 3.502-2.276.499.074 1.01.112 1.528.112 5.523 0 10-3.463 10-7.37C21 6.463 17.523 3 12 3" />
                            </svg>
                            카카오로 시작하기
                        </button>

                        {/* Naver */}
                        <button
                            onClick={() => handleLogin('naver')}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                            style={{ backgroundColor: '#03C75A' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
                                <path d="M16.273 12.845L7.376 3H3v18h4.726V11.155L16.624 21H21V3h-4.727v9.845z" />
                            </svg>
                            네이버로 시작하기
                        </button>

                        {/* Google */}
                        <button
                            onClick={() => handleLogin('google')}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-gray-700 bg-white border-2 border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 active:translate-y-0"
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google로 시작하기
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-forest-200 to-transparent" />
                        <span className="text-sm text-forest-400">또는</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-forest-200 to-transparent" />
                    </div>

                    {/* Guest mode info */}
                    <div className="text-center">
                        <p className="text-sm text-forest-500 mb-3">
                            로그인 없이도 도서를 둘러볼 수 있어요
                        </p>
                        <button
                            onClick={() => navigate('/books')}
                            className="text-forest-600 hover:text-forest-800 font-medium underline-offset-4 hover:underline transition-colors"
                        >
                            둘러보기 →
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-forest-400 mt-8">
                    로그인 시 <span className="underline cursor-pointer hover:text-forest-600">이용약관</span> 및{' '}
                    <span className="underline cursor-pointer hover:text-forest-600">개인정보처리방침</span>에 동의합니다.
                </p>
            </div>
        </div>
    );
}
