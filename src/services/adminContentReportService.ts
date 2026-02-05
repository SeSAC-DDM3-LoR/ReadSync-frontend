import api from './api';

// ==================== Types ====================

export type ContentReportTargetType = 'CHAPTERS_COMMENT' | 'REVIEW';
export type ContentReportProcessStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type ContentReportReasonType = 'SPOILER' | 'ABUSE' | 'ADVERTISEMENT';

// 신고 목록 아이템
export interface ContentReport {
    reportId: number;
    targetType: ContentReportTargetType;
    targetId: number;
    reporterId: number;
    reporterName: string;
    reasonType: ContentReportReasonType;
    reasonDetail: string;
    processStatus: ContentReportProcessStatus;
    createdAt: string;
}

// 신고 상세 정보
export interface ContentReportDetail extends ContentReport {
    targetContent: string;  // 댓글 또는 리뷰 내용
}

// 페이징 응답
export interface ContentReportPageResponse {
    content: ContentReport[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
}

// ==================== Admin Content Report Service ====================

export const adminContentReportService = {
    /**
     * 댓글/리뷰 신고 목록 조회
     */
    getContentReports: async (
        status?: ContentReportProcessStatus,
        targetType?: ContentReportTargetType,
        page: number = 0,
        size: number = 20
    ): Promise<ContentReportPageResponse> => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (targetType) params.append('targetType', targetType);
        params.append('page', String(page + 1)); // 백엔드는 1-based
        params.append('size', String(size));

        const response = await api.get(`/v1/contentreports?${params.toString()}`);

        // 백엔드 응답 형식: { reports: [...], totalCount: number }
        const reports = response.data.reports || [];
        const totalCount = response.data.totalCount || 0;
        const totalPages = Math.ceil(totalCount / size);

        return {
            content: reports,
            totalElements: totalCount,
            totalPages: totalPages,
            currentPage: page,
            size: size
        };
    },

    /**
     * 신고 상세 정보 조회
     */
    getContentReportDetail: async (reportId: number): Promise<ContentReportDetail> => {
        const response = await api.get(`/v1/contentreports/${reportId}`);
        return response.data;
    },

    /**
     * 신고 처리 상태 업데이트
     */
    updateContentReportStatus: async (
        reportId: number,
        intent: 'ACCEPT' | 'REJECT',
        visibilityStatus?: boolean
    ): Promise<ContentReport> => {
        const response = await api.patch(`/v1/contentreports/${reportId}/status`, {
            intent,
            visibilityStatus
        });
        return response.data;
    }
};

export default adminContentReportService;
