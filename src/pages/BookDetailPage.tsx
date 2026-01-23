import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Book } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, BookOpen, Star, Share2, Heart } from 'lucide-react';
import { useState } from 'react';

export function BookDetailPage() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);

    const { data: book, isLoading, error } = useQuery<Book>({
        queryKey: ['book', bookId],
        queryFn: async () => {
            const res = await api.get(`/books/${bookId}`);
            return res.data;
        }
    });

    if (isLoading) return <div className="p-8 text-center text-forest-500">도서 정보를 불러오는 중...</div>;
    if (!book) return <div className="p-8 text-center text-forest-500">도서를 찾을 수 없습니다.</div>;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-forest-500 hover:text-forest-700 mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                돌아가기
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Book Cover */}
                <div className="col-span-12 md:col-span-4">
                    <Card className="p-4 border-0 shadow-xl bg-white sticky top-24">
                        <div className="aspect-[2/3] bg-gradient-to-br from-forest-50 to-emerald-50 rounded-lg overflow-hidden relative shadow-inner">
                            {book.coverUrl ? (
                                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-forest-200">
                                    <BookOpen className="w-20 h-20" />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex flex-col gap-3">
                            <Button className="w-full py-6 text-lg font-bold shadow-lg shadow-forest-500/20">
                                <BookOpen className="w-5 h-5 mr-2" />
                                {book.viewPermission !== 'FREE' ? '구매하기' : '무료로 읽기'}
                            </Button>
                            <Button variant="outline" className="w-full">
                                서재에 담기
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Book Info */}
                <div className="col-span-12 md:col-span-8 space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm text-forest-600 font-medium">
                            <span className="bg-forest-100 px-2 py-0.5 rounded">소설</span>
                            {book.isAdultOnly && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded">19세 미만 구독불가</span>}
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-forest-900 mb-3 leading-tight">{book.title}</h1>
                        <p className="text-xl text-forest-700 mb-6">{book.author}</p>

                        <div className="flex items-center gap-6 py-4 border-y border-forest-100">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                <span className="font-bold text-lg text-forest-900">4.8</span>
                                <span className="text-slate-400 text-sm">(128 reviews)</span>
                            </div>
                            <div className="h-4 w-px bg-forest-200" />
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors" onClick={() => setIsLiked(!isLiked)}>
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                    <span>좋아요</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-forest-600 transition-colors">
                                    <Share2 className="w-5 h-5" />
                                    <span>공유</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-forest max-w-none">
                        <h3 className="font-serif text-2xl font-bold text-forest-900 mb-4">책 소개</h3>
                        <p className="text-lg leading-relaxed text-forest-800/80 whitespace-pre-wrap">
                            {book.summary}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-serif text-2xl font-bold text-forest-900 mb-4">상세 정보</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between p-3 bg-forest-50 rounded-lg">
                                <span className="text-forest-600">출판사</span>
                                <span className="font-medium text-forest-900">{book.publisher || '정보 없음'}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-forest-50 rounded-lg">
                                <span className="text-forest-600">출간일</span>
                                <span className="font-medium text-forest-900">{book.publishedDate || '정보 없음'}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-forest-50 rounded-lg">
                                <span className="text-forest-600">가격</span>
                                <span className="font-medium text-forest-900">{book.price.toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between p-3 bg-forest-50 rounded-lg">
                                <span className="text-forest-600">언어</span>
                                <span className="font-medium text-forest-900">{book.language}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
