import api from './api';
import type { PageResponse } from './bookService';

// ==================== Types ====================

export interface ExpLog {
    expLogId: number;
    activityType: 'READ_BOOK' | 'WRITE_REVIEW' | 'DAILY_ATTENDANCE';
    activityDescription: string;
    earnedExp: number;
    targetId: number;
    referenceId: number;
    createdAt: string;
}

export interface Notice {
    noticeId: number;
    title: string;
    content: string;
}

export interface Inquiry {
    inquiryId: number;
    title: string;
    content: string;
    status: string;
}

export interface InquiryRequest {
    title: string;
    content: string;
}

// 타인 프로필 정보
export interface OtherProfile {
    userId: number;
    nickname: string;
    tag: string;
    profileImage: string | null;
    levelId: number;
    experience: number;
    preferredGenre: string | null;
}

// ==================== Profile Service ====================

export const profileService = {
    // 타인 프로필 조회
    getOtherProfile: async (userId: number): Promise<OtherProfile> => {
        const response = await api.get<OtherProfile>(`/v1/users/${userId}`);
        return response.data;
    },

    // 유저 검색 (닉네임으로)
    searchUsers: async (keyword: string, page = 0, size = 20): Promise<OtherProfile[]> => {
        const response = await api.get<OtherProfile[]>('/v1/users/search', {
            params: { keyword, page, size }
        });
        return response.data;
    },

    // 닉네임#태그로 정확히 찾기
    findUserByTag: async (nickname: string, tag: string): Promise<OtherProfile> => {
        const response = await api.get<OtherProfile>('/v1/users/find', {
            params: { nickname, tag }
        });
        return response.data;
    },
};

// ==================== Exp Service ====================

export const expService = {
    // 내 경험치 로그
    getMyExpLogs: async (page = 0, size = 20): Promise<PageResponse<ExpLog>> => {
        const response = await api.get<PageResponse<ExpLog>>('/v1/exp/me', {
            params: { page, size },
        });
        return response.data;
    },
};

// ==================== Credit Service ====================

export const creditService = {
    // 내 크레딧 잔액
    getMyBalance: async (): Promise<number> => {
        const response = await api.get<number>('/v1/credits/me');
        return response.data;
    },
};

// ==================== Notice Service ====================

export const noticeService = {
    // 공지사항 목록
    getNotices: async (): Promise<Notice[]> => {
        const response = await api.get<Notice[]>('/notices');
        return response.data;
    },

    // 공지사항 단건 조회
    getNotice: async (noticeId: number): Promise<Notice> => {
        const response = await api.get<Notice>(`/notices/${noticeId}`);
        return response.data;
    },

    // [관리자] 공지사항 작성
    createNotice: async (title: string, content: string): Promise<Notice> => {
        const response = await api.post<Notice>('/notices', { title, content });
        return response.data;
    },

    // [관리자] 공지사항 수정
    updateNotice: async (noticeId: number, title: string, content: string): Promise<Notice> => {
        const response = await api.put<Notice>(`/notices/${noticeId}`, { title, content });
        return response.data;
    },

    // [관리자] 공지사항 삭제
    deleteNotice: async (noticeId: number): Promise<void> => {
        await api.delete(`/notices/${noticeId}`);
    },
};

// ==================== Inquiry Service ====================

export const inquiryService = {
    // 내 문의 목록
    getMyInquiries: async (): Promise<Inquiry[]> => {
        const response = await api.get<Inquiry[]>('/inquiry');
        return response.data;
    },

    // 문의 단건 조회
    getInquiry: async (inquiryId: number): Promise<Inquiry> => {
        const response = await api.get<Inquiry>(`/inquiry/${inquiryId}`);
        return response.data;
    },

    // 문의 작성
    createInquiry: async (request: InquiryRequest): Promise<Inquiry> => {
        const response = await api.post<Inquiry>('/inquiry', request);
        return response.data;
    },

    // 문의 수정
    updateInquiry: async (inquiryId: number, request: InquiryRequest): Promise<Inquiry> => {
        const response = await api.put<Inquiry>(`/inquiry/${inquiryId}`, request);
        return response.data;
    },

    // 문의 삭제
    deleteInquiry: async (inquiryId: number): Promise<void> => {
        await api.delete(`/inquiry/${inquiryId}`);
    },
};

export default expService;
