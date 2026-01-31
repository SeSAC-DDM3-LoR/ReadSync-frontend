import api from './api';
import type { PageResponse } from './bookService';

// ==================== Types ====================

export interface AdminUser {
    userId: number;
    loginId: string;
    nickname: string;
    tag: string;
    role: string;
    status: string;
    provider: string;
    createdAt: string;
}

export interface UserDetail {
    userId: number;
    nickname: string;
    tag: string;
    profileImage: string;
    role: string;
    status: string;
    levelId: number;
    experience: number;
    preferredGenre: string;
}

export interface Report {
    reportId: number;
    reporterId: number;
    reporterName: string;
    targetUserId: number;
    targetUserName: string;
    reason: string;
    reportedContent: string;
    status: 'PENDING' | 'PROCESSED' | 'REJECTED';
    createdAt: string;
}

export interface ContentReport {
    reportId: number;
    reporterId: number;
    targetType: 'CHAPTERS_COMMENT' | 'REVIEW';
    targetId: number;
    reasonType: string;
    processStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}

export interface Blacklist {
    blacklistId: number;
    userId: number;
    userLoginId: string;
    type: 'SITE_BAN' | 'COMMUNITY_BAN';
    reason: string;
    startDate: string;
    endDate: string;
    active: boolean;
}

export interface AdminBook {
    bookId: number;
    title: string;
    author: string;
    publisher: string;
    price: number;
    rentalPrice: number;
    coverUrl: string;
    description: string;
    categoryId: number;
    categoryName?: string;
    createdAt: string;
}

export interface BookRequest {
    title: string;
    author: string;
    publisher?: string;
    price: number;
    rentalPrice?: number;
    coverUrl?: string;
    description?: string;
    categoryId?: number;
    isAdultOnly?: boolean;
    viewPermission?: 'FREE' | 'PREMIUM';
    language?: string;
    publishedDate?: string;
}

export interface AdminChapter {
    chapterId: number;
    bookId: number;
    chapterName: string;
    sequence: number;
    bookContentPath: string;
    paragraphs: number;
}

export interface ChapterRequest {
    bookId: number;
    chapterName?: string;
    sequence?: number;
}

// ==================== Admin User Service ====================

export const adminUserService = {
    // 전체 회원 조회
    getAllUsers: async (page = 0, size = 20): Promise<PageResponse<AdminUser>> => {
        const response = await api.get<PageResponse<AdminUser>>('/v1/users/admin/list', {
            params: { page, size },
        });
        return response.data;
    },

    // 회원 상세 조회
    getUserDetail: async (userId: number): Promise<UserDetail> => {
        const response = await api.get<UserDetail>(`/v1/users/admin/${userId}/detail`);
        return response.data;
    },

    // 회원 상태 변경
    changeUserStatus: async (userId: number, status: 'ACTIVE' | 'BANNED' | 'WITHDRAWN'): Promise<string> => {
        const response = await api.patch<string>(`/v1/users/admin/${userId}/status`, null, {
            params: { status },
        });
        return response.data;
    },
};

// ==================== Admin Report Service ====================

export const adminReportService = {
    // 신고 목록 조회
    getReports: async (status?: string, page = 0, size = 20): Promise<PageResponse<Report>> => {
        const response = await api.get<PageResponse<Report>>('/v1/reports', {
            params: { status, page, size },
        });
        return response.data;
    },

    // 신고 처리
    processReport: async (reportId: number, status: 'PROCESSED' | 'REJECTED'): Promise<string> => {
        const response = await api.patch<string>(`/v1/reports/${reportId}/status`, { status });
        return response.data;
    },

    // 콘텐츠 신고 목록
    getContentReports: async (status?: string, page = 0, size = 20): Promise<any> => {
        const response = await api.get('/v1/contentreports', {
            params: { status, page, size },
        });
        return response.data;
    },

    // 콘텐츠 신고 처리
    processContentReport: async (reportId: number, intent: 'ACCEPT' | 'REJECT', adminNote?: string): Promise<ContentReport> => {
        const response = await api.patch<ContentReport>(`/v1/contentreports/${reportId}/status`, {
            intent,
            adminNote,
        });
        return response.data;
    },
};

// ==================== Blacklist Service ====================

export const blacklistService = {
    // 제재 목록 조회
    getActiveBlacklists: async (): Promise<Blacklist[]> => {
        const response = await api.get<Blacklist[]>('/v1/blacklists');
        return response.data;
    },

    // 제재 등록
    addBlacklist: async (userId: number, type: 'SITE_BAN' | 'COMMUNITY_BAN', reason: string, days: number): Promise<string> => {
        const response = await api.post<string>('/v1/blacklists', {
            userId,
            type,
            reason,
            durationDays: days,
        });
        return response.data;
    },

    // 제재 해제
    releaseBlacklist: async (blacklistId: number): Promise<string> => {
        const response = await api.delete<string>(`/v1/blacklists/${blacklistId}`);
        return response.data;
    },
};

// ==================== Admin Book Service ====================

export const adminBookService = {
    // 도서 목록 조회
    getAllBooks: async (page = 0, size = 20): Promise<PageResponse<AdminBook>> => {
        const response = await api.get<PageResponse<AdminBook>>('/v1/books', {
            params: { page, size },
        });
        return response.data;
    },

    // 도서 단건 조회
    getBook: async (bookId: number): Promise<AdminBook> => {
        const response = await api.get<AdminBook>(`/v1/books/${bookId}`);
        return response.data;
    },

    // 도서 등록
    createBook: async (request: BookRequest): Promise<number> => {
        const response = await api.post<number>('/v1/books', request);
        return response.data;
    },

    // 도서 수정
    updateBook: async (bookId: number, request: BookRequest): Promise<string> => {
        const response = await api.put<string>(`/v1/books/${bookId}`, request);
        return response.data;
    },

    // 도서 삭제
    deleteBook: async (bookId: number): Promise<void> => {
        await api.delete(`/v1/books/${bookId}`);
    },

    // 도서 검색
    searchBooks: async (keyword: string, page = 0, size = 20): Promise<PageResponse<AdminBook>> => {
        const response = await api.get<PageResponse<AdminBook>>('/v1/books/search', {
            params: { keyword, page, size },
        });
        return response.data;
    },
};

// ==================== Admin Chapter Service ====================

export const adminChapterService = {
    // 책의 챕터 목록 조회
    getChaptersByBook: async (bookId: number): Promise<AdminChapter[]> => {
        const response = await api.get<AdminChapter[]>(`/v1/chapters/book/${bookId}`);
        return response.data;
    },

    // 챕터 단건 조회
    getChapter: async (chapterId: number): Promise<AdminChapter> => {
        const response = await api.get<AdminChapter>(`/v1/chapters/${chapterId}`);
        return response.data;
    },

    // 챕터 등록 (파일 업로드 - S3)
    createChapter: async (file: File, bookId: number, chapterName?: string, sequence?: number, paragraphs?: number): Promise<AdminChapter> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bookId', bookId.toString());
        if (chapterName) formData.append('chapterName', chapterName);
        if (sequence !== undefined) formData.append('sequence', sequence.toString());
        if (paragraphs !== undefined) formData.append('paragraphs', paragraphs.toString());

        const response = await api.post<AdminChapter>('/v1/chapters/s3', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // 챕터 등록 (URL)
    createChapterByUrl: async (bookId: number, chapterName: string, sequence: number, contentPath: string): Promise<AdminChapter> => {
        const response = await api.post<AdminChapter>('/v1/chapters/url', {
            bookId,
            chapterName,
            sequence,
            contentPath,
        });
        return response.data;
    },

    // 챕터 수정 (파일 업로드 - S3)
    updateChapter: async (chapterId: number, file?: File, chapterName?: string, sequence?: number, paragraphs?: number): Promise<AdminChapter> => {
        const formData = new FormData();
        if (file) formData.append('file', file);
        if (chapterName) formData.append('chapterName', chapterName);
        if (sequence !== undefined) formData.append('sequence', sequence.toString());

        const response = await api.put<AdminChapter>(`/v1/chapters/${chapterId}/s3`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // 챕터 삭제
    deleteChapter: async (chapterId: number): Promise<void> => {
        await api.delete(`/v1/chapters/${chapterId}`);
    },

    // 전체 챕터 조회
    getAllChapters: async (): Promise<AdminChapter[]> => {
        const response = await api.get<AdminChapter[]>('/v1/chapters');
        return response.data;
    },
};

export default adminUserService;

