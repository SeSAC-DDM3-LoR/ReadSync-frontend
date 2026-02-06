import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { readingRoomService } from '../../../services/readingRoomService';

interface RoomSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: number;
    currentVoice: 'SEONBI' | 'BORAM' | 'YUNA' | 'KYEON' | 'BITNA';
    currentSpeed: number;
}

const VOICES = [
    { id: 'SEONBI', name: '선비 (차분한 남성)', color: 'from-blue-400 to-blue-600' },
    { id: 'BORAM', name: '보람 (따뜻한 여성)', color: 'from-pink-400 to-pink-600' },
    { id: 'YUNA', name: '유나 (밝은 여성)', color: 'from-purple-400 to-purple-600' },
    { id: 'KYEON', name: '견 (지적인 남성)', color: 'from-indigo-400 to-indigo-600' },
    { id: 'BITNA', name: '빛나 (청량한 여성)', color: 'from-teal-400 to-teal-600' },
] as const;

const SPEEDS = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0];

const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
    isOpen,
    onClose,
    roomId,
    currentVoice,
    currentSpeed
}) => {
    const [selectedVoice, setSelectedVoice] = useState(currentVoice);
    const [selectedSpeed, setSelectedSpeed] = useState(currentSpeed);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const promises = [];
            if (selectedVoice !== currentVoice) {
                promises.push(readingRoomService.updateVoiceType(roomId, selectedVoice));
            }
            if (selectedSpeed !== currentSpeed) {
                promises.push(readingRoomService.updatePlaySpeed(roomId, selectedSpeed));
            }
            await Promise.all(promises);
            onClose();
        } catch (error) {
            console.error('Failed to update settings:', error);
            alert('설정 변경에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white">독서룸 설정</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Voice Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-white/70 block">목소리 선택</label>
                        <div className="grid grid-cols-1 gap-2">
                            {VOICES.map((voice) => (
                                <button
                                    key={voice.id}
                                    onClick={() => setSelectedVoice(voice.id)}
                                    className={`relative flex items-center p-3 rounded-xl border transition-all duration-200 ${selectedVoice === voice.id
                                            ? 'bg-white/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${voice.color} flex items-center justify-center mr-3 shadow-inner`}>
                                        <span className="text-white text-xs font-bold">{voice.id[0]}</span>
                                    </div>
                                    <span className={`flex-1 text-left ${selectedVoice === voice.id ? 'text-white font-semibold' : 'text-white/70'}`}>
                                        {voice.name}
                                    </span>
                                    {selectedVoice === voice.id && (
                                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Speed Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-white/70 block">
                            재생 속도 <span className="text-indigo-400 ml-1">{selectedSpeed}x</span>
                        </label>
                        <div className="flex justify-between bg-white/5 p-1 rounded-xl">
                            {SPEEDS.map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => setSelectedSpeed(speed)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSpeed === speed
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-white/50 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            '변경사항 저장'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomSettingsModal;
