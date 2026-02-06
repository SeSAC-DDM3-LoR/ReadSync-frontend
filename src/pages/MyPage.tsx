import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, BookOpen, Star, Coins, LogOut,
    Edit2, Loader2, MessageSquare, Zap,
    X, Camera, Check, CreditCard, Crown, BarChart3, Clock,
    Wand2, Skull, Heart, Rocket, Briefcase, Leaf, History, Music
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import authService from '../services/authService';
import { reviewService } from '../services/reviewService';
import { commentService } from '../services/reviewService';
import { expService, creditService } from '../services/userService';
import { adminCategoryService } from '../services/adminService';
import { levelService, getExpProgress, getExpNeededForNextLevel } from '../services/levelService';
import type { Level } from '../services/levelService';
import { subscriptionService, type Subscription } from '../services/subscriptionService';
import { paymentService, type OrderResponse } from '../services/paymentService';
import { profileService } from '../services/userService';
import type { Review, Comment } from '../services/reviewService';
import type { ExpLog } from '../services/userService';
import { GENRES, getGenreLabels } from '../constants/genres';
import { bookLogService, type BookLog } from '../services/libraryService';

const GENRE_ICONS = [Wand2, Heart, Skull, Rocket, Briefcase, Leaf, History, Music];
const GENRE_COLORS = [
    'from-purple-500 to-indigo-500',
    'from-pink-500 to-rose-500',
    'from-gray-700 to-gray-900',
    'from-cyan-500 to-blue-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-green-500',
    'from-yellow-600 to-amber-700',
    'from-teal-500 to-cyan-500'
];

interface UIGenre {
    id: string; // categoryName as ID
    label: string;
    icon: any;
    color: string;
}

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout, updateUser, fetchCurrentUser } = useAuthStore();

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            // 마이페이지 진입 시 최신 유저 정보 갱신 (경험치, 레벨 등)
            fetchCurrentUser();
        }
    }, [isAuthenticated]);

    if (!user) return null;

    const menuItems = [
        { path: '/mypage', label: '프로필', icon: User },
        { path: '/mypage/subscription', label: '구독 관리 및 결제', icon: Crown },
        { path: '/mypage/reviews', label: '내 리뷰', icon: Star },
        { path: '/mypage/comments', label: '내 댓글', icon: MessageSquare },
        { path: '/mypage/exp', label: '경험치 내역', icon: Zap },
        { path: '/mypage/credits', label: '씨앗 포인트 내역', icon: Coins }, // Renamed from Credit
        // { path: '/inquiry', label: '1:1 문의', icon: Edit2 },
        // { path: '/notices', label: '공지사항', icon: Heart },
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
                                            <img src={user.profileImage ?? undefined} alt={user.nickname ?? 'Profile'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl text-white font-bold">{user.nickname?.charAt(0) || 'U'}</span>
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
                                    className="w-full mt-6 flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">로그아웃</span>
                                </button>

                                <button
                                    onClick={() => {
                                        if (user.role === 'ADMIN') {
                                            alert('관리자 계정은 회원 탈퇴할 수 없습니다.');
                                            return;
                                        }
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <User size={20} />
                                    <span className="font-medium">회원 탈퇴</span>
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
                            {currentPath === '/mypage/subscription' && <SubscriptionSection />}
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
                {isDeleteModalOpen && (
                    <DeleteAccountModal
                        user={user}
                        onClose={() => setIsDeleteModalOpen(false)}
                        logout={logout}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// 회원 탈퇴 모달
const DeleteAccountModal: React.FC<{
    user: any;
    onClose: () => void;
    logout: () => void;
}> = ({ user, onClose, logout }) => {
    const [password, setPassword] = useState('');
    const [confirmationText, setConfirmationText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLocalUser = user.provider === 'LOCAL';

    const handleSubmit = async () => {
        setError(null);

        if (isLocalUser) {
            if (!password) {
                setError('비밀번호를 입력해주세요.');
                return;
            }
        } else {
            if (confirmationText !== '지금 탈퇴합니다') {
                setError("'지금 탈퇴합니다'를 정확히 입력해주세요.");
                return;
            }
        }

        if (!confirm('정말 탈퇴하시겠습니까? 탈퇴 후에는 계구를 복구할 수 없습니다.')) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. 비밀번호 검증 (로컬 유저인 경우)
            if (isLocalUser) {
                const isValid = await authService.verifyPassword(password);
                if (!isValid) {
                    setError('비밀번호가 일치하지 않습니다.');
                    setIsSubmitting(false);
                    return;
                }
            }

            // 2. 회원 탈퇴 요청
            await profileService.withdraw();

            alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
            await logout();
            window.location.href = '/';

        } catch (error) {
            console.error('Withdrawal failed:', error);
            setError('회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">회원 탈퇴</h2>
                    <p className="text-gray-500 text-sm mt-2">
                        탈퇴 시 모든 정보가 삭제되며<br />
                        복구할 수 없습니다. 신중하게 결정해주세요.
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    {isLocalUser ? (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호 확인</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                placeholder="비밀번호를 입력하세요"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">탈퇴 확인</label>
                            <p className="text-sm text-gray-500 mb-2">아래 입력창에 <b>지금 탈퇴합니다</b> 를 입력해주세요.</p>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                placeholder="지금 탈퇴합니다"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm text-center font-medium">{error}</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '탈퇴하기'}
                    </button>
                </div>
            </motion.div>
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

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [genres, setGenres] = useState<UIGenre[]>([]);
    const [isLoadingGenres, setIsLoadingGenres] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingGenres(true);
            try {
                const response = await adminCategoryService.getAllCategories(0, 100);
                const mappedGenres = response.content.map((cat, index) => ({
                    id: cat.categoryName, // name as ID
                    label: cat.categoryName,
                    icon: GENRE_ICONS[index % GENRE_ICONS.length],
                    color: GENRE_COLORS[index % GENRE_COLORS.length]
                }));
                setGenres(mappedGenres);
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setIsLoadingGenres(false);
            }
        };
        loadCategories();
    }, []);

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
            let finalImageUrl = user.profileImage;

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

            await authService.updateProfile(updatePayload);

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
                                    src={previewImage || user.profileImage || "https://via.placeholder.com/150"}
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
                            {isLoadingGenres ? (
                                <div className="col-span-2 py-8 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                                    카테고리 불러오는 중...
                                </div>
                            ) : genres.length === 0 ? (
                                <div className="col-span-2 py-8 text-center text-gray-500">
                                    등록된 카테고리가 없습니다.
                                </div>
                            ) : (
                                genres.map((genre) => {
                                    const isSelected = selectedGenres.includes(genre.id);
                                    const Icon = genre.icon;
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
                                                <Icon size={14} className="text-white" />
                                            </div>
                                            <span className="text-sm font-bold flex-1">{genre.label}</span>
                                            {isSelected && <Check size={14} className="text-emerald-600" />}
                                        </button>
                                    );
                                })
                            )}
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
    const [levels, setLevels] = useState<Level[]>([]);
    const [bookLogs, setBookLogs] = useState<BookLog[]>([]);

    useEffect(() => {
        const loadLevels = async () => {
            try {
                const data = await levelService.getAllLevels();
                setLevels(data);
            } catch (err) {
                console.error('Failed to load levels:', err);
            }
        };
        loadLevels();
    }, []);

    useEffect(() => {
        const loadBookLogs = async () => {
            try {
                const logs = await bookLogService.getMyBookLogs();
                setBookLogs(logs);
            } catch (err) {
                console.error('Failed to load book logs:', err);
            }
        };
        loadBookLogs();
    }, []);


    const expProgress = levels.length > 0
        ? getExpProgress(user.experience || 0, user.levelId || 1, levels)
        : 0;
    const expNeeded = levels.length > 0
        ? getExpNeededForNextLevel(user.levelId || 1, levels)
        : 100;

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
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-600 mb-2">경험치</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${expProgress}%` }}
                                    transition={{ duration: 0.8 }}
                                />
                            </div>
                            <span className="text-sm font-bold text-emerald-600 min-w-[80px] text-right">
                                {user.experience || 0} / {expNeeded}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Lv.{user.levelId || 1} → Lv.{(user.levelId || 1) + 1} 진행률: {expProgress.toFixed(1)}%
                        </p>
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

            {/* 독서 통계 그래프 */}
            <ReadingStatsGraph bookLogs={bookLogs} />
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

// 독서 통계 그래프 섹션
const ReadingStatsGraph: React.FC<{ bookLogs: BookLog[] }> = ({ bookLogs }) => {
    // 최근 7일 날짜 배열 생성
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    const last7Days = getLast7Days();

    // 날짜별 데이터 집계
    const dailyStats = last7Days.map(date => {
        const dayLogs = bookLogs.filter(log => log.readDate === date);
        // readTime은 초 단위로 저장됨 -> 분 단위로 변환
        const readTimeInSeconds = dayLogs.reduce((sum, log) => sum + (log.readTime || 0), 0);
        const readTimeInMinutes = Math.round(readTimeInSeconds / 60);
        return {
            date,
            displayDate: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            readTime: readTimeInMinutes,  // 분 단위
            readParagraph: dayLogs.reduce((sum, log) => sum + (log.readParagraph || 0), 0),
        };
    });

    // 최대값 계산 (그래프 비율 계산용)
    const maxReadTime = Math.max(...dailyStats.map(d => d.readTime), 1);
    const maxParagraph = Math.max(...dailyStats.map(d => d.readParagraph), 1);

    // 총합 계산
    const totalReadTime = dailyStats.reduce((sum, d) => sum + d.readTime, 0);
    const totalParagraphs = dailyStats.reduce((sum, d) => sum + d.readParagraph, 0);

    // 시간 포맷 함수 (분 -> 시간:분)
    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}분`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-emerald-500" size={24} />
                <h3 className="text-lg font-bold text-gray-900">주간 독서 통계</h3>
            </div>

            {/* 요약 통계 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-medium">총 독서 시간</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-800">{formatTime(totalReadTime)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={16} className="text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">읽은 문단</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{totalParagraphs.toLocaleString()}개</p>
                </div>
            </div>

            {/* 일별 독서 시간 바 차트 */}
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-3">일별 독서 시간</p>
                <div className="flex items-end justify-between gap-2 h-32">
                    {dailyStats.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col items-center justify-end h-24">
                                <motion.div
                                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(day.readTime / maxReadTime) * 100}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    style={{ minHeight: day.readTime > 0 ? '8px' : '0px' }}
                                />
                            </div>
                            <span className="text-xs text-gray-500">{day.displayDate}</span>
                            {day.readTime > 0 && (
                                <span className="text-xs font-medium text-emerald-600">{day.readTime}분</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 일별 읽은 문단 바 차트 */}
            <div>
                <p className="text-sm font-medium text-gray-600 mb-3">일별 읽은 문단</p>
                <div className="flex items-end justify-between gap-2 h-32">
                    {dailyStats.map((day, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col items-center justify-end h-24">
                                <motion.div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(day.readParagraph / maxParagraph) * 100}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    style={{ minHeight: day.readParagraph > 0 ? '8px' : '0px' }}
                                />
                            </div>
                            <span className="text-xs text-gray-500">{day.displayDate}</span>
                            {day.readParagraph > 0 && (
                                <span className="text-xs font-medium text-blue-600">{day.readParagraph}개</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {bookLogs.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <BarChart3 size={48} className="mx-auto mb-2 opacity-30" />
                    <p>아직 독서 기록이 없습니다.</p>
                    <p className="text-sm">책을 읽으면 이곳에 통계가 표시됩니다.</p>
                </div>
            )}
        </div>
    );
};

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

// 구독 관리 섹션
const SubscriptionSection: React.FC = () => {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [subData, ordersData] = await Promise.all([
                subscriptionService.getMySubscription().catch(() => null), // 구독 없으면 null
                paymentService.getMyOrders(0, 5) // 최근 5건만 표시
            ]);
            setSubscription(subData);
            setOrders(ordersData.content);
        } catch (error) {
            console.error('Failed to load subscription/orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!subscription) return;
        if (!confirm('정말로 구독을 해지하시겠습니까? 다음 결제일부터 청구되지 않습니다.')) return;

        setIsCancelling(true);
        try {
            await subscriptionService.cancelSubscription(subscription.subId);
            await loadData();
            alert('구독이 성공적으로 해지되었습니다.');
        } catch (error: any) {
            console.error('Cancel subscription failed:', error);
            alert(error.response?.data?.message || '구독 해지 중 오류가 발생했습니다.');
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { text: string; className: string }> = {
            ACTIVE: { text: '활성', className: 'bg-emerald-100 text-emerald-700' },
            CANCELLED: { text: '해지됨', className: 'bg-gray-100 text-gray-700' },
            PENDING: { text: '대기 중', className: 'bg-yellow-100 text-yellow-700' },
            EXPIRED: { text: '만료됨', className: 'bg-red-100 text-red-700' },
            PAYMENT_FAILED: { text: '결제 실패', className: 'bg-red-100 text-red-700' },
        };

        const config = statusConfig[status] || { text: status, className: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
                {config.text}
            </span>
        );
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 size={32} className="text-emerald-500 animate-spin" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">구독 관리 및 결제</h2>

            {subscription ? (
                <div className="space-y-6 mb-8">
                    {/* 현재 구독 정보 */}
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-8 text-white">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/20 rounded-2xl">
                                    <Crown size={32} />
                                </div>
                                <div>
                                    <p className="text-emerald-100 text-sm mb-1">현재 플랜</p>
                                    <h3 className="text-3xl font-bold">{subscription.planName}</h3>
                                </div>
                            </div>
                            {getStatusBadge(subscription.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-6 bg-white/10 rounded-2xl p-6">
                            <div>
                                <p className="text-emerald-100 text-sm mb-1">월 요금</p>
                                <p className="text-2xl font-bold">{subscription.price.toLocaleString()}원</p>
                            </div>
                            <div>
                                <p className="text-emerald-100 text-sm mb-1">다음 결제일</p>
                                <p className="text-2xl font-bold">
                                    {new Date(subscription.nextBillingDate).toLocaleDateString('ko-KR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-emerald-100 text-sm mb-1">구독 시작일</p>
                                <p className="text-lg font-medium">
                                    {new Date(subscription.startedAt).toLocaleDateString('ko-KR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-emerald-100 text-sm mb-1">구독 상태</p>
                                <p className="text-lg font-medium">{subscription.status}</p>
                            </div>
                        </div>
                    </div>

                    {/* 관리 옵션 */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">구독 관리 옵션</h4>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/subscription')}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard size={20} className="text-emerald-600" />
                                    <span className="font-medium text-gray-700">플랜 변경하기</span>
                                </div>
                                <span className="text-gray-400">→</span>
                            </button>

                            {subscription.status === 'ACTIVE' && (
                                <button
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <X size={20} className="text-red-600" />
                                        <span className="font-medium text-red-700">
                                            {isCancelling ? '처리 중...' : '구독 해지하기'}
                                        </span>
                                    </div>
                                    {isCancelling && <Loader2 size={18} className="text-red-600 animate-spin" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* 구독 없음 상태 */
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm mb-8">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                        <Crown size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">활성화된 구독이 없습니다</h3>
                    <p className="text-gray-600 mb-8">
                        프리미엄 플랜을 구독하고 모든 기능을 무제한으로 이용해보세요!
                    </p>
                    <button
                        onClick={() => navigate('/subscription')}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                        <Crown size={20} />
                        구독 플랜 보기
                    </button>
                </div>
            )}

            {/* 결제 내역 (주문 내역) */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">최근 결제 내역</h3>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">결제 내역이 없습니다.</p>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.orderId} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-xl transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-gray-900">{order.orderName}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {order.status === 'COMPLETED' ? '결제완료' : order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()} · {order.orderUid}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{order.totalAmount.toLocaleString()}원</p>
                                    {order.receiptUrl && (
                                        <a
                                            href={order.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                                        >
                                            영수증 보기
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};


export default MyPage;
