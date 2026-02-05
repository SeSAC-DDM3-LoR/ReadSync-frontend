import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Settings, Search, List,
    Sparkles, X, Send, Highlighter, StickyNote,
    Moon, Sun, Minus, Plus, Loader2, ThumbsUp, ThumbsDown, AlertCircle, Trash2
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
// 독서 이벤트 및 북마크 서비스
import {
    readingPulseService,
    getBookmarkByLibraryAndChapter,
    getBookmarksByLibrary,
    type ReadingPulseRequest
} from '../services/libraryService';
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

    // [New] 북마크 정보 가져오기 (챕터별 진행률 표시용) (상태 선언은 컴포넌트 최상단)
    // 값 타입을 Bookmark 객체 자체로 변경 (readMask 활용)
    const [chapterBookmarkMap, setChapterBookmarkMap] = useState<Map<number, any>>(new Map());

    // 텍스트 선택
    const [textSelection, setTextSelection] = useState<TextSelection | null>(null);

    // [New] 라이브러리/북마크 정보 Fetch
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!libraryId) return;
            try {
                const bookmarks = await getBookmarksByLibrary(parseInt(libraryId));
                // Map<chapterId, Bookmark>
                const bookmarkMap = new Map<number, any>();
                bookmarks.forEach(b => {
                    bookmarkMap.set(b.chapterId, b);
                });

                // [Optimistic UI] 이전 페이지 등에서 넘겨준 최신 상태가 있으면 덮어쓰기
                // (백엔드 반영 지연 시에도 즉시 UI 업데이트 보장)
                const loc = location as any;
                if (loc.state?.optimisticBookmark) {
                    const opt = loc.state.optimisticBookmark;
                    // 현재 라이브러리의 북마크인지 확인
                    if (opt.libraryId === parseInt(libraryId)) {
                        bookmarkMap.set(opt.chapterId, opt);
                        // Ref에도 최신화
                        optimisticUpdatesRef.current.set(opt.chapterId, opt);
                    }
                }

                // [Ref Persistence] Ref에 저장된 optimistic 데이터가 있으면 무조건 덮어쓰기
                // (서버 데이터보다 우리가 방금 계산한 게 더 최신일 확률 100%)
                optimisticUpdatesRef.current.forEach((val, key) => {
                    if (val.libraryId === parseInt(libraryId)) {
                        bookmarkMap.set(key, val);
                    }
                });

                setChapterBookmarkMap(bookmarkMap);
            } catch (err) {
                console.error("Failed to fetch bookmarks:", err);
            }
        };
        fetchBookmarks();
    }, [libraryId, chapterId, location]); // location.state 변경 시에도 실행

    // [New] 나가기 핸들러 (Optimistic UI)
    const handleExit = async () => {
        if (!libraryId || !chapterId) {
            navigate('/library');
            return;
        }

        // 마지막 상태 캡처
        const currentProgress = Math.round(((currentPage + 1) / totalPages) * 100) || 0;

        // 비동기 펄스 전송 (기다리지 않거나 짧게만 기다림)
        sendReadingPulse();

        navigate('/library', {
            state: {
                updatedLibraryId: parseInt(libraryId),
                updatedProgress: currentProgress,
                lastReadChapterId: parseInt(chapterId),
                timestamp: Date.now()
            }
        });
    };

    // 댓글
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isCommentLoading, setIsCommentLoading] = useState(false);
    // 스포일러 댓글 공개 상태 관리 (Map<commentId, isRevealed>)
    const [spoilerRevealedMap, setSpoilerRevealedMap] = useState<Map<number, boolean>>(new Map());

    // 독서 이벤트 추적 (Reading Pulse)
    const readStartTimeRef = useRef<number>(Date.now());
    const readParagraphsRef = useRef<Set<number>>(new Set());
    const pulseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentPageRef = useRef<number>(0);  // 현재 페이지를 ref로 추적하여 의존성 문제 해결
    const pagesRef = useRef<PageContent[]>([]);  // pages를 ref로 추적하여 callback 의존성 안정화
    const lastLeftPageFirstParagraphRef = useRef<number>(0);  // 왼쪽 페이지 첫 문단 추적 (fallback용)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // [New] 디바운스 타이머 Refs

    // 마지막 읽은 위치 복원
    const [initialPosition, setInitialPosition] = useState<number | null>(null);
    const initialPositionApplied = useRef<boolean>(false);

    // AI 채팅: 출처 문단 클릭 핸들러
    const handleNavigateToParagraph = useCallback((paragraphId: string) => {
        if (!pages || pages.length === 0) return;

        // 해당 문단이 포함된 페이지 찾기
        const targetPageIndex = pages.findIndex(page =>
            page.items.some(item => item.originalId === paragraphId || item.id === paragraphId)
        );

        if (targetPageIndex !== -1) {
            setCurrentPage(targetPageIndex);
            // 모바일 등에서 사이드바 닫기 (선택 사항)
            // setShowRightSidebar(false); 
            console.log(`Navigated to page ${targetPageIndex + 1} for paragraph ${paragraphId}`);
        } else {
            console.warn(`Paragraph ${paragraphId} not found in pages.`);
        }
    }, [pages]);

    // AI 메시지 전송
    const handleAiSend = async () => {
        if (!aiInput.trim()) return;

        let currentRoom: ChatRoomResponse | null | undefined = chatRoom;

        // 채팅방이 없으면 생성 시도
        if (!currentRoom) {
            const newRoom = await initChatRoom();
            if (newRoom) {
                currentRoom = newRoom;
            } else {
                console.error("채팅방 생성 실패: 초기화 불가");
                alert("채팅방을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.");
                return;
            }
        }

        // 방어 코드: 여전히 방이 없거나 ID가 없으면 중단
        if (!currentRoom || !currentRoom.roomId) {
            console.error("채팅방 정보 누락");
            return;
        }

        const userMsg = aiInput;
        setAiInput(''); // 입력창 초기화
        setIsAiLoading(true);

        // UI에 즉시 표시
        const tempUserChat: ChatMessage = {
            id: Date.now(), // 임시 ID
            role: 'user',
            content: userMsg,
            timestamp: new Date().toISOString()
        };
        setAiMessages(prev => [...prev, tempUserChat]);

        try {
            // 현재 페이지의 대표 문단 ID 추출 (첫 번째 문단의 원본 ID)
            let currentParagraphId = undefined;
            if (pages && pages[currentPage] && pages[currentPage].items.length > 0) {
                currentParagraphId = pages[currentPage].items[0].originalId;
            }

            // 수정된 로직: currentRoom.roomId 사용 (chatRoom 상태 대신)
            const response = await aiChatService.sendMessage(currentRoom.roomId, {
                userMessage: userMsg, // userMsg 변수명 일치
                currentParagraphId
            });

            // AI 응답 추가
            const aiChat: ChatMessage = {
                id: response.chatId,
                role: 'ai',
                content: response.aiMessage, // aiMessage 변수명 일치
                timestamp: response.createdAt,
                relatedParagraphId: (response as any).relatedParagraphId
            };

            setAiMessages(prev => [...prev, aiChat]);

        } catch (error) {
            console.error('메시지 전송 실패:', error);
            setAiMessages(prev => [...prev, {
                role: 'ai', // role 필드 필수
                content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                timestamp: new Date().toISOString() // timestamp 추가
            }]);
        } finally {
            setIsAiLoading(false);
        }
    };

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

    // ==================== Reading Pulse & Position Restoration ====================

    // currentPageRef를 최신 값으로 유지
    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    // pagesRef를 최신 값으로 유지 (callback 의존성 안정화)
    useEffect(() => {
        pagesRef.current = pages;
    }, [pages]);

    // 현재 페이지에서 문단 인덱스 추출 헬퍼 함수 (ref 사용하여 의존성 최소화)
    // 항상 "왼쪽 페이지 첫 문단"을 반환 (일관성 유지)
    const getCurrentParagraphIndex = useCallback((): number => {
        const page = currentPageRef.current;
        const currentPages = pagesRef.current;


        // 유효성 검사: pages가 비어있으면 마지막으로 추적된 왼쪽 첫 문단 사용
        if (!currentPages[page]?.items?.length) {

            return lastLeftPageFirstParagraphRef.current || 0; // 0 = 무효 (저장하지 않음)
        }

        const firstItem = currentPages[page].items[0];


        const match = firstItem.originalId?.match(/p_(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }, []);  // 의존성 없음 - ref를 통해 최신 값 접근

    // 현재 페이지의 문단들 추적 + 왼쪽 첫 문단 저장
    useEffect(() => {
        if (pages[currentPage]) {
            // 왼쪽 페이지 첫 문단 추적 (fallback 용)
            const firstItem = pages[currentPage].items[0];
            if (firstItem?.originalId) {
                const match = firstItem.originalId.match(/p_(\d+)/);
                if (match) {
                    lastLeftPageFirstParagraphRef.current = parseInt(match[1]);
                }
            }

            // 읽은 문단 추적
            pages[currentPage].items.forEach(item => {
                const match = item.originalId?.match(/p_(\d+)/);
                if (match) {
                    readParagraphsRef.current.add(parseInt(match[1]));
                }
            });
        }
        // 우측 페이지도 추적
        if (pages[currentPage + 1]) {
            pages[currentPage + 1].items.forEach(item => {
                const match = item.originalId?.match(/p_(\d+)/);
                if (match) {
                    readParagraphsRef.current.add(parseInt(match[1]));
                }
            });
        }
    }, [currentPage, pages]);

    // 독서 펄스 전송 함수 (의존성 최소화하여 interval 재생성 방지)
    const sendReadingPulse = useCallback(async (isForce: boolean = false) => {
        if (!libraryId || !chapterId) return;

        // [New] 강제 전송 시 예비된 디바운스 타이머 취소 (중복 전송 방지)
        if (isForce && debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        const now = Date.now();
        const readTimeSeconds = Math.floor((now - readStartTimeRef.current) / 1000);
        const allParagraphs = Array.from(readParagraphsRef.current);

        // 실제 콘텐츠에서 최대 문단 번호 계산 (bookContentData.paragraphs가 부정확할 수 있음)
        // 우선순위: 1. bookContentData의 paragraphs 2. 현재 페이지 문단 파싱값 3. 넉넉한 기본값(99999)
        const contentMax = bookContentData?.paragraphs;

        const parsedMax = pagesRef.current.reduce((max, page) => {
            page.items.forEach(item => {
                const match = item.originalId?.match(/p_(\d+)/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > max) max = num;
                }
            });
            return max;
        }, 0);

        const limit = contentMax || (parsedMax > 0 ? parsedMax : 99999);

        // 유효한 범위(1 ~ limit) 내의 문단만 필터링
        const paragraphs = allParagraphs.filter(p => p >= 1 && p <= limit);

        const lastReadPos = getCurrentParagraphIndex();

        // [비상 대책] 읽은 문단 목록이 비어있다면, 현재 보고 있는 문단이라도 추가
        // (타이밍 문제나 데이터 로딩 지연 등으로 문단 수집이 누락되는 경우 방지)
        if (paragraphs.length === 0 && lastReadPos > 0) {
            // 중복 방지를 위해 확인 후 추가 (어차피 빈 배열이지만)
            if (!paragraphs.includes(lastReadPos)) {
                paragraphs.push(lastReadPos);
            }
        }

        // 강제 전송이 아니고, 읽은 시간이 3초 미만이며 문단도 없으면 스킵
        if (!isForce && readTimeSeconds < 3 && paragraphs.length === 0) return;

        // 유효하지 않은 위치(0)면 펄스 전송 스킵 (데이터 손상 방지)
        if (lastReadPos === 0) {
            return;
        }

        const request: ReadingPulseRequest = {
            libraryId: parseInt(libraryId),
            chapterId: parseInt(chapterId),
            lastReadPos,
            readParagraphIndices: paragraphs,
            readTime: readTimeSeconds
        };

        try {
            await readingPulseService.sendPulse(request);
        } catch (error) {
            console.error('독서 펄스 전송 실패:', error);
        }

        // 리셋
        readStartTimeRef.current = now;
        // [Fix] 펄스 전송 후에도 세션 기록(Green Bar) 유지 (화면 깜빡임 방지)
        // 챕터가 바뀔 때만(useEffect) clear() 하도록 수정
        // readParagraphsRef.current.clear(); -> 삭제됨
    }, [libraryId, chapterId, getCurrentParagraphIndex]);  // pages 의존성 제거 - pagesRef 사용으로 불필요

    // sendReadingPulse의 최신 버전을 ref로 유지 (interval에서 사용)
    const sendReadingPulseRef = useRef(sendReadingPulse);
    useEffect(() => {
        sendReadingPulseRef.current = sendReadingPulse;
    }, [sendReadingPulse]);

    // [New] 디바운스 펄스 전송 (빠른 페이지 넘김 시 API 과부하 방지)
    const debouncedSendPulse = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            sendReadingPulseRef.current();
            debounceTimerRef.current = null;
        }, 2000); // 2초 대기
    }, []);

    // 5분 간격 자동 펄스 전송 (챕터가 바뀔 때만 interval 재생성)
    useEffect(() => {
        if (!libraryId || !chapterId) return;

        // 시작 시간 초기화 (챕터 진입 시에만)
        readStartTimeRef.current = Date.now();
        readParagraphsRef.current.clear();

        // 5분(300초) 간격으로 펄스 전송
        pulseIntervalRef.current = setInterval(() => {
            sendReadingPulseRef.current();  // ref를 통해 최신 함수 호출
        }, 5 * 60 * 1000);

        return () => {
            if (pulseIntervalRef.current) {
                clearInterval(pulseIntervalRef.current);
            }
        };
    }, [libraryId, chapterId]);  // sendReadingPulse 의존성 제거하여 interval 재생성 방지

    // 페이지 이탈 시 펄스 전송
    // Strict Mode 대응을 위한 cleanup timeout ref
    const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // 마운트 시 이전 cleanup timeout 취소 (Strict Mode 재마운트 케이스)
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = null;
        }

        const handleBeforeUnload = () => {
            if (!libraryId || !chapterId) return;

            const now = Date.now();
            const readTimeSeconds = Math.floor((now - readStartTimeRef.current) / 1000);

            if (readTimeSeconds < 5 && readParagraphsRef.current.size === 0) return;

            const lastReadPos = getCurrentParagraphIndex();

            // 유효하지 않은 위치(0)면 전송 스킵 (데이터 손상 방지)
            if (lastReadPos === 0) return;

            const request: ReadingPulseRequest = {
                libraryId: parseInt(libraryId),
                chapterId: parseInt(chapterId),
                lastReadPos,
                readParagraphIndices: Array.from(readParagraphsRef.current),
                readTime: readTimeSeconds
            };

            // localStorage에서 토큰 가져오기
            const token = localStorage.getItem('accessToken');
            readingPulseService.sendPulseOnUnload(request, token);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // React Strict Mode에서 두 번 실행되는 것을 방지
            // setTimeout으로 감싸서 Strict Mode 재마운트와 실제 언마운트 구분
            // 재마운트 시 위의 clearTimeout으로 취소됨

            // ⚠️ 중요: cleanup 시점에 현재 위치를 캡처! (100ms 후에는 새 챕터 데이터로 덮어쓰여짐)
            const capturedLastReadPos = getCurrentParagraphIndex();
            const capturedParagraphs = Array.from(readParagraphsRef.current);
            const capturedReadTime = Math.floor((Date.now() - readStartTimeRef.current) / 1000);

            cleanupTimeoutRef.current = setTimeout(async () => {
                // 캡처된 값이 유효한 경우에만 전송
                if (capturedLastReadPos > 0 && libraryId && chapterId) {
                    try {
                        await readingPulseService.sendPulse({
                            libraryId: parseInt(libraryId),
                            chapterId: parseInt(chapterId),
                            lastReadPos: capturedLastReadPos,
                            readParagraphIndices: capturedParagraphs,
                            readTime: capturedReadTime
                        });
                    } catch (error) {
                        console.error('[cleanup] 펄스 전송 실패:', error);
                    }
                }
            }, 100);
        };
    }, [libraryId, chapterId, getCurrentParagraphIndex]);  // sendReadingPulse 의존성 제거

    // 마지막 읽은 위치 로드
    useEffect(() => {
        const loadLastPosition = async () => {
            if (!libraryId || !chapterId) return;

            // 챕터 변경 시 리셋
            initialPositionApplied.current = false;
            setInitialPosition(null);

            try {
                const bookmark = await getBookmarkByLibraryAndChapter(
                    parseInt(libraryId),
                    parseInt(chapterId)
                );


                if (bookmark?.lastReadPos) {
                    setInitialPosition(bookmark.lastReadPos);
                }
            } catch (error) {
                console.error('북마크 조회 실패:', error);
            }
        };

        loadLastPosition();
    }, [libraryId, chapterId]);

    // 마지막 읽은 위치로 이동
    useEffect(() => {
        // isLoading이 false일 때만 시도 (현재 챕터의 페이지가 완전히 로드됨)
        if (initialPosition && pages.length > 0 && !isLoading && !initialPositionApplied.current) {
            // 디버그: 현재 페이지들의 문단 범위 확인
            const allParagraphIds = new Set<number>();
            pages.forEach(page => {
                page.items.forEach(item => {
                    const match = item.originalId?.match(/p_(\d+)/);
                    if (match) allParagraphIds.add(parseInt(match[1]));
                });
            });
            const sortedIds = Array.from(allParagraphIds).sort((a, b) => a - b);
            const minId = sortedIds[0] || 0;
            const maxId = sortedIds[sortedIds.length - 1] || 0;


            // 해당 문단이 포함된 모든 페이지 찾기 (분할된 문단 고려)
            const matchingPages: number[] = [];
            pages.forEach((page, pageIndex) => {
                const hasTarget = page.items.some(item => {
                    const match = item.originalId?.match(/p_(\d+)/);
                    return match && parseInt(match[1]) === initialPosition;
                });
                if (hasTarget) {
                    matchingPages.push(pageIndex);
                }
            });

            if (matchingPages.length > 0) {
                // 마지막 매칭 페이지 사용 (문단이 분할된 경우 읽던 위치에 더 가까움)
                const targetPageIndex = matchingPages[matchingPages.length - 1];
                // 짝수 페이지로 맞추기 (2페이지씩 보여주므로)
                const finalPage = targetPageIndex % 2 === 0 ? targetPageIndex : Math.max(0, targetPageIndex - 1);
                setCurrentPage(finalPage);
                initialPositionApplied.current = true;
            } else if (initialPosition >= minId && initialPosition <= maxId) {
                // 범위 내인데 못 찾음 - 데이터 불일치
                initialPositionApplied.current = true;
            } else if (initialPosition > maxId) {
                // 범위 초과 - 마지막 페이지로 이동
                const lastPage = pages.length - 1;
                const finalPage = lastPage % 2 === 0 ? lastPage : Math.max(0, lastPage - 1);
                setCurrentPage(finalPage);
                initialPositionApplied.current = true;
            }
            // else: 아직 페이지 로딩 중일 수 있음 - 다음 렌더에서 재시도
        }
    }, [initialPosition, pages, isLoading]);

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

    const initChatRoom = async (): Promise<ChatRoomResponse | null> => {
        if (!chapterId) return null;

        // 이미 방이 있으면 반환
        if (chatRoom) return chatRoom;

        try {
            const room = await aiChatService.createChatRoom({
                chapterId: parseInt(chapterId),
                title: chapter?.chapterName || `챕터 ${chapterId} 채팅`,
            });
            setChatRoom(room);

            // 채팅 기록 로드
            const history = await aiChatService.getChatHistory(room.roomId);
            setAiMessages(convertToUIMessages(history));

            return room;
        } catch (error) {
            console.error('채팅방 초기화 실패:', error);
            return null;
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
        // [Fix] 페이지 이동 시 현재 페이지의 문단들을 세션 기록에 '즉시' 반영 (Green Bar Lag 해결)
        // useEffect보다 먼저 실행되어, 다음 페이지 렌더링 시점에 이미 '읽음'으로 처리됨
        if (pages[currentPage]) {
            pages[currentPage].items.forEach(item => {
                const match = item.originalId?.match(/p_(\d+)/);
                if (match) {
                    readParagraphsRef.current.add(parseInt(match[1]));
                }
            });
            // [Fix] 페이지 넘길 때마다 진행률 저장 시도 (사용자 요청: "Apply progress")
            // [Debounce] 빠른 페이지 넘김 시 API 스팸 방지를 위해 디바운스 적용
            debouncedSendPulse();
        }

        if (currentPage + 2 < totalPages) {
            setCurrentPage(prev => prev + 2);
        } else if (currentPage + 1 < totalPages) {
            setCurrentPage(totalPages - 1);
        }
    }, [currentPage, totalPages, pages, sendReadingPulse]);

    const goToPreviousPage = useCallback(() => {
        // 이전 페이지로 갈 때도 현재 페이지 읽음 처리
        if (pages[currentPage]) {
            pages[currentPage].items.forEach(item => {
                const match = item.originalId?.match(/p_(\d+)/);
                if (match) {
                    readParagraphsRef.current.add(parseInt(match[1]));
                }
            });
            debouncedSendPulse();
        }

        if (currentPage >= 2) {
            setCurrentPage(prev => prev - 2);
        } else {
            setCurrentPage(0);
        }
    }, [currentPage, pages, sendReadingPulse]);

    const goToPage = (pageNum: number) => {
        const targetPage = Math.max(0, Math.min(pageNum - 1, totalPages - 1));
        // 짝수 페이지로 맞추기 (2페이지씩 보여주므로)
        setCurrentPage(targetPage % 2 === 0 ? targetPage : targetPage - 1);
    };

    // [New] Optimistic Updates 보관용 Ref (서버 데이터가 잠시 stale 해도 이걸로 덮어씌움)
    const optimisticUpdatesRef = useRef<Map<number, any>>(new Map());

    const goToChapter = async (newChapterId: number) => {
        // [Optimistic UI] 현재 챕터 정보 계산
        let optimisticBookmark = null;
        if (chapterId && chapterBookmarkMap) {
            const cid = parseInt(chapterId);
            const baseBookmark = chapterBookmarkMap.get(cid);
            const currentReadIndices = Array.from(readParagraphsRef.current);
            const totalParagraphs = bookContentData?.paragraphs || 1;

            // 1. 기존 마스크 가져오기 (Base64 -> Binary String)
            let baseMask = "";
            if (baseBookmark?.readMask) {
                try {
                    baseMask = atob(baseBookmark.readMask);
                } catch (e) { baseMask = ""; }
            }
            // 마스크 길이가 부족하면 0으로 채움
            if (baseMask.length < totalParagraphs) {
                baseMask = baseMask + "0".repeat(totalParagraphs - baseMask.length);
            }

            // 2. 새 마스크 생성 (기존 + 신규)
            const newMaskChars = baseMask.split('');
            currentReadIndices.forEach(idx => {
                if (idx >= 1 && idx <= newMaskChars.length) {
                    newMaskChars[idx - 1] = '1';
                }
            });
            const updatedMaskString = newMaskChars.join('');

            // 3. 진행률 계산
            const readCount = updatedMaskString.split('').filter(c => c === '1').length;
            const updatedProgress = (readCount / totalParagraphs) * 100;

            // 4. Optimistic Bookmark 객체 생성
            optimisticBookmark = {
                ...baseBookmark,
                chapterId: cid,
                progress: updatedProgress,
                // 백엔드 포맷(Base64)으로 다시 인코딩하여 저장
                readMask: btoa(updatedMaskString),
                libraryId: parseInt(libraryId || "0")
            };

            // [핵심] Ref에 저장하여 이후 fetchBookmarks에서도 살아남게 함
            optimisticUpdatesRef.current.set(cid, optimisticBookmark);
        }

        // 현재 챕터에서 나가기 전에 펄스 전송 (강제 전송)
        await sendReadingPulse(true);

        navigate(`/reader/${libraryId}/${newChapterId}`, {
            state: {
                optimisticBookmark
            }
        });

        // 챕터 이동 시 스크롤 최상단으로 (ReaderPage에서 처리하겠지만 명시적으로)
        window.scrollTo(0, 0);
        setCurrentPage(0);
        setShowRightSidebar(false);

        // 초기화
        setTextSelection(null);
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



    // ==================== Comments ====================

    const handleAddComment = async () => {
        if (!newComment.trim() || !chapterId) return;

        try {
            const createdComment = await commentService.createComment(parseInt(chapterId), {
                content: newComment,
                isSpoiler,
            });
            // Optimistic UI: 댓글을 즉시 목록에 추가
            setComments(prev => [...prev, createdComment]);
            setNewComment('');
            setIsSpoiler(false);
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
            // 에러 발생 시 목록 새로고침으로 동기화
            if (chapterId) {
                loadComments(parseInt(chapterId));
            }
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('댓글을 삭제하시겠습니까?')) return;

        try {
            await commentService.deleteComment(commentId);
            // 댓글 목록에서 제거
            setComments(prev => prev.filter(c => c.commentId !== commentId));
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
            alert('댓글 삭제에 실패했습니다.');
        }
    };

    const toggleSpoilerReveal = (commentId: number) => {
        setSpoilerRevealedMap(prev => {
            const newMap = new Map(prev);
            newMap.set(commentId, !newMap.get(commentId));
            return newMap;
        });
    };

    const handleToggleLike = async (commentId: number, likeType: LikeType) => {
        try {
            const response = await likeService.toggleCommentLike(commentId, likeType);
            // 댓글 목록에서 해당 댓글의 카운트만 업데이트
            setComments(prev => prev.map(comment =>
                comment.commentId === commentId
                    ? { ...comment, likeCount: response.likeCount, dislikeCount: response.dislikeCount }
                    : comment
            ));
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
                            <button
                                onClick={handleExit}
                                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                style={{ color: theme.text }}
                            >
                                <ChevronLeft size={20} />
                                <span>서재로</span>
                            </button>

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
                                                    key={msg.id || idx}
                                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                                >
                                                    <div
                                                        className={`p-3 rounded-lg text-sm max-w-[90%] ${msg.role === 'user'
                                                            ? 'bg-emerald-500 text-white rounded-br-none'
                                                            : (theme.name === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800') + ' rounded-bl-none'
                                                            }`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                    {/* 출처 표시 */}
                                                    {msg.relatedParagraphId && (
                                                        <button
                                                            onClick={() => handleNavigateToParagraph(msg.relatedParagraphId!)}
                                                            className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1 self-start ml-1"
                                                        >
                                                            <span>📄</span>
                                                            관련 문단으로 이동
                                                        </button>
                                                    )}
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
                                    {/* (Update chapters.map logic) */}
                                    {chapters.map(ch => {
                                        // 1. 현재 챕터 여부
                                        const isCurrent = ch.chapterId === chapter?.chapterId;
                                        // 2. 저장된 북마크 정보
                                        const bookmark = chapterBookmarkMap.get(ch.chapterId);
                                        const readMaskBase64 = bookmark?.readMask || "";
                                        let readMask = "";

                                        // Base64 디코딩 (백엔드에서 byte[]로 보냄)
                                        if (readMaskBase64) {
                                            try {
                                                readMask = atob(readMaskBase64);
                                            } catch (e) {
                                                console.error("Base64 decode failed:", e);
                                                readMask = "";
                                            }
                                        }

                                        // [New] 현재 읽고 있는 위치(문단) 식별 (Left & Right Spread)
                                        const currentParagraphSet = new Set<number>();
                                        const leftParagraphs: number[] = [];
                                        const rightParagraphs: number[] = [];

                                        // 1. Left Page
                                        if (isCurrent && pages[currentPage]) {
                                            pages[currentPage].items.forEach(item => {
                                                const match = item.originalId?.match(/p_(\d+)/);
                                                if (match) {
                                                    const pId = parseInt(match[1]);
                                                    currentParagraphSet.add(pId);
                                                    leftParagraphs.push(pId);
                                                }
                                            });
                                        }

                                        // 2. Right Page (펼침면이므로 오른쪽 페이지도 '읽음'에 포함)
                                        if (isCurrent && currentPage + 1 < pages.length && pages[currentPage + 1]) {
                                            pages[currentPage + 1].items.forEach(item => {
                                                const match = item.originalId?.match(/p_(\d+)/);
                                                if (match) {
                                                    const pId = parseInt(match[1]);
                                                    currentParagraphSet.add(pId);
                                                    rightParagraphs.push(pId);
                                                }
                                            });
                                        }

                                        // 마스크 파싱 (길이가 없으면 0으로 채움)
                                        // [Fix] chapter.paragraphs가 부정확할 경우를 대비하여, 현재 읽은 위치(maxCurrentP)나 마스크 길이 중 가장 큰 값을 사용
                                        const maxCurrentP = isCurrent
                                            ? Math.max(0, ...Array.from(readParagraphsRef.current), ...Array.from(currentParagraphSet))
                                            : 0;
                                        const totalSegments = Math.max(ch.paragraphs || 0, readMask.length, maxCurrentP, 1);

                                        // 마스크가 없는 경우(읽은 적 없음) '0'으로 채워진 문자열 생성
                                        const maskString = readMask.length >= totalSegments
                                            ? readMask
                                            : readMask + "0".repeat(Math.max(0, totalSegments - readMask.length));

                                        // 시각화용 세그먼트 배열 생성
                                        const segments = Array.from({ length: totalSegments }, (_, i) => maskString[i] === '1');

                                        // [New] 실시간 진행률 계산
                                        // segments: 기존 북마크의 읽음 상태 (boolean[])
                                        // readParagraphsRef: 이번 세션에서 읽은 문단들
                                        // currentParagraphSet: 지금 보고 있는 페이지의 문단들
                                        let sessionReadCount = 0;
                                        if (isCurrent) {
                                            // 현재 챕터라면, 기존 마스크 + 세션 기록 + 현재 페이지 모두 합산
                                            sessionReadCount = Array.from({ length: totalSegments }).filter((_, i) => {
                                                const pNum = i + 1;
                                                const isBookmarkRead = segments[i]; // 기존 북마크
                                                const isSessionRead = readParagraphsRef.current.has(pNum); // 이번 세션
                                                const isNowReading = currentParagraphSet.has(pNum); // 현재 페이지
                                                return isBookmarkRead || isSessionRead || isNowReading;
                                            }).length;
                                        } else {
                                            // 다른 챕터는 기존 북마크 기준
                                            sessionReadCount = segments.filter(Boolean).length;
                                        }

                                        const dynamicProgress = totalSegments > 0 ? (sessionReadCount / totalSegments) * 100 : 0;

                                        // [New] 커서 위치 결정 (사용자 요청: 오른쪽 페이지 우선, 없으면 왼쪽 페이지)
                                        // -> 펼쳐진 면의 '가장 마지막 문단'을 가리키는 것이 직관적임
                                        let cursorPositionPercent = -1;
                                        if (isCurrent && currentParagraphSet.size > 0) {
                                            let targetP = 0;
                                            if (rightParagraphs.length > 0) {
                                                targetP = Math.max(...rightParagraphs);
                                            } else if (leftParagraphs.length > 0) {
                                                targetP = Math.max(...leftParagraphs);
                                            } else {
                                                targetP = Math.max(...Array.from(currentParagraphSet));
                                            }

                                            if (targetP >= 1 && totalSegments > 0) {
                                                // [Fix] 커서 위치를 문단의 '끝'으로 조정
                                                cursorPositionPercent = (targetP / totalSegments) * 100;
                                            }
                                        }

                                        return (
                                            <button
                                                key={ch.chapterId}
                                                onClick={() => goToChapter(ch.chapterId)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${isCurrent
                                                    ? 'bg-emerald-500/10'
                                                    : 'hover:bg-black/5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-medium ${isCurrent ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                        {ch.chapterName}
                                                    </span>
                                                    {/* 퍼센트 항상 표시 (실시간 반영) */}
                                                    <span className="text-xs opacity-50 font-mono">
                                                        {Math.round(dynamicProgress)}%
                                                    </span>
                                                </div>

                                                {/* 진행바 항상 표시 (ReadMask 바코드 스타일) */}
                                                <div className="w-full h-2 bg-gray-100 rounded-sm overflow-hidden flex relative">
                                                    {/* 현재 위치 커서 (노란색, 고정 크기) */}
                                                    {cursorPositionPercent >= 0 && (
                                                        <div
                                                            className="absolute top-0 bottom-0 bg-amber-400 z-10 shadow-[0_0_2px_rgba(0,0,0,0.3)]"
                                                            style={{
                                                                left: `${cursorPositionPercent}%`,
                                                                width: '4px', // 고정 크기
                                                                transform: 'translateX(-50%)' // 중앙 정렬
                                                            }}
                                                        />
                                                    )}

                                                    {segments.map((isReadFromBookmark, idx) => {
                                                        // idx는 0부터 시작하므로 문단 번호는 idx + 1
                                                        const pNum = idx + 1;

                                                        // 1. 현재 화면에 보고 있더라도 바코드 색상은 변경하지 않음 (커서로 대체) -> [Fix] 초록색(읽음)으로 즉시 반영
                                                        const isReadingNow = currentParagraphSet.has(pNum);

                                                        // 2. 이번 세션에서 읽은 문단 (차선: 초록색)
                                                        // Ref에 저장된 기록 확인 (isCurrent일 때만 유효)
                                                        const isReadInSession = isCurrent && readParagraphsRef.current.has(pNum);

                                                        // 3. 기존 북마크에서 읽음 처리된 문단 (기본: 초록색)
                                                        // [Fix] 현재 보고 있는 문단도 '읽음(Green)'에 포함시켜 퍼센트와 시각적 바를 일치시킴 (Zero Latency)
                                                        const isRead = isReadFromBookmark || isReadInSession || isReadingNow;

                                                        const bgColor = isRead ? 'bg-emerald-400' : 'bg-transparent';

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`flex-1 ${bgColor}`}
                                                            // minWidth 삭제로 전체 너비에 맞춤
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </button>
                                        );
                                    })}
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
                                            {comments.map(comment => {
                                                const isRevealed = spoilerRevealedMap.get(comment.commentId) || false;
                                                const currentUser = useAuthStore.getState().user;
                                                const isMyComment = currentUser && comment.userId === currentUser.id;

                                                return (
                                                    <div
                                                        key={comment.commentId}
                                                        className="p-3 rounded-lg"
                                                        style={{
                                                            backgroundColor: theme.name === 'dark' ? '#2A2A2A' : '#F5F5F5'
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium">{comment.nickname}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs opacity-50">
                                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                                </span>
                                                                {isMyComment && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(comment.commentId)}
                                                                        className="p-1 hover:bg-red-500/10 rounded transition-colors"
                                                                        title="댓글 삭제"
                                                                    >
                                                                        <Trash2 size={14} className="text-red-500" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {comment.isSpoiler && !isRevealed ? (
                                                            <button
                                                                onClick={() => toggleSpoilerReveal(comment.commentId)}
                                                                className="text-sm text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                                            >
                                                                ⚠️ 해당 댓글은 스포일러성 내용이 포함되어 있습니다. 보시려면 클릭해 주세요.
                                                            </button>
                                                        ) : (
                                                            <div>
                                                                {comment.isSpoiler && (
                                                                    <button
                                                                        onClick={() => toggleSpoilerReveal(comment.commentId)}
                                                                        className="text-xs text-red-500 mb-1 hover:underline cursor-pointer"
                                                                    >
                                                                        [스포일러] 숨기기
                                                                    </button>
                                                                )}
                                                                <p className="text-sm">{comment.content}</p>
                                                            </div>
                                                        )}
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
                                                );
                                            })}
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
