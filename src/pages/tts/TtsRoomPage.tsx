import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Services & Stores
import useAuthStore from '../../stores/authStore';
import { readingRoomService, type ReadingRoom, type RoomParticipant } from '../../services/readingRoomService';
import { chatService, type ChatMessage } from '../../services/chatService';
import websocketClient from '../../services/websocketClient';
import { ttsService } from '../../services/ttsService';

// Sub Components
import RoomList from './components/RoomList';
import BookViewer, { type BookParagraph } from './components/BookViewer';
import ChatSidebar from './components/ChatSidebar';
import RoomHeader from './components/RoomHeader';
import ParticipantList from './components/ParticipantList';
import RoomControlBar from './components/RoomControlBar'; // 하단 컨트롤 바

// Modals
import UserProfilePopup from '../../components/UserProfilePopup';
import InviteFriendModal from '../../components/InviteFriendModal';
import CreateRoomModal from '../../components/CreateRoomModal';

const TtsRoomPage: React.FC = () => {
    const navigate = useNavigate();
    const { roomId } = useParams<{ roomId: string }>();
    const { isAuthenticated, user } = useAuthStore();
    
    // ---------------- Refs ----------------
    // [수정] useRef는 초기값 null을 가질 수 있도록 제네릭에 HTMLDivElement를 넣고 초기값 null을 줍니다.
    // ChatSidebar 컴포넌트의 Props에서도 ref 타입을 React.RefObject<HTMLDivElement | null>로 받아야 합니다.
    const chatEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // ---------------- States ----------------
    const [currentView, setCurrentView] = useState<'list' | 'room'>('list');
    const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
    const [currentRoom, setCurrentRoom] = useState<ReadingRoom | null>(null);
    
    // Data States
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [bookContent, setBookContent] = useState<BookParagraph[]>([]);
    
    // UI & Playback States
    const [newMessage, setNewMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(true);
    
    // [중요] 재생 관련 상태
    const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false); // 현재 방의 재생 상태 (오디오 태그 제어용)
    const [isAudioLoading, setIsAudioLoading] = useState(false);

    // Modals
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [profilePopup, setProfilePopup] = useState<{ isOpen: boolean; userId: number; position?: { x: number; y: number } }>({
        isOpen: false, userId: 0
    });

    // 방장 여부 확인
    const isHost = currentRoom?.hostId === user?.userId;

    // ---------------- Hooks ----------------

    useEffect(() => {
        if (!isAuthenticated) navigate('/login');
    }, [isAuthenticated]);

    // URL 변경 감지 -> 방 입장 또는 리스트로 이동
    useEffect(() => {
        if (roomId) {
            const id = parseInt(roomId);
            if (!isNaN(id) && currentRoomId !== id) {
                handleEnterRoom(id);
            }
        } else {
            handleLeaveRoom(false);
        }
    }, [roomId]);

    // 더미 데이터 로드 (실제로는 API 호출 필요)
    useEffect(() => {
        if (currentView === 'room') {
            // TODO: 실제로는 roomId에 해당하는 책 내용을 API로 가져와야 합니다.
            setBookContent([
                { id: "p_0003", speaker: "나레이션", text: "사람이란 자기보다 우월하거나 열등한 사람에게 대할 때처럼, 자기의 지위나 처지라는 것을 명료히 의식할 때가 없는 모양이다." },
                { id: "p_0004", speaker: "나레이션", text: "그러나 자기가 저편보다는 낫다, 한 손 접는다고 생각할 때에 느끼는 자랑과 기쁨이 자기를 행복게 하고 향상케 함보다는..." },
                { id: "p_0008", speaker: "나레이션", text: "되지 않게 감상적으로 생긴 나는 점점 바람이 세차 가는 갑판 위에서, 나오는 눈물을 억제하여 가며 가만히 섰다가..." }
            ]);
        }
    }, [currentView]);


    // ---------------- WebSocket & Sync Logic ----------------

    useEffect(() => {
        if (!currentRoomId || currentView !== 'room') return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const connectAndSubscribe = async () => {
            if (!websocketClient.isConnected()) {
                await websocketClient.connect(token);
            }

            // 1. 채팅 구독
            websocketClient.subscribeToChatRoom(currentRoomId, 
                (newMsg) => setMessages(prev => [...prev, newMsg]), 
                () => { alert('강퇴당했습니다.'); handleLeaveRoom(); }
            );
            
            // 2. 방 상태 및 싱크 구독
            websocketClient.subscribeToRoomStatus(currentRoomId, async (message) => {
                // A. 참여자 변경 알림
                if (message.type === 'PARTICIPANT_UPDATE') {
                    console.log("참여자 업데이트 감지! 목록 갱신 시작...");
                    
                    // [수정] DB 트랜잭션이 끝날 때까지 300ms 기다렸다가 요청
                    setTimeout(() => {
                        readingRoomService.getParticipants(currentRoomId)
                            .then(data => {
                                console.log("갱신된 참여자 명단:", data);
                                setParticipants(data);
                            })
                            .catch(err => console.error("참여자 목록 갱신 실패:", err));
                    }, 300);
                }
                
                // B. 방 상태 변경 (재생/일시정지)
                if (message.type === 'STATUS_CHANGE') {
                    const newStatus = message.status; // 'PLAYING' | 'PAUSED'
                    setIsPlaying(newStatus === 'PLAYING');
                    
                    // 오디오 태그 제어
                    if (audioRef.current) {
                        if (newStatus === 'PLAYING') {
                            // 문단이 선택되어 있다면 재생 시도
                            if (audioRef.current.src) audioRef.current.play().catch(() => {});
                        } else {
                            audioRef.current.pause();
                        }
                    }
                }

                // C. 문단 싱크 (방장이 문단을 바꿨을 때)
                if (message.type === 'SYNC_PARAGRAPH') {
                    const targetId = message.paragraphId;
                    setActiveParagraphId(targetId);

                    if (targetId) {
                        try {
                            setIsAudioLoading(true);
                            // 1. 오디오 URL 가져오기
                            const url = await ttsService.getAudioUrl(targetId);
                            
                            // 2. 오디오 설정 및 재생
                            if (audioRef.current) {
                                audioRef.current.src = url;
                                // 현재 방 상태가 PLAYING이라면 소리도 같이 재생
                                // (방금 입장했거나, 방장이 이미 재생 중인 경우)
                                if (isPlaying || message.forcePlay) {
                                    await audioRef.current.play();
                                }
                            }
                        } catch (err) {
                            console.error("Audio Sync Failed:", err);
                        } finally {
                            setIsAudioLoading(false);
                        }
                    }
                }
            });
        };

        connectAndSubscribe();

        return () => {
            websocketClient.unsubscribeFromRoom(currentRoomId);
        };
    }, [currentRoomId, currentView]); // 의존성 배열 주의


    // ---------------- Handlers ----------------

    const handleEnterRoom = async (targetRoomId: number) => {
        if (currentRoomId === targetRoomId && currentView === 'room') return;
        
        if (!window.location.pathname.includes(`/tts-room/${targetRoomId}`)) {
            navigate(`/tts-room/${targetRoomId}`);
            return;
        }

        try {
            await readingRoomService.enterRoom(targetRoomId);
            setCurrentRoomId(targetRoomId);
            setCurrentView('room');

            // 초기 데이터 로드
            const [roomData, participantsData] = await Promise.all([
                readingRoomService.getRoom(targetRoomId),
                readingRoomService.getParticipants(targetRoomId).catch(() => [])
            ]);
            setCurrentRoom(roomData);
            setParticipants(participantsData);
            
            // 방 상태 동기화
            if (roomData.status === 'PLAYING') setIsPlaying(true);

            // 채팅 기록
            try {
                const history = await chatService.getRecentMessages(targetRoomId);
                setMessages(history);
            } catch (chatErr) { console.error('Chat history error:', chatErr); }

        } catch (err) { console.error('Enter room failed:', err); }
    };

    const handleLeaveRoom = async (shouldNavigate = true) => {
        if (currentRoomId) {
            websocketClient.unsubscribeFromRoom(currentRoomId);
            try { await readingRoomService.leaveRoom(currentRoomId); } catch (e) { /* ignore */ }
        }
        
        setCurrentView('list');
        setCurrentRoomId(null);
        setCurrentRoom(null);
        setMessages([]);
        setBookContent([]);
        setIsPlaying(false);
        setActiveParagraphId(null);
        
        if (shouldNavigate) navigate('/tts-room');
    };

    // [방장 전용] 문단 클릭 시 싱크 전송
    const handleHostParagraphClick = (paragraphId: string) => {
        if (!isHost || !currentRoomId) return;

        // 웹소켓으로 싱크 메시지 전송 (구현 필요: websocketClient.sendSyncMessage 등)
        // 임시로 chat 메시지 타입이나 별도 프로토콜 사용
        websocketClient.sendRoomMessage(currentRoomId, {
            type: 'SYNC_PARAGRAPH',
            paragraphId: paragraphId,
            forcePlay: true
        });
    };

    // [방장 전용] 재생 시작 버튼
    const handleStart = async () => {
        if (!currentRoomId || !isHost) return;
        try {
            await readingRoomService.startReading(currentRoomId);
            // 만약 선택된 문단이 없다면 첫 번째 문단부터 시작하도록 싱크 전송
            if (!activeParagraphId && bookContent.length > 0) {
                handleHostParagraphClick(bookContent[0].id);
            }
        } catch (err) { console.error(err); }
    };

    // [방장 전용] 일시정지 버튼
    const handlePause = async () => {
        if (!currentRoomId || !isHost) return;
        try {
            await readingRoomService.pauseReading(currentRoomId);
        } catch (err) { console.error(err); }
    };

    // [방장 전용] 오디오가 끝났을 때 다음 문단으로 자동 이동
    const handleAudioEnded = () => {
        if (!isHost || !activeParagraphId) return;

        const currentIndex = bookContent.findIndex(p => p.id === activeParagraphId);
        if (currentIndex >= 0 && currentIndex < bookContent.length - 1) {
            const nextParagraph = bookContent[currentIndex + 1];
            handleHostParagraphClick(nextParagraph.id);
        } else {
            // 책이 끝났으면 일시정지
            handlePause();
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !currentRoomId) return;
        websocketClient.sendChatMessage(currentRoomId, 'TEXT', newMessage);
        setNewMessage('');
    };

    const handleProfileClick = (userId: number, event: React.MouseEvent) => {
        if (userId === user?.userId) return;
        setProfilePopup({ isOpen: true, userId, position: { x: event.clientX, y: event.clientY } });
    };

    // ---------------- Render ----------------

    if (currentView === 'list') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8">
                <div className="relative z-10">
                    <div className="max-w-4xl mx-auto mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                            <ArrowLeft size={20} /> 메인으로 돌아가기
                        </Link>
                    </div>
                    <RoomList onEnterRoom={handleEnterRoom} onCreateRoom={() => setShowCreateModal(true)} />
                </div>
                <CreateRoomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onRoomCreated={(id) => handleEnterRoom(id)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col">
            {/* 오디오 태그 (숨김) - 방장만 onEnded 이벤트를 처리하여 싱크를 맞춤 */}
            <audio 
                ref={audioRef} 
                onEnded={isHost ? handleAudioEnded : undefined} 
                hidden 
            />

            {/* 배경 효과 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* 메인 레이아웃 */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'mr-80' : ''}`}>
                <RoomHeader 
                    onLeave={() => handleLeaveRoom(true)}
                    participantCount={participants.length}
                    isHost={isHost}
                    onInvite={() => setShowInviteModal(true)}
                    isChatOpen={isChatOpen}
                    onToggleChat={() => setIsChatOpen(!isChatOpen)}
                />

                <main className="relative z-10 flex-1 px-4 py-8 overflow-auto pb-24"> {/* pb-24: 하단 컨트롤 바 공간 확보 */}
                    <div className="max-w-4xl mx-auto w-full">
                        <BookViewer 
                            roomName={currentRoom?.roomName}
                            bookTitle={currentRoom?.bookTitle}
                            bookContent={bookContent}
                            activeParagraphId={activeParagraphId}
                            isAudioLoading={isAudioLoading}
                            // 방장이면 클릭 핸들러 전달, 아니면 빈 함수(클릭 방지)
                            onPlayParagraph={isHost ? handleHostParagraphClick : () => {}}
                        />

                        <ParticipantList 
                            participants={participants}
                            onProfileClick={handleProfileClick}
                        />
                    </div>
                </main>

                {/* 하단 컨트롤 바 (방장이 아니면 정보 표시만, 방장이면 컨트롤 가능) */}
                <RoomControlBar 
                    isHost={isHost}
                    isPlaying={isPlaying}
                    onPlay={handleStart}
                    onPause={handlePause}
                    title={currentRoom?.bookTitle}
                />
            </div>

            {/* 사이드바 및 모달 */}
            <ChatSidebar 
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={messages}
                currentUserId={user?.userId}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSendMessage}
                onProfileClick={handleProfileClick}
                chatEndRef={chatEndRef} // 여기서 에러가 나면 ChatSidebar Props 타입을 확인하세요
            />

            <InviteFriendModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} roomId={currentRoomId || 0} />
            <UserProfilePopup isOpen={profilePopup.isOpen} userId={profilePopup.userId} onClose={() => setProfilePopup({ ...profilePopup, isOpen: false })} position={profilePopup.position} />
        </div>
    );
};

export default TtsRoomPage;