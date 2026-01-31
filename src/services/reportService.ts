import api from './api';

// ==================== Types ====================

export interface ReportRequest {
    targetUserId?: number;
    targetContentId?: number;
    contentType?: 'POST' | 'COMMENT' | 'REVIEW';
    reason: string;
}

// ==================== Report Service ====================

export const reportService = {
    // 사용자 신고
    reportUser: async (targetUserId: number, reason: string): Promise<void> => {
        await api.post('/v1/reports/user', {
            targetUserId,
            reason
        });
    },

    // 콘텐츠 신고
    reportContent: async (
        targetContentId: number,
        contentType: 'POST' | 'COMMENT' | 'REVIEW',
        reason: string
    ): Promise<void> => {
        await api.post('/v1/reports/content', {
            targetContentId,
            contentType,
            reason
        });
    },
};

export default reportService;
