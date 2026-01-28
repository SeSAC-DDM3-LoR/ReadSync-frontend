import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, Star, ShoppingCart, Heart, Share2, ArrowLeft,
    Clock, User, Calendar, Globe, Loader2, ChevronRight, AlertCircle,
    ThumbsUp, ThumbsDown, Plus, Crown, Check, Package, BookMarked
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { bookService } from '../services/bookService';
import { chapterService, type Chapter } from '../services/readerService';
import { libraryService } from '../services/libraryService';
import { reviewService } from '../services/reviewService';
import { cartService } from '../services/cartService';
import useAuthStore from '../stores/authStore';
import type { Book } from '../services/bookService';
import type { Review } from '../services/reviewService';
import UserProfilePopup from '../components/UserProfilePopup';

const BookDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [book, setBook] = useState<Book | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'chapters' | 'reviews'>('info');
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [purchasedBookIds, setPurchasedBookIds] = useState<Set<number>>(new Set());
    const [isLoadingPurchased, setIsLoadingPurchased] = useState(true);
    const [cartBookIds, setCartBookIds] = useState<Set<number>>(new Set());
    const [isLoadingCart, setIsLoadingCart] = useState(true);
    const [libraryBookIds, setLibraryBookIds] = useState<Set<number>>(new Set());
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
    const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);

    // 프로필 팝업 상태
    const [profilePopup, setProfilePopup] = useState<{ isOpen: boolean; userId: number; position?: { x: number; y: number } }>({
        isOpen: false,
        userId: 0
    });

    // 프로필 클릭 핸들러
    const handleProfileClick = (userId: number | undefined, event: React.MouseEvent) => {
        if (!userId) return;
        setProfilePopup({
            isOpen: true,
            userId,
            position: { x: event.clientX, y: event.clientY }
        });
    };

    useEffect(() => {
        if (id) {
            loadBookData(parseInt(id));
        }
        if (isAuthenticated) {
            loadPurchasedBooks();
            loadCartItems();
            loadLibraryBooks();
        }
    }, [id, isAuthenticated]);

    const loadLibraryBooks = async () => {
        setIsLoadingLibrary(true);
        try {
            const response = await libraryService.getMyLibrary(0, 100);
            const libraryIds = new Set(response.content.map(item => item.bookId));
            setLibraryBookIds(libraryIds);
        } catch (err) {
            console.error('Failed to load library books:', err);
        } finally {
            setIsLoadingLibrary(false);
        }
    };

    const loadCartItems = async () => {
        setIsLoadingCart(true);
        try {
            const cartItems = await cartService.getCart();
            const cartIds = new Set(cartItems.map(item => item.bookId));
            setCartBookIds(cartIds);
        } catch (err) {
            console.error('Failed to load cart items:', err);
        } finally {
            setIsLoadingCart(false);
        }
    };

    const loadPurchasedBooks = async () => {
        setIsLoadingPurchased(true);
        try {
            const purchasedBooks = await bookService.getPurchasedBooks();
            const purchasedIds = new Set(purchasedBooks.map(b => b.bookId));
            setPurchasedBookIds(purchasedIds);
        } catch (err) {
            console.error('Failed to load purchased books:', err);
        } finally {
            setIsLoadingPurchased(false);
        }
    };

    const loadBookData = async (bookId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const [bookData, chaptersData, reviewsData] = await Promise.all([
                bookService.getBook(bookId),
                chapterService.getChaptersByBook(bookId).catch(() => []),
                reviewService.getReviewsByBook(bookId, 0, 10).catch(() => ({ content: [] })),
            ]);
            setBook(bookData);
            setChapters(chaptersData);
            setReviews(reviewsData.content || []);
        } catch (err) {
            console.error('Failed to load book:', err);
            setError('도서를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!book) return;

        // 이미 장바구니에 있는 경우 방지
        if (cartBookIds.has(book.bookId)) {
            alert('이미 장바구니에 담긴 책입니다.');
            return;
        }

        setIsAddingToCart(true);
        try {
            await cartService.addToCart({ bookId: book.bookId, quantity: 1 });
            // 장바구니에 추가 성공 시 상태 업데이트
            setCartBookIds(prev => new Set(prev).add(book.bookId));
            alert('장바구니에 추가되었습니다!');
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            const errorCode = error.response?.data?.code;
            if (errorCode === 'ALREADY_OWNED_BOOK') {
                alert('이미 소유한 책입니다. 내 서재에서 확인해주세요!');
            } else {
                alert('장바구니 추가에 실패했습니다.');
            }
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleAddToLibrary = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!book) return;

        // 이미 서재에 있는 경우 방지
        if (libraryBookIds.has(book.bookId)) {
            alert('이미 내 서재에 있는 책입니다.');
            return;
        }

        setIsAddingToLibrary(true);
        try {
            await libraryService.addToLibrary({
                bookId: book.bookId,
                ownershipType: 'OWNED'
            });
            // 서재에 추가 성공 시 상태 업데이트
            setLibraryBookIds(prev => new Set(prev).add(book.bookId));
            alert('내 서재에 추가되었습니다!');
        } catch (error: any) {
            console.error('Failed to add to library:', error);
            alert('서재 추가에 실패했습니다.');
        } finally {
            setIsAddingToLibrary(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
                <Header />
                <div className="flex items-center justify-center py-40">
                    <Loader2 size={48} className="text-emerald-500 animate-spin" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
                <Header />
                <div className="flex flex-col items-center justify-center py-40">
                    <AlertCircle size={64} className="text-red-400 mb-4" />
                    <p className="text-gray-600 text-lg">{error || '도서를 찾을 수 없습니다.'}</p>
                    <Link to="/books" className="mt-4 text-emerald-600 hover:underline">
                        도서 목록으로 돌아가기
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* 뒤로가기 */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-8 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>뒤로가기</span>
                    </button>

                    {/* 도서 정보 헤더 */}
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {/* 표지 */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative"
                        >
                            <div className="aspect-[2/3] rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-100 to-green-50 shadow-2xl">
                                {book.coverUrl ? (
                                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen size={80} className="text-emerald-300" />
                                    </div>
                                )}
                            </div>

                            {/* 배지들 */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {book.viewPermission === 'PREMIUM' && (
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                                        <Crown size={16} /> PREMIUM
                                    </div>
                                )}
                                {book.viewPermission === 'FREE' && (
                                    <div className="bg-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                                        FREE
                                    </div>
                                )}
                                {book.isAdultOnly && (
                                    <div className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                                        19+ 성인
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* 정보 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="md:col-span-2"
                        >
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{book.title}</h1>

                            <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-600">
                                <span className="flex items-center gap-1">
                                    <User size={16} /> {book.author}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={16} /> {book.publishedDate}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Globe size={16} /> {book.language || '한국어'}
                                </span>
                            </div>

                            {/* 가격 */}
                            <div className="mb-6">
                                <span className="text-3xl font-extrabold text-emerald-600">
                                    {book.price > 0 ? `₩${book.price.toLocaleString()}` : '무료'}
                                </span>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex flex-wrap gap-3 mb-8">
                                {isLoadingPurchased || isLoadingCart || isLoadingLibrary ? (
                                    <button
                                        disabled
                                        className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-white font-bold rounded-xl opacity-50"
                                    >
                                        <Loader2 size={20} className="animate-spin" />
                                        확인 중...
                                    </button>
                                ) : book.viewPermission === 'FREE' ? (
                                    // FREE 책: 서재 추가 버튼만 표시
                                    <>
                                        {libraryBookIds.has(book.bookId) ? (
                                            <button
                                                onClick={() => navigate('/library')}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all"
                                            >
                                                <BookMarked size={20} />
                                                내 서재에서 보기
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAddToLibrary}
                                                disabled={isAddingToLibrary}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all disabled:opacity-50"
                                            >
                                                {isAddingToLibrary ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <BookMarked size={20} />
                                                )}
                                                내 서재에 추가하기
                                            </button>
                                        )}
                                    </>
                                ) : purchasedBookIds.has(book.bookId) ? (
                                    // PREMIUM 구매 완료: 구매 완료 + 서재 추가 버튼
                                    <>
                                        <button
                                            disabled
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg cursor-not-allowed"
                                        >
                                            <Check size={20} />
                                            구매 완료
                                        </button>
                                        {libraryBookIds.has(book.bookId) ? (
                                            <button
                                                onClick={() => navigate('/library')}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all"
                                            >
                                                <BookMarked size={20} />
                                                내 서재에서 보기
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAddToLibrary}
                                                disabled={isAddingToLibrary}
                                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all disabled:opacity-50"
                                            >
                                                {isAddingToLibrary ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <BookMarked size={20} />
                                                )}
                                                내 서재에 추가하기
                                            </button>
                                        )}
                                    </>
                                ) : cartBookIds.has(book.bookId) ? (
                                    // PREMIUM 미구매 + 장바구니에 있음
                                    <button
                                        onClick={() => navigate('/cart')}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all"
                                    >
                                        <Package size={20} />
                                        장바구니로 가기
                                    </button>
                                ) : (
                                    // PREMIUM 미구매 + 장바구니에 없음
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isAddingToCart}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50"
                                    >
                                        {isAddingToCart ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <ShoppingCart size={20} />
                                        )}
                                        장바구니 담기
                                    </button>
                                )}
                                <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
                                    <Heart size={20} />
                                    찜하기
                                </button>
                                <button className="p-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {/* 출판사 */}
                            <p className="text-sm text-gray-500">출판사: {book.publisher}</p>
                        </motion.div>
                    </div>

                    {/* 탭 */}
                    <div className="flex border-b border-gray-200 mb-6">
                        {(['info', 'chapters', 'reviews'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 font-bold transition-colors relative ${activeTab === tab ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'info' && '도서 정보'}
                                {tab === 'chapters' && `목차 (${chapters.length})`}
                                {tab === 'reviews' && `리뷰 (${reviews.length})`}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* 탭 콘텐츠 */}
                    {activeTab === 'info' && (
                        <div className="prose max-w-none">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">책 소개</h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {book.summary || '도서 소개가 없습니다.'}
                            </p>
                        </div>
                    )}

                    {activeTab === 'chapters' && (
                        <div className="space-y-2">
                            {chapters.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">목차 정보가 없습니다.</p>
                            ) : (
                                chapters.map((chapter, index) => (
                                    <div
                                        key={chapter.chapterId}
                                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                                {chapter.sequence || index + 1}
                                            </span>
                                            <span className="font-medium text-gray-800">{chapter.chapterName}</span>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-400" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
                            ) : (
                                reviews.map((review) => (
                                    <div
                                        key={review.reviewId}
                                        className="p-6 bg-white rounded-2xl border border-gray-100"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={(e) => handleProfileClick(review.writerId, e)}
                                            >
                                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">
                                                    {review.writerName?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 hover:text-emerald-600">{review.writerName}</p>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-700">{review.content}</p>
                                        <div className="flex items-center gap-4 mt-4">
                                            <button className="flex items-center gap-1 text-gray-500 hover:text-emerald-600">
                                                <ThumbsUp size={16} /> {review.likeCount}
                                            </button>
                                            <button className="flex items-center gap-1 text-gray-500 hover:text-red-500">
                                                <ThumbsDown size={16} /> {review.dislikeCount}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* 리뷰 작성 버튼 */}
                            {isAuthenticated && (
                                <button className="w-full py-4 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
                                    <Plus size={20} />
                                    리뷰 작성하기
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* 프로필 팝업 */}
            <UserProfilePopup
                isOpen={profilePopup.isOpen}
                userId={profilePopup.userId}
                onClose={() => setProfilePopup({ ...profilePopup, isOpen: false })}
                position={profilePopup.position}
            />
        </div>
    );
};

export default BookDetailPage;
