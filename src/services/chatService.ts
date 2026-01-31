import api from './api';

// ==================== Types ====================

export interface ChatMessage {
    chatId: number;
    senderId: number;
    senderName: string;
    senderProfileImage: string | null;
    messageType: 'TEXT' | 'IMAGE';
    content: string;
    imageUrl?: string;
    sendAt: string;
}

export interface SendMessageRequest {
    roomId: number;
    messageType: 'TEXT' | 'IMAGE';
    content: string;
    imageUrl?: string;
}

// ==================== Chat Service ====================

export const chatService = {
    // 최근 메시지 조회 (50개)
    getRecentMessages: async (roomId: number): Promise<ChatMessage[]> => {
        const response = await api.get<ChatMessage[]>(`/v1/chat/rooms/${roomId}/messages`);
        return response.data;
    },

    // 과거 메시지 조회 (페이지네이션)
    getOldMessages: async (roomId: number, lastChatId: number): Promise<ChatMessage[]> => {
        const response = await api.get<ChatMessage[]>(`/v1/chat/rooms/${roomId}/messages/history`, {
            params: { lastChatId }
        });
        return response.data;
    },

    // WebSocket을 통한 메시지 전송은 websocketClient.ts에서 처리
};

export default chatService;
