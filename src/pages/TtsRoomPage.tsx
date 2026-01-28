import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Volume2, VolumeX, Play, Pause, SkipBack, SkipForward,
    Settings, Users, ArrowLeft, BookOpen, Send, MessageCircle,
    Plus, UserPlus, Crown, X, Loader2, DoorOpen
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { readingRoomService, type ReadingRoom, type RoomParticipant } from '../services/readingRoomService';
import UserProfilePopup from '../components/UserProfilePopup';
import InviteFriendModal from '../components/InviteFriendModal';
import CreateRoomModal from '../components/CreateRoomModal';

interface ChatMessage {
    chatId: number;
    senderId: number;
    senderName: string;
    senderProfileImage: string | null;
    content: string;
    sendAt: string;
}

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
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [progress] = useState(35);

    // 참여자 목록
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);

    // 채팅 상태
    const [messages, setMessages] = useState<ChatMessage[]>([
        { chatId: 1, senderId: 1, senderName: '김독서', senderProfileImage: null, content: '안녕하세요! 이 책 재밌네요', sendAt: new Date().toISOString() },
        { chatId: 2, senderId: 2, senderName: '이북러', senderProfileImage: null, content: '저도 이 부분 좋아요 ㅎㅎ', sendAt: new Date().toISOString() },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);

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
    }, [messages]);

    // 방 입장
    const handleEnterRoom = async (roomId: number) => {
        try {
            await readingRoomService.enterRoom(roomId);
            setCurrentRoomId(roomId);
            setCurrentView('room');

            // 방 정보 로드
            try {
                const roomData = await readingRoomService.getRoom(roomId);
                setCurrentRoom(roomData);
            } catch (err) {
                console.error('Failed to load room:', err);
            }

            // 참여자 목록 로드
            try {
                const participantsData = await readingRoomService.getParticipants(roomId);
                setParticipants(participantsData);
            } catch (err) {
                // Mock 참여자 데이터
                setParticipants([
                    { participantId: 1, userId: user?.userId || 0, nickname: user?.nickname || '나', profileImage: null, isHost: true, joinedAt: new Date().toISOString() },
                ]);
            }
        } catch (err) {
            console.error('Failed to enter room:', err);
            // 실패해도 일단 방 화면으로 이동 (개발 모드)
            setCurrentRoomId(roomId);
            setCurrentView('room');
        }
    };

    // 방 퇴장
    const handleLeaveRoom = async () => {
        if (currentRoomId) {
            try {
                await readingRoomService.leaveRoom(currentRoomId);
            } catch (err) {
                console.error('Failed to leave room:', err);
            }
        }
        setCurrentView('list');
        setCurrentRoomId(null);
        setCurrentRoom(null);
    };

    // 참여자 강퇴
    const handleKickUser = async (targetUserId: number) => {
        if (!currentRoomId) return;
        try {
            await readingRoomService.kickUser(currentRoomId, targetUserId);
            setParticipants(prev => prev.filter(p => p.userId !== targetUserId));
        } catch (err) {
            console.error('Failed to kick user:', err);
        }
    };

    // 메시지 전송
    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const newMsg: ChatMessage = {
            chatId: Date.now(),
            senderId: user?.userId || 0,
            senderName: user?.nickname || '나',
            senderProfileImage: user?.profileImage || null,
            content: newMessage,
            sendAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');

        // TODO: 실제로는 WebSocket으로 메시지 전송
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
        setProfilePopup({
            isOpen: true,
            userId,
            position: { x: event.clientX, y: event.clientY }
        });
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

                        {/* 컨트롤 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-6"
                        >
                            <button className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                <SkipBack size={24} />
                            </button>

                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                            >
                                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                            </button>

                            <button className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                <SkipForward size={24} />
                            </button>
                        </motion.div>

                        {/* 추가 컨트롤 */}
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                            >
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                <span className="text-sm">음량</span>
                            </button>

                            <div className="flex items-center gap-2 text-white/70">
                                <span className="text-sm">속도</span>
                                <select
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
                                >
                                    <option value="0.5">0.5x</option>
                                    <option value="0.75">0.75x</option>
                                    <option value="1">1x</option>
                                    <option value="1.25">1.25x</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="2">2x</option>
                                </select>
                            </div>
                        </div>

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

                                        {/* 강퇴 버튼 (방장만, 자기 자신 제외) */}
                                        {isHost && participant.userId !== user?.userId && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleKickUser(participant.userId);
                                                }}
                                                className="ml-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                                                title="강퇴"
                                            >
                                                <X size={14} />
                                            </button>
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
                                    실시간 채팅
                                </h3>
                                <button
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-1 text-white/50 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm text-white/50 mt-1">함께 읽는 분들과 소통하세요</p>
                        </div>

                        {/* 채팅 메시지 영역 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === (user?.userId || 0);
                                return (
                                    <div
                                        key={msg.chatId}
                                        className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* 프로필 이미지 */}
                                        <div
                                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs cursor-pointer ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-purple-400 to-pink-400'
                                                }`}
                                            onClick={(e) => !isMe && handleProfileClick(msg.senderId, e)}
                                        >
                                            {msg.senderName.charAt(0)}
                                        </div>

                                        {/* 메시지 내용 */}
                                        <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                                            <p
                                                className="text-xs text-white/50 mb-1 cursor-pointer hover:text-white/70"
                                                onClick={(e) => !isMe && handleProfileClick(msg.senderId, e)}
                                            >
                                                {msg.senderName}
                                            </p>
                                            <div className={`px-3 py-2 rounded-2xl text-sm ${isMe
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-sm'
                                                : 'bg-white/10 text-white rounded-tl-sm'
                                                }`}>
                                                {msg.content}
                                            </div>
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
