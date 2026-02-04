import api from './api';
import type { PageResponse } from './bookService';

// ==================== Types ====================

export interface Library {
    libraryId: number;
    userId: number;
    bookId: number;
    bookTitle: string;
    coverUrl?: string; // 책 표지 URL (선택적)
    ownershipType: 'OWNED' | 'RENTED';
    totalProgress: number; // BigDecimal은 number로 변환됨
    readingStatus: 'BEFORE_READING' | 'READING' | 'COMPLETED';
    expiresAt: string | null;
    createdAt: string;
    // 추가: 마지막으로 읽은 챕터 ID (읽기 이어가기용)
    lastReadChapterId?: number;
}

export interface LibraryRequest {
    bookId: number;
    ownershipType: 'OWNED' | 'RENTED';
    rentalDays?: number;
}

export interface Bookmark {
    bookmarkId: number;
    libraryId: number;
    chapterId: number;
    lastReadPos: number;
    progress: number;
    readMask: string; // '0' and '1' string
}

export interface BookmarkRequest {
    libraryId: number;
    chapterId: number;
    lastReadPos: number;
    readParagraphIndices?: number[];
}

// ==================== Library Service ====================

export const libraryService = {
    // 내 서재 조회
    getMyLibrary: async (page = 0, size = 12): Promise<PageResponse<Library>> => {
        const response = await api.get<PageResponse<Library>>('/v1/my-library/me', {
            params: { page, size, _t: Date.now() }, // 캐시 방지용 타임스탬프
        });
        return response.data;
    },

    // 타 유저 서재 조회
    getUserLibrary: async (userId: number, page = 0, size = 12): Promise<PageResponse<Library>> => {
        const response = await api.get<PageResponse<Library>>(`/v1/my-library/user/${userId}`, {
            params: { page, size },
        });
        return response.data;
    },

    // 서재에 도서 추가 (내 서재)
    addToLibrary: async (request: LibraryRequest): Promise<number> => {
        const response = await api.post<number>('/v1/my-library/me', request);
        return response.data;
    },

    // 서재에서 도서 삭제
    removeFromLibrary: async (libraryId: number): Promise<void> => {
        await api.delete(`/v1/my-library/${libraryId}`);
    },

    // 서재 단건 조회 (libraryId로)
    getLibraryById: async (libraryId: number): Promise<Library> => {
        const response = await api.get<Library>(`/v1/my-library/${libraryId}`);
        return response.data;
    },
};

// ==================== Bookmark Service ====================

export const bookmarkService = {
    // 내 북마크 목록
    getMyBookmarks: async (page = 0, size = 20): Promise<PageResponse<Bookmark>> => {
        const response = await api.get<PageResponse<Bookmark>>('/v1/bookmarks/me', {
            params: { page, size },
        });
        return response.data;
    },

    // 북마크 저장/수정
    saveBookmark: async (request: BookmarkRequest): Promise<number> => {
        const response = await api.post<number>('/v1/bookmarks', request);
        return response.data;
    },

    // 북마크 삭제
    deleteBookmark: async (bookmarkId: number): Promise<void> => {
        await api.delete(`/v1/bookmarks/${bookmarkId}`);
    },

    // 특정 라이브러리의 북마크 조회
    getBookmarkByLibrary: async (libraryId: number): Promise<Bookmark | null> => {
        try {
            const response = await api.get<Bookmark>(`/v1/bookmarks/library/${libraryId}`);
            return response.data;
        } catch {
            return null;
        }
    },
};

// ==================== BookLog Service (독서 기록) ====================

export interface BookLog {
    bookLogId: number;
    libraryId: number;
    readDate: string;  // 마지막 읽은 날짜
    readTime: number;  // 읽은 시간 (초 단위 - 프론트에서 분 단위로 변환 필요)
    readParagraph: number;  // 읽은 문단 수
}

export const bookLogService = {
    // 내 독서 기록 조회
    getMyBookLogs: async (): Promise<BookLog[]> => {
        const response = await api.get<BookLog[]>('/v1/book-logs/me');
        return response.data;
    },

    // 유저별 독서 기록 조회
    getUserBookLogs: async (userId: number): Promise<BookLog[]> => {
        const response = await api.get<BookLog[]>(`/v1/book-logs/user/${userId}`);
        return response.data;
    },
};

// ==================== Reading Pulse Service (독서 이벤트) ====================

export interface ReadingPulseRequest {
    libraryId: number;
    chapterId: number;
    lastReadPos: number;
    readParagraphIndices: number[];
    readTime: number;  // 초 단위
}

export const readingPulseService = {
    // 독서 펄스 전송 (5분 주기 또는 페이지 이탈 시)
    sendPulse: async (request: ReadingPulseRequest): Promise<void> => {
        await api.post('/v1/reading/pulse', request);
    },

    // 페이지 이탈 시 펄스 전송 (keepalive 사용)
    sendPulseOnUnload: (request: ReadingPulseRequest, authToken: string | null): void => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        // fetch with keepalive for page unload scenarios
        fetch('/api/v1/reading/pulse', {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
            keepalive: true,
        }).catch(() => {
            // 페이지 이탈 중이므로 에러 무시
        });
    },
};

// ==================== Enhanced Bookmark Functions ====================

// bookmarkService에 특정 라이브러리+챕터의 북마크 조회 함수 추가
// bookmarkService에 특정 라이브러리+챕터의 북마크 조회 함수 추가
export const getBookmarksByLibrary = async (
    libraryId: number
): Promise<Bookmark[]> => {
    try {
        const response = await api.get<PageResponse<Bookmark>>(`/v1/bookmarks/library/${libraryId}`, {
            params: { page: 0, size: 100, _t: Date.now() }
        });
        return response.data.content;
    } catch {
        return [];
    }
};

export const getBookmarkByLibraryAndChapter = async (
    libraryId: number,
    chapterId: number
): Promise<Bookmark | null> => {
    try {
        const bookmarks = await getBookmarksByLibrary(libraryId);
        // chapterId와 일치하는 북마크 찾기
        return bookmarks.find(b => b.chapterId === chapterId) || null;
    } catch {
        return null;
    }
};

export default libraryService;

