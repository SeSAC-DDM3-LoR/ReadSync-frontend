import React from 'react';
import { ArrowLeft, Users, UserPlus, MessageCircle, Settings } from 'lucide-react';

interface RoomHeaderProps {
    onLeave: () => void;
    participantCount: number;
    isHost: boolean;
    onInvite: () => void;
    isChatOpen: boolean;
    onToggleChat: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ onLeave, participantCount, isHost, onInvite, isChatOpen, onToggleChat }) => (
    <header className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button onClick={onLeave} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <ArrowLeft size={20} /> 방 나가기
            </button>
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-white/70">
                    <Users size={18} /> <span>{participantCount}명 참여 중</span>
                </span>
                {isHost && (
                    <button onClick={onInvite} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                        <UserPlus size={18} /> 초대
                    </button>
                )}
                <button onClick={onToggleChat} className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                    <MessageCircle size={20} />
                </button>
                <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <Settings size={20} />
                </button>
            </div>
        </div>
    </header>
);

export default RoomHeader;