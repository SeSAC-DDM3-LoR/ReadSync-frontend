import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, ChevronLeft, ChevronRight, Loader2, Crown } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { bookService, categoryService } from '../services/bookService';
import type { Book, Category, PageResponse } from '../services/bookService';

const BooksPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    const currentPage = parseInt(searchParams.get('page') || '1') - 1;
    const searchQuery = searchParams.get('search') || '';
    const selectedCategory = searchParams.get('category') || '';

    useEffect(() => {
        loadData();
    }, [currentPage, searchQuery]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            let response: PageResponse<Book>;
            if (searchQuery) {
                response = await bookService.searchBooks(searchQuery, currentPage, 12);
            } else {
                response = await bookService.getBooks(currentPage, 12);
            }
            setBooks(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to load books:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await categoryService.getCategories(0, 50);
            setCategories(response.content);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('search') as string;
        setSearchParams({ search: query, page: '1' });
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(page + 1));
        setSearchParams(params);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* 페이지 헤더 */}
                    <div className="text-center mb-12">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-extrabold text-gray-900 mb-4"
                        >
                            📚 도서 목록
                        </motion.h1>
                        <p className="text-gray-600">다양한 장르의 책을 만나보세요</p>
                    </div>

                    {/* 검색 및 필터 */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={searchQuery}
                                    placeholder="책 제목, 저자로 검색..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-emerald-100 
                             focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 
                             outline-none transition-all text-gray-700 shadow-sm"
                                />
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                <button
                                    type="submit"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    검색
                                </button>
                            </div>
                        </form>

                        <div className="flex gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSearchParams({ category: e.target.value, page: '1' })}
                                className="px-4 py-4 rounded-2xl bg-white border-2 border-emerald-100 outline-none font-medium text-gray-700"
                            >
                                <option value="">전체 카테고리</option>
                                {categories.map((cat) => (
                                    <option key={cat.categoryId} value={String(cat.categoryId)}>
                                        {cat.categoryName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 로딩 */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={48} className="text-emerald-500 animate-spin" />
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-20">
                            <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
                        </div>
                    ) : (
                        <>
                            {/* 도서 그리드 */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                {books.map((book, index) => (
                                    <BookCard key={book.bookId} book={book} index={index} />
                                ))}
                            </div>

                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        className="p-2 rounded-xl bg-white border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                                        if (pageNum >= totalPages) return null;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-10 h-10 rounded-xl font-bold transition-colors ${pageNum === currentPage
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-white border border-emerald-200 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                        className="p-2 rounded-xl bg-white border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

// 도서 카드 컴포넌트
const BookCard: React.FC<{ book: Book; index: number }> = ({ book, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link
                to={`/books/${book.bookId}`}
                className="block group"
            >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-green-50 shadow-lg group-hover:shadow-xl transition-all mb-3">
                    {book.coverUrl ? (
                        <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={48} className="text-emerald-300" />
                        </div>
                    )}

                    {/* 권한 배지 */}
                    {book.viewPermission === 'PREMIUM' && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                            <Crown size={12} /> PREMIUM
                        </div>
                    )}
                    {book.viewPermission === 'FREE' && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            FREE
                        </div>
                    )}

                    {/* 성인 배지 */}
                    {book.isAdultOnly && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            19+
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {book.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{book.author}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-emerald-600 font-bold">
                        {book.price > 0 ? `₩${book.price.toLocaleString()}` : '무료'}
                    </span>
                </div>
            </Link>
        </motion.div>
    );
};

export default BooksPage;
