import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Chrome } from 'lucide-react';
import authService from '../services/authService';

// 카카오 아이콘 컴포넌트
const KakaoIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.93 5.42 4.8 6.83-.17.61-.64 2.2-.73 2.54-.11.43.16.42.33.31.14-.09 2.18-1.46 3.06-2.06.51.07 1.03.11 1.54.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
);

// 네이버 아이콘 컴포넌트
const NaverIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
    </svg>
);

const LoginPage: React.FC = () => {

    // 소셜 로그인 - OAuth URL로 리다이렉트
    const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
        const oauthUrl = authService.getOAuthUrl(provider);
        window.location.href = oauthUrl;
    };

    return (
        <div className="min-h-screen flex">
            {/* 좌측: 일러스트레이션 영역 */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 relative overflow-hidden">
                {/* 배경 장식 */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
                </div>

                {/* 콘텐츠 */}
                <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <BookOpen size={40} className="text-white" />
                        </div>

                        <h1 className="text-4xl font-extrabold mb-4">ReadSync</h1>
                        <p className="text-xl text-emerald-100 mb-8">책과 함께 성장하는 즐거움</p>

                        <div className="space-y-4 text-left max-w-sm">
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur px-5 py-4 rounded-2xl">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <p className="font-bold">AI 독서 도우미</p>
                                    <p className="text-sm text-emerald-100">책 내용을 AI에게 질문하세요</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur px-5 py-4 rounded-2xl">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    📚
                                </div>
                                <div>
                                    <p className="font-bold">나만의 독서 숲</p>
                                    <p className="text-sm text-emerald-100">읽은 책만큼 나무가 자라요</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur px-5 py-4 rounded-2xl">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    🏆
                                </div>
                                <div>
                                    <p className="font-bold">독서 퀘스트</p>
                                    <p className="text-sm text-emerald-100">미션을 완료하고 보상받으세요</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 우측: 로그인 영역 */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-b from-white to-emerald-50/30">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* 모바일 로고 */}
                    <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <BookOpen size={22} />
                        </div>
                        <span className="font-extrabold text-2xl bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                            ReadSync
                        </span>
                    </Link>

                    {/* 타이틀 */}
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                            환영합니다! 👋
                        </h2>
                        <p className="text-gray-600">
                            소셜 계정으로 간편하게 시작하세요
                        </p>
                    </div>

                    {/* 소셜 로그인 버튼들 */}
                    <div className="space-y-4">
                        <motion.button
                            onClick={() => handleSocialLogin('kakao')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold rounded-2xl transition-all shadow-lg shadow-yellow-200/50"
                        >
                            <KakaoIcon size={22} />
                            카카오로 시작하기
                        </motion.button>

                        <motion.button
                            onClick={() => handleSocialLogin('naver')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#03C75A] hover:bg-[#02B350] text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-300/50"
                        >
                            <NaverIcon size={18} />
                            네이버로 시작하기
                        </motion.button>

                        <motion.button
                            onClick={() => handleSocialLogin('google')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl border-2 border-gray-200 transition-all shadow-lg"
                        >
                            <Chrome size={22} className="text-gray-600" />
                            Google로 시작하기
                        </motion.button>
                    </div>

                    {/* 안내 문구 */}
                    <p className="text-center mt-8 text-sm text-gray-500">
                        처음 로그인하시면 자동으로 회원가입됩니다.
                    </p>

                    {/* 이용약관 */}
                    <p className="text-center mt-4 text-xs text-gray-400 leading-relaxed">
                        로그인 시{' '}
                        <a href="#" className="text-emerald-600 hover:underline">이용약관</a>
                        {' '}및{' '}
                        <a href="#" className="text-emerald-600 hover:underline">개인정보처리방침</a>
                        에 동의하게 됩니다.
                    </p>

                    {/* 홈으로 돌아가기 */}
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← 홈으로 돌아가기
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
