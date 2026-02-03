import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, DoorOpen, Crown, Loader2 } from 'lucide-react';
import { readingRoomService, type ReadingRoom } from '../../../services/readingRoomService';

interface RoomListProps {
    onEnterRoom: (roomId: number) => void;
    onCreateRoom: () => void;
}

const RoomList: React.FC<RoomListProps> = ({ onEnterRoom, onCreateRoom }) => {
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                            {statusBadge.text}
                                        </span>
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Users size={16} />
                                            <span className="text-sm">{room.currentParticipants}/{room.maxCapacity}</span>
                                        </div>
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

export default RoomList;