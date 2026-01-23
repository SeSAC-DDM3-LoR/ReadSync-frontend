import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Book } from '../lib/api';
import { Search, BookOpen } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Mock Data for fallback if backend is empty
const MOCK_BOOKS: Book[] = [
    { bookId: 1, title: "데이터베이스", author: "강작가", categoryId: 1, coverUrl: "", price: 25000, summary: "SQL 기초", isAdultOnly: false, language: "KOREAN", viewPermission: 'FREE' },
    { bookId: 2, title: "자바", author: "이코딩", categoryId: 2, coverUrl: "", price: 32000, summary: "Java 마스터", isAdultOnly: false, language: "KOREAN", viewPermission: 'FREE' },
    { bookId: 3, title: "AI와 미래", author: "박지능", categoryId: 3, coverUrl: "", price: 18000, summary: "인공지능 개론", isAdultOnly: false, language: "KOREAN", viewPermission: 'FREE' },
];

export function BooksPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const { data: books, isLoading } = useQuery<Book[]>({
        queryKey: ['books'],
        queryFn: async () => {
            try {
                const res = await api.get('/books');
                return res.data;
            } catch (e) {
                console.warn(e, "Backend unavailable, using mock data");
                return MOCK_BOOKS;
            }
        }
    });

    const categories = [
        { id: 1, name: '소설' },
        { id: 2, name: 'IT/과학' },
        { id: 3, name: '인문' }
    ];

    const filteredBooks = books?.filter(book => {
        const matchesSearch = book.title.includes(searchTerm) || book.author.includes(searchTerm);
        const matchesCategory = selectedCategory ? book.categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-forest-900 mb-2">서점 (Book Store)</h1>
                    <p className="text-forest-600">지식의 숲에서 새로운 모험을 찾아보세요.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="도서 제목, 작가 검색..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-forest-200 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 bg-white shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                    variant={selectedCategory === null ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full"
                >
                    전체
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.id)}
                        className="rounded-full"
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {isLoading ? (
                    // Skeletons
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-forest-100/50 rounded-xl animate-pulse" />
                    ))
                ) : filteredBooks?.map(book => (
                    <Card key={book.bookId} className="group cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-none bg-white p-0 overflow-hidden">
                        {/* Cover */}
                        <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                            {book.coverUrl ? (
                                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 text-forest-300">
                                    <BookOpen className="w-12 h-12 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="sm" className="rounded-full bg-white text-forest-800 hover:bg-forest-50 shadow-lg border-none">상세보기</Button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <div className="text-xs text-forest-500 font-medium mb-1">{categories.find(c => c.id === book.categoryId)?.name || '기타'}</div>
                            <h3 className="font-bold text-forest-900 line-clamp-1 mb-1 group-hover:text-forest-600 transition-colors">{book.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-1">{book.author}</p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="font-bold text-forest-800">{book.price.toLocaleString()}원</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {!isLoading && filteredBooks?.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    검색 결과가 없습니다.
                </div>
            )}

        </div>
    );
}
