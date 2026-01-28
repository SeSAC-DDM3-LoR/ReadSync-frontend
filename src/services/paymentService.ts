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
};

export default paymentService;
