import api from './api';

// ==================== Types ====================

export interface ReportRequest {
    targetUserId?: number;
    targetId?: number;  // 신고 대상 ID (댓글 ID 또는 리뷰 ID)
    targetType?: 'CHAPTERS_COMMENT' | 'REVIEW';  // 백엔드 enum과 일치
    reasonType?: 'BAD_LANGUAGE' | 'SPOILER' | 'ADVERTISEMENT' | 'OTHER';  // 신고 사유 유형
    reasonDetail: string;  // 상세 사유
}

// ==================== Report Service ====================

export const reportService = {
    // 사용자 신고
    reportUser: async (targetUserId: number, reason: string): Promise<void> => {
        await api.post('/v1/contentreports/user', {
            targetUserId,
            reason
        });
    },

    // 콘텐츠 신고 (댓글/리뷰)
    reportContent: async (
        targetId: number,
        targetType: 'CHAPTERS_COMMENT' | 'REVIEW',
        reasonType: 'SPOILER' | 'ABUSE' | 'ADVERTISEMENT',
        reasonDetail: string
    ): Promise<void> => {
        await api.post('/v1/contentreports', {
            targetId,
            targetType,
            reasonType,
            reasonDetail
        });
    },
};

export default reportService;
