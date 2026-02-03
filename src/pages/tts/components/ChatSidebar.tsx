import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import type { ChatMessage } from '../../../services/chatService';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    currentUserId?: number;
    newMessage: string;
    setNewMessage: (msg: string) => void;
    onSendMessage: () => void;
    onProfileClick: (userId: number, event: React.MouseEvent) => void;
    chatEndRef: React.RefObject<HTMLDivElement | null>
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    isOpen,
    onClose,
    messages,
    currentUserId,
    newMessage,
    setNewMessage,
    onSendMessage,
    onProfileClick,
    chatEndRef
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    initial={{ x: 320 }}
                    animate={{ x: 0 }}
                    exit={{ x: 320 }}
                    className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-[60]"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageCircle size={20} /> 독서 토론
                        </h3>
                        <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUserId;
                            return (
                                <div key={msg.chatId || idx} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs cursor-pointer ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-purple-400 to-pink-400'}`}
                                        onClick={(e) => !isMe && onProfileClick(msg.senderId, e)}
                                    >
                                        {msg.senderProfileImage ? (
                                            <img src={msg.senderProfileImage} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            (msg.senderName || '?').charAt(0)
                                        )}
                                    </div>
                                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}>
                                        {!isMe && <p className="text-xs text-white/50 mb-1">{msg.senderName}</p>}
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/10 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="메시지 입력..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500"
                        />
                        <button
                            onClick={onSendMessage}
                            disabled={!newMessage.trim()}
                            className="p-2 bg-purple-500 rounded-xl text-white hover:opacity-90 disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};

export default ChatSidebar;