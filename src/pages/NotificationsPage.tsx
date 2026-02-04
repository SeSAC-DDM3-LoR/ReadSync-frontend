import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bell, Users, BookOpen, Check, X, Loader2, ArrowLeft
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { roomInvitationService, type RoomInvitation } from '../services/readingRoomService';
import { friendshipService, type FriendRequest } from '../services/communityService';
import useAuthStore from '../stores/authStore';
import websocketClient from '../services/websocketClient';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'invitations' | 'friends'>('invitations');
    const [roomInvitations, setRoomInvitations] = useState<RoomInvitation[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadNotifications();

        // WebSocket 실시간 알림 구독
        if (user?.userId) {
            const token = localStorage.getItem('accessToken');
            if (token && !websocketClient.isConnected()) {
                websocketClient.connect(token).then(() => {
                    websocketClient.subscribeToInvitations(user.userId, () => {
                        loadNotifications();
                    });
                }).catch(err => {
                    console.error('WebSocket connection failed:', err);
                });
            } else if (websocketClient.isConnected()) {
                websocketClient.subscribeToInvitations(user.userId, () => {
                    loadNotifications();
                });
            }
        }

        return () => {
            if (user?.userId) {
                websocketClient.unsubscribeFromInvitations(user.userId);
            }
        };
    }, [isAuthenticated, user?.userId]);

    const loadNotifications = async () => {
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
    };

    // 방 초대 수락
    const handleAcceptRoomInvitation = async (invitationId: number, roomId: number) => {
        setProcessingId(invitationId);
        try {
            await roomInvitationService.acceptInvitation(invitationId);
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
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* 헤더 */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            뒤로 가기
                        </button>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Bell className="text-emerald-500" />
                            알림
                        </h1>
                        <p className="text-gray-600 mt-2">
                            받은 초대와 친구 요청을 확인하세요
                        </p>
                    </motion.div>

                    {/* 탭 */}
                    <div className="flex gap-2 mb-8">
                        <button
                            onClick={() => setActiveTab('invitations')}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors relative ${activeTab === 'invitations'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-600'
                                }`}
                        >
                            독서룸 초대 ({roomInvitations.length})
                            {roomInvitations.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {roomInvitations.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors relative ${activeTab === 'friends'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-600'
                                }`}
                        >
                            친구 요청 ({friendRequests.length})
                            {friendRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {friendRequests.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* 콘텐츠 */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* 독서룸 초대 탭 */}
                            {activeTab === 'invitations' && (
                                <div className="space-y-3">
                                    {roomInvitations.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-2xl">
                                            <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">받은 독서룸 초대가 없습니다</p>
                                        </div>
                                    ) : (
                                        roomInvitations.map((invitation) => (
                                            <motion.div
                                                key={invitation.invitationId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <BookOpen size={28} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                                                            {invitation.roomName}
                                                        </h3>
                                                        <p className="text-gray-600 mb-2">
                                                            <span className="font-semibold text-purple-600">{invitation.inviterName}</span>님이 초대했습니다
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(invitation.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRoomInvitation(invitation.invitationId, invitation.roomId)}
                                                            disabled={processingId === invitation.invitationId}
                                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                        >
                                                            {processingId === invitation.invitationId ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Check size={18} />
                                                            )}
                                                            수락
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRoomInvitation(invitation.invitationId)}
                                                            disabled={processingId === invitation.invitationId}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                        >
                                                            <X size={18} />
                                                            거절
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 친구 요청 탭 */}
                            {activeTab === 'friends' && (
                                <div className="space-y-3">
                                    {friendRequests.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-2xl">
                                            <Users size={64} className="text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">받은 친구 요청이 없습니다</p>
                                        </div>
                                    ) : (
                                        friendRequests.map((request) => (
                                            <motion.div
                                                key={request.friendshipId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-400 rounded-xl flex items-center justify-center">
                                                            <span className="text-white font-bold text-xl">
                                                                {request.requesterName?.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg">
                                                                {request.requesterName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(request.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptFriendRequest(request.friendshipId)}
                                                            disabled={processingId === request.friendshipId}
                                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                                        >
                                                            {processingId === request.friendshipId ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Check size={18} />
                                                            )}
                                                            수락
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectFriendRequest(request.friendshipId)}
                                                            disabled={processingId === request.friendshipId}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                                                        >
                                                            <X size={18} />
                                                            거절
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NotificationsPage;
