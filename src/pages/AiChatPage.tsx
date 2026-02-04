import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Bot, User, ArrowLeft, Sparkles } from 'lucide-react';
import Header from '../components/layout/Header';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

const AiChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: 'assistant',
            content: '안녕하세요! 저는 ReadSync AI 독서 도우미입니다. 📚\n\n책에 대한 질문이나 추천을 원하시면 말씀해주세요!',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // 임시 응답 (AI 연동 예정)
        setTimeout(() => {
            const aiResponse: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'AI 채팅 기능은 현재 개발 중입니다. 곧 파이썬 AI 서버와 연동되어 더욱 스마트한 독서 경험을 제공할 예정입니다! 🚀',
            };
            setMessages((prev) => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-4 px-4 flex flex-col">
                <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                    {/* 헤더 */}
                    <div className="mb-6">
                        <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4">
                            <ArrowLeft size={20} />
                            홈으로 돌아가기
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            AI 독서 도우미
                        </h1>
                        <p className="text-gray-600 mt-2">책에 대해 무엇이든 물어보세요!</p>
                    </div>

                    {/* 채팅 영역 */}
                    <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        {/* 메시지 목록 */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                        }`}>
                                        {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                    </div>
                                    <div className={`max-w-[70%] p-4 rounded-2xl ${message.role === 'user'
                                        ? 'bg-emerald-500 text-white rounded-tr-none'
                                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <Bot size={20} className="text-white" />
                                    </div>
                                    <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 입력 영역 */}
                        <div className="p-4 border-t border-gray-100">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="메시지를 입력하세요..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AiChatPage;
