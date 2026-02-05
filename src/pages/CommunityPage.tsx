import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageSquare, Plus, Eye, Heart, Clock, Loader2,
    ChevronRight, Search
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { communityService } from '../services/communityService';
import useAuthStore from '../stores/authStore';
import type { CommunityPost } from '../services/communityService';

const CommunityPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showWriteModal, setShowWriteModal] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setIsLoading(true);
        try {
            const data = await communityService.getPosts();
            setPosts(data);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWriteClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowWriteModal(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* 페이지 헤더 */}
                    <div className="flex items-center justify-between mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                                <MessageSquare className="text-emerald-500" />
                                커뮤니티
                            </h1>
                            <p className="text-gray-600 mt-2">독서에 대한 이야기를 나눠보세요</p>
                        </motion.div>

                        <button
                            onClick={handleWriteClick}
                            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg shadow-emerald-200 transition-all"
                        >
                            <Plus size={20} />
                            글쓰기
                        </button>
                    </div>

                    {/* 검색 */}
                    <div className="relative mb-8">
                        <input
                            type="text"
                            placeholder="게시글 검색..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-emerald-100 
                         focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 
                         outline-none transition-all"
                        />
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    </div>

                    {/* 게시글 목록 */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <MessageSquare size={64} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-4">아직 게시글이 없습니다</p>
                            <button
                                onClick={handleWriteClick}
                                className="inline-flex items-center gap-2 text-emerald-600 hover:underline"
                            >
                                첫 글 작성하기 <ChevronRight size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post, index) => (
                                <PostCard key={post.postId} post={post} index={index} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* 글쓰기 모달 */}
            {showWriteModal && (
                <WritePostModal onClose={() => setShowWriteModal(false)} onSuccess={loadPosts} />
            )}
        </div>
    );
};

// 게시글 카드
const PostCard: React.FC<{ post: CommunityPost; index: number }> = ({ post, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link
                to={`/community/${post.postId}`}
                className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                    {post.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 mb-4">
                    {post.content}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <Eye size={16} /> {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                            <Heart size={16} /> {post.likeCount}
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </Link>
        </motion.div>
    );
};

// 글쓰기 모달
const WritePostModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
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
            await communityService.createPost({ title, content });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create post:', error);
            alert('게시글 작성에 실패했습니다.');
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
                className="relative bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6">새 글 작성</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="내용을 입력하세요"
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? '작성 중...' : '작성하기'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CommunityPage;
