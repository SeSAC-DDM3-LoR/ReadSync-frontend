import React from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface RoomControlBarProps {
    isHost: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    title?: string;
}

const RoomControlBar: React.FC<RoomControlBarProps> = ({ isHost, isPlaying, onPlay, onPause, title }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 flex items-center justify-center z-50 px-4">
            <div className="max-w-4xl w-full flex items-center justify-between">
                <div className="text-white">
                    <p className="text-sm text-gray-400">현재 읽고 있는 책</p>
                    <p className="font-bold">{title || "책 제목 없음"}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* 이전 문단 (아이콘만) */}
                    <button className="p-2 text-white/50 hover:text-white transition-colors" disabled={!isHost}>
                        <SkipBack size={24} />
                    </button>

                    {/* 재생/일시정지 버튼 (방장만 활성) */}
                    {isHost ? (
                        <button
                            onClick={isPlaying ? onPause : onPlay}
                            className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-white/10 rounded-full text-sm text-white/70">
                            {isPlaying ? "방장이 재생 중..." : "방장이 일시정지함"}
                        </div>
                    )}

                    {/* 다음 문단 (아이콘만) */}
                    <button className="p-2 text-white/50 hover:text-white transition-colors" disabled={!isHost}>
                        <SkipForward size={24} />
                    </button>
                </div>

                {/* 우측 여백용 더미 */}
                <div className="w-32 hidden md:block"></div>
            </div>
        </div>
    );
};

export default RoomControlBar;