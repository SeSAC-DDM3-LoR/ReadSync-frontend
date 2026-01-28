import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus, Flag, Loader2, Trophy, Zap, BookOpen } from 'lucide-react';
import { profileService, type OtherProfile } from '../services/userService';
import { friendshipService } from '../services/communityService';
import useAuthStore from '../stores/authStore';

interface UserProfilePopupProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({
    userId,
    isOpen,
    onClose,
    position
}) => {
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState<OtherProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadProfile();
        }
    }, [isOpen, userId]);

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await profileService.getOtherProfile(userId);
            setProfile(data);
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('프로필을 불러올 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendFriendRequest = async () => {
        if (!profile) return;
        setIsSendingRequest(true);
        try {
            await friendshipService.sendRequest(profile.userId);
            setRequestSent(true);
        } catch (err: any) {
            if (err.response?.status === 409) {
                setRequestSent(true);
            } else {
                console.error('Failed to send friend request:', err);
            }
        } finally {
            setIsSendingRequest(false);
        }
    };

    const getTierInfo = (levelId: number) => {
        if (levelId >= 10) return { name: 'DIAMOND', color: 'text-cyan-400', emoji: '💎' };
        if (levelId >= 7) return { name: 'PLATINUM', color: 'text-gray-300', emoji: '🏆' };
        if (levelId >= 5) return { name: 'GOLD', color: 'text-yellow-400', emoji: '🥇' };
        if (levelId >= 3) return { name: 'SILVER', color: 'text-gray-400', emoji: '🥈' };
        return { name: 'BRONZE', color: 'text-amber-600', emoji: '🥉' };
    };

    const isMyself = currentUser?.userId === userId;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed z-50 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                        style={{
                            top: position?.y ? Math.min(position.y, window.innerHeight - 400) : '50%',
                            left: position?.x ? Math.min(position.x, window.innerWidth - 340) : '50%',
                            transform: position ? 'none' : 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="relative h-20 bg-gradient-to-r from-purple-500 to-pink-500">
                            <button
                                onClick={onClose}
                                className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-6 pb-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-400">
                                    {error}
                                </div>
                            ) : profile ? (
                                <>
                                    <div className="-mt-10 mb-4 flex justify-center">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-800 shadow-lg">
                                            {profile.profileImage ? (
                                                <img
                                                    src={profile.profileImage}
                                                    alt={profile.nickname}
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            ) : (
                                                profile.nickname?.charAt(0) || '?'
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center mb-4">
                                        <h3 className="text-xl font-bold text-white">
                                            {profile.nickname}
                                            <span className="text-gray-400 font-normal ml-1">#{profile.tag}</span>
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                                                <Zap size={14} />
                                                <span className="text-xs">레벨</span>
                                            </div>
                                            <p className="text-white font-bold">{profile.levelId || 1}</p>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                                                <BookOpen size={14} />
                                                <span className="text-xs">경험치</span>
                                            </div>
                                            <p className="text-white font-bold">{profile.experience || 0}</p>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-xl p-3 text-center">
                                            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                                                <Trophy size={14} />
                                                <span className="text-xs">티어</span>
                                            </div>
                                            <p className={`font-bold ${getTierInfo(profile.levelId || 1).color}`}>
                                                {getTierInfo(profile.levelId || 1).emoji}
                                            </p>
                                        </div>
                                    </div>

                                    {profile.preferredGenre && (
                                        <div className="text-center text-sm text-gray-400 mb-4">
                                            선호 장르: <span className="text-purple-300">{profile.preferredGenre}</span>
                                        </div>
                                    )}

                                    {!isMyself && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSendFriendRequest}
                                                disabled={isSendingRequest || requestSent}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${requestSent
                                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                                                    }`}
                                            >
                                                {isSendingRequest ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : requestSent ? (
                                                    <>
                                                        <UserMinus size={18} />
                                                        요청됨
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={18} />
                                                        친구 추가
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                                                title="신고하기"
                                            >
                                                <Flag size={18} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserProfilePopup;
