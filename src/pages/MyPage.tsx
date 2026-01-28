import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User, BookOpen, Star, Coins, Trophy, Settings, LogOut,
    ChevronRight, Edit2, Loader2, MessageSquare, Heart, Zap
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import { reviewService } from '../services/reviewService';
import { commentService } from '../services/reviewService';
import { expService, creditService } from '../services/userService';
import type { Review, Comment } from '../services/reviewService';
import type { ExpLog } from '../services/userService';

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated]);

    if (!user) return null;

    const menuItems = [
        { path: '/mypage', label: '프로필', icon: User },
        { path: '/mypage/reviews', label: '내 리뷰', icon: Star },
        { path: '/mypage/comments', label: '내 댓글', icon: MessageSquare },
        { path: '/mypage/exp', label: '경험치 내역', icon: Zap },
        { path: '/mypage/credits', label: '크레딧 내역', icon: Coins },
        { path: '/inquiry', label: '1:1 문의', icon: Edit2 },
        { path: '/notices', label: '공지사항', icon: Heart },
    ];

    const currentPath = location.pathname;

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await logout();
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* 사이드바 */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
                                {/* 프로필 요약 */}
                                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl text-white font-bold">{user.nickname?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <h2 className="font-bold text-xl text-gray-900">
                                        {user.nickname}
                                        <span className="text-gray-400 font-normal text-sm">#{user.tag}</span>
                                    </h2>
                                    <p className="text-sm text-emerald-600 font-medium mt-1">Lv.{user.levelId || 1}</p>
                                </div>

                                {/* 메뉴 */}
                                <nav className="space-y-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentPath === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Icon size={20} />
                                                <span className="font-medium">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                <button
                                    onClick={handleLogout}
                                    className="w-full mt-6 flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">로그아웃</span>
                                </button>
                            </div>
                        </div>

                        {/* 메인 콘텐츠 */}
                        <div className="lg:col-span-3">
                            {currentPath === '/mypage' && <ProfileSection user={user} />}
                            {currentPath === '/mypage/reviews' && <MyReviewsSection />}
                            {currentPath === '/mypage/comments' && <MyCommentsSection />}
                            {currentPath === '/mypage/exp' && <ExpLogSection />}
                            {currentPath === '/mypage/credits' && <CreditsSection />}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

// 프로필 섹션
const ProfileSection: React.FC<{ user: any }> = ({ user }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">내 프로필</h2>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">닉네임</label>
                        <p className="text-lg text-gray-900">{user.nickname}#{user.tag}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">레벨</label>
                        <p className="text-lg text-gray-900">Lv.{user.levelId || 1}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">경험치</label>
                        <p className="text-lg text-gray-900">{user.experience || 0} EXP</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">선호 장르</label>
                        <p className="text-lg text-gray-900">{user.preferredGenre || '미설정'}</p>
                    </div>
                </div>

                <button className="mt-8 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2">
                    <Edit2 size={18} />
                    프로필 수정
                </button>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard icon={<BookOpen className="text-emerald-500" />} label="읽은 책" value="23권" />
                <StatCard icon={<Star className="text-amber-500" />} label="작성 리뷰" value="12개" />
                <StatCard icon={<Coins className="text-yellow-500" />} label="크레딧" value="1,250" />
                <StatCard icon={<Trophy className="text-purple-500" />} label="연속 출석" value="7일" />
            </div>
        </motion.div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
            {icon}
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

// 내 리뷰 섹션
const MyReviewsSection: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const response = await reviewService.getMyReviews(0, 20);
            setReviews(response.content);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">내 리뷰</h2>
            {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-12">작성한 리뷰가 없습니다.</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.reviewId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-1 mb-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={16} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                                ))}
                            </div>
                            <p className="font-bold text-gray-900 mb-1">{review.bookTitle}</p>
                            <p className="text-gray-600">{review.content}</p>
                            <p className="text-sm text-gray-500 mt-3">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// 내 댓글 섹션
const MyCommentsSection: React.FC = () => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadComments();
    }, []);

    const loadComments = async () => {
        try {
            const data = await commentService.getMyComments();
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">내 댓글</h2>
            {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-12">작성한 댓글이 없습니다.</p>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.commentId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <p className="text-gray-700">{comment.content}</p>
                            <p className="text-sm text-gray-500 mt-3">{new Date(comment.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// 경험치 내역 섹션
const ExpLogSection: React.FC = () => {
    const [logs, setLogs] = useState<ExpLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const response = await expService.getMyExpLogs(0, 20);
            setLogs(response.content);
        } catch (error) {
            console.error('Failed to load exp logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">경험치 내역</h2>
            {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-12">경험치 내역이 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => (
                        <div key={log.expLogId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">{log.activityDescription}</p>
                                <p className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="text-emerald-600 font-bold">+{log.earnedExp} EXP</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// 크레딧 내역 섹션
const CreditsSection: React.FC = () => {
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadBalance();
    }, []);

    const loadBalance = async () => {
        try {
            const data = await creditService.getMyBalance();
            setBalance(data);
        } catch (error) {
            console.error('Failed to load balance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">크레딧 내역</h2>
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl p-8 mb-6">
                <p className="text-amber-700 font-medium mb-2">보유 크레딧</p>
                <p className="text-4xl font-extrabold text-amber-800 flex items-center gap-2">
                    <Coins size={32} /> {balance.toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

export default MyPage;
