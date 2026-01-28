import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, Loader2, ChevronRight, Library, BookMarked,
    Clock
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { libraryService } from '../services/libraryService';
import useAuthStore from '../stores/authStore';
import type { Library as LibraryType } from '../services/libraryService';

const LibraryPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [books, setBooks] = useState<LibraryType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'reading' | 'completed'>('all');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadLibrary();
    }, [isAuthenticated]);

    const loadLibrary = async () => {
        setIsLoading(true);
        try {
            const response = await libraryService.getMyLibrary(0, 50);
            setBooks(response.content);
        } catch (error) {
            console.error('Failed to load library:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBooks = books.filter((book) => {
        if (filter === 'reading') return book.readingStatus === 'READING';
        if (filter === 'completed') return book.readingStatus === 'COMPLETED';
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* 페이지 헤더 */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl font-extrabold text-gray-900 flex items-center gap-3"
                            >
                                <Library className="text-emerald-500" />
                                내 서재
                            </motion.h1>
                            <p className="text-gray-600 mt-2">보유한 도서 {books.length}권</p>
                        </div>

                        <Link
                            to="/books"
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                        >
                            도서 둘러보기
                        </Link>
                    </div>

                    {/* 필터 탭 */}
                    <div className="flex gap-2 mb-8">
                        {(['all', 'reading', 'completed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === f
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-emerald-50'
                                    }`}
                            >
                                {f === 'all' && '전체'}
                                {f === 'reading' && '읽는 중'}
                                {f === 'completed' && '완독'}
                            </button>
                        ))}
                    </div>

                    {/* 로딩 */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="text-center py-20">
                            <BookMarked size={64} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-4">
                                {filter === 'all' ? '아직 서재에 책이 없습니다' : '해당 상태의 책이 없습니다'}
                            </p>
                            <Link
                                to="/books"
                                className="inline-flex items-center gap-2 text-emerald-600 hover:underline"
                            >
                                도서 둘러보기 <ChevronRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBooks.map((book, index) => (
                                <LibraryCard key={book.libraryId} book={book} index={index} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

// 서재 카드 컴포넌트
const LibraryCard: React.FC<{ book: LibraryType; index: number }> = ({ book, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
        >
            <div className="flex gap-4">
                {/* 표지 */}
                <div className="w-20 h-28 bg-gradient-to-br from-emerald-100 to-green-50 rounded-xl flex-shrink-0 overflow-hidden">
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.bookTitle} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={32} className="text-emerald-300" />
                        </div>
                    )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{book.bookTitle}</h3>

                    {/* 상태 배지 */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${book.readingStatus === 'READING' ? 'bg-blue-100 text-blue-700' :
                            book.readingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                            {book.readingStatus === 'READING' ? '읽는 중' :
                                book.readingStatus === 'COMPLETED' ? '완독' : '읽기 전'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${book.ownershipType === 'OWNED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {book.ownershipType === 'OWNED' ? '소장' : '대여'}
                        </span>
                    </div>

                    {/* 진행률 */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">진행률</span>
                            <span className="font-bold text-emerald-600">{Math.round(book.totalProgress || 0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
                                style={{ width: `${book.totalProgress || 0}%` }}
                            />
                        </div>
                    </div>

                    {/* 대여 만료일 */}
                    {book.ownershipType === 'RENTED' && book.expiresAt && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(book.expiresAt).toLocaleDateString()}까지
                        </p>
                    )}
                </div>
            </div>

            {/* 읽기 버튼 */}
            <Link
                to={`/reader/${book.libraryId}/1`}
                className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl text-center block hover:shadow-lg transition-shadow"
            >
                읽기 계속하기
            </Link>
        </motion.div>
    );
};

export default LibraryPage;
