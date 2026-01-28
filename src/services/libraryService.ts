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
}

export interface BookmarkRequest {
    libraryId: number;
    chapterId: number;
    lastReadPos: number;
    readParagraphIndices?: number[];
}

export interface Chapter {
    chapterId: number;
    bookId: number;
    chapterName: string;
    sequence: number;
    bookContentPath: string;
    bookContent: any;
    paragraphs: number;
}

// ==================== Library Service ====================

export const libraryService = {
    // 내 서재 조회
    getMyLibrary: async (page = 0, size = 12): Promise<PageResponse<Library>> => {
        const response = await api.get<PageResponse<Library>>('/v1/my-library/me', {
            params: { page, size },
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
};

// ==================== Chapter Service ====================

export const chapterService = {
    // 책의 챕터 목록 조회
    getChaptersByBook: async (bookId: number): Promise<Chapter[]> => {
        const response = await api.get<Chapter[]>(`/v1/chapters/book/${bookId}`);
        return response.data;
    },

    // 챕터 상세 조회 (본문 포함)
    getChapter: async (chapterId: number): Promise<Chapter> => {
        const response = await api.get<Chapter>(`/v1/chapters/${chapterId}`);
        return response.data;
    },

    // 챕터 URL 조회 (본문 미포함)
    getChapterUrl: async (chapterId: number): Promise<Chapter> => {
        const response = await api.get<Chapter>(`/v1/chapters/${chapterId}/url`);
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
};

// ==================== BookLog Service (독서 기록) ====================

export interface BookLog {
    bookLogId: number;
    libraryId: number;
    readDate: string;  // 마지막 읽은 날짜
    readTime: number;  // 읽은 시간 (분)
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

export default libraryService;
