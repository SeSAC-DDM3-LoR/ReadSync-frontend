import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronRight, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { noticeService } from '../services/userService';
import type { Notice } from '../services/userService';

const NoticesPage: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        try {
            const data = await noticeService.getNotices();
            setNotices(data);
        } catch (error) {
            console.error('Failed to load notices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Bell className="text-emerald-500" />
                            공지사항
                        </h1>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : notices.length === 0 ? (
                        <div className="text-center py-20">
                            <Bell size={64} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">공지사항이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notices.map((notice, index) => (
                                <motion.div
                                    key={notice.noticeId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedNotice(selectedNotice?.noticeId === notice.noticeId ? null : notice)}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-emerald-200 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900">{notice.title}</h3>
                                        <ChevronRight
                                            size={20}
                                            className={`text-gray-400 transition-transform ${selectedNotice?.noticeId === notice.noticeId ? 'rotate-90' : ''}`}
                                        />
                                    </div>
                                    {selectedNotice?.noticeId === notice.noticeId && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-4 pt-4 border-t border-gray-100"
                                        >
                                            <p className="text-gray-600 whitespace-pre-wrap">{notice.content}</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NoticesPage;
