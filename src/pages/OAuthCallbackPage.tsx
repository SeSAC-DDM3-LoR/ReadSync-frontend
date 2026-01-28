import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, CheckCircle, XCircle } from 'lucide-react';
import authService from '../services/authService';
import useAuthStore from '../stores/authStore';

const OAuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { fetchCurrentUser } = useAuthStore();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('로그인 처리 중...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // URL에서 토큰과 isNewUser 파라미터 추출
                const accessToken = searchParams.get('accessToken');
                const refreshToken = searchParams.get('refreshToken');
                const isNewUser = searchParams.get('isNewUser') === 'true';

                if (!accessToken || !refreshToken) {
                    throw new Error('토큰을 받지 못했습니다.');
                }

                // 토큰 저장
                authService.saveTokens(accessToken, refreshToken);

                // 유저 정보 가져오기
                await fetchCurrentUser();

                setStatus('success');
                setMessage('로그인 성공!');

                // 1초 후 리다이렉트
                setTimeout(() => {
                    if (isNewUser) {
                        // 신규 유저: 온보딩 페이지로
                        navigate('/onboarding', { replace: true });
                    } else {
                        // 기존 유저: 메인 페이지로
                        navigate('/', { replace: true });
                    }
                }, 1000);

            } catch (error: any) {
                console.error('OAuth callback error:', error);
                setStatus('error');
                setMessage(error.message || '로그인 처리 중 오류가 발생했습니다.');

                // 3초 후 로그인 페이지로
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, fetchCurrentUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm"
            >
                {/* 로고 */}
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <BookOpen size={32} className="text-white" />
                </div>

                {/* 상태 아이콘 */}
                <div className="mb-6">
                    {status === 'loading' && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Loader2 size={48} className="text-emerald-500 mx-auto" />
                        </motion.div>
                    )}
                    {status === 'success' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <CheckCircle size={48} className="text-emerald-500 mx-auto" />
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <XCircle size={48} className="text-red-500 mx-auto" />
                        </motion.div>
                    )}
                </div>

                {/* 메시지 */}
                <h2 className={`text-xl font-bold mb-2 ${status === 'error' ? 'text-red-600' : 'text-gray-900'
                    }`}>
                    {message}
                </h2>

                {status === 'loading' && (
                    <p className="text-gray-500 text-sm">잠시만 기다려주세요...</p>
                )}
                {status === 'success' && (
                    <p className="text-emerald-600 text-sm">페이지로 이동합니다...</p>
                )}
                {status === 'error' && (
                    <p className="text-gray-500 text-sm">로그인 페이지로 돌아갑니다...</p>
                )}
            </motion.div>
        </div>
    );
};

export default OAuthCallbackPage;
