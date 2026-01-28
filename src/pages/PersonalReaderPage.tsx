import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Settings, MessageSquare, Search, List,
    Sparkles, X, Send, Highlighter, StickyNote,
    Moon, Sun, Minus, Plus, Loader2
} from 'lucide-react';
import { chapterService, type Chapter } from '../services/libraryService';
import useAuthStore from '../stores/authStore';


// ==================== Types ====================

interface PageContent {
    pageNumber: number;
    content: string;
}

interface SearchResult {
    text: string;
    pageNumber: number;
    highlightStart: number;
}

interface TextSelection {
    text: string;
    position: { x: number; y: number };
}

// ==================== Constants ====================

const CHARS_PER_PAGE = 800; // 페이지당 글자 수 조정

// 향후 프리셋 버튼용
// const FONT_SIZES = [14, 16, 18, 20, 22, 24];
const THEMES = [
    { name: 'light', bg: '#FFFDF7', text: '#2D1810', label: '밝은' },
    { name: 'sepia', bg: '#F8F0E3', text: '#5C4033', label: '세피아' },
    { name: 'dark', bg: '#1A1A1A', text: '#E8E8E8', label: '어두운' },
];

// ==================== Main Component ====================

const PersonalReaderPage: React.FC = () => {
    const { libraryId, chapterId } = useParams<{ libraryId: string; chapterId: string }>();
    const navigate = useNavigate();
    // 향후 인증 체크용
    useAuthStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 챕터 데이터
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [bookId, setBookId] = useState<number | null>(null);

    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed, 좌측 페이지
    const [pages, setPages] = useState<PageContent[]>([]);
    const totalPages = pages.length;

    // UI 상태
    const [showUI, setShowUI] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [showBottomBar, setShowBottomBar] = useState(true);
    const [rightSidebarTab, setRightSidebarTab] = useState<'ai' | 'toc' | 'comments' | 'search'>('toc');

    // 설정
    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState(THEMES[0]);
    const [showSettings, setShowSettings] = useState(false);

    // AI 채팅
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
    const [aiInput, setAiInput] = useState('');

    // 검색
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    // 텍스트 선택
    const [textSelection, setTextSelection] = useState<TextSelection | null>(null);

    // 댓글
    const [comments, setComments] = useState<{ id: number; user: string; content: string; createdAt: string }[]>([
        { id: 1, user: '독서광', content: '이 부분 정말 감동적이네요!', createdAt: '2024-01-15' },
        { id: 2, user: '책벌레', content: '저도 같은 생각이에요.', createdAt: '2024-01-16' },
    ]);
    const [newComment, setNewComment] = useState('');

    // ==================== Effects ====================

    // 챕터 로드
    useEffect(() => {
        if (chapterId) {
            loadChapter(parseInt(chapterId));
        }
    }, [chapterId]);

    // 책의 챕터 목록 로드
    useEffect(() => {
        if (bookId) {
            loadChapterList(bookId);
        }
    }, [bookId]);

    // 키보드 이벤트
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                goToPreviousPage();
            } else if (e.key === 'ArrowRight') {
                goToNextPage();
            } else if (e.key === 'Escape') {
                setTextSelection(null);
                setShowSettings(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages]);

    // 마우스 휠 이벤트
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                goToNextPage();
            } else {
                goToPreviousPage();
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: true });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [currentPage, totalPages]);

    // ==================== Data Loading ====================

    const loadChapter = async (id: number) => {
        setIsLoading(true);
        try {
            const data = await chapterService.getChapter(id);
            setChapter(data);
            setBookId(data.bookId);

            // 본문을 페이지로 분할
            const content = data.bookContent?.content || data.bookContent ||
                generateSampleContent(); // 샘플 콘텐츠
            const paginatedContent = paginateContent(content);
            setPages(paginatedContent);
        } catch (error) {
            console.error('Failed to load chapter:', error);
            // 샘플 데이터로 대체
            const sampleContent = generateSampleContent();
            setPages(paginateContent(sampleContent));
            setChapter({
                chapterId: id,
                bookId: 1,
                chapterName: `제 ${id}장`,
                sequence: id,
                bookContentPath: '',
                bookContent: sampleContent,
                paragraphs: 10,
            });
            setBookId(1);
        } finally {
            setIsLoading(false);
        }
    };

    const loadChapterList = async (bookId: number) => {
        try {
            const data = await chapterService.getChaptersByBook(bookId);
            setChapters(data);
        } catch (error) {
            console.error('Failed to load chapters:', error);
            // 샘플 데이터
            setChapters([
                { chapterId: 1, bookId, chapterName: '제 1장: 시작', sequence: 1, bookContentPath: '', bookContent: '', paragraphs: 10 },
                { chapterId: 2, bookId, chapterName: '제 2장: 만남', sequence: 2, bookContentPath: '', bookContent: '', paragraphs: 12 },
                { chapterId: 3, bookId, chapterName: '제 3장: 모험', sequence: 3, bookContentPath: '', bookContent: '', paragraphs: 8 },
            ]);
        }
    };

    // ==================== Utilities ====================

    const generateSampleContent = () => {
        return `
            그날, 하늘은 유난히 맑았다. 구름 한 점 없는 파란 하늘 아래, 마을은 평화로웠다.

            주인공은 작은 언덕 위에 서서 저 멀리 보이는 숲을 바라보았다. 그곳에는 아무도 가본 적 없는 비밀의 장소가 있다고 했다. 할머니가 어린 시절 들려주셨던 이야기가 떠올랐다.

            "저 숲 깊은 곳에는 마법의 거울이 있단다. 그 거울을 들여다보면, 네가 정말로 원하는 것이 무엇인지 알 수 있지."

            어린 시절에는 그저 동화 같은 이야기라고 생각했다. 하지만 지금은 달랐다. 스물다섯 번째 생일을 맞이한 오늘, 그 이야기가 자꾸만 머릿속을 맴돌았다.

            마을 사람들은 모두 자신의 일에 바빴다. 대장간에서는 쇠 두드리는 소리가 울려 퍼졌고, 시장에서는 상인들의 활기찬 목소리가 들렸다. 하지만 주인공의 마음은 이미 저 숲을 향해 있었다.

            "정말 가볼까?"

            혼잣말처럼 내뱉은 말이 바람에 실려 사라졌다. 결심은 이미 서 있었다. 오늘 밤, 모두가 잠든 후에 출발하기로 했다.

            준비물을 챙기기 시작했다. 낡은 배낭에 물통과 마른 빵, 그리고 할아버지께 물려받은 나침반을 넣었다. 이 나침반은 항상 올바른 길을 가리킨다고 했다.

            창문 너머로 해가 서서히 기울기 시작했다. 하늘이 주황색으로 물들어갈 때, 주인공은 깊은 숨을 내쉬었다.

            "드디어 시작이야."

            모험은 이제 막 시작되려 하고 있었다. 그 누구도 예상하지 못한 여정이 펼쳐질 것이다. 숲 속에서 만나게 될 존재들, 풀어야 할 수수께끼들, 그리고 결국 마주하게 될 그 거울.

            모든 것이 이 순간을 위해 준비되어 있었던 것처럼 느껴졌다.

            밤이 찾아왔다. 마을에 불빛이 하나둘 꺼지기 시작했다. 주인공은 조용히 집을 나섰다. 달빛 아래, 숲으로 향하는 첫 발걸음을 내딛었다.

            나무들 사이로 난 작은 오솔길을 따라 걸었다. 부엉이 울음소리가 멀리서 들려왔고, 바스락거리는 낙엽 소리가 발밑에서 울려 퍼졌다.

            얼마나 걸었을까. 갑자기 앞에 빛나는 무언가가 보였다. 푸른 빛이 나무들 사이로 새어 나오고 있었다.

            "이건... 뭐지?"

            조심스럽게 다가가 보았다. 그곳에는 작은 연못이 있었고, 연못 가운데에서 신비로운 빛이 솟아오르고 있었다.

            물 위에 비친 자신의 모습을 보았을 때, 주인공은 숨을 멈추었다. 거울에 비친 것처럼 선명한 모습. 하지만 그 눈동자 속에는 평소와는 다른 무언가가 담겨 있었다.

            용기.

            그것이 자신에게 필요한 것임을 깨달았다.

            연못가에 무릎을 꿇고 물에 손을 담갔다. 차가운 물이 손끝을 감싸는 순간, 어딘가에서 목소리가 들려왔다.

            "용기 있는 자여, 네가 찾는 것은 여기에 없다. 하지만 이 길을 계속 따라가면, 결국 마주하게 될 것이다."

            목소리의 주인을 찾아 주위를 둘러보았지만, 아무도 보이지 않았다. 오직 연못의 빛만이 서서히 사라져 가고 있었다.

            다시 일어섰다. 길은 계속되고 있었다. 발걸음을 멈출 수 없었다.
        `.trim();
    };

    const paginateContent = (content: string): PageContent[] => {
        const adjustedCharsPerPage = Math.floor(CHARS_PER_PAGE * (18 / fontSize));
        const paragraphs = content.split('\n').filter(p => p.trim());
        const pages: PageContent[] = [];
        let currentPageContent = '';

        paragraphs.forEach(paragraph => {
            if ((currentPageContent + paragraph).length > adjustedCharsPerPage) {
                if (currentPageContent) {
                    pages.push({ pageNumber: pages.length + 1, content: currentPageContent.trim() });
                    currentPageContent = paragraph + '\n\n';
                } else {
                    // 단락이 너무 김
                    pages.push({ pageNumber: pages.length + 1, content: paragraph.trim() });
                }
            } else {
                currentPageContent += paragraph + '\n\n';
            }
        });

        if (currentPageContent.trim()) {
            pages.push({ pageNumber: pages.length + 1, content: currentPageContent.trim() });
        }

        return pages;
    };

    // 폰트 사이즈 변경 시 페이지 재분할
    useEffect(() => {
        if (chapter?.bookContent) {
            const content = chapter.bookContent?.content || chapter.bookContent || generateSampleContent();
            setPages(paginateContent(content));
        }
    }, [fontSize]);

    // ==================== Navigation ====================

    const goToNextPage = useCallback(() => {
        if (currentPage + 2 < totalPages) {
            setCurrentPage(prev => prev + 2);
        } else if (currentPage + 1 < totalPages) {
            setCurrentPage(totalPages - 1);
        }
    }, [currentPage, totalPages]);

    const goToPreviousPage = useCallback(() => {
        if (currentPage >= 2) {
            setCurrentPage(prev => prev - 2);
        } else {
            setCurrentPage(0);
        }
    }, [currentPage]);

    const goToPage = (pageNum: number) => {
        const targetPage = Math.max(0, Math.min(pageNum - 1, totalPages - 1));
        // 짝수 페이지로 맞추기 (2페이지씩 보여주므로)
        setCurrentPage(targetPage % 2 === 0 ? targetPage : targetPage - 1);
    };

    const goToChapter = (chapterId: number) => {
        navigate(`/reader/${libraryId}/${chapterId}`);
        setCurrentPage(0);
        setShowRightSidebar(false);
    };

    // ==================== Click Handlers ====================

    const handleContainerClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickX = e.clientX - rect.left;
        const containerWidth = rect.width;
        const sidebarWidth = showRightSidebar ? 320 : 0;
        const contentWidth = containerWidth - sidebarWidth;

        // 좌측 1/4 영역 클릭
        if (clickX < contentWidth * 0.25) {
            goToPreviousPage();
        }
        // 우측 1/4 영역 클릭
        else if (clickX > contentWidth * 0.75 && clickX < contentWidth) {
            goToNextPage();
        }
        // 중앙 영역 클릭
        else if (clickX >= contentWidth * 0.25 && clickX <= contentWidth * 0.75) {
            setShowUI(prev => !prev);
            setShowBottomBar(prev => !prev);
        }
    };

    // ==================== Text Selection ====================

    const handleTextSelect = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setTextSelection({
                text: selection.toString(),
                position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
            });
        } else {
            setTextSelection(null);
        }
    };

    const handleHighlight = () => {
        // TODO: 하이라이트 저장 로직
        alert(`"${textSelection?.text}" 하이라이트 저장!`);
        setTextSelection(null);
    };

    const handleMemo = () => {
        const memo = prompt('메모를 입력하세요:');
        if (memo) {
            alert(`메모 저장: "${memo}"`);
        }
        setTextSelection(null);
    };

    const handleAiSearch = () => {
        if (textSelection) {
            setAiInput(`"${textSelection.text}"의 의미가 무엇인가요?`);
            setShowRightSidebar(true);
            setRightSidebarTab('ai');
            setTextSelection(null);
        }
    };

    // ==================== Search ====================

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const results: SearchResult[] = [];
        pages.forEach(page => {
            const lowerContent = page.content.toLowerCase();
            const lowerQuery = searchQuery.toLowerCase();
            let index = lowerContent.indexOf(lowerQuery);

            while (index !== -1) {
                const start = Math.max(0, index - 20);
                const end = Math.min(page.content.length, index + searchQuery.length + 20);
                results.push({
                    text: '...' + page.content.substring(start, end) + '...',
                    pageNumber: page.pageNumber,
                    highlightStart: index - start + 3,
                });
                index = lowerContent.indexOf(lowerQuery, index + 1);
            }
        });

        setSearchResults(results);
    };

    // ==================== AI Chat ====================

    const handleAiSend = async () => {
        if (!aiInput.trim()) return;

        const userMessage = aiInput;
        setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setAiInput('');

        // 시뮬레이션된 AI 응답
        setTimeout(() => {
            setAiMessages(prev => [...prev, {
                role: 'ai',
                content: `"${userMessage}"에 대한 답변입니다. 이 텍스트는 AI 기능의 데모입니다. 실제 구현 시 백엔드 AI API와 연동됩니다.`
            }]);
        }, 1000);
    };

    // ==================== Comments ====================

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setComments(prev => [...prev, {
            id: Date.now(),
            user: '나',
            content: newComment,
            createdAt: new Date().toISOString().split('T')[0],
        }]);
        setNewComment('');
    };

    // ==================== Current Pages ====================

    const leftPage = pages[currentPage] || null;
    const rightPage = pages[currentPage + 1] || null;

    // ==================== Render ====================

    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: theme.bg }}
            >
                <Loader2 size={48} className="animate-spin" style={{ color: theme.text }} />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen flex flex-col select-none overflow-hidden"
            style={{ backgroundColor: theme.bg, color: theme.text }}
            onClick={handleContainerClick}
            onMouseUp={handleTextSelect}
        >
            {/* 헤더 */}
            <AnimatePresence>
                {showUI && (
                    <motion.header
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-opacity-90 backdrop-blur-sm border-b"
                        style={{
                            backgroundColor: theme.bg,
                            borderColor: theme.name === 'dark' ? '#333' : '#E5E5E5'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                            <Link
                                to="/library"
                                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                style={{ color: theme.text }}
                            >
                                <ChevronLeft size={20} />
                                <span>서재로</span>
                            </Link>

                            <div className="flex items-center gap-2">
                                <span className="text-sm opacity-60">
                                    {chapter?.chapterName || '로딩 중...'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                                >
                                    <Settings size={20} />
                                </button>
                                <button
                                    onClick={() => setShowRightSidebar(prev => !prev)}
                                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            {/* 본문 영역 */}
            <main
                className="flex-1 flex items-center justify-center px-4"
                style={{ paddingTop: showUI ? 60 : 0, paddingBottom: showBottomBar ? 80 : 0 }}
            >
                <div className="flex gap-8 max-w-5xl w-full h-full">
                    {/* 좌측 페이지 */}
                    <motion.div
                        key={`left-${currentPage}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 flex flex-col justify-center"
                    >
                        {leftPage && (
                            <article
                                className="prose max-w-none leading-relaxed whitespace-pre-wrap select-text"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: 1.8,
                                    color: theme.text,
                                }}
                            >
                                {leftPage.content}
                            </article>
                        )}
                        {leftPage && (
                            <div className="text-center mt-4 opacity-50 text-sm">
                                {leftPage.pageNumber}
                            </div>
                        )}
                    </motion.div>

                    {/* 구분선 */}
                    <div
                        className="w-px"
                        style={{ backgroundColor: theme.name === 'dark' ? '#333' : '#E8E8E8' }}
                    />

                    {/* 우측 페이지 */}
                    <motion.div
                        key={`right-${currentPage + 1}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 flex flex-col justify-center"
                    >
                        {rightPage && (
                            <article
                                className="prose max-w-none leading-relaxed whitespace-pre-wrap select-text"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: 1.8,
                                    color: theme.text,
                                }}
                            >
                                {rightPage.content}
                            </article>
                        )}
                        {rightPage && (
                            <div className="text-center mt-4 opacity-50 text-sm">
                                {rightPage.pageNumber}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            {/* 하단 진행 바 */}
            <AnimatePresence>
                {showBottomBar && (
                    <motion.footer
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 border-t"
                        style={{
                            backgroundColor: theme.bg,
                            borderColor: theme.name === 'dark' ? '#333' : '#E5E5E5'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="max-w-4xl mx-auto px-8 py-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm opacity-60 w-12">
                                    {currentPage + 1}
                                </span>
                                <input
                                    type="range"
                                    min={0}
                                    max={Math.max(0, totalPages - 1)}
                                    value={currentPage}
                                    onChange={(e) => goToPage(parseInt(e.target.value) + 1)}
                                    className="flex-1 h-2 bg-gray-300 rounded-full appearance-none cursor-pointer"
                                    style={{
                                        accentColor: theme.name === 'dark' ? '#888' : '#333',
                                    }}
                                />
                                <span className="text-sm opacity-60 w-12 text-right">
                                    {totalPages}
                                </span>
                            </div>
                            <div className="text-center text-xs opacity-50 mt-2">
                                {Math.round(((currentPage + 1) / totalPages) * 100)}% 완료
                            </div>
                        </div>
                    </motion.footer>
                )}
            </AnimatePresence>

            {/* 우측 사이드바 */}
            <AnimatePresence>
                {showRightSidebar && (
                    <motion.aside
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        className="fixed top-0 right-0 bottom-0 w-80 border-l shadow-xl z-50 flex flex-col"
                        style={{
                            backgroundColor: theme.bg,
                            borderColor: theme.name === 'dark' ? '#333' : '#E5E5E5'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 탭 헤더 */}
                        <div className="flex border-b" style={{ borderColor: theme.name === 'dark' ? '#333' : '#E5E5E5' }}>
                            {[
                                { key: 'ai', icon: Sparkles, label: 'AI' },
                                { key: 'toc', icon: List, label: '목차' },
                                { key: 'comments', icon: MessageSquare, label: '댓글' },
                                { key: 'search', icon: Search, label: '검색' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setRightSidebarTab(tab.key as any)}
                                    className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition-colors ${rightSidebarTab === tab.key ? 'bg-black/5' : 'hover:bg-black/5'
                                        }`}
                                    style={{
                                        color: rightSidebarTab === tab.key ? theme.text : `${theme.text}80`,
                                    }}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* AI 탭 */}
                            {rightSidebarTab === 'ai' && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                        {aiMessages.length === 0 && (
                                            <div className="text-center py-8 opacity-50">
                                                <Sparkles size={32} className="mx-auto mb-2" />
                                                <p className="text-sm">AI에게 질문해보세요</p>
                                                <p className="text-xs mt-1">문장 분석, 요약, 질문 등</p>
                                            </div>
                                        )}
                                        {aiMessages.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-xl text-sm ${msg.role === 'user'
                                                    ? 'bg-emerald-500 text-white ml-8'
                                                    : 'bg-black/5 mr-8'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={aiInput}
                                            onChange={(e) => setAiInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                                            placeholder="질문을 입력하세요..."
                                            className="flex-1 px-3 py-2 rounded-xl border text-sm"
                                            style={{
                                                backgroundColor: 'transparent',
                                                borderColor: theme.name === 'dark' ? '#444' : '#DDD',
                                                color: theme.text,
                                            }}
                                        />
                                        <button
                                            onClick={handleAiSend}
                                            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 목차 탭 */}
                            {rightSidebarTab === 'toc' && (
                                <div className="space-y-1">
                                    {chapters.map(ch => (
                                        <button
                                            key={ch.chapterId}
                                            onClick={() => goToChapter(ch.chapterId)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${ch.chapterId === chapter?.chapterId
                                                ? 'bg-emerald-500 text-white'
                                                : 'hover:bg-black/5'
                                                }`}
                                        >
                                            {ch.chapterName}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 댓글 탭 */}
                            {rightSidebarTab === 'comments' && (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="p-3 bg-black/5 rounded-xl">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{comment.user}</span>
                                                    <span className="text-xs opacity-50">{comment.createdAt}</span>
                                                </div>
                                                <p className="text-sm">{comment.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            placeholder="댓글을 입력하세요..."
                                            className="flex-1 px-3 py-2 rounded-xl border text-sm"
                                            style={{
                                                backgroundColor: 'transparent',
                                                borderColor: theme.name === 'dark' ? '#444' : '#DDD',
                                                color: theme.text,
                                            }}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 검색 탭 */}
                            {rightSidebarTab === 'search' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="검색어 입력..."
                                            className="flex-1 px-3 py-2 rounded-xl border text-sm"
                                            style={{
                                                backgroundColor: 'transparent',
                                                borderColor: theme.name === 'dark' ? '#444' : '#DDD',
                                                color: theme.text,
                                            }}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {searchResults.length === 0 && searchQuery && (
                                            <p className="text-sm opacity-50 text-center py-4">
                                                검색 결과가 없습니다.
                                            </p>
                                        )}
                                        {searchResults.map((result, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    goToPage(result.pageNumber);
                                                    setShowRightSidebar(false);
                                                }}
                                                className="w-full text-left p-3 bg-black/5 rounded-xl hover:bg-black/10 transition-colors"
                                            >
                                                <div className="text-xs opacity-50 mb-1">
                                                    {result.pageNumber}페이지
                                                </div>
                                                <div className="text-sm">{result.text}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 사이드바 닫기 */}
                        <button
                            onClick={() => setShowRightSidebar(false)}
                            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/10"
                        >
                            <X size={18} />
                        </button>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* 텍스트 선택 팝업 */}
            <AnimatePresence>
                {textSelection && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed z-50 flex gap-1 p-1 bg-gray-900 text-white rounded-lg shadow-xl"
                        style={{
                            left: textSelection.position.x,
                            top: textSelection.position.y,
                            transform: 'translate(-50%, -100%)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleHighlight}
                            className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 rounded-lg text-sm"
                        >
                            <Highlighter size={16} />
                            하이라이트
                        </button>
                        <button
                            onClick={handleMemo}
                            className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 rounded-lg text-sm"
                        >
                            <StickyNote size={16} />
                            메모
                        </button>
                        <button
                            onClick={handleAiSearch}
                            className="flex items-center gap-1 px-3 py-2 hover:bg-white/10 rounded-lg text-sm"
                        >
                            <Sparkles size={16} />
                            AI 검색
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 설정 모달 */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">읽기 설정</h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* 글자 크기 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    글자 크기
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="text-lg font-medium w-16 text-center">
                                        {fontSize}px
                                    </span>
                                    <button
                                        onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* 테마 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    배경 테마
                                </label>
                                <div className="flex gap-3">
                                    {THEMES.map(t => (
                                        <button
                                            key={t.name}
                                            onClick={() => setTheme(t)}
                                            className={`flex-1 py-4 rounded-xl border-2 transition-all ${theme.name === t.name
                                                ? 'border-emerald-500 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            style={{ backgroundColor: t.bg }}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                {t.name === 'dark' ? (
                                                    <Moon size={20} style={{ color: t.text }} />
                                                ) : (
                                                    <Sun size={20} style={{ color: t.text }} />
                                                )}
                                                <span className="text-xs" style={{ color: t.text }}>
                                                    {t.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PersonalReaderPage;
