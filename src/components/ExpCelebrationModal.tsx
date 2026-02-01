import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Trophy, X, Zap } from 'lucide-react';

interface ExpCelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle: string;
    earnedExp: number;
    isLevelUp?: boolean;
    newLevel?: number;
}

const ExpCelebrationModal: React.FC<ExpCelebrationModalProps> = ({
    isOpen,
    onClose,
    bookTitle,
    earnedExp,
    isLevelUp = false,
    newLevel
}) => {
    const [showExp, setShowExp] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // 순차적 애니메이션
            const expTimer = setTimeout(() => setShowExp(true), 500);
            const levelTimer = setTimeout(() => setShowLevelUp(true), 1200);

            return () => {
                clearTimeout(expTimer);
                clearTimeout(levelTimer);
            };
        } else {
            setShowExp(false);
            setShowLevelUp(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: 50 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md mx-4 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-1 shadow-2xl"
                >
                    {/* 배경 파티클 효과 */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                                initial={{
                                    x: Math.random() * 400 - 200,
                                    y: 400,
                                    opacity: 0
                                }}
                                animate={{
                                    y: -100,
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                                style={{ left: `${Math.random() * 100}%` }}
                            />
                        ))}
                    </div>

                    <div className="relative bg-white rounded-[22px] p-8 text-center">
                        {/* 닫기 버튼 */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* 트로피 아이콘 */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', delay: 0.2, damping: 10 }}
                            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200"
                        >
                            <Trophy size={48} className="text-white" />
                        </motion.div>

                        {/* 축하 메시지 */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-extrabold text-gray-900 mb-2"
                        >
                            🎉 완독을 축하합니다!
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 mb-6"
                        >
                            <span className="font-bold text-emerald-600">{bookTitle}</span>을(를)
                            <br />끝까지 읽으셨습니다!
                        </motion.p>

                        {/* 경험치 획득 */}
                        <AnimatePresence>
                            {showExp && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                    className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 mb-4 border border-emerald-100"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Zap size={28} className="text-emerald-500" />
                                        <div className="text-left">
                                            <p className="text-sm text-emerald-600 font-medium">경험치 획득!</p>
                                            <motion.p
                                                initial={{ scale: 1 }}
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 0.5, delay: 0.2 }}
                                                className="text-3xl font-extrabold text-emerald-700"
                                            >
                                                +{earnedExp} EXP
                                            </motion.p>
                                        </div>
                                        <Sparkles size={28} className="text-yellow-500" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 레벨업 알림 */}
                        <AnimatePresence>
                            {showLevelUp && isLevelUp && newLevel && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                    className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Star size={28} className="text-amber-500 fill-amber-400" />
                                        <div>
                                            <p className="text-sm text-amber-600 font-medium">레벨 업!</p>
                                            <p className="text-2xl font-extrabold text-amber-700">
                                                Lv.{newLevel} 달성!
                                            </p>
                                        </div>
                                        <Star size={28} className="text-amber-500 fill-amber-400" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 확인 버튼 */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={onClose}
                            className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] transition-all"
                        >
                            확인
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ExpCelebrationModal;
