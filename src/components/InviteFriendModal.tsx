import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Loader2, Check, Users } from 'lucide-react';
import { friendshipService, type Friend } from '../services/communityService';
import { roomInvitationService } from '../services/readingRoomService';

interface InviteFriendModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: number;
}

const InviteFriendModal: React.FC<InviteFriendModalProps> = ({
    isOpen,
    onClose,
    roomId
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
    const [invitingId, setInvitingId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadFriends();
        }
    }, [isOpen]);

    const loadFriends = async () => {
        setIsLoading(true);
        try {
            const data = await friendshipService.getMyFriends();
            setFriends(data);
        } catch (err) {
            console.error('Failed to load friends:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (friendUserId: number) => {
        setInvitingId(friendUserId);
        try {
            await roomInvitationService.inviteUser(roomId, friendUserId);
            setInvitedIds(prev => new Set([...prev, friendUserId]));
        } catch (err: any) {
            if (err.response?.status === 409) {
                // 이미 초대한 경우
                setInvitedIds(prev => new Set([...prev, friendUserId]));
            } else {
                console.error('Failed to invite friend:', err);
            }
        } finally {
            setInvitingId(null);
        }
    };

    // 검색 필터링
    const filteredFriends = friends.filter(friend =>
        friend.friendNickname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 오버레이 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50"
                    />

                    {/* 모달 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                    >
                        {/* 헤더 */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users size={20} className="text-purple-400" />
                                친구 초대하기
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 검색 */}
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="친구 검색..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        {/* 친구 목록 */}
                        <div className="max-h-[300px] overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    {friends.length === 0 ? '친구가 없습니다.' : '검색 결과가 없습니다.'}
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredFriends.map((friend) => {
                                        const isInvited = invitedIds.has(friend.friendUserId);
                                        const isInviting = invitingId === friend.friendUserId;

                                        return (
                                            <div
                                                key={friend.friendshipId}
                                                className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* 프로필 이미지 */}
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                                                        {friend.friendProfileImage ? (
                                                            <img
                                                                src={friend.friendProfileImage}
                                                                alt={friend.friendNickname}
                                                                className="w-full h-full object-cover rounded-xl"
                                                            />
                                                        ) : (
                                                            friend.friendNickname.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{friend.friendNickname}</p>
                                                        <p className={`text-xs ${friend.onlineStatus === 'ONLINE' ? 'text-green-400' : 'text-gray-500'}`}>
                                                            {friend.onlineStatus === 'ONLINE' ? '온라인' : '오프라인'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 초대 버튼 */}
                                                <button
                                                    onClick={() => handleInvite(friend.friendUserId)}
                                                    disabled={isInvited || isInviting}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isInvited
                                                        ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                                                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                                        }`}
                                                >
                                                    {isInviting ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : isInvited ? (
                                                        <>
                                                            <Check size={14} />
                                                            초대됨
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus size={14} />
                                                            초대
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 푸터 */}
                        <div className="p-4 border-t border-white/10 bg-slate-900/50">
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default InviteFriendModal;
