import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import authService from '../services/authService';
import useAuthStore from '../stores/authStore';

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, setUser, setLoading, setError } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        loginId: '',
        password: '',
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 이미 관리자로 로그인된 경우 대시보드로 리다이렉트
    useEffect(() => {
        if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN')) {
            navigate('/admin/dashboard', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.role]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrorMessage(null); // 입력 시 에러 메시지 초기화
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.loginId || !formData.password) {
            setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authService.adminLogin({
                loginId: formData.loginId,
                password: formData.password,
            });

            // 토큰 저장
            authService.saveTokens(response.accessToken, response.refreshToken);

            // 디버깅: 응답 데이터 확인
            console.log('Login response:', response);
            console.log('User detail:', response.detail);
            console.log('User role:', response.detail?.role);

            // 유저 정보 저장 (response.detail에서 가져옴)
            setUser(response.detail);

            // 관리자 대시보드로 이동 (상태 업데이트 후 리다이렉트)
            setTimeout(() => {
                navigate('/admin/dashboard', { replace: true });
            }, 100);
        } catch (error: any) {
            console.error('Admin login error:', error);

            // 개발 모드: 백엔드 연결 안됐을 때 mock 로그인 허용
            if (import.meta.env.DEV && formData.loginId === 'admin' && formData.password === 'admin') {
                console.log('DEV MODE: Using mock admin login');
                const mockUser = {
                    userId: 1,
                    nickname: 'Admin',
                    tag: '0000',
                    profileImage: null,
                    role: 'ADMIN' as const,
                    status: 'ACTIVE' as const,
                    levelId: 99,
                    experience: 99999,
                    preferredGenre: null,
                    readBookCount: 0,
                    reviewCount: 0,
                    totalCredit: 0,
                };
                setUser(mockUser);
                navigate('/admin/dashboard');
                return;
            }

            if (error.response?.status === 401) {
                setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다.');
            } else if (error.response?.status === 403) {
                setErrorMessage('관리자 권한이 없는 계정입니다.');
            } else {
                setErrorMessage('로그인에 실패했습니다. (DEV 모드: admin/admin 으로 테스트 가능)');
            }

            setError(error.message);
        } finally {
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            {/* 배경 장식 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* 로그인 카드 */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">

                    {/* 아이콘 & 타이틀 */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">관리자 로그인</h1>
                        <p className="text-slate-400 text-sm">ReadSync Admin Console</p>
                    </div>

                    {/* 에러 메시지 */}
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                        >
                            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                            <span className="text-red-400 text-sm">{errorMessage}</span>
                        </motion.div>
                    )}

                    {/* 로그인 폼 */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">관리자 ID</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="loginId"
                                    value={formData.loginId}
                                    onChange={handleInputChange}
                                    placeholder="admin"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-700/50 border border-slate-600 
                             focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 
                             outline-none transition-all text-white placeholder-slate-400"
                                />
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">비밀번호</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-700/50 border border-slate-600 
                             focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 
                             outline-none transition-all text-white placeholder-slate-400"
                                />
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* 로그인 버튼 */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                ${isSubmitting
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    로그인 중...
                                </>
                            ) : (
                                <>
                                    로그인
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* 보안 안내 */}
                    <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <p className="text-slate-400 text-xs leading-relaxed text-center">
                            🔒 이 페이지는 관리자 전용입니다.<br />
                            일반 사용자는 <Link to="/login" className="text-emerald-400 hover:underline">소셜 로그인</Link>을 이용해주세요.
                        </p>
                    </div>
                </div>

                {/* 홈으로 돌아가기 */}
                <Link
                    to="/"
                    className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    ← 홈으로 돌아가기
                </Link>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
