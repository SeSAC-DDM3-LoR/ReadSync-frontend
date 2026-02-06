import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, Loader2 } from 'lucide-react';

// 부모 컴포넌트에서 쓸 타입 정의
export interface BookParagraph {
    id: string;
    text: string;
    speaker: string;
}

interface BookViewerProps {
    roomName?: string;
    bookTitle?: string;
    bookContent: BookParagraph[];
    activeParagraphId: string | null;
    isAudioLoading: boolean;
    onPlayParagraph: (id: string) => void;
}

const BookViewer: React.FC<BookViewerProps> = ({
    roomName,
    bookTitle,
    bookContent,
    activeParagraphId,
    isAudioLoading,
    onPlayParagraph
}) => {
    return (
        <div className="w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-2xl font-bold text-white mb-2">{roomName || 'TTS 독서룸'}</h1>
                <p className="text-purple-300">{bookTitle}</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/10"
            >
                {bookContent.length > 0 ? (() => {
                    // 현재 활성화된 문단의 인덱스 찾기
                    const activeIndex = bookContent.findIndex(p => p.id === activeParagraphId);

                    // 표시할 문단 필터링: 활성 문단 기준 앞뒤 1개씩 (총 최대 3개)
                    const visibleParagraphs = bookContent.filter((_, index) => {
                        if (activeIndex === -1) {
                            // 활성 문단이 없으면 처음 3개만 표시
                            return index < 3;
                        }
                        return index >= activeIndex - 1 && index <= activeIndex + 1;
                    });

                    return (
                        <div className="space-y-6">
                            {visibleParagraphs.map((paragraph) => {
                                const isActive = paragraph.id === activeParagraphId;
                                return (
                                    <div
                                        key={paragraph.id}
                                        onClick={() => onPlayParagraph(paragraph.id)}
                                        className={`
                                            p-4 rounded-xl transition-all cursor-pointer border border-transparent
                                            ${isActive
                                                ? 'bg-purple-500/30 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                                : 'hover:bg-white/5 hover:border-white/10 opacity-60'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${isActive ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                {paragraph.speaker}
                                            </span>
                                            {isActive && !isAudioLoading && <Volume2 size={16} className="text-purple-300 animate-pulse" />}
                                            {isActive && isAudioLoading && <Loader2 size={16} className="text-purple-300 animate-spin" />}
                                        </div>
                                        <p className={`text-lg leading-relaxed ${isActive ? 'text-white font-medium text-xl' : 'text-gray-400'}`}>
                                            {paragraph.text}
                                        </p>
                                    </div>
                                );
                            })}

                            {/* 진행 상태 표시 */}
                            {activeIndex !== -1 && (
                                <div className="text-center text-purple-300/60 text-sm mt-4">
                                    {activeIndex + 1} / {bookContent.length} 문단
                                </div>
                            )}
                        </div>
                    );
                })() : (
                    <div className="text-center py-10 text-white/50">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        책 내용을 불러오는 중입니다...
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default BookViewer;