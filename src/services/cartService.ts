import api from './api';

// ==================== Types ====================

export interface CartItem {
    cartId: number;
    bookId: number;
    title: string;
    coverUrl: string;
    quantity: number;
    price: number;
    totalPrice: number;
}

export interface CartAddRequest {
    bookId: number;
    quantity: number;
}

export interface PaymentConfirmRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
}

export interface Subscription {
    subId: number;
    planName: string;
    price: number;
    status: 'PENDING' | 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAYMENT_FAILED';
    nextBillingDate: string;
    startedAt: string;
}

// ==================== Cart Service ====================

export const cartService = {
    // 장바구니 목록 조회
    getCart: async (): Promise<CartItem[]> => {
        const response = await api.get<CartItem[]>('/v1/carts');
        return response.data;
    },

    // 장바구니 추가
    addToCart: async (request: CartAddRequest): Promise<CartItem> => {
        const response = await api.post<CartItem>('/v1/carts', request);
        return response.data;
    },

    // 장바구니 수량 수정
    updateCartItem: async (cartId: number, quantity: number): Promise<CartItem> => {
        const response = await api.patch<CartItem>(`/v1/carts/${cartId}`, { quantity });
        return response.data;
    },

    // 장바구니 항목 삭제
    removeFromCart: async (cartId: number): Promise<void> => {
        await api.delete(`/v1/carts/${cartId}`);
    },
};

// ==================== Payment Service ====================

export const paymentService = {
    // 결제 승인
    confirmPayment: async (request: PaymentConfirmRequest): Promise<any> => {
        const response = await api.post('/v1/payments/confirm', request);
        return response.data;
    },

    // 빌링키 등록 (정기 결제용)
    registerBillingKey: async (authKey: string, customerKey: string): Promise<void> => {
        await api.post('/v1/payments/billing-key', { authKey, customerKey });
    },
};

// ==================== Subscription Service ====================

export const subscriptionService = {
    // 내 구독 정보 조회
    getMySubscription: async (): Promise<Subscription | null> => {
        try {
            const response = await api.get<Subscription>('/v1/subscriptions/me');
            return response.data;
        } catch {
            return null;
        }
    },

    // 구독 신청
    subscribe: async (planId: number): Promise<Subscription> => {
        const response = await api.post<Subscription>('/v1/subscriptions', null, {
            params: { planId },
        });
        return response.data;
    },

    // 구독 해지
    cancelSubscription: async (subId: number): Promise<void> => {
        await api.delete(`/v1/subscriptions/${subId}`);
    },
};

export default cartService;
