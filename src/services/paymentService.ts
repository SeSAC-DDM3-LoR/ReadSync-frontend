import api from './api';

export interface PaymentConfirmRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
}

export interface PaymentResponse {
    paymentKey: string;
    orderId: string;
    status: string;
    totalAmount: number;
    method: string;
    receipt: {
        url: string;
    };
}

export const paymentService = {
    /**
     * 결제 승인 요청
     */
    confirmPayment: async (request: PaymentConfirmRequest): Promise<PaymentResponse> => {
        const response = await api.post<PaymentResponse>('/v1/payments/confirm', request);
        return response.data;
    },

    /**
     * 내 결제(주문) 내역 조회
     */
    getMyOrders: async (page = 0, size = 10): Promise<{ content: OrderResponse[] }> => {
        const response = await api.get<{ content: OrderResponse[] }>('/v1/orders/me', {
            params: { page, size }
        });
        return response.data;
    },
};

export interface OrderResponse {
    orderId: number;
    orderUid: string;
    orderName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    receiptUrl: string | null;
}

export default paymentService;
