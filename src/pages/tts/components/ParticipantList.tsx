import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crown } from 'lucide-react';
import type { RoomParticipant } from '../../../services/readingRoomService';

interface ParticipantListProps {
    participants: RoomParticipant[];
    onProfileClick: (userId: number, event: React.MouseEvent) => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, onProfileClick }) => (
    <motion.div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} /> 함께 듣고 있는 사람들
        </h3>
        <div className="flex flex-wrap gap-3">
            {participants.map((participant) => (
                <div 
                    key={participant.participantId} 
                    className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors" 
                    onClick={(e) => onProfileClick(participant.userId, e)}
                >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {participant.profileImage ? <img src={participant.profileImage} alt="" className="rounded-lg w-full h-full object-cover" /> : participant.nickname.charAt(0)}
                    </div>
                    <span className="text-white text-sm">{participant.nickname}</span>
                    {participant.isHost && <Crown size={14} className="text-yellow-400" />}
                </div>
            ))}
        </div>
    </motion.div>
);

export default ParticipantList;