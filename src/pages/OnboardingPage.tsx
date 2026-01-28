import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, Sparkles, ArrowRight, Check,
    BookHeart
} from 'lucide-react';
import authService from '../services/authService';
import useAuthStore from '../stores/authStore';

import { GENRES } from '../constants/genres';

// 장르 목록 (Shared Constant 사용)
const genres = GENRES;

const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();

    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleGenre = (genreId: string) => {
        if (selectedGenres.includes(genreId)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genreId));
        } else if (selectedGenres.length < 3) {
            setSelectedGenres([...selectedGenres, genreId]);
        }
    };

    const handleNicknameSubmit = () => {
        if (nickname.trim().length < 2) {
            setError('닉네임은 2자 이상 입력해주세요.');
            return;
        }
        if (nickname.trim().length > 20) {
            setError('닉네임은 20자 이하로 입력해주세요.');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleComplete = async () => {
        if (selectedGenres.length === 0) {
            setError('선호 장르를 1개 이상 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const preferredGenre = selectedGenres.join(',');

            await authService.updateProfile({
                nickname: nickname.trim(),
                preferredGenre,
            });

            // 스토어 업데이트
            updateUser({
                nickname: nickname.trim(),
                preferredGenre,
            });

            // 메인 페이지로 이동
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error('Profile update error:', err);
            setError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
            {/* 배경 장식 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-green-200/30 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-emerald-100">

                    {/* 헤더 */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                            <BookOpen size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">환영합니다! 🎉</h1>
                        <p className="text-gray-600">ReadSync를 시작하기 전에 몇 가지만 알려주세요</p>
                    </div>

                    {/* 진행 표시 */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                    </div>

                    {/* Step 1: 닉네임 입력 */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                                    <Sparkles size={20} className="text-amber-500" />
                                    닉네임을 정해주세요
                                </label>
                                <p className="text-sm text-gray-500 mb-4">
                                    다른 독서왕들에게 보여질 이름이에요. 뒤에 #태그가 자동으로 붙어요!
                                </p>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="독서왕"
                                        maxLength={20}
                                        className="w-full px-4 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                                    />
                                    {user?.tag && (
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
                                            #{user.tag}
                                        </span>
                                    )}
                                </div>
                                {error && (
                                    <p className="text-red-500 text-sm mt-2">{error}</p>
                                )}
                            </div>

                            <button
                                onClick={handleNicknameSubmit}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl 
                           shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all
                           flex items-center justify-center gap-2"
                            >
                                다음
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: 선호 장르 선택 */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                                    <BookHeart size={20} className="text-pink-500" />
                                    선호하는 장르를 선택해주세요
                                </label>
                                <p className="text-sm text-gray-500 mb-4">
                                    최대 3개까지 선택할 수 있어요. 맞춤 추천에 활용됩니다!
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    {genres.map((genre) => {
                                        const isSelected = selectedGenres.includes(genre.id);
                                        const Icon = genre.icon;
                                        return (
                                            <motion.button
                                                key={genre.id}
                                                onClick={() => toggleGenre(genre.id)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${genre.color} flex items-center justify-center mb-2`}>
                                                    <Icon size={20} className="text-white" />
                                                </div>
                                                <span className="font-bold text-gray-800">{genre.label}</span>

                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <p className="text-sm text-gray-400 mt-3 text-center">
                                    {selectedGenres.length}/3 선택됨
                                </p>

                                {error && (
                                    <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    이전
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={isSubmitting}
                                    className={`flex-1 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isSubmitting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>저장 중...</>
                                    ) : (
                                        <>
                                            시작하기
                                            <Sparkles size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingPage;
