import api from './api';
import type { PageResponse } from './bookService';

// ==================== AI 채팅 관련 타입 정의 ====================

/**
 * 채팅 메시지 타입
 */
export type ChatType = 'QUESTION' | 'SUMMARY' | 'EXPLANATION' | 'CHAT';

/**
 * AI 채팅방 생성 요청 DTO
 */
export interface ChatRoomRequest {
    chapterId: number;        // 채팅방을 생성할 챕터 ID
    title?: string;           // 채팅방 제목 (선택)
}

/**
 * AI 채팅방 응답 DTO
 */
export interface ChatRoomResponse {
    roomId: number;           // 채팅방 ID
    userId: number;           // 사용자 ID
    chapterId: number;        // 챕터 ID
    title: string;            // 채팅방 제목
    createdAt: string;        // 생성일시
    updatedAt: string;        // 수정일시
}

/**
 * AI 채팅 메시지 요청 DTO
 */
export interface ChatMessageRequest {
    userMessage: string;          // 사용자 메시지
    chatType?: ChatType;      // 채팅 타입 (기본값: CHAT)
    currentParagraphId?: string; // 현재 읽고 있는 문단 ID (Context용)
}

/**
 * AI 채팅 메시지 응답 DTO
 */
export interface ChatMessageResponse {
    chatId: number;           // 메시지 ID
    roomId: number;           // 채팅방 ID
    chatType: ChatType;       // 채팅 타입
    userMessage: string;          // 사용자 메시지
    aiMessage: string;            // AI 응답 메시지
    tokenCount: number;       // 사용된 토큰 수
    responseTimeMs: number;   // 응답 시간 (밀리초)
    rating: number | null;    // AI 응답 평점 (1~5)
    createdAt: string;        // 생성일시
    relatedParagraphId?: string; // 출처 문단 ID
}

/**
 * 프론트엔드용 채팅 메시지 (UI 렌더링용)
 */
export interface ChatMessage {
    id?: number;
    role: 'user' | 'ai';
    content: string;
    timestamp?: string;
    isLoading?: boolean;      // AI 응답 대기 중 여부
    relatedParagraphId?: string; // 출처 문단 ID
}

// ==================== AI Chat Service ====================

export const aiChatService = {
    // ========== 채팅방 관리 ==========

    /**
     * 채팅방 생성
     * 
     * 동일 챕터의 채팅방이 이미 있으면 기존 채팅방을 반환합니다.
     * 
     * @param request 채팅방 생성 요청 데이터
     * @returns 생성된 (또는 기존) 채팅방 정보
     */
    createChatRoom: async (request: ChatRoomRequest): Promise<ChatRoomResponse> => {
        const response = await api.post<ChatRoomResponse>('/v1/ai-chat/rooms', request);
        return response.data;
    },

    /**
     * 내 채팅방 목록 조회 (페이징)
     * 
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @returns 채팅방 목록 (페이징)
     */
    getChatRooms: async (page = 0, size = 10): Promise<PageResponse<ChatRoomResponse>> => {
        const response = await api.get<PageResponse<ChatRoomResponse>>('/v1/ai-chat/rooms', {
            params: { page, size },
        });
        return response.data;
    },

    /**
     * 채팅방 상세 조회
     * 
     * @param roomId 채팅방 ID
     * @returns 채팅방 상세 정보
     */
    getChatRoom: async (roomId: number): Promise<ChatRoomResponse> => {
        const response = await api.get<ChatRoomResponse>(`/v1/ai-chat/rooms/${roomId}`);
        return response.data;
    },

    /**
     * 채팅방 제목 수정
     * 
     * @param roomId 채팅방 ID
     * @param title 새 제목
     * @returns 수정된 채팅방 정보
     */
    updateChatRoomTitle: async (roomId: number, title: string): Promise<ChatRoomResponse> => {
        const response = await api.put<ChatRoomResponse>(`/v1/ai-chat/rooms/${roomId}`, null, {
            params: { title },
        });
        return response.data;
    },

    /**
     * 채팅방 삭제 (Soft Delete)
     * 
     * @param roomId 삭제할 채팅방 ID
     */
    deleteChatRoom: async (roomId: number): Promise<void> => {
        await api.delete(`/v1/ai-chat/rooms/${roomId}`);
    },

    // ========== 채팅 메시지 ==========

    /**
     * 채팅 기록 전체 조회
     * 
     * @param roomId 채팅방 ID
     * @returns 채팅 메시지 목록
     */
    getChatHistory: async (roomId: number): Promise<ChatMessageResponse[]> => {
        const response = await api.get<ChatMessageResponse[]>(`/v1/ai-chat/rooms/${roomId}/messages`);
        return response.data;
    },

    /**
     * 채팅 기록 페이징 조회
     * 
     * @param roomId 채팅방 ID
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @returns 채팅 메시지 목록 (페이징)
     */
    getChatHistoryPaged: async (
        roomId: number,
        page = 0,
        size = 20
    ): Promise<PageResponse<ChatMessageResponse>> => {
        const response = await api.get<PageResponse<ChatMessageResponse>>(
            `/v1/ai-chat/rooms/${roomId}/messages/paged`,
            { params: { page, size } },
        );
        return response.data;
    },

    /**
     * 메시지 전송 (일반)
     * 
     * AI에게 질문을 보내고 응답을 받습니다.
     * 
     * @param roomId 채팅방 ID
     * @param request 메시지 요청 데이터
     * @returns AI 응답 메시지
     */
    sendMessage: async (roomId: number, request: ChatMessageRequest): Promise<ChatMessageResponse> => {
        const response = await api.post<ChatMessageResponse>(
            `/v1/ai-chat/rooms/${roomId}/messages`,
            request,
        );
        return response.data;
    },

    /**
     * 메시지 전송 (스트리밍)
     * 
     * AI에게 질문을 보내고 SSE로 실시간 응답을 받습니다.
     * 
     * @param roomId 채팅방 ID
     * @param request 메시지 요청 데이터
     * @param onMessage 스트리밍 메시지 수신 콜백
     * @param onComplete 완료 콜백
     * @param onError 에러 콜백
     */
    sendMessageStream: (
        roomId: number,
        request: ChatMessageRequest,
        onMessage: (chunk: string) => void,
        onComplete?: () => void,
        onError?: (error: Error) => void,
    ) => {
        // SSE 연결을 위해 fetch 사용
        const controller = new AbortController();

        fetch(`/v1/ai-chat/rooms/${roomId}/messages/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    throw new Error('스트림을 읽을 수 없습니다.');
                }

                // 스트리밍 데이터 읽기
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    onMessage(chunk);
                }

                onComplete?.();
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    onError?.(error);
                }
            });

        // 스트림 중단 함수 반환
        return () => controller.abort();
    },

    /**
     * AI 답변 평가
     * 
     * @param chatId 메시지 ID
     * @param rating 평점 (1~5)
     */
    rateAiResponse: async (chatId: number, rating: number): Promise<void> => {
        await api.put(`/v1/ai-chat/messages/${chatId}/rating`, null, {
            params: { rating },
        });
    },
};

// ==================== 헬퍼 함수 ====================

/**
 * 백엔드 응답을 프론트엔드 ChatMessage 형태로 변환
 * 
 * @param responses 백엔드 응답 메시지 배열
 * @returns 프론트엔드용 메시지 배열
 */
export const convertToUIMessages = (responses: ChatMessageResponse[]): ChatMessage[] => {
    const messages: ChatMessage[] = [];

    responses.forEach(response => {
        // 사용자 메시지 추가
        messages.push({
            id: response.chatId,
            role: 'user',
            content: response.userMessage,
            timestamp: response.createdAt,
        });

        // AI 응답 추가
        messages.push({
            id: response.chatId,
            role: 'ai',
            content: response.aiMessage,
            timestamp: response.createdAt,
            relatedParagraphId: response.relatedParagraphId,
        });
    });

    return messages;
};

export default aiChatService;
