import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Book } from '../../lib/api';
import { BookOpen, ChevronRight, Star, TrendingUp, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
    { id: 'trending', label: '인기', icon: TrendingUp },
    { id: 'new', label: '신작', icon: Sparkles },
    { id: 'recommended', label: 'AI 추천', icon: Star },
];

export function BookSection() {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('trending');

    const { data: books, isLoading, error } = useQuery<Book[]>({
        queryKey: ['books-featured'],
        queryFn: async () => {
            const res = await api.get('/books');
            // 최신 6개만 노출
            return res.data.slice(0, 6);
        }
    });

    if (error) return <div className="p-4 text-center text-red-500">도서 정보를 불러오는데 실패했습니다.</div>;

    return (
        <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-serif font-bold text-forest-900">추천 도서</h3>
                    <p className="text-sm text-forest-500">지금 읽기 좋은 책들</p>
                </div>
                <button
                    onClick={() => navigate('/books')}
                    className="flex items-center gap-1 text-sm font-medium text-forest-600 hover:text-forest-800 transition-colors"
                >
                    전체보기 <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                ${activeCategory === cat.id
                                    ? 'bg-forest-500 text-white shadow-md'
                                    : 'bg-forest-50 text-forest-600 hover:bg-forest-100'}`}
                        >
                            <Icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {isLoading
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-forest-100/50 rounded-xl animate-pulse" />
                    ))
                    : books?.map(book => (
                        <div
                            key={book.bookId}
                            className="group cursor-pointer"
                            onClick={() => navigate(`/books/${book.bookId}`)}
                        >
                            {/* Cover */}
                            <div className="aspect-[2/3] bg-gradient-to-br from-forest-100 to-forest-200 rounded-xl overflow-hidden mb-2 relative shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                                {book.coverUrl ? (
                                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-forest-300">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-white text-xs font-medium truncate">{book.author}</span>
                                </div>
                            </div>
                            {/* Title */}
                            <h4 className="text-sm font-medium text-forest-800 line-clamp-2 group-hover:text-forest-600 transition-colors">
                                {book.title}
                            </h4>
                        </div>
                    ))
                }
            </div>

            {/* Bottom CTA */}
            <div className="mt-6 pt-6 border-t border-forest-100 text-center">
                <button
                    onClick={() => navigate('/books')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-forest-500 to-forest-600 text-white font-medium rounded-full shadow-lg shadow-forest-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    <BookOpen className="w-5 h-5" />
                    서점 둘러보기
                </button>
            </div>
        </Card>
    );
}
