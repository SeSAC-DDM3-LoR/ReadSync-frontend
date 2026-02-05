import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, BookOpen, Mic, Gauge, Users, Plus } from 'lucide-react';
import { libraryService, type Library } from '../services/libraryService';
import { readingRoomService } from '../services/readingRoomService';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRoomCreated: (roomId: number) => void;
}

// TTS 목소리 옵션
const VOICE_OPTIONS = [
    { id: 'male_1', name: '남성 1 (차분한)', gender: 'male' },
    { id: 'male_2', name: '남성 2 (밝은)', gender: 'male' },
    { id: 'female_1', name: '여성 1 (차분한)', gender: 'female' },
    { id: 'female_2', name: '여성 2 (밝은)', gender: 'female' },
    { id: 'ai_natural', name: 'AI 자연스러운', gender: 'neutral' },
];

// 속도 옵션
const SPEED_OPTIONS = [
    { value: 0.5, label: '0.5x (느림)' },
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1.0x (보통)' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x (빠름)' },
    { value: 2.0, label: '2.0x (매우 빠름)' },
];

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
    isOpen,
    onClose,
    onRoomCreated
}) => {
    const [roomName, setRoomName] = useState('');
    const [selectedBook, setSelectedBook] = useState<Library | null>(null);
    const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[2].id);
    const [selectedSpeed, setSelectedSpeed] = useState(1.0);
    const [maxParticipants, setMaxParticipants] = useState(5);

    const [myBooks, setMyBooks] = useState<Library[]>([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadMyBooks();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setRoomName('');
        setSelectedBook(null);
        setSelectedVoice(VOICE_OPTIONS[2].id);
        setSelectedSpeed(1.0);
        setMaxParticipants(5);
        setError(null);
    };

    const loadMyBooks = async () => {
        setIsLoadingBooks(true);
        try {
            const data = await libraryService.getMyLibrary(0, 100);
            setMyBooks(data.content || []);
        } catch (err) {
            console.error('Failed to load my books:', err);
            // Mock 데이터 (백엔드 없을 때)
            setMyBooks([
                { libraryId: 1, userId: 1, bookId: 101, bookTitle: '데미안', ownershipType: 'OWNED', totalProgress: 35, readingStatus: 'READING', expiresAt: null, createdAt: '2024-01-01' },
                { libraryId: 2, userId: 1, bookId: 102, bookTitle: '어린 왕자', ownershipType: 'OWNED', totalProgress: 100, readingStatus: 'COMPLETED', expiresAt: null, createdAt: '2024-01-05' },
                { libraryId: 3, userId: 1, bookId: 103, bookTitle: '1984', ownershipType: 'RENTED', totalProgress: 10, readingStatus: 'BEFORE_READING', expiresAt: '2024-02-01', createdAt: '2024-01-10' },
            ]);
        } finally {
            setIsLoadingBooks(false);
        }
    };

    const handleCreateRoom = async () => {
        if (!roomName.trim()) {
            setError('방 제목을 입력해주세요.');
            return;
        }
        if (!selectedBook) {
            setError('책을 선택해주세요.');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const roomId = await readingRoomService.createRoom({
                libraryId: selectedBook.libraryId,
                roomName: roomName.trim(),
                voiceType: 'SEONBI', // 기본 목소리 타입
                maxCapacity: maxParticipants,
            });
            onRoomCreated(roomId);
            onClose();
        } catch (err: any) {
            console.error('Failed to create room:', err);
            setError(err.response?.data?.message || '방 생성에 실패했습니다.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 배경 오버레이 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* 모달 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-lg bg-slate-800 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                            {/* 헤더 */}
                            <div className="relative p-6 bg-gradient-to-r from-purple-500 to-pink-500">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus size={24} />
                                    새 독서룸 만들기
                                </h2>
                                <p className="text-white/80 text-sm mt-1">
                                    친구들과 함께 책을 들으며 읽어보세요
                                </p>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* 콘텐츠 */}
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                {/* 방 제목 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        방 제목 *
                                    </label>
                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        placeholder="예: 데미안 같이 읽어요 🎧"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                                        maxLength={50}
                                    />
                                </div>

                                {/* 책 선택 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <BookOpen size={16} />
                                        내 서재에서 책 선택 *
                                    </label>

                                    {isLoadingBooks ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                        </div>
                                    ) : myBooks.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <BookOpen size={40} className="mx-auto mb-2 opacity-50" />
                                            <p>서재에 책이 없습니다.</p>
                                            <p className="text-sm">먼저 책을 구매해주세요.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                                            {myBooks.map((book) => (
                                                <button
                                                    key={book.libraryId}
                                                    onClick={() => setSelectedBook(book)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedBook?.libraryId === book.libraryId
                                                        ? 'bg-purple-500/30 border-2 border-purple-500'
                                                        : 'bg-slate-700 border-2 border-transparent hover:bg-slate-600'
                                                        }`}
                                                >
                                                    <div className="w-10 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <BookOpen size={18} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium truncate">
                                                            {book.bookTitle}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${book.ownershipType === 'OWNED'
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : 'bg-yellow-500/20 text-yellow-400'
                                                                }`}>
                                                                {book.ownershipType === 'OWNED' ? '소장' : '대여'}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                진행률 {book.totalProgress}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {selectedBook?.libraryId === book.libraryId && (
                                                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-sm">✓</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* TTS 목소리 선택 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Mic size={16} />
                                        TTS 목소리
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {VOICE_OPTIONS.map((voice) => (
                                            <button
                                                key={voice.id}
                                                onClick={() => setSelectedVoice(voice.id)}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedVoice === voice.id
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {voice.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 재생 속도 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Gauge size={16} />
                                        재생 속도
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SPEED_OPTIONS.map((speed) => (
                                            <button
                                                key={speed.value}
                                                onClick={() => setSelectedSpeed(speed.value)}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedSpeed === speed.value
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {speed.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 최대 참여 인원 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Users size={16} />
                                        최대 참여 인원
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="2"
                                            max="10"
                                            value={maxParticipants}
                                            onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                        <span className="text-white font-bold w-10 text-center">
                                            {maxParticipants}명
                                        </span>
                                    </div>
                                </div>

                                {/* 에러 메시지 */}
                                {error && (
                                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* 푸터 */}
                            <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-slate-700 text-gray-300 rounded-xl font-medium hover:bg-slate-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={isCreating || !roomName.trim() || !selectedBook}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            생성 중...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={20} />
                                            방 만들기
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateRoomModal;
