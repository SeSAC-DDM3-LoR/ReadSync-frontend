import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Settings, Search, List,
    Sparkles, X, Send, Highlighter, StickyNote,
    Moon, Sun, Minus, Plus, Loader2, ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';
// 리더 관련 서비스 (책 콘텐츠, 챕터)
import {
    chapterService,
    fetchBookContentFromUrl,
    type Chapter,
    type BookContent,
    type BookContentItem
} from '../services/readerService';
// 댓글 서비스
import {
    commentService,
    likeService,
    type CommentResponse,
    type LikeType
} from '../services/commentService';
// AI 채팅 서비스
import {
    aiChatService,
    convertToUIMessages,
    type ChatRoomResponse,
    type ChatMessage
} from '../services/aiChatService';
import useAuthStore from '../stores/authStore';


// ==================== Types ====================

/**
 * 분할된 콘텐츠 아이템 (페이지 경계에서 문단이 나뉠 때 사용)
 */
interface BookContentChunkItem extends BookContentItem {
    originalId: string;      // 원본 문단 ID (예: p_0003)
    chunkIndex: number;      // 분할 순서 (0: 첫 조각, 1+: 이어지는 조각)
    isComplete: boolean;     // 문단의 마지막 조각인지 여부
    totalChunks: number;     // 전체 조각 개수
}

/**
 * 페이지 콘텐츠 타입 (페이지 분할 후)
 */
interface PageContent {
    pageNumber: number;
    items: BookContentChunkItem[];  // 분할된 콘텐츠 아이템 배열
}

/**
 * 검색 결과 타입
 */
interface SearchResult {
    text: string;
    pageNumber: number;
    itemId: string;
    highlightStart: number;
}

/**
 * 텍스트 선택 상태
 */
interface TextSelection {
    text: string;
    position: { x: number; y: number };
}

// ==================== Constants ====================

// 기본 폰트 크기
const BASE_FONT_SIZE = 18;

// 테마 목록
const THEMES = [
    { name: 'light', bg: '#FFFDF7', text: '#2D1810', label: '밝은' },
    { name: 'sepia', bg: '#F8F0E3', text: '#5C4033', label: '세피아' },
    { name: 'dark', bg: '#1A1A1A', text: '#E8E8E8', label: '어두운' },
];

// ==================== Main Component ====================

const PersonalReaderPage: React.FC = () => {
    const { libraryId, chapterId } = useParams<{ libraryId: string; chapterId: string }>();
    const navigate = useNavigate();
    useAuthStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // ==================== State ====================

    // 로딩 상태
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // 챕터 및 책 데이터
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [bookId, setBookId] = useState<number | null>(null);
    const [bookContentData, setBookContentData] = useState<BookContent | null>(null);

    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(0);  // 0-indexed (좌측 페이지)
    const [pages, setPages] = useState<PageContent[]>([]);
    const totalPages = pages.length;

    // 뷰포트 (반응형 페이지 분할용)
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [containerWidth, setContainerWidth] = useState(800);

    // UI 상태
    const [showUI, setShowUI] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [showBottomBar, setShowBottomBar] = useState(true);
    const [rightSidebarTab, setRightSidebarTab] = useState<'ai' | 'toc' | 'comments' | 'search'>('toc');

    // 설정
    const [fontSize, setFontSize] = useState(BASE_FONT_SIZE);
    const [theme, setTheme] = useState(THEMES[0]);
    const [showSettings, setShowSettings] = useState(false);

    // AI 채팅
    const [chatRoom, setChatRoom] = useState<ChatRoomResponse | null>(null);
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    // 검색
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    // 텍스트 선택
    const [textSelection, setTextSelection] = useState<TextSelection | null>(null);

    // 댓글
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isCommentLoading, setIsCommentLoading] = useState(false);

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

    // 댓글 로드
    useEffect(() => {
        if (chapterId) {
            loadComments(parseInt(chapterId));
        }
    }, [chapterId]);

    // 뷰포트 크기 변경 감지
    useEffect(() => {
        const handleResize = () => {
            setViewportHeight(window.innerHeight);
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // 초기 설정

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 글자 크기 또는 뷰포트 변경 시 페이지 재계산
    useEffect(() => {
        if (bookContentData?.content) {
            const newPages = paginateBookContent(bookContentData.content);
            setPages(newPages);
            // 현재 페이지 위치 유지 (범위 초과 방지)
            setCurrentPage(prev => Math.min(prev, Math.max(0, newPages.length - 1)));
        }
    }, [fontSize, viewportHeight, containerWidth, bookContentData]);

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

    /**
     * 챕터 데이터 로드
     * 
     * 백엔드에서 챕터 정보를 가져오고, 책 콘텐츠를 파싱합니다.
     * bookContent가 직접 제공되면 사용하고, 없으면 bookContentPath URL에서 파싱합니다.
     */
    const loadChapter = async (id: number) => {
        setIsLoading(true);
        setLoadError(null);

        try {
            // 1. 백엔드에서 챕터 정보 조회
            const chapterData = await chapterService.getChapter(id);
            setChapter(chapterData);
            setBookId(chapterData.bookId);

            let bookContent: BookContent;

            // 2. bookContent가 있으면 직접 사용, 없으면 URL에서 파싱
            if (chapterData.bookContent &&
                typeof chapterData.bookContent === 'object' &&
                'content' in chapterData.bookContent) {
                bookContent = chapterData.bookContent as BookContent;
            } else if (chapterData.bookContentPath) {
                // URL에서 JSON 파싱
                try {
                    bookContent = await fetchBookContentFromUrl(chapterData.bookContentPath);
                } catch (urlError) {
                    console.error('URL 콘텐츠 로드 실패:', urlError);
                    // 샘플 데이터로 대체
                    bookContent = generateSampleBookContent();
                }
            } else {
                // 콘텐츠 없음 - 샘플 데이터 사용
                bookContent = generateSampleBookContent();
            }

            // 3. 콘텐츠 저장 및 페이지 분할
            setBookContentData(bookContent);
            const paginatedContent = paginateBookContent(bookContent.content);
            setPages(paginatedContent);

        } catch (error) {
            console.error('챕터 로드 실패:', error);
            setLoadError('챕터를 불러오는데 실패했습니다.');

            // 샘플 데이터로 대체
            const sampleContent = generateSampleBookContent();
            setBookContentData(sampleContent);
            setPages(paginateBookContent(sampleContent.content));
            setChapter({
                chapterId: id,
                bookId: 1,
                chapterName: `제 ${id}장`,
                sequence: id,
                bookContentPath: '',
                bookContent: sampleContent,
                paragraphs: sampleContent.paragraphs,
            });
            setBookId(1);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 책의 챕터 목록 로드 (목차용)
     */
    const loadChapterList = async (bookId: number) => {
        try {
            const data = await chapterService.getChaptersByBook(bookId);
            setChapters(data);
        } catch (error) {
            console.error('챕터 목록 로드 실패:', error);
            // 샘플 데이터
            setChapters([
                { chapterId: 1, bookId, chapterName: '제 1장: 시작', sequence: 1, bookContentPath: '', bookContent: null, paragraphs: 10 },
                { chapterId: 2, bookId, chapterName: '제 2장: 만남', sequence: 2, bookContentPath: '', bookContent: null, paragraphs: 12 },
                { chapterId: 3, bookId, chapterName: '제 3장: 모험', sequence: 3, bookContentPath: '', bookContent: null, paragraphs: 8 },
            ]);
        }
    };

    /**
     * 챕터별 댓글 로드
     */
    const loadComments = async (chapterId: number) => {
        setIsCommentLoading(true);
        try {
            const data = await commentService.getCommentsByChapter(chapterId);
            setComments(data);
        } catch (error) {
            console.error('댓글 로드 실패:', error);
            // 샘플 데이터
            setComments([]);
        } finally {
            setIsCommentLoading(false);
        }
    };

    /**
     * AI 채팅방 초기화/조회
     */
    const initChatRoom = async () => {
        if (!chapterId || chatRoom) return;

        try {
            const room = await aiChatService.createChatRoom({
                chapterId: parseInt(chapterId),
                title: chapter?.chapterName || `챕터 ${chapterId} 채팅`,
            });
            setChatRoom(room);

            // 채팅 기록 로드
            const history = await aiChatService.getChatHistory(room.roomId);
            setAiMessages(convertToUIMessages(history));
        } catch (error) {
            console.error('채팅방 초기화 실패:', error);
        }
    };

    // ==================== Utilities ====================

    /**
     * 샘플 책 콘텐츠 생성 (개발/테스트용)
     */
    const generateSampleBookContent = (): BookContent => {
        return {
            book_name: "샘플 소설",
            series_info: null,
            chapter: 1,
            chapter_name: "시작",
            author: "작가 미상",
            translator: null,
            publisher: null,
            published_date: null,
            categories: ["소설", "판타지"],
            paragraphs: 15,
            speakers: ["나레이션"],
            summary: "모험이 시작되는 이야기입니다.",
            content: [
                { id: "p_0001", type: "heading_1", text: "샘플 소설", speaker: "나레이션", style: { align: "center", bold: true, size: "large" } },
                { id: "p_0002", type: "heading_2", text: "제 1장: 시작", speaker: "나레이션", style: { align: "center", bold: true } },
                { id: "p_0003", type: "paragraph", text: "그날, 하늘은 유난히 맑았다. 구름 한 점 없는 파란 하늘 아래, 마을은 평화로웠다.", speaker: "나레이션" },
                { id: "p_0004", type: "paragraph", text: "주인공은 작은 언덕 위에 서서 저 멀리 보이는 숲을 바라보았다. 그곳에는 아무도 가본 적 없는 비밀의 장소가 있다고 했다. 할머니가 어린 시절 들려주셨던 이야기가 떠올랐다.", speaker: "나레이션" },
                { id: "p_0005", type: "quote", text: "\"저 숲 깊은 곳에는 마법의 거울이 있단다. 그 거울을 들여다보면, 네가 정말로 원하는 것이 무엇인지 알 수 있지.\"", speaker: "할머니" },
                { id: "p_0006", type: "paragraph", text: "어린 시절에는 그저 동화 같은 이야기라고 생각했다. 하지만 지금은 달랐다. 스물다섯 번째 생일을 맞이한 오늘, 그 이야기가 자꾸만 머릿속을 맴돌았다.", speaker: "나레이션" },
                { id: "p_0007", type: "paragraph", text: "마을 사람들은 모두 자신의 일에 바빴다. 대장간에서는 쇠 두드리는 소리가 울려 퍼졌고, 시장에서는 상인들의 활기찬 목소리가 들렸다. 하지만 주인공의 마음은 이미 저 숲을 향해 있었다.", speaker: "나레이션" },
                { id: "p_0008", type: "quote", text: "\"정말 가볼까?\"", speaker: "주인공" },
                { id: "p_0009", type: "paragraph", text: "혼잣말처럼 내뱉은 말이 바람에 실려 사라졌다. 결심은 이미 서 있었다. 오늘 밤, 모두가 잠든 후에 출발하기로 했다.", speaker: "나레이션" },
                { id: "p_0010", type: "paragraph", text: "준비물을 챙기기 시작했다. 낡은 배낭에 물통과 마른 빵, 그리고 할아버지께 물려받은 나침반을 넣었다. 이 나침반은 항상 올바른 길을 가리킨다고 했다.", speaker: "나레이션" },
                { id: "p_0011", type: "paragraph", text: "창문 너머로 해가 서서히 기울기 시작했다. 하늘이 주황색으로 물들어갈 때, 주인공은 깊은 숨을 내쉬었다.", speaker: "나레이션" },
                { id: "p_0012", type: "quote", text: "\"드디어 시작이야.\"", speaker: "주인공" },
                { id: "p_0013", type: "paragraph", text: "모험은 이제 막 시작되려 하고 있었다. 그 누구도 예상하지 못한 여정이 펼쳐질 것이다. 숲 속에서 만나게 될 존재들, 풀어야 할 수수께끼들, 그리고 결국 마주하게 될 그 거울.", speaker: "나레이션" },
                { id: "p_0014", type: "paragraph", text: "모든 것이 이 순간을 위해 준비되어 있었던 것처럼 느껴졌다.", speaker: "나레이션" },
                { id: "p_0015", type: "paragraph", text: "밤이 찾아왔다. 마을에 불빛이 하나둘 꺼지기 시작했다. 주인공은 조용히 집을 나섰다. 달빛 아래, 숲으로 향하는 첫 발걸음을 내딛었다.", speaker: "나레이션" },
            ]
        };
    };

    /**
     * 긴 문단을 여러 조각으로 분할
     * 
     * @param item 분할할 콘텐츠 아이템
     * @param remainingLines 현재 페이지에 남은 줄  수
     * @param maxLinesPerPage 페이지당 최대 줄 수
     * @returns 분할된 콘텐츠 조각 배열
     */
    const splitItemIntoChunks = (
        item: BookContentItem,
        remainingLines: number,
        maxLinesPerPage: number
    ): BookContentChunkItem[] => {
        const chunks: BookContentChunkItem[] = [];

        // 제목류는 분할하지 않음 (통째로 다음 페이지로)
        if (['heading_1', 'heading_2', 'heading_3'].includes(item.type)) {
            return [{
                ...item,
                originalId: item.id,
                chunkIndex: 0,
                isComplete: true,
                totalChunks: 1
            }];
        }

        // 문단 타입별 한 줄당 글자 수
        const charsPerLine = item.type === 'quote' ? 35 : 40;
        const text = item.text;
        const totalChars = text.length;

        // 예상 전체 줄 수
        const totalLines = Math.ceil(totalChars / charsPerLine);

        // 한 페이지에 다 들어가면 분할 불필요
        if (totalLines <= maxLinesPerPage) {
            return [{
                ...item,
                originalId: item.id,
                chunkIndex: 0,
                isComplete: true,
                totalChunks: 1
            }];
        }

        // 문장 구분 문자
        const breakChars = ['。', '.', '!', '?', ',', '、', '\n'];

        // 첫 번째 조각: 현재 페이지 남은 공간에 맞춤
        const firstChunkChars = Math.floor(remainingLines * charsPerLine);
        if (firstChunkChars > 0 && remainingLines > 2) { // 최소 2줄 이상일 때만 분할
            // 문장 단위로 자르기 위해 마지막 마침표/쉼표 찾기
            let splitIndex = firstChunkChars;

            for (let i = firstChunkChars; i < Math.min(firstChunkChars + 20, totalChars); i++) {
                if (breakChars.includes(text[i])) {
                    splitIndex = i + 1;
                    break;
                }
            }

            if (splitIndex > 0) {
                chunks.push({
                    ...item,
                    id: `${item.id}_chunk_0`,
                    originalId: item.id,
                    text: text.substring(0, splitIndex).trim(),
                    chunkIndex: 0,
                    isComplete: false,
                    totalChunks: 0 // 나중에 업데이트
                });

                // 나머지 텍스트 처리
                let remainingText = text.substring(splitIndex).trim();
                let chunkIndex = 1;

                while (remainingText.length > 0) {
                    const chunkChars = Math.floor(maxLinesPerPage * charsPerLine);

                    if (remainingText.length <= chunkChars) {
                        // 마지막 조각
                        chunks.push({
                            ...item,
                            id: `${item.id}_chunk_${chunkIndex}`,
                            originalId: item.id,
                            text: remainingText,
                            chunkIndex,
                            isComplete: true,
                            totalChunks: 0 // 나중에 업데이트
                        });
                        break;
                    } else {
                        // 중간 조각
                        let splitIdx = chunkChars;
                        for (let i = chunkChars; i < Math.min(chunkChars + 20, remainingText.length); i++) {
                            if (breakChars.includes(remainingText[i])) {
                                splitIdx = i + 1;
                                break;
                            }
                        }

                        chunks.push({
                            ...item,
                            id: `${item.id}_chunk_${chunkIndex}`,
                            originalId: item.id,
                            text: remainingText.substring(0, splitIdx).trim(),
                            chunkIndex,
                            isComplete: false,
                            totalChunks: 0 // 나중에 업데이트
                        });

                        remainingText = remainingText.substring(splitIdx).trim();
                        chunkIndex++;
                    }
                }
            }
        }

        // 조각이 생성되지 않은 경우 (남은 공간이 너무 적음) - 전체를 다음 페이지로
        if (chunks.length === 0) {
            let remainingText = text;
            let chunkIndex = 0;

            while (remainingText.length > 0) {
                const chunkChars = Math.floor(maxLinesPerPage * charsPerLine);

                if (remainingText.length <= chunkChars) {
                    chunks.push({
                        ...item,
                        id: `${item.id}_chunk_${chunkIndex}`,
                        originalId: item.id,
                        text: remainingText,
                        chunkIndex,
                        isComplete: true,
                        totalChunks: 0
                    });
                    break;
                } else {
                    let splitIdx = chunkChars;
                    for (let i = chunkChars; i < Math.min(chunkChars + 20, remainingText.length); i++) {
                        if (breakChars.includes(remainingText[i])) {
                            splitIdx = i + 1;
                            break;
                        }
                    }

                    chunks.push({
                        ...item,
                        id: `${item.id}_chunk_${chunkIndex}`,
                        originalId: item.id,
                        text: remainingText.substring(0, splitIdx).trim(),
                        chunkIndex,
                        isComplete: false,
                        totalChunks: 0
                    });

                    remainingText = remainingText.substring(splitIdx).trim();
                    chunkIndex++;
                }
            }
        }

        // totalChunks 업데이트
        const totalChunks = chunks.length;
        chunks.forEach(chunk => {
            chunk.totalChunks = totalChunks;
        });

        return chunks;
    };

    /**
     * 책 콘텐츠를 페이지 단위로 분할
     * 
     * 줄 수 기반으로 페이지를 나누며, 긴 문단은 자동으로 분할하여 이어서 출력합니다.
     */
    const paginateBookContent = (content: BookContentItem[]): PageContent[] => {
        // 폰트 크기에따른 페이지당 최대 줄 수 결정
        // 기본 18px일 때 약 20줄로 조정 (85% 높이를 고려)
        // 이전: 25줄이었으나 페이지가 잘려서 20줄로 감소
        const MAX_LINES_PER_PAGE = Math.floor(20 * (BASE_FONT_SIZE / fontSize));

        const pages: PageContent[] = [];
        let currentPageItems: BookContentChunkItem[] = [];
        let currentLineCount = 0;

        content.forEach(item => {
            // 각 아이템의 줄 수 계산
            let itemLines = 1;

            if (item.type === 'paragraph') {
                const charsPerLine = 40;
                itemLines = Math.ceil(item.text.length / charsPerLine);
            } else if (item.type === 'heading_1') {
                itemLines = 2;
            } else if (item.type === 'heading_2') {
                itemLines = 1.5;
            } else if (item.type === 'heading_3') {
                itemLines = 1;
            } else if (item.type === 'quote') {
                const charsPerLine = 35;
                itemLines = Math.ceil(item.text.length / charsPerLine) + 0.5;
            }

            // 현재 페이지에 추가할 수 있는지 확인
            if (currentLineCount + itemLines > MAX_LINES_PER_PAGE && currentPageItems.length > 0) {
                // 페이지가 꽉 참 - 분할 필요 여부 확인
                const remainingLines = MAX_LINES_PER_PAGE - currentLineCount;

                // 제목은 분할하지 않고 다음 페이지로
                if (['heading_1', 'heading_2', 'heading_3'].includes(item.type)) {
                    // 현재 페이지 완성
                    pages.push({
                        pageNumber: pages.length + 1,
                        items: [...currentPageItems],
                    });
                    currentPageItems = [{
                        ...item,
                        originalId: item.id,
                        chunkIndex: 0,
                        isComplete: true,
                        totalChunks: 1
                    }];
                    currentLineCount = itemLines;
                } else {
                    // 문단은 분할 가능
                    const chunks = splitItemIntoChunks(item, remainingLines, MAX_LINES_PER_PAGE);

                    chunks.forEach((chunk, idx) => {
                        const chunkLines = Math.ceil(chunk.text.length / (chunk.type === 'quote' ? 35 : 40));

                        if (idx === 0 && remainingLines > 2) {
                            // 첫 조각을 현재 페이지에 추가 (충분한 공간이 있을 때)
                            currentPageItems.push(chunk);
                            currentLineCount += chunkLines;

                            // 첫 조각 후 페이지 완성
                            pages.push({
                                pageNumber: pages.length + 1,
                                items: [...currentPageItems],
                            });
                            currentPageItems = [];
                            currentLineCount = 0;
                        } else {
                            // 나머지 조각들 처리
                            if (idx === 0 || currentPageItems.length === 0) {
                                // 새 페이지 시작 (첫 조각이 추가되지 않았거나 페이지 비어있음)
                                currentPageItems.push(chunk);
                                currentLineCount = chunkLines;
                            } else {
                                // 현재 페이지에 추가
                                currentPageItems.push(chunk);
                                currentLineCount += chunkLines;
                            }

                            // 페이지가 가득 찼거나 마지막 조각이면 페이지 완성
                            if (currentLineCount >= MAX_LINES_PER_PAGE * 0.8 || chunk.isComplete) {
                                if (chunk.isComplete || idx === chunks.length - 1) {
                                    pages.push({
                                        pageNumber: pages.length + 1,
                                        items: [...currentPageItems],
                                    });
                                    currentPageItems = [];
                                    currentLineCount = 0;
                                }
                            }
                        }
                    });
                }
            } else {
                // 현재 페이지에 여유 있음 - 분할하지 않고 추가
                currentPageItems.push({
                    ...item,
                    originalId: item.id,
                    chunkIndex: 0,
                    isComplete: true,
                    totalChunks: 1
                });
                currentLineCount += itemLines;
            }
        });

        // 마지막 페이지 추가
        if (currentPageItems.length > 0) {
            pages.push({
                pageNumber: pages.length + 1,
                items: currentPageItems,
            });
        }

        return pages;
    };

    /**
     * 콘텐츠 아이템 렌더링 (분할된 문단 지원)
     */
    const renderContentItem = (item: BookContentChunkItem, _index: number) => {
        const baseStyle: React.CSSProperties = {
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            color: theme.text,
            marginBottom: '12px',
        };

        // 분할된 문단의 경우 스타일 조정
        if (item.chunkIndex > 0) {
            // 이어지는 조각은 위쪽 여백 제거 (들여쓰기 없이 바로 이어짐)
            baseStyle.marginTop = '0px';
            baseStyle.marginBottom = item.isComplete ? '12px' : '4px';
        }

        // 스타일 적용
        const customStyle: React.CSSProperties = { ...baseStyle };
        if (item.style) {
            if (item.style.align) customStyle.textAlign = item.style.align;
            if (item.style.bold) customStyle.fontWeight = 'bold';
            if (item.style.size === 'large') customStyle.fontSize = `${fontSize * 1.5}px`;
            else if (item.style.size === 'small') customStyle.fontSize = `${fontSize * 0.85}px`;
        }

        switch (item.type) {
            case 'heading_1':
                return (
                    <h1 key={item.id} style={{
                        ...customStyle,
                        fontSize: `${fontSize * 1.6}px`,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '24px',
                        marginTop: '16px'
                    }}>
                        {item.text}
                    </h1>
                );
            case 'heading_2':
                return (
                    <h2 key={item.id} style={{
                        ...customStyle,
                        fontSize: `${fontSize * 1.3}px`,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        {item.text}
                    </h2>
                );
            case 'heading_3':
                return (
                    <h3 key={item.id} style={{
                        ...customStyle,
                        fontSize: `${fontSize * 1.15}px`,
                        fontWeight: 'bold',
                        marginBottom: '16px'
                    }}>
                        {item.text}
                    </h3>
                );
            case 'quote':
                return (
                    <blockquote key={item.id} style={{
                        ...customStyle,
                        paddingLeft: '20px',
                        borderLeft: `3px solid ${theme.text}40`,
                        fontStyle: 'italic'
                    }}>
                        {item.text}
                    </blockquote>
                );
            case 'poetry':
            case 'letter':
                return (
                    <div key={item.id} style={{
                        ...customStyle,
                        paddingLeft: '24px',
                        fontStyle: 'italic',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {item.text}
                    </div>
                );
            case 'footnote':
                return (
                    <div key={item.id} style={{
                        ...customStyle,
                        fontSize: `${fontSize * 0.8}px`,
                        opacity: 0.7,
                        borderTop: `1px solid ${theme.text}20`,
                        paddingTop: '8px',
                        marginTop: '16px'
                    }}>
                        {item.text}
                    </div>
                );
            case 'image':
                return (
                    <figure key={item.id} style={{ textAlign: 'center', marginBottom: '16px' }}>
                        {item.img_url && (
                            <img
                                src={item.img_url}
                                alt={item.text}
                                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                            />
                        )}
                        <figcaption style={{
                            fontSize: `${fontSize * 0.8}px`,
                            color: `${theme.text}80`,
                            marginTop: '8px'
                        }}>
                            {item.text}
                        </figcaption>
                    </figure>
                );
            default: // paragraph
                return (
                    <p key={item.id} style={{
                        ...customStyle,
                        textIndent: '2em'
                    }}>
                        {item.text}
                    </p>
                );
        }
    };

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
            initChatRoom();  // 채팅방 초기화
            setTextSelection(null);
        }
    };

    // ==================== Search ====================

    const handleSearch = () => {
        if (!searchQuery.trim() || pages.length === 0) {
            setSearchResults([]);
            return;
        }

        const results: SearchResult[] = [];
        const lowerQuery = searchQuery.toLowerCase();

        pages.forEach((page, pageIndex) => {
            page.items.forEach(item => {
                const lowerText = item.text.toLowerCase();
                let index = lowerText.indexOf(lowerQuery);

                while (index !== -1) {
                    const start = Math.max(0, index - 20);
                    const end = Math.min(item.text.length, index + searchQuery.length + 20);

                    results.push({
                        text: '...' + item.text.substring(start, end) + '...',
                        pageNumber: pageIndex + 1,
                        itemId: item.id,
                        highlightStart: index - start + 3,
                    });

                    index = lowerText.indexOf(lowerQuery, index + 1);
                }
            });
        });

        setSearchResults(results);
    };

    const handleSearchResultClick = (result: SearchResult) => {
        goToPage(result.pageNumber);
        setShowRightSidebar(false);
    };

    // ==================== AI Chat ====================

    const handleAiSend = async () => {
        if (!aiInput.trim()) return;

        // 채팅방이 없으면 생성
        if (!chatRoom) {
            await initChatRoom();
        }

        const userMessage = aiInput;
        setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setAiInput('');
        setIsAiLoading(true);

        try {
            if (chatRoom) {
                const response = await aiChatService.sendMessage(chatRoom.roomId, {
                    userMsg: userMessage,
                    chatType: 'CHAT',
                });
                setAiMessages(prev => [...prev, { role: 'ai', content: response.aiMsg }]);
            } else {
                // 채팅방 없을 경우 시뮬레이션
                setTimeout(() => {
                    setAiMessages(prev => [...prev, {
                        role: 'ai',
                        content: `"${userMessage}"에 대한 답변입니다. AI 서버 연동 후 실제 응답이 표시됩니다.`
                    }]);
                }, 1000);
            }
        } catch (error) {
            console.error('AI 응답 실패:', error);
            setAiMessages(prev => [...prev, {
                role: 'ai',
                content: 'AI 응답을 받는데 실패했습니다. 잠시 후 다시 시도해주세요.'
            }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    // ==================== Comments ====================

    const handleAddComment = async () => {
        if (!newComment.trim() || !chapterId) return;

        try {
            await commentService.createComment(parseInt(chapterId), {
                content: newComment,
                isSpoiler,
            });
            setNewComment('');
            setIsSpoiler(false);
            // 댓글 목록 새로고침
            loadComments(parseInt(chapterId));
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
        }
    };

    const handleToggleLike = async (commentId: number, likeType: LikeType) => {
        try {
            await likeService.toggleCommentLike(commentId, likeType);
            // 댓글 목록 새로고침
            if (chapterId) {
                loadComments(parseInt(chapterId));
            }
        } catch (error) {
            console.error('좋아요 토글 실패:', error);
        }
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

    // 헤더 높이 60px, 하단바 높이 80px
    const HEADER_HEIGHT = 60;
    const FOOTER_HEIGHT = 80;
    const contentHeight = viewportHeight - (showUI ? HEADER_HEIGHT : 0) - (showBottomBar ? FOOTER_HEIGHT : 0);

    return (
        <div
            ref={containerRef}
            className="flex flex-col select-none overflow-hidden"
            style={{
                backgroundColor: theme.bg,
                color: theme.text,
                height: '100vh',
                maxHeight: '100vh'
            }}
            onClick={handleContainerClick}
            onMouseUp={handleTextSelect}
        >
            {/* 에러 메시지 */}
            {loadError && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {loadError}
                </div>
            )}

            {/* 헤더 */}
            <AnimatePresence>
                {showUI && (
                    <motion.header
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-opacity-98 backdrop-blur-md border-b"
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
                                    {bookContentData?.book_name || chapter?.chapterName || '로딩 중...'}
                                </span>
                                {bookContentData?.chapter && (
                                    <span className="text-sm opacity-40">
                                        - 제 {bookContentData.chapter}장
                                    </span>
                                )}
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

            {/* 본문 영역 - 고정 높이로 스크롤 방지 */}
            <main
                className="flex-1 flex items-center justify-center px-4 overflow-hidden"
                style={{
                    marginTop: showUI ? HEADER_HEIGHT : 0,
                    marginBottom: showBottomBar ? FOOTER_HEIGHT : 0,
                    height: contentHeight,
                    maxHeight: contentHeight,
                    transition: 'margin 0.3s ease'
                }}
            >
                <div className="flex gap-8 max-w-5xl w-full" style={{ height: '100%', maxHeight: '100%' }}>
                    {/* 좌측 페이지 */}
                    <motion.div
                        key={`left-${currentPage}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 flex flex-col justify-center overflow-hidden"
                    >
                        {leftPage && (
                            <article className="prose max-w-none select-text">
                                {leftPage.items.map((item, idx) => renderContentItem(item, idx))}
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
                        className="flex-1 flex flex-col justify-center overflow-hidden"
                    >
                        {rightPage && (
                            <article className="prose max-w-none select-text">
                                {rightPage.items.map((item, idx) => renderContentItem(item, idx))}
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
                                    className="flex-1 accent-emerald-500"
                                />
                                <span className="text-sm opacity-60 w-12 text-right">
                                    {totalPages}
                                </span>
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
                        className="fixed top-0 right-0 bottom-0 w-80 z-50 border-l shadow-xl overflow-hidden flex flex-col"
                        style={{
                            backgroundColor: theme.bg,
                            borderColor: theme.name === 'dark' ? '#333' : '#E5E5E5'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 탭 */}
                        <div className="flex border-b" style={{ borderColor: theme.name === 'dark' ? '#333' : '#E5E5E5' }}>
                            {[
                                { key: 'ai', icon: Sparkles, label: 'AI' },
                                { key: 'toc', icon: List, label: '목차' },
                                { key: 'comments', icon: () => <span>💬</span>, label: '댓글' },
                                { key: 'search', icon: Search, label: '검색' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setRightSidebarTab(tab.key as 'ai' | 'toc' | 'comments' | 'search');
                                        if (tab.key === 'ai') initChatRoom();
                                    }}
                                    className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition-colors ${rightSidebarTab === tab.key
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'hover:bg-black/5'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* AI 채팅 */}
                            {rightSidebarTab === 'ai' && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                        {aiMessages.length === 0 ? (
                                            <div className="text-center text-sm opacity-60 py-8">
                                                <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
                                                <p>책 내용에 대해 AI에게 질문해보세요!</p>
                                                <p className="text-xs mt-1">텍스트를 선택하고 'AI 검색'을 누르면 자동으로 질문이 생성됩니다.</p>
                                            </div>
                                        ) : (
                                            aiMessages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg text-sm ${msg.role === 'user'
                                                        ? 'bg-emerald-500 text-white ml-8'
                                                        : 'bg-gray-100 mr-8'
                                                        }`}
                                                    style={msg.role === 'ai' ? { backgroundColor: theme.name === 'dark' ? '#2A2A2A' : '#F5F5F5' } : {}}
                                                >
                                                    {msg.content}
                                                </div>
                                            ))
                                        )}
                                        {isAiLoading && (
                                            <div className="flex items-center gap-2 text-sm opacity-60">
                                                <Loader2 size={16} className="animate-spin" />
                                                응답 생성 중...
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={aiInput}
                                            onChange={(e) => setAiInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                                            placeholder="질문을 입력하세요..."
                                            className="flex-1 px-3 py-2 rounded-lg border text-sm"
                                            style={{
                                                backgroundColor: theme.name === 'dark' ? '#2A2A2A' : '#FFF',
                                                borderColor: theme.name === 'dark' ? '#444' : '#DDD',
                                                color: theme.text
                                            }}
                                        />
                                        <button
                                            onClick={handleAiSend}
                                            disabled={isAiLoading}
                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 목차 */}
                            {rightSidebarTab === 'toc' && (
                                <div className="space-y-2">
                                    <h3 className="font-bold mb-4">목차</h3>
                                    {chapters.map(ch => (
                                        <button
                                            key={ch.chapterId}
                                            onClick={() => goToChapter(ch.chapterId)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${ch.chapterId === chapter?.chapterId
                                                ? 'bg-emerald-500/20 text-emerald-600'
                                                : 'hover:bg-black/5'
                                                }`}
                                        >
                                            {ch.chapterName}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 댓글 */}
                            {rightSidebarTab === 'comments' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold">댓글 ({comments.length})</h3>

                                    {/* 댓글 입력 */}
                                    <div className="space-y-2">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="댓글을 입력하세요..."
                                            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                            rows={3}
                                            style={{
                                                backgroundColor: theme.name === 'dark' ? '#2A2A2A' : '#FFF',
                                                borderColor: theme.name === 'dark' ? '#444' : '#DDD',
                                                color: theme.text
                                            }}
                                        />
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={isSpoiler}
                                                    onChange={(e) => setIsSpoiler(e.target.checked)}
                                                />
                                                스포일러 포함
                                            </label>
                                            <button
                                                onClick={handleAddComment}
                                                className="px-4 py-1 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
                                            >
                                                등록
                                            </button>
                                        </div>
                                    </div>

                                    {/* 댓글 목록 */}
                                    {isCommentLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 size={24} className="animate-spin opacity-50" />
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-sm text-center opacity-60 py-4">
                                            아직 댓글이 없습니다.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {comments.map(comment => (
                                                <div
                                                    key={comment.commentId}
                                                    className="p-3 rounded-lg"
                                                    style={{
                                                        backgroundColor: theme.name === 'dark' ? '#2A2A2A' : '#F5F5F5'
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">{comment.nickname}</span>
                                                        <span className="text-xs opacity-50">
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">
                                                        {comment.isSpoiler ? (
                                                            <span className="text-red-500">[스포일러] </span>
                                                        ) : null}
                                                        {comment.content}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <button
                                                            onClick={() => handleToggleLike(comment.commentId, 'LIKE')}
                                                            className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
                                                        >
                                                            <ThumbsUp size={14} />
                                                            {comment.likeCount || 0}
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleLike(comment.commentId, 'DISLIKE')}
                                                            className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
                                                        >
                                                            <ThumbsDown size={14} />
                                                            {comment.dislikeCount || 0}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 검색 */}
                            {rightSidebarTab === 'search' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold">책 내 검색</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="검색어 입력..."
                                            className="flex-1 px-3 py-2 rounded-lg border text-sm"
                                            style={{
                                                backgroundColor: theme.name === 'dark' ? '#2A2A2A' : '#FFF',
                                                borderColor: theme.name === 'dark' ? '#444' : '#DDD',
                                                color: theme.text
                                            }}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs opacity-60">{searchResults.length}개 결과</p>
                                            {searchResults.map((result, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSearchResultClick(result)}
                                                    className="w-full text-left p-2 rounded-lg hover:bg-black/5 text-sm"
                                                >
                                                    <div className="text-xs opacity-50 mb-1">
                                                        {result.pageNumber}페이지
                                                    </div>
                                                    <div className="text-sm">{result.text}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
