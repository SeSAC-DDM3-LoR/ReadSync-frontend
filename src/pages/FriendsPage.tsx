import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, UserPlus, UserMinus, Clock, Check, X,
    Loader2, BookOpen
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { friendshipService } from '../services/communityService';
import { roomInvitationService, type RoomInvitation } from '../services/readingRoomService';
import useAuthStore from '../stores/authStore';
import type { Friend, FriendRequest } from '../services/communityService';
import websocketClient from '../services/websocketClient';

const FriendsPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [roomInvitations, setRoomInvitations] = useState<RoomInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent' | 'invitations'>('friends');
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadData();

        // WebSocket 실시간 알림 구독
        if (user?.userId) {
            const token = localStorage.getItem('accessToken');
            if (token && !websocketClient.isConnected()) {
                websocketClient.connect(token).then(() => {
                    websocketClient.subscribeToInvitations(user.userId, () => {
                        loadData();
                    });
                }).catch(err => {
                    console.error('WebSocket connection failed:', err);
                });
            } else if (websocketClient.isConnected()) {
                websocketClient.subscribeToInvitations(user.userId, () => {
                    loadData();
                });
            }
        }

        return () => {
            if (user?.userId) {
                websocketClient.unsubscribeFromInvitations(user.userId);
            }
        };
    }, [isAuthenticated, user?.userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [friendsData, receivedData, sentData, invitationsData] = await Promise.all([
                friendshipService.getMyFriends(),
                friendshipService.getReceivedRequests(),
                friendshipService.getSentRequests(),
                roomInvitationService.getReceivedInvitations(),
            ]);
            setFriends(friendsData);
            setReceivedRequests(receivedData);
            setSentRequests(sentData);
            setRoomInvitations(invitationsData.filter(inv => inv.status === 'PENDING'));
        } catch (error) {
            console.error('Failed to load friends data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (friendshipId: number) => {
        try {
            await friendshipService.acceptRequest(friendshipId);
            loadData();
        } catch (error) {
            console.error('Failed to accept request:', error);
        }
    };

    const handleReject = async (friendshipId: number) => {
        try {
            await friendshipService.rejectRequest(friendshipId);
            loadData();
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
    };

    const handleUnfriend = async (friendshipId: number) => {
        if (!confirm('친구를 삭제하시겠습니까?')) return;

        // 이전 상태 저장
        const previousFriends = [...friends];

        try {
            // 즉시 UI에서 제거 (낙관적 업데이트)
            setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));

            // API 호출
            await friendshipService.unfriend(friendshipId);
            console.log('✅ Friend deleted successfully');

            // 서버 데이터와 동기화
            await loadData();
        } catch (error) {
            console.error('❌ Failed to unfriend:', error);
            // 에러 발생 시 이전 상태로 복구
            setFriends(previousFriends);
            alert('친구 삭제에 실패했습니다.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ONLINE': return 'bg-green-500';
            case 'READING': return 'bg-blue-500';
            default: return 'bg-gray-400';
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
            await loadData();
        } catch (error) {
            console.error('Failed to reject invitation:', error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Users className="text-emerald-500" />
                            친구
                        </h1>
                    </motion.div>

                    {/* 탭 */}
                    <div className="flex gap-2 mb-8">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'friends' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'
                                }`}
                        >
                            친구 목록 ({friends.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors relative ${activeTab === 'received' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'
                                }`}
                        >
                            받은 요청
                            {receivedRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {receivedRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === 'sent' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'
                                }`}
                        >
                            보낸 요청 ({sentRequests.length})
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* 친구 목록 */}
                            {activeTab === 'friends' && (
                                <div className="space-y-3">
                                    {friends.length === 0 ? (
                                        <div className="text-center py-16">
                                            <Users size={64} className="text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">친구가 없습니다</p>
                                        </div>
                                    ) : (
                                        friends.map((friend) => (
                                            <motion.div
                                                key={friend.friendshipId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-100 flex items-center justify-center">
                                                            {friend.friendProfileImage ? (
                                                                <img src={friend.friendProfileImage} alt={friend.friendNickname} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-emerald-600 font-bold">{friend.friendNickname?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(friend.onlineStatus)}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{friend.friendNickname}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {friend.onlineStatus === 'ONLINE' ? '온라인' :
                                                                friend.onlineStatus === 'READING' ? '독서 중' : '오프라인'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnfriend(friend.friendshipId)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <UserMinus size={20} />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 받은 요청 */}
                            {activeTab === 'received' && (
                                <div className="space-y-3">
                                    {receivedRequests.length === 0 ? (
                                        <div className="text-center py-16">
                                            <Clock size={64} className="text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">받은 요청이 없습니다</p>
                                        </div>
                                    ) : (
                                        receivedRequests.map((request) => (
                                            <motion.div
                                                key={request.friendshipId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                        <span className="text-emerald-600 font-bold">{request.requesterName?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{request.requesterName}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(request.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccept(request.friendshipId)}
                                                        className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request.friendshipId)}
                                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 보낸 요청 */}
                            {activeTab === 'sent' && (
                                <div className="space-y-3">
                                    {sentRequests.length === 0 ? (
                                        <div className="text-center py-16">
                                            <UserPlus size={64} className="text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">보낸 요청이 없습니다</p>
                                        </div>
                                    ) : (
                                        sentRequests.map((request) => (
                                            <motion.div
                                                key={request.friendshipId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                        <span className="text-emerald-600 font-bold">{request.addresseeName?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{request.addresseeName}</p>
                                                        <p className="text-sm text-amber-600">대기 중</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 독서룸 초대 */}
                            {activeTab === 'invitations' && (
                                <div className="space-y-3">
                                    {roomInvitations.length === 0 ? (
                                        <div className="text-center py-16">
                                            <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">받은 독서룸 초대가 없습니다</p>
                                        </div>
                                    ) : (
                                        roomInvitations.map((invitation) => (
                                            <motion.div
                                                key={invitation.invitationId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <BookOpen size={24} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 mb-1">
                                                            {invitation.roomName}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            <span className="font-semibold text-purple-600">{invitation.inviterName}</span>님이 초대했습니다
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(invitation.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRoomInvitation(invitation.invitationId, invitation.roomId)}
                                                            disabled={processingId === invitation.invitationId}
                                                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-50"
                                                        >
                                                            {processingId === invitation.invitationId ? (
                                                                <Loader2 size={20} className="animate-spin" />
                                                            ) : (
                                                                <Check size={20} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRoomInvitation(invitation.invitationId)}
                                                            disabled={processingId === invitation.invitationId}
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                                                        >
                                                            <X size={20} />
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

export default FriendsPage;
