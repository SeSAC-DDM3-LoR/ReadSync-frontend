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

export default adminUserService;
