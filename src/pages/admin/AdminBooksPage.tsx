import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Search, Book, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Category {
    categoryId: number;
    categoryName: string;
}

interface BookData {
    bookId: number;
    title: string;
    author: string;
    publisher: string;
    bookImage?: string;
    categoryName?: string;
}

export function AdminBooksPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // 상태 관리
    const [books, setBooks] = useState<BookData[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // 입력 폼 상태
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        publisher: '',
        summary: '',
        categoryId: '',
        image: null as File | null
    });

    // 초기 데이터 로드 (책 목록, 카테고리 목록)
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [booksRes, catsRes] = await Promise.all([
                api.get('/books?page=0&size=100'), // 전체 목록 조회 (페이징은 임시로 넉넉하게)
                api.get('/categories')
            ]);
            
            // 백엔드 응답 구조에 맞게 데이터 세팅
            setBooks(booksRes.data.content || []); 
            setCategories(catsRes.data || []);
        } catch (error) {
            console.error('Data fetch failed:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 도서 등록 처리
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            alert('카테고리를 선택해주세요.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            // 1. JSON 데이터 준비 (Swagger BookRequestDTO 참고)
            const requestDto = {
                title: formData.title,
                author: formData.author,
                publisher: formData.publisher,
                summary: formData.summary,
                categoryId: Number(formData.categoryId)
            };

            // 2. FormData 객체 생성 (이미지 파일 + JSON)
            const submitData = new FormData();
            // 백엔드 @RequestPart("book")에 맞춰 JSON 문자열로 변환하여 추가
            submitData.append('book', new Blob([JSON.stringify(requestDto)], { type: 'application/json' }));
            
            // 백엔드 @RequestPart("image") (선택사항)
            if (formData.image) {
                submitData.append('image', formData.image);
            }

            // 3. API 호출 (Content-Type은 axios가 자동으로 설정)
            await api.post('/books', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('도서가 성공적으로 등록되었습니다.');
            setShowForm(false);
            setFormData({ title: '', author: '', publisher: '', summary: '', categoryId: '', image: null });
            fetchData(); // 목록 갱신

        } catch (error) {
            console.error('Book creation failed:', error);
            alert('도서 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* 사이드바는 AdminDashboard의 것을 재사용하거나 Layout으로 분리해야 하지만, 일단 여기서는 생략하고 컨텐츠만 집중 */}
            {/* 실제로는 AdminLayout을 만들어 감싸는 것이 좋습니다. */}
            
            <main className="flex-1 p-8 ml-64"> {/* ml-64는 사이드바 공간 확보용 */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">도서 관리</h2>
                        <p className="text-slate-500">플랫폼에 등록된 도서를 관리합니다.</p>
                    </div>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        {showForm ? '목록으로' : <><Plus className="w-4 h-4" /> 도서 등록</>}
                    </button>
                </div>

                {/* 등록 폼 */}
                {showForm && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 animate-fade-in-down">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">새 도서 등록</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">제목</label>
                                    <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="도서 제목" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">작가</label>
                                    <input name="author" required value={formData.author} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="작가명" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">출판사</label>
                                    <input name="publisher" required value={formData.publisher} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="출판사" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">카테고리</label>
                                    <select name="categoryId" required value={formData.categoryId} onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option value="">카테고리 선택</option>
                                        {categories.map(cat => (
                                            <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">줄거리</label>
                                <textarea name="summary" required value={formData.summary} onChange={handleInputChange} rows={3} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="도서 줄거리..." />
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">취소</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    등록하기
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 도서 목록 테이블 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500 flex justify-center items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> 목록 불러오는 중...
                        </div>
                    ) : books.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">등록된 도서가 없습니다.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">표지</th>
                                    <th className="px-6 py-4">제목</th>
                                    <th className="px-6 py-4">작가</th>
                                    <th className="px-6 py-4">출판사</th>
                                    <th className="px-6 py-4">카테고리</th>
                                    <th className="px-6 py-4 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {books.map((book) => (
                                    <tr key={book.bookId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{book.bookId}</td>
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-14 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                                                {book.bookImage ? (
                                                    <img src={book.bookImage} alt={book.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{book.title}</td>
                                        <td className="px-6 py-4">{book.author}</td>
                                        <td className="px-6 py-4">{book.publisher}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                                                {book.categoryName || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="삭제 (미구현)">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}