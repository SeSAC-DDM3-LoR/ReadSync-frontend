import api from './api';

// ==================== Types ====================

export interface SubscriptionPlan {
    planId: number;
    name: string;
    description: string;
    price: number;
    duration: number; // days
    features: string[];
}

// 빌링키 등록 요청
export interface BillingKeyRequest {
    authKey: string;
    customerKey: string;
}

// 구독 정보 응답 (백엔드 SubscriptionResponse와 일치)
export interface Subscription {
    subId: number;
    planName: string;
    price: number;
    status: 'ACTIVE' | 'CANCELLED' | 'PENDING' | 'EXPIRED' | 'PAYMENT_FAILED';
    nextBillingDate: string; // ISO datetime
    startedAt: string; // ISO datetime
}

// ==================== Subscription Service ====================

export const subscriptionService = {
    // 구독 플랜 목록 조회
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        // 현재 백엔드에 플랜 목록 API가 없으므로 하드코딩
        return [
            {
                planId: 1,
                name: '무료',
                description: '기본 기능 이용',
                price: 0,
                duration: 0,
                features: [
                    '도서 구매 가능',
                    '기본 AI 기능 (일일 5회)',
                    '커뮤니티 참여',
                ],
            },
            {
                planId: 2,
                name: '프리미엄',
                description: '모든 기능 무제한 이용',
                price: 9900,
                duration: 30,
                features: [
                    '모든 무료 기능 포함',
                    'AI 기능 무제한',
                    '광고 없음',
                    'TTS 음성 읽기',
                    '오프라인 다운로드',
                ],
            },
            {
                planId: 3,
                name: '프로',
                description: '팀/가족 공유 가능',
                price: 14900,
                duration: 30,
                features: [
                    '모든 프리미엄 기능 포함',
                    '최대 5명 가족 공유',
                    '독점 콘텐츠 접근',
                    '우선 고객 지원',
                    '베타 기능 조기 접근',
                ],
            },
        ];
    },

    // 구독 신청
    subscribe: async (planId: number): Promise<Subscription> => {
        const response = await api.post<Subscription>('/v1/subscriptions', null, {
            params: { planId },
        });
        return response.data;
    },

    // 내 구독 정보 조회
    getMySubscription: async (): Promise<Subscription | null> => {
        try {
            const response = await api.get<Subscription>('/v1/subscriptions/me');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 204) {
                return null;
            }
            throw error;
        }
    },

    // 빌링키 등록
    registerBillingKey: async (request: BillingKeyRequest): Promise<void> => {
        await api.post('/v1/payments/billing-key', request);
    },

    // 구독 해지
    cancelSubscription: async (subId: number): Promise<void> => {
        await api.delete(`/v1/subscriptions/${subId}`);
    },
};

export default subscriptionService;
