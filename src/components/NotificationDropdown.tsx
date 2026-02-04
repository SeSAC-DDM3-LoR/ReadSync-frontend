import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Loader2, Users, BookOpen } from 'lucide-react';
import { roomInvitationService, type RoomInvitation } from '../services/readingRoomService';
import { friendshipService, type FriendRequest } from '../services/communityService';
import useAuthStore from '../stores/authStore';
import websocketClient from '../services/websocketClient';

const NotificationDropdown: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [roomInvitations, setRoomInvitations] = useState<RoomInvitation[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // 총 알림 개수
    const totalNotifications = roomInvitations.length + friendRequests.length;

    // 알림 데이터 로드 - useCallback으로 메모이제이션
    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const [invitations, requests] = await Promise.all([
                roomInvitationService.getReceivedInvitations(),
                friendshipService.getReceivedRequests(),
            ]);
            setRoomInvitations(invitations.filter(inv => inv.status === 'PENDING'));
            setFriendRequests(requests.filter(req => req.status === 'PENDING'));
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []); // 외부 의존성 없음

    // WebSocket 실시간 알림 구독
    useEffect(() => {
        if (!user?.userId) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const setupWebSocket = async () => {
            try {
                // WebSocket 연결 (이미 연결되어 있으면 재연결하지 않음)
                if (!websocketClient.isConnected()) {
                    await websocketClient.connect(token);
                }

                // 초대 알림 구독 (중복 구독 방지를 위해 한 번만 설정)
                websocketClient.subscribeToInvitations(user.userId, (invitation) => {
                    console.log('New invitation received:', invitation);
                    loadNotifications(); // 새 초대 시 목록 갱신
                });
            } catch (err) {
                console.error('WebSocket setup failed:', err);
            }
        };

        setupWebSocket();

        return () => {
            if (user?.userId) {
                websocketClient.unsubscribeFromInvitations(user.userId);
            }
        };
    }, [user?.userId, loadNotifications]); // loadNotifications 의존성 추가

    // 드롭다운 열릴 때 데이터 로드
    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    // 방 초대 수락
    const handleAcceptRoomInvitation = async (invitationId: number, roomId: number) => {
        setProcessingId(invitationId);
        try {
            await roomInvitationService.acceptInvitation(invitationId);
            setIsOpen(false);
            navigate(`/tts-room/${roomId}`);
        } catch (error) {
            console.error('Failed to accept invitation:', error);
            alert('초대 수락에 실패했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    // 방 초대 거절
    const handleRejectRoomInvitation = async (invitationId: number) => {
        setProcessingId(invitationId);
        try {
            await roomInvitationService.rejectInvitation(invitationId);
            await loadNotifications();
        } catch (error) {
            console.error('Failed to reject invitation:', error);
        } finally {
            setProcessingId(null);
        }
    };

    // 친구 요청 수락
    const handleAcceptFriendRequest = async (friendshipId: number) => {
        setProcessingId(friendshipId);
        try {
            await friendshipService.acceptRequest(friendshipId);
            await loadNotifications();
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    // 친구 요청 거절
    const handleRejectFriendRequest = async (friendshipId: number) => {
        setProcessingId(friendshipId);
        try {
            await friendshipService.rejectRequest(friendshipId);
            await loadNotifications();
        } catch (error) {
            console.error('Failed to reject friend request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="relative">
            {/* 알림 버튼 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-emerald-50 rounded-full transition-colors"
            >
                <Bell size={20} />
                {totalNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                )}
            </button>

            {/* 드롭다운 */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* 오버레이 */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* 알림 패널 */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[500px] overflow-hidden flex flex-col"
                        >
                            {/* 헤더 */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800">알림</h3>
                                    {totalNotifications > 0 && (
                                        <button
                                            onClick={() => navigate('/notifications')}
                                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                        >
                                            전체 보기
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 알림 목록 */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                    </div>
                                ) : totalNotifications === 0 ? (
                                    <div className="text-center py-12">
                                        <Bell size={48} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">새로운 알림이 없습니다</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {/* 방 초대 */}
                                        {roomInvitations.map((invitation) => (
                                            <div key={invitation.invitationId} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <BookOpen size={20} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-800 font-medium">
                                                            <span className="font-bold text-purple-600">{invitation.inviterName}</span>님이 독서룸에 초대했습니다
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                            {invitation.roomName}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(invitation.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => handleAcceptRoomInvitation(invitation.invitationId, invitation.roomId)}
                                                                disabled={processingId === invitation.invitationId}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                            >
                                                                {processingId === invitation.invitationId ? (
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                ) : (
                                                                    <Check size={12} />
                                                                )}
                                                                수락
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectRoomInvitation(invitation.invitationId)}
                                                                disabled={processingId === invitation.invitationId}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                            >
                                                                <X size={12} />
                                                                거절
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* 친구 요청 */}
                                        {friendRequests.map((request) => (
                                            <div key={request.friendshipId} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Users size={20} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-800 font-medium">
                                                            <span className="font-bold text-emerald-600">{request.requesterName}</span>님이 친구 요청을 보냈습니다
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(request.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => handleAcceptFriendRequest(request.friendshipId)}
                                                                disabled={processingId === request.friendshipId}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                            >
                                                                {processingId === request.friendshipId ? (
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                ) : (
                                                                    <Check size={12} />
                                                                )}
                                                                수락
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectFriendRequest(request.friendshipId)}
                                                                disabled={processingId === request.friendshipId}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                            >
                                                                <X size={12} />
                                                                거절
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
