import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, BookOpen, Star, Coins, LogOut,
    Edit2, Loader2, MessageSquare, Heart, Zap,
    X, Camera, Check
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import authService from '../services/authService';
import { reviewService } from '../services/reviewService';
import { commentService } from '../services/reviewService';
import { expService, creditService } from '../services/userService';
import type { Review, Comment } from '../services/reviewService';
import type { ExpLog } from '../services/userService';
import { GENRES, getGenreLabels } from '../constants/genres';

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout, updateUser } = useAuthStore();

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
        { path: '/mypage/credits', label: '씨앗 포인트 내역', icon: Coins }, // Renamed from Credit
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
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center relative group">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl text-white font-bold">{user.nickname?.charAt(0)}</span>
                                        )}
                                        {/* Quick Edit Button Overlay */}
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <Edit2 size={24} />
                                        </button>
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
                            {currentPath === '/mypage' && (
                                <ProfileSection
                                    user={user}
                                    onEdit={() => setIsEditModalOpen(true)}
                                />
                            )}
                            {currentPath === '/mypage/reviews' && <MyReviewsSection />}
                            {currentPath === '/mypage/comments' && <MyCommentsSection />}
                            {currentPath === '/mypage/exp' && <ExpLogSection />}
                            {currentPath === '/mypage/credits' && <CreditsSection />}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <EditProfileModal
                        user={user}
                        onClose={() => setIsEditModalOpen(false)}
                        onUpdate={(updatedData) => {
                            updateUser(updatedData);
                            setIsEditModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// 프로필 편집 모달
const EditProfileModal: React.FC<{
    user: any;
    onClose: () => void;
    onUpdate: (data: any) => void
}> = ({ user, onClose, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [nickname, setNickname] = useState(user.nickname);

    // Parse initial genres from string "fantasy,romance" -> ["fantasy", "romance"]
    const initialGenres = user.preferredGenre ? user.preferredGenre.split(',').map((g: string) => g.trim()) : [];
    const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);

    const [profileImage, setProfileImage] = useState<string | null>(user.profileImage);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleGenre = (genreId: string) => {
        if (selectedGenres.includes(genreId)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genreId));
        } else if (selectedGenres.length < 3) {
            setSelectedGenres([...selectedGenres, genreId]);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("이미지 크기는 5MB 이하여야 합니다.");
                return;
            }
            setImageFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (nickname.trim().length < 2) {
            setError("닉네임은 2자 이상이어야 합니다.");
            return;
        }
        if (selectedGenres.length === 0) {
            setError("최소 1개의 선호 장르를 선택해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let finalImageUrl = profileImage;

            // 1. Upload Image if changed
            if (imageFile) {
                try {
                    finalImageUrl = await authService.uploadImage(imageFile);
                } catch (err) {
                    console.error("Image upload failed:", err);
                    setError("이미지 업로드에 실패했습니다.");
                    setIsSubmitting(false);
                    return;
                }
            }

            // 2. Update Profile
            const preferredGenreStr = selectedGenres.join(',');
            const updatePayload = {
                nickname,
                preferredGenre: preferredGenreStr,
                profileImage: finalImageUrl || undefined
            };

            const updatedUser = await authService.updateProfile(updatePayload);

            // 3. Update Store & Close
            onUpdate({
                nickname,
                preferredGenre: preferredGenreStr,
                profileImage: finalImageUrl
            });

        } catch (err) {
            console.error("Profile update failed:", err);
            setError("프로필 수정에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">프로필 수정</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-emerald-50">
                                <img
                                    src={previewImage || profileImage || "https://via.placeholder.com/150"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                            <div className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full text-white shadow-lg">
                                <Edit2 size={14} />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <p className="text-sm text-gray-500 mt-2">클릭하여 이미지 변경</p>
                    </div>

                    {/* Nickname */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={20}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium"
                        />
                    </div>

                    {/* Genres */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            선호 장르 <span className="text-emerald-500 text-xs font-normal">(최대 3개)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {GENRES.map((genre) => {
                                const isSelected = selectedGenres.includes(genre.id);
                                return (
                                    <button
                                        key={genre.id}
                                        onClick={() => toggleGenre(genre.id)}
                                        className={`px-3 py-3 rounded-xl border text-left flex items-center gap-2 transition-all ${isSelected
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${genre.color}`}>
                                            <genre.icon size={14} className="text-white" />
                                        </div>
                                        <span className="text-sm font-bold flex-1">{genre.label}</span>
                                        {isSelected && <Check size={14} className="text-emerald-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            '저장하기'
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// 프로필 섹션
const ProfileSection: React.FC<{ user: any; onEdit: () => void }> = ({ user, onEdit }) => {
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
                        <p className="text-lg text-gray-900 font-medium">{user.nickname}#{user.tag}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">레벨</label>
                        <p className="text-lg text-gray-900 font-medium">Lv.{user.levelId || 1}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">경험치</label>
                        <p className="text-lg text-gray-900 font-medium">{user.experience || 0} EXP</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">선호 장르</label>
                        <p className="text-lg text-gray-900 font-medium flex flex-wrap gap-2">
                            {user.preferredGenre ? (
                                user.preferredGenre.split(',').map((g: string) => (
                                    <span key={g} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100">
                                        {getGenreLabels(g.trim())}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400">미설정</span>
                            )}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onEdit}
                    className="mt-8 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                    <Edit2 size={18} />
                    프로필 수정
                </button>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <StatCard icon={<BookOpen className="text-emerald-500" />} label="읽은 책" value={`${user.readBookCount || 0}권`} />
                <StatCard icon={<Star className="text-amber-500" />} label="작성 리뷰" value={`${user.reviewCount || 0}개`} />
                <StatCard icon={<Coins className="text-yellow-500" />} label="씨앗 포인트" value={(user.totalCredit || 0).toLocaleString()} />
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
                <p className="text-xl font-bold text-gray-900">{value}</p>
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

// 씨앗 포인트 (크레딧) 내역 섹션 - Renamed
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
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">씨앗 포인트 내역</h2> {/* Renamed */}
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl p-8 mb-6">
                <p className="text-amber-700 font-medium mb-2">보유 씨앗</p>
                <p className="text-4xl font-extrabold text-amber-800 flex items-center gap-2">
                    <Coins size={32} /> {balance.toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

export default MyPage;
