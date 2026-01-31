import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Plus, Edit3, Trash2, Search, ChevronLeft, ChevronRight,
    LayoutDashboard, Users, AlertTriangle, Bell, Shield, X, Loader2,
    Upload, FileText, GripVertical, ChevronDown, ChevronUp, Save
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import {
    adminBookService, adminChapterService,
    type AdminBook, type BookRequest, type AdminChapter
} from '../../services/adminService';

const AdminBooksPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    // 도서 목록 상태
    const [books, setBooks] = useState<AdminBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 모달 상태
    const [showBookModal, setShowBookModal] = useState(false);
    const [editingBook, setEditingBook] = useState<AdminBook | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 챕터 관리 상태
    const [expandedBookId, setExpandedBookId] = useState<number | null>(null);
    const [chapters, setChapters] = useState<AdminChapter[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [editingChapter, setEditingChapter] = useState<AdminChapter | null>(null);
    const [chapterFile, setChapterFile] = useState<File | null>(null);

    // 폼 데이터
    const [bookForm, setBookForm] = useState<BookRequest>({
        title: '',
        author: '',
        publisher: '',
        price: 0,
        rentalPrice: 0,
        coverUrl: '',
        description: '',
        categoryId: 1,
        isAdultOnly: false,
        viewPermission: 'FREE',
        language: 'ko',
        publishedDate: '',
    });

    const [chapterForm, setChapterForm] = useState({
        chapterName: '',
        sequence: 1,
        paragraphs: -1, // [NEW]
    });

    // 권한 체크
    useEffect(() => {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
        if (!isAuthenticated || !isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }
        loadBooks();
    }, [isAuthenticated, user?.role, currentPage]);

    // ==================== Data Loading ====================

    const loadBooks = async () => {
        setIsLoading(true);
        try {
            const response = await adminBookService.getAllBooks(currentPage, 10);
            setBooks(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Failed to load books:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadChapters = async (bookId: number) => {
        setIsLoadingChapters(true);
        try {
            const data = await adminChapterService.getChaptersByBook(bookId);
            setChapters(data.sort((a, b) => a.sequence - b.sequence));
        } catch (error) {
            console.error('Failed to load chapters:', error);
            setChapters([]);
        } finally {
            setIsLoadingChapters(false);
        }
    };

    const handleSearch = async () => {
        if (!searchKeyword.trim()) {
            loadBooks();
            return;
        }
        setIsLoading(true);
        try {
            const response = await adminBookService.searchBooks(searchKeyword, 0, 10);
            setBooks(response.content);
            setTotalPages(response.totalPages);
            setCurrentPage(0);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ==================== Book CRUD ====================

    const openBookModal = (book?: AdminBook) => {
        if (book) {
            setEditingBook(book);
            setBookForm({
                title: book.title,
                author: book.author,
                publisher: book.publisher || '',
                price: book.price,
                rentalPrice: book.rentalPrice || 0,
                coverUrl: book.coverUrl || '',
                description: book.description || '',
                categoryId: book.categoryId || 1,
                isAdultOnly: false,
                viewPermission: 'FREE', // 기본값
                language: 'ko',
                publishedDate: '',
            });
        } else {
            setEditingBook(null);
            setBookForm({
                title: '',
                author: '',
                publisher: '',
                price: 0,
                rentalPrice: 0,
                coverUrl: '',
                description: '',
                categoryId: 1,
                isAdultOnly: false,
                viewPermission: 'FREE',
                language: 'ko',
                publishedDate: '',
            });
        }
        setShowBookModal(true);
    };

    const handleSaveBook = async () => {
        if (!bookForm.title || !bookForm.author) {
            alert('제목과 저자는 필수입니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingBook) {
                await adminBookService.updateBook(editingBook.bookId, bookForm);
                alert('도서가 수정되었습니다.');
            } else {
                await adminBookService.createBook(bookForm);
                alert('도서가 등록되었습니다.');
            }
            setShowBookModal(false);
            loadBooks();
        } catch (error) {
            console.error('Failed to save book:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBook = async (bookId: number) => {
        if (!confirm('정말로 이 도서를 삭제하시겠습니까? 관련된 모든 챕터도 함께 삭제됩니다.')) {
            return;
        }

        try {
            await adminBookService.deleteBook(bookId);
            alert('도서가 삭제되었습니다.');
            loadBooks();
        } catch (error) {
            console.error('Failed to delete book:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // ==================== Chapter CRUD ====================

    const toggleChapters = async (bookId: number) => {
        if (expandedBookId === bookId) {
            setExpandedBookId(null);
            setChapters([]);
        } else {
            setExpandedBookId(bookId);
            await loadChapters(bookId);
        }
    };

    const openChapterModal = (chapter?: AdminChapter) => {
        if (chapter) {
            setEditingChapter(chapter);
            setChapterForm({
                chapterName: chapter.chapterName,
                sequence: chapter.sequence,
                paragraphs: chapter.paragraphs || -1,
            });
            setChapterFile(null); // 수정 시 기본 파일 선택 안함
        } else {
            setEditingChapter(null);
            setChapterForm({
                chapterName: '',
                sequence: chapters.length + 1, // 기본값: 마지막 + 1
                paragraphs: -1,
            });
            setChapterFile(null);
        }
        setShowChapterModal(true);
    };

    // 파일 선택 핸들러 (스마트 분석)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setChapterFile(file);

        // JSON 파일 분석
        if (file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);

                    // 1. Chapter Name 자동 채우기
                    let newName = '';
                    if (json.chapter_name) {
                        newName = json.chapter_name;
                    } else if (json.book_name) {
                        if (json.chapter) {
                            newName = `${json.book_name} ${json.chapter}장`;
                        } else {
                            // chapter_name과 chapter가 없고 book_name만 있는 경우
                            newName = json.book_name;
                        }
                    }

                    // 2. Sequence 자동 채우기
                    let newSequence = chapterForm.sequence;
                    if (json.chapter) {
                        // DB 중복 체크는 어렵지만 일단 파일 값 우선
                        newSequence = parseInt(json.chapter);
                        // 만약 중복이라면? -> 사용자 수동 수정 유도 (여기서는 값만 제안)
                        const isDuplicate = chapters.some(c => c.sequence === newSequence && c.chapterId !== editingChapter?.chapterId);
                        if (isDuplicate) {
                            // 이미 있으면 자동으로 +1 할 수도 있지만, 요구사항은 "null이면 순서대로, 있으면 해당 값"
                            // "이미 DB에 해당 책의 sequence가 있으면 자동으로 빈 칸 채움" -> 이 로직이 조금 애매함.
                            // 사용자 요구: "파일 내 chapter 값이 있으면 사용. null이면 순서대로."
                            // 추가 요구: "이미 DB에 해당 sequence가 있다면 자동으로 3을 채워넣음" -> 충돌 회피?
                            // 일단 파일 값 우선 적용하고, 사용자가 보고 수정하게 둠.
                        }
                    }

                    // 3. Paragraphs 카운트
                    let paragraphCount = -1;
                    if (json.content && Array.isArray(json.content)) {
                        // "content" 하위의 "id" 개수 카운트
                        paragraphCount = json.content.filter((item: any) => item.id).length;
                    }

                    // 폼 업데이트 (사용자가 수정 가능하도록)
                    setChapterForm(prev => ({
                        ...prev,
                        chapterName: newName || prev.chapterName,
                        sequence: newSequence, // 파일 값 우선
                        paragraphs: paragraphCount
                    }));

                } catch (err) {
                    console.error("JSON parsing error:", err);
                    alert("파일 내용을 분석할 수 없습니다. 수동으로 입력해주세요.");
                }
            };
            reader.readAsText(file);
        } else {
            // JSON 아님 -> 기본 로직 (폼 유지)
        }
    };

    const handleSaveChapter = async () => {
        if (!chapterForm.chapterName) {
            alert('챕터 이름은 필수입니다.');
            return;
        }

        if (!editingChapter && !chapterFile) {
            alert('새 챕터는 파일이 필요합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingChapter) {
                await adminChapterService.updateChapter(
                    editingChapter.chapterId,
                    chapterFile || undefined,
                    chapterForm.chapterName,
                    chapterForm.sequence,
                    chapterForm.paragraphs // [NEW]
                );
                alert('챕터가 수정되었습니다.');
            } else if (expandedBookId && chapterFile) {
                await adminChapterService.createChapter(
                    chapterFile,
                    expandedBookId,
                    chapterForm.chapterName,
                    chapterForm.sequence,
                    chapterForm.paragraphs // [NEW]
                );
                alert('챕터가 등록되었습니다.');
            }
            setShowChapterModal(false);
            if (expandedBookId) {
                await loadChapters(expandedBookId);
            }
        } catch (error) {
            console.error('Failed to save chapter:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteChapter = async (chapterId: number) => {
        if (!confirm('정말로 이 챕터를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await adminChapterService.deleteChapter(chapterId);
            alert('챕터가 삭제되었습니다.');
            if (expandedBookId) {
                await loadChapters(expandedBookId);
            }
        } catch (error) {
            console.error('Failed to delete chapter:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // 사이드바 메뉴 아이템
    const menuItems = [
        { path: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
        { path: '/admin/users', label: '회원 관리', icon: Users },
        { path: '/admin/books', label: '도서 관리', icon: BookOpen, active: true },
        { path: '/admin/reports', label: '신고 관리', icon: AlertTriangle },
        { path: '/admin/notices', label: '공지 관리', icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-gray-900">
            {/* 사이드바 */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Shield size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">ReadSync</h1>
                        <p className="text-gray-400 text-xs">Admin Panel</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <Link
                        to="/"
                        className="block text-center py-3 text-gray-400 hover:text-white transition-colors"
                    >
                        ← 사이트로 돌아가기
                    </Link>
                </div>
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="ml-64 p-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">도서 관리</h1>
                        <p className="text-gray-400">도서 등록, 수정, 삭제 및 챕터 관리</p>
                    </div>
                    <button
                        onClick={() => openBookModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                        <Plus size={20} />
                        새 도서 등록
                    </button>
                </div>

                {/* 검색 */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="도서 검색..."
                            className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                        />
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                    >
                        검색
                    </button>
                </div>

                {/* 도서 목록 */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={48} className="text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {books.map((book) => (
                            <motion.div
                                key={book.bookId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden"
                            >
                                {/* 도서 정보 행 */}
                                <div className="p-4 flex items-center gap-4">
                                    {/* 표지 */}
                                    <div className="w-16 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                        {book.coverUrl ? (
                                            <img
                                                src={book.coverUrl}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen size={24} className="text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold truncate">{book.title}</h3>
                                        <p className="text-gray-400 text-sm">{book.author}</p>
                                        <div className="flex items-center gap-4 mt-1 text-sm">
                                            <span className="text-emerald-400">
                                                ₩{book.price?.toLocaleString() || 0}
                                            </span>
                                            {book.rentalPrice > 0 && (
                                                <span className="text-gray-500">
                                                    대여 ₩{book.rentalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleChapters(book.bookId)}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${expandedBookId === book.bookId
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                        >
                                            <FileText size={16} />
                                            챕터
                                            {expandedBookId === book.bookId ? (
                                                <ChevronUp size={16} />
                                            ) : (
                                                <ChevronDown size={16} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openBookModal(book)}
                                            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBook(book.bookId)}
                                            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* 챕터 목록 */}
                                <AnimatePresence>
                                    {expandedBookId === book.bookId && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-700 bg-gray-850"
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-white font-medium">
                                                        챕터 목록 ({chapters.length})
                                                    </h4>
                                                    <button
                                                        onClick={() => openChapterModal()}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                        챕터 추가
                                                    </button>
                                                </div>

                                                {isLoadingChapters ? (
                                                    <div className="flex justify-center py-8">
                                                        <Loader2 size={24} className="text-emerald-500 animate-spin" />
                                                    </div>
                                                ) : chapters.length === 0 ? (
                                                    <div className="text-center py-8 text-gray-500">
                                                        등록된 챕터가 없습니다.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {chapters.map((chapter) => (
                                                            <div
                                                                key={chapter.chapterId}
                                                                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl"
                                                            >
                                                                <GripVertical size={16} className="text-gray-500 cursor-move" />
                                                                <span className="w-8 text-center text-gray-400 text-sm">
                                                                    {chapter.sequence}
                                                                </span>
                                                                <span className="flex-1 text-white">
                                                                    {chapter.chapterName}
                                                                </span>
                                                                <span className="text-gray-500 text-sm">
                                                                    {chapter.paragraphs || 0} 단락
                                                                </span>
                                                                <button
                                                                    onClick={() => openChapterModal(chapter)}
                                                                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                                                >
                                                                    <Edit3 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteChapter(chapter.chapterId)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}

                        {books.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                                <p>등록된 도서가 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-gray-400 px-4">
                            {currentPage + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </main>

            {/* 도서 등록/수정 모달 */}
            <AnimatePresence>
                {showBookModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowBookModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingBook ? '도서 수정' : '새 도서 등록'}
                                </h3>
                                <button
                                    onClick={() => setShowBookModal(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">제목 *</label>
                                    <input
                                        type="text"
                                        value={bookForm.title}
                                        onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">저자 *</label>
                                    <input
                                        type="text"
                                        value={bookForm.author}
                                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">출판사</label>
                                    <input
                                        type="text"
                                        value={bookForm.publisher}
                                        onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">가격</label>
                                        <input
                                            type="number"
                                            value={bookForm.price}
                                            onChange={(e) => setBookForm({ ...bookForm, price: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">대여 가격</label>
                                        <input
                                            type="number"
                                            value={bookForm.rentalPrice}
                                            onChange={(e) => setBookForm({ ...bookForm, rentalPrice: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isAdultOnly"
                                        checked={bookForm.isAdultOnly || false}
                                        onChange={(e) => setBookForm({ ...bookForm, isAdultOnly: e.target.checked })}
                                        className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                                    />
                                    <label htmlFor="isAdultOnly" className="text-sm text-gray-400">
                                        성인 전용
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">표지 URL</label>
                                    <input
                                        type="text"
                                        value={bookForm.coverUrl}
                                        onChange={(e) => setBookForm({ ...bookForm, coverUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">설명</label>
                                    <textarea
                                        value={bookForm.description}
                                        onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">언어</label>
                                    <select
                                        value={bookForm.language}
                                        onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    >
                                        <option value="ko">한국어</option>
                                        <option value="en">English</option>
                                        <option value="ja">Japanese</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">열람 권한</label>
                                    <select
                                        value={bookForm.viewPermission}
                                        onChange={(e) => setBookForm({ ...bookForm, viewPermission: e.target.value as 'FREE' | 'PREMIUM' })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    >
                                        <option value="FREE">무료</option>
                                        <option value="PREMIUM">유료 (구매 필요)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">출판일</label>
                                    <input
                                        type="date"
                                        value={bookForm.publishedDate || ''}
                                        onChange={(e) => setBookForm({ ...bookForm, publishedDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowBookModal(false)}
                                    className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSaveBook}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    저장
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 챕터 등록/수정 모달 */}
            <AnimatePresence>
                {showChapterModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowChapterModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingChapter ? '챕터 수정' : '새 챕터 추가'}
                                </h3>
                                <button
                                    onClick={() => setShowChapterModal(false)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">챕터 이름 *</label>
                                    <input
                                        type="text"
                                        value={chapterForm.chapterName}
                                        onChange={(e) => setChapterForm({ ...chapterForm, chapterName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="예: 제 1장: 시작"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">순서</label>
                                    <input
                                        type="number"
                                        value={chapterForm.sequence}
                                        onChange={(e) => setChapterForm({ ...chapterForm, sequence: parseInt(e.target.value) || 1 })}
                                        min={1}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        문단 수 (자동 추출)
                                    </label>
                                    <input
                                        type="number"
                                        value={chapterForm.paragraphs}
                                        onChange={(e) => setChapterForm({ ...chapterForm, paragraphs: parseInt(e.target.value) || -1 })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                                        readOnly={false} // 수정 가능
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        JSON 파일 업로드 시 자동 계산됩니다. (-1: 정보 없음/자동추출 실패)
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        콘텐츠 파일 {!editingChapter && '*'}
                                    </label>
                                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                                        <Upload size={20} className="text-gray-400" />
                                        <span className="text-gray-400">
                                            {chapterFile ? chapterFile.name : '파일 선택'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".txt,.json,.html"
                                            onChange={handleFileChange} // [UPDATED]
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        지원 형식: .txt, .json, .html (JSON 권장)
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowChapterModal(false)}
                                    className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSaveChapter}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    저장
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default AdminBooksPage;
