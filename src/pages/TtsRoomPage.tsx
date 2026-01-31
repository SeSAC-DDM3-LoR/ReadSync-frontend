import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Volume2, VolumeX, Play, Pause, SkipBack, SkipForward,
    Settings, Users, ArrowLeft, BookOpen, Send, MessageCircle,
    Plus, UserPlus, Crown, Loader2, DoorOpen, ExternalLink
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { readingRoomService, type ReadingRoom, type RoomParticipant } from '../services/readingRoomService';
import { chatService, type ChatMessage } from '../services/chatService';
// import { aiChatService, convertToUIMessages, type ChatMessage } from '../services/aiChatService';
import websocketClient from '../services/websocketClient';
import UserProfilePopup from '../components/UserProfilePopup';
import InviteFriendModal from '../components/InviteFriendModal';
import CreateRoomModal from '../components/CreateRoomModal';

// 방 목록 페이지 컴포넌트
const RoomListView: React.FC<{
    onEnterRoom: (roomId: number) => void;
    onCreateRoom: () => void;
}> = ({ onEnterRoom, onCreateRoom }) => {
    const [rooms, setRooms] = useState<ReadingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        setIsLoading(true);
        try {
            const data = await readingRoomService.getRooms();
            setRooms(data);
        } catch (err) {
            console.error('Failed to load rooms:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // 상태에 따른 배지 색상
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WAITING': return { text: '대기 중', color: 'bg-yellow-500/20 text-yellow-400' };
            case 'PLAYING': return { text: '진행 중', color: 'bg-green-500/20 text-green-400' };
            case 'PAUSED': return { text: '일시정지', color: 'bg-orange-500/20 text-orange-400' };
            default: return { text: status, color: 'bg-gray-500/20 text-gray-400' };
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">TTS 독서룸</h1>
                    <p className="text-purple-300">함께 책을 들으며 읽어보세요</p>
                </div>
                <button
                    onClick={onCreateRoom}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
                >
                    <Plus size={20} />
                    방 만들기
                </button>
            </div>

            {/* 방 목록 */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                </div>
            ) : rooms.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-3xl flex items-center justify-center">
                        <Users size={40} className="text-purple-400/50" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">아직 열린 방이 없어요</h3>
                    <p className="text-gray-400 mb-6">첫 번째 독서룸을 만들어보세요!</p>
                    <button
                        onClick={onCreateRoom}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        방 만들기
                    </button>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    {rooms.map((room, index) => {
                        const statusBadge = getStatusBadge(room.status);
                        return (
                            <motion.div
                                key={room.roomId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer"
                                onClick={() => onEnterRoom(room.roomId)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* 책 아이콘 */}
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <BookOpen size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">{room.roomName}</h3>
                                            <p className="text-sm text-gray-400">{room.bookTitle}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-purple-300 flex items-center gap-1">
                                                    <Crown size={12} />
                                                    {room.hostName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* 상태 배지 */}
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                            {statusBadge.text}
                                        </span>
                                        {/* 참여자 수 */}
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Users size={16} />
                                            <span className="text-sm">{room.currentParticipants}/{room.maxCapacity}</span>
                                        </div>
                                        {/* 입장 버튼 */}
                                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors">
                                            <DoorOpen size={18} />
                                            입장
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// 메인 TTS룸 페이지
const TtsRoomPage: React.FC = () => {
    const navigate = useNavigate();
    const { roomId } = useParams<{ roomId: string }>();
    const { isAuthenticated, user } = useAuthStore();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // 현재 뷰 상태
    const [currentView, setCurrentView] = useState<'list' | 'room'>('list');
    const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
    const [currentRoom, setCurrentRoom] = useState<ReadingRoom | null>(null);

    // 방 상태

    const [progress] = useState(35);

    // 참여자 목록
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);

    // AI 채팅 상태
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);
    // const [isGenerating, setIsGenerating] = useState(false);

    // 모달 상태
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [profilePopup, setProfilePopup] = useState<{ isOpen: boolean; userId: number; position?: { x: number; y: number } }>({
        isOpen: false,
        userId: 0
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated]);

    // URL에 roomId가 있으면 해당 방으로 입장
    useEffect(() => {
        if (roomId) {
            handleEnterRoom(parseInt(roomId));
        }
    }, [roomId]);

    // 채팅창 스크롤 자동 이동
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatOpen]); // isChatOpen이 열릴 때도 스크롤 조정

    // 방 입장
    const handleEnterRoom = async (roomId: number) => {
        try {
            await readingRoomService.enterRoom(roomId);
            setCurrentRoomId(roomId);
            setCurrentView('room');

            // 1. 방 정보 및 참여자 로드
            const [roomData, participantsData] = await Promise.all([
                readingRoomService.getRoom(roomId),
                readingRoomService.getParticipants(roomId).catch(() => [])
            ]);
            setCurrentRoom(roomData);
            setParticipants(participantsData);

            // 2. 기존 채팅 내역 로드 (REST API)
            try {
                const history = await chatService.getRecentMessages(roomId);
                // API에서 가져온 메시지는 시간순 정렬되어 있다고 가정
                setMessages(history);
            } catch (chatErr) {
                console.error('Failed to load chat history:', chatErr);
            }

            // 3. WebSocket 연결 및 구독
            const token = localStorage.getItem('accessToken'); // 수정: 'token' → 'accessToken'
            console.log('[TtsRoomPage] Token exists:', !!token);

            if (token) {
                console.log('[TtsRoomPage] Checking WebSocket connection status...');
                console.log('[TtsRoomPage] Is connected:', websocketClient.isConnected());

                try {
                    if (!websocketClient.isConnected()) {
                        console.log('[TtsRoomPage] WebSocket not connected, attempting to connect...');
                        await websocketClient.connect(token);
                        console.log('[TtsRoomPage] ✅ WebSocket connection successful');
                    } else {
                        console.log('[TtsRoomPage] WebSocket already connected');
                    }

                    // 채팅 구독 (실시간 수신)
                    console.log('[TtsRoomPage] Subscribing to chat room:', roomId);
                    websocketClient.subscribeToChatRoom(
                        roomId,
                        (newMessage: ChatMessage) => {
                            // [중요] 내 메시지도 서버를 통해 다시 받아서 그리는 것이 정합성에 좋습니다.
                            // 만약 낙관적 업데이트(Optimistic UI)를 썼다면 중복 제거 로직 필요.
                            // 여기서는 서버가 보내주는 걸 그대로 추가합니다.
                            setMessages(prev => [...prev, newMessage]);
                        },
                        () => {
                            alert('방장에 의해 강퇴되었습니다.');
                            handleLeaveRoom();
                        }
                    );

                    // 방 상태 구독
                    console.log('[TtsRoomPage] Subscribing to room status:', roomId);
                    websocketClient.subscribeToRoomStatus(
                        roomId,
                        (statusUpdate) => {
                            if (statusUpdate.type === 'STATUS_CHANGE') {
                                setCurrentRoom(prev => prev ? { ...prev, status: statusUpdate.status } : null);
                            } else if (statusUpdate.type === 'PARTICIPANT_UPDATE') {
                                readingRoomService.getParticipants(roomId).then(setParticipants);
                            }
                        }
                    );
                    console.log('[TtsRoomPage] ✅ All subscriptions completed');
                } catch (wsError) {
                    console.error('[TtsRoomPage] ❌ WebSocket connection/subscription failed:', wsError);
                }
            } else {
                console.warn('[TtsRoomPage] ⚠️ No token found, skipping WebSocket connection');
            }

        } catch (err) {
            console.error('Failed to enter room:', err);
            // 에러 처리 로직
        }
    };

    // AI 채팅 기록 로드
    // const loadChatHistory = async (roomId: number) => {
    //     try {
    //         const history = await aiChatService.getChatHistory(roomId);
    //         setMessages(convertToUIMessages(history));
    //     } catch (err) {
    //         console.error('Failed to load chat history:', err);
    //     }
    // };

    // 방 퇴장
    const handleLeaveRoom = async () => {
        if (currentRoomId) {
            // WebSocket 구독 해제
            websocketClient.unsubscribeFromRoom(currentRoomId);

            try {
                await readingRoomService.leaveRoom(currentRoomId);
            } catch (err) {
                console.error('Failed to leave room:', err);
            }
        }
        setCurrentView('list');
        setCurrentRoomId(null);
        setCurrentRoom(null);
        setMessages([]); // 채팅 초기화
    };



    // 메시지 전송 (스트리밍)
    const handleSendMessage = async () => {
        // if (!newMessage.trim() || !currentRoomId || isGenerating) return;

        // const userMsg = newMessage;
        // setNewMessage('');
        // setIsGenerating(true);

        // // 1. 사용자 메시지 즉시 추가
        // const tempUserMsgId = Date.now();
        // setMessages(prev => [
        //     ...prev,
        //     { id: tempUserMsgId, role: 'user', content: userMsg, timestamp: new Date().toISOString() },
        //     { id: tempUserMsgId + 1, role: 'ai', content: '', isLoading: true } // 로딩 메시지
        // ]);

        // try {
        //     let aiContent = '';

        //     // 스트리밍 호출
        //     aiChatService.sendMessageStream(
        //         currentRoomId,
        //         { userMessage: userMsg }, // currentParagraphId 추가 가능
        //         (chunk) => {
        //             aiContent += chunk;
        //             setMessages(prev => {
        //                 const newMsgs = [...prev];
        //                 const lastMsg = newMsgs[newMsgs.length - 1];
        //                 if (lastMsg && lastMsg.role === 'ai') {
        //                     lastMsg.content = aiContent;
        //                     lastMsg.isLoading = false;
        //                 }
        //                 return newMsgs;
        //             });
        //         },
        //         () => {
        //             setIsGenerating(false);
        //             // 완료 후 다시 로드해서 메타데이터(문단 ID 등) 동기화 (옵션)
        //             // loadChatHistory(currentRoomId);
        //             // 혹은 스트리밍 완료 시점에서 문단 ID를 알 수 없으므로,
        //             // 필요하다면 별도 API를 호출하거나 스트리밍 프로토콜 조정 필요.
        //             // 임시로 스트리밍 완료 처리.
        //         },
        //         (err) => {
        //             console.error('Streaming error:', err);
        //             setIsGenerating(false);
        //             setMessages(prev => {
        //                 const newMsgs = [...prev];
        //                 const lastMsg = newMsgs[newMsgs.length - 1];
        //                 if (lastMsg && lastMsg.role === 'ai') {
        //                     lastMsg.content += '\n(오류가 발생했습니다)';
        //                     lastMsg.isLoading = false;
        //                 }
        //                 return newMsgs;
        //             });
        //         }
        //     );

        // } catch (err) {
        //     console.error('Failed to send message:', err);
        //     setIsGenerating(false);
        // }

        if (!newMessage.trim() || !currentRoomId) return;

        // WebSocket으로 전송 요청
        websocketClient.sendChatMessage(currentRoomId, 'TEXT', newMessage);

        // 입력창 초기화 (메시지 추가는 subscribe 콜백에서 처리함)
        setNewMessage('');
    };


    // 엔터키로 전송
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 프로필 클릭
    const handleProfileClick = (userId: number, event: React.MouseEvent) => {
        if (userId === user?.userId) return; // 내 프로필은 클릭 무시
        setProfilePopup({
            isOpen: true,
            userId,
            position: { x: event.clientX, y: event.clientY }
        });
    };

    // 출처 문단 이동 핸들러
    const handleCitationClick = (paragraphId: string) => {
        console.log(`Moving to paragraph: ${paragraphId}`);
        // TODO: 실제 BookViewer의 문단 이동 로직 연결
        // 예: document.getElementById(paragraphId)?.scrollIntoView();
        alert(`문단 ${paragraphId}로 이동합니다. (구현 예정)`);
    };

    // 방 만들기
    const handleCreateRoom = () => {
        setShowCreateModal(true);
    };

    // 방 생성 완료 후
    const handleRoomCreated = (roomId: number) => {
        handleEnterRoom(roomId);
    };

    // 방장 여부
    const isHost = currentRoom?.hostId === user?.userId || participants.some(p => p.userId === user?.userId && p.isHost);

    // 방 목록 뷰
    if (currentView === 'list') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8">
                {/* 배경 장식 */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10">
                    {/* 네비게이션 */}
                    <div className="max-w-4xl mx-auto mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                            메인으로 돌아가기
                        </Link>
                    </div>

                    <RoomListView
                        onEnterRoom={handleEnterRoom}
                        onCreateRoom={handleCreateRoom}
                    />
                </div>

                {/* 방 만들기 모달 */}
                <CreateRoomModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onRoomCreated={handleRoomCreated}
                />
            </div>
        );
    }

    // 방 안 뷰
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex">
            {/* 배경 장식 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'mr-80' : ''}`}>
                {/* 헤더 */}
                <header className="relative z-10 p-4">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <button
                            onClick={handleLeaveRoom}
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            방 나가기
                        </button>

                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2 text-white/70">
                                <Users size={18} />
                                <span>{participants.length}명 참여 중</span>
                            </span>

                            {isHost && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                                >
                                    <UserPlus size={18} />
                                    친구 초대
                                </button>
                            )}

                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            >
                                <MessageCircle size={20} />
                            </button>
                            <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* 메인 콘텐츠 */}
                <main className="relative z-10 flex-1 px-4 py-8 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        {/* 책 정보 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            <div className="w-32 h-44 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl shadow-2xl flex items-center justify-center">
                                <BookOpen size={48} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {currentRoom?.roomName || 'TTS 독서룸'}
                            </h1>
                            <p className="text-purple-300">{currentRoom?.bookTitle || '함께 책을 들으며 읽어요'}</p>
                        </motion.div>

                        {/* 현재 읽고 있는 문장 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/10"
                        >
                            <p className="text-xl text-white leading-relaxed text-center">
                                "TTS 독서룸 기능은 현재 개발 중입니다. 곧 파이썬 TTS 서버와 연동되어 함께 책을 들으며 읽을 수 있는 경험을 제공할 예정입니다."
                            </p>
                        </motion.div>

                        {/* 진행 바 */}
                        <div className="mb-8">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                />
                            </div>
                            <div className="flex justify-between text-sm text-white/50 mt-2">
                                <span>12:34</span>
                                <span>35:28</span>
                            </div>
                        </div>

                        {/* 컨트롤 (생략) */}

                        {/* 참여자 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10"
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users size={20} />
                                함께 듣고 있는 사람들
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {participants.map((participant) => (
                                    <div
                                        key={participant.participantId}
                                        className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors group"
                                        onClick={(e) => handleProfileClick(participant.userId, e)}
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                            {participant.profileImage ? (
                                                <img src={participant.profileImage} alt="" className="w-full h-full rounded-lg object-cover" />
                                            ) : (
                                                participant.nickname.charAt(0)
                                            )}
                                        </div>
                                        <span className="text-white text-sm">{participant.nickname}</span>
                                        {participant.isHost && (
                                            <Crown size={14} className="text-yellow-400" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* 채팅 사이드바 */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.aside
                        initial={{ x: 320 }}
                        animate={{ x: 0 }}
                        exit={{ x: 320 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-20"
                    >
                        {/* 채팅 헤더 */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageCircle size={20} />
                                    독서 토론 채팅
                                </h3>
                                <button
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm text-white/50 mt-1">참여자들과 실시간으로 대화하세요</p>
                        </div>

                        {/* 채팅 메시지 영역 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.userId;
                                return (
                                    <div
                                        key={msg.chatId || idx}
                                        className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* 프로필 이미지 */}
                                        <div
                                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${isMe
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                                                : 'bg-gradient-to-br from-purple-400 to-pink-400'
                                                }`}

                                            onClick={(e) => !isMe && handleProfileClick(msg.senderId, e)}
                                        >
                                            {/* 이미지가 없으면 이름 첫 글자 */}
                                            {msg.senderProfileImage ? (
                                                <img src={msg.senderProfileImage} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                (msg.senderName || '?').charAt(0)
                                            )}
                                        </div>
                                        {/* 메시지 내용 */}
                                        <div className={`max-w-[80%] ${isMe ? 'text-right' : 'text-left'}`}>
                                            {/* 상대방 이름 표시 */}
                                            {!isMe && (
                                                <p className="text-xs text-white/50 mb-1 ml-1">
                                                    {msg.senderName}
                                                </p>
                                            )}

                                            <div className={`px-3 py-2 rounded-2xl text-sm break-all ${isMe
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-sm'
                                                : 'bg-white/10 text-white rounded-tl-sm'
                                                }`}>
                                                {/* 이미지 메시지 지원 (messageType 확인) */}
                                                {msg.messageType === 'IMAGE' && msg.imageUrl ? (
                                                    <img src={msg.imageUrl} alt="전송된 이미지" className="max-w-full rounded-lg mb-1" />
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>

                                            {/* 시간 표시 */}
                                            <p className="text-[10px] text-white/30 mt-1 px-1">
                                                {new Date(msg.sendAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* 메시지 입력 */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="메시지를 입력하세요..."
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* 친구 초대 모달 */}
            <InviteFriendModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                roomId={currentRoomId || 0}
            />

            {/* 유저 프로필 팝업 */}
            <UserProfilePopup
                isOpen={profilePopup.isOpen}
                userId={profilePopup.userId}
                onClose={() => setProfilePopup({ ...profilePopup, isOpen: false })}
                position={profilePopup.position}
            />
        </div>
    );
};

export default TtsRoomPage;
