import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, Plus, Loader2, ChevronRight, MessageSquare } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { inquiryService } from '../services/userService';
import useAuthStore from '../stores/authStore';
import type { Inquiry } from '../services/userService';

const InquiryPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadInquiries();
    }, [isAuthenticated]);

    const loadInquiries = async () => {
        try {
            const data = await inquiryService.getMyInquiries();
            setInquiries(data);
        } catch (error) {
            console.error('Failed to load inquiries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return { text: '답변 대기', class: 'bg-amber-100 text-amber-700' };
            case 'ANSWERED': return { text: '답변 완료', class: 'bg-green-100 text-green-700' };
            default: return { text: status, class: 'bg-gray-100 text-gray-600' };
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                                <HelpCircle className="text-emerald-500" />
                                1:1 문의
                            </h1>
                            <p className="text-gray-600 mt-2">궁금한 점이 있으시면 문의해주세요</p>
                        </motion.div>

                        <button
                            onClick={() => setShowWriteModal(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                        >
                            <Plus size={20} />
                            문의하기
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="text-center py-20">
                            <MessageSquare size={64} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">문의 내역이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {inquiries.map((inquiry, index) => {
                                const status = getStatusLabel(inquiry.status);
                                return (
                                    <motion.div
                                        key={inquiry.inquiryId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedInquiry(selectedInquiry?.inquiryId === inquiry.inquiryId ? null : inquiry)}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-emerald-200 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${status.class}`}>
                                                    {status.text}
                                                </span>
                                                <h3 className="font-bold text-gray-900">{inquiry.title}</h3>
                                            </div>
                                            <ChevronRight
                                                size={20}
                                                className={`text-gray-400 transition-transform ${selectedInquiry?.inquiryId === inquiry.inquiryId ? 'rotate-90' : ''}`}
                                            />
                                        </div>
                                        {selectedInquiry?.inquiryId === inquiry.inquiryId && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-4 pt-4 border-t border-gray-100"
                                            >
                                                <p className="text-gray-600 whitespace-pre-wrap">{inquiry.content}</p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* 문의 작성 모달 */}
            {showWriteModal && (
                <WriteInquiryModal onClose={() => setShowWriteModal(false)} onSuccess={loadInquiries} />
            )}
        </div>
    );
};

// 문의 작성 모달
const WriteInquiryModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await inquiryService.createInquiry({ title, content });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create inquiry:', error);
            alert('문의 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-3xl p-8 w-full max-w-2xl"
            >
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6">문의하기</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="문의 제목"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="문의 내용을 상세히 작성해주세요"
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl disabled:opacity-50"
                        >
                            {isSubmitting ? '등록 중...' : '등록하기'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default InquiryPage;
