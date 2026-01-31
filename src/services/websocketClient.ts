import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessage } from './chatService';


// WebSocket 연결 상태
type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

// WebSocket 클라이언트 클래스
class WebSocketClient {
    private client: Client | null = null;
    private connectionStatus: ConnectionStatus = 'DISCONNECTED';
    private subscriptions: Map<string, StompSubscription> = new Map();
    private messageHandlers: Map<string, (message: ChatMessage) => void> = new Map();
    private kickedRooms: Set<number> = new Set(); // Kick된 방 ID 저장

    /**
     * WebSocket 연결 초기화
     */
    connect(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connectionStatus === 'CONNECTED') {
                console.log('[WebSocket] Already connected');
                resolve();
                return;
            }

            console.log('[WebSocket] Attempting to connect...');
            const baseUrl = import.meta.env.VITE_API_BASE_URL;
            console.log('[WebSocket] API Base URL:', baseUrl);
            console.log('[WebSocket] Token exists:', !!token);

            // 환경 변수 검증
            if (!baseUrl) {
                const errorMsg = '❌ VITE_API_BASE_URL이 설정되지 않았습니다. .env 파일을 확인하고 개발 서버를 재시작하세요.';
                console.error(errorMsg);
                this.connectionStatus = 'DISCONNECTED';
                reject(new Error(errorMsg));
                return;
            }

            this.connectionStatus = 'CONNECTING';

            const wsUrl = `${baseUrl}/api/ws`; // 수정: /ws → /api/ws
            console.log('[WebSocket] Connection URL:', wsUrl);

            this.client = new Client({
                webSocketFactory: () => {
                    console.log('[WebSocket] Creating SockJS connection to:', wsUrl);
                    return new SockJS(wsUrl);
                },
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                },
                debug: (str) => {
                    console.log('[STOMP Debug]', str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: (frame) => {
                    console.log('✅ [WebSocket] Connected successfully!', frame);
                    this.connectionStatus = 'CONNECTED';
                    resolve();
                },
                onStompError: (frame) => {
                    console.error('❌ [STOMP Error]', frame);
                    console.error('Error headers:', frame.headers);
                    console.error('Error body:', frame.body);
                    this.connectionStatus = 'DISCONNECTED';
                    reject(new Error(frame.headers['message'] || 'STOMP connection error'));
                },
                onWebSocketClose: (event) => {
                    console.log('🔌 [WebSocket] Connection closed', event);
                    this.connectionStatus = 'DISCONNECTED';
                },
                onWebSocketError: (event) => {
                    console.error('❌ [WebSocket Error]', event);
                },
            });

            try {
                this.client.activate();
                console.log('[WebSocket] Client activated');
            } catch (error) {
                console.error('❌ [WebSocket] Failed to activate client:', error);
                this.connectionStatus = 'DISCONNECTED';
                reject(error);
            }
        });
    }

    /**
     * WebSocket 연결 해제
     */
    disconnect(): void {
        if (this.client) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
            this.subscriptions.clear();
            this.messageHandlers.clear();
            this.client.deactivate();
            this.client = null;
            this.connectionStatus = 'DISCONNECTED';
        }
    }

    /**
     * 채팅방 구독
     */
    subscribeToChatRoom(
        roomId: number,
        onMessage: (message: ChatMessage) => void,
        onKick?: () => void
    ): void {
        console.log(`[WebSocket] Attempting to subscribe to chat room ${roomId}`);
        console.log(`[WebSocket] Connection status: ${this.connectionStatus}`);

        if (!this.client || this.connectionStatus !== 'CONNECTED') {
            console.error('❌ [WebSocket] Cannot subscribe - not connected');
            return;
        }

        // Kick된 방인지 확인
        if (this.kickedRooms.has(roomId)) {
            console.warn(`⚠️ [WebSocket] You have been kicked from room ${roomId}`);
            if (onKick) onKick();
            return;
        }

        const destination = `/topic/chat/${roomId}`;

        // 이미 구독 중인지 확인
        if (this.subscriptions.has(destination)) {
            console.warn(`⚠️ [WebSocket] Already subscribed to ${destination}`);
            return;
        }

        try {
            const subscription = this.client.subscribe(destination, (message: IMessage) => {
                console.log(`📨 [WebSocket] Received message from ${destination}:`, message.body);
                try {
                    const chatMessage: ChatMessage = JSON.parse(message.body);
                    onMessage(chatMessage);
                } catch (error) {
                    console.error('❌ [WebSocket] Failed to parse chat message:', error);
                }
            });

            this.subscriptions.set(destination, subscription);
            this.messageHandlers.set(destination, onMessage);
            console.log(`✅ [WebSocket] Successfully subscribed to ${destination}`);
        } catch (error) {
            console.error(`❌ [WebSocket] Failed to subscribe to ${destination}:`, error);
        }
    }

    /**
     * 독서룸 상태 변경 구독
     */
    subscribeToRoomStatus(
        roomId: number,
        onStatusChange: (status: any) => void,
        onKick?: () => void
    ): void {
        if (!this.client || this.connectionStatus !== 'CONNECTED') {
            console.error('WebSocket is not connected');
            return;
        }

        // Kick된 방인지 확인
        if (this.kickedRooms.has(roomId)) {
            console.warn(`You have been kicked from room ${roomId}`);
            if (onKick) onKick();
            return;
        }

        const destination = `/topic/room/${roomId}/status`;

        if (this.subscriptions.has(destination)) {
            console.warn(`Already subscribed to ${destination}`);
            return;
        }

        const subscription = this.client.subscribe(destination, (message: IMessage) => {
            try {
                const statusUpdate = JSON.parse(message.body);

                // Kick 이벤트 처리
                if (statusUpdate.type === 'KICK') {
                    this.kickedRooms.add(roomId);
                    this.unsubscribeFromRoom(roomId);
                    if (onKick) onKick();
                    return;
                }

                onStatusChange(statusUpdate);
            } catch (error) {
                console.error('Failed to parse status update:', error);
            }
        });

        this.subscriptions.set(destination, subscription);
    }

    /**
     * 채팅 메시지 전송
     */
    sendChatMessage(roomId: number, messageType: 'TEXT' | 'IMAGE', content: string, imageUrl?: string): void {
        console.log(`[WebSocket] Attempting to send message to room ${roomId}`);
        console.log(`[WebSocket] Connection status: ${this.connectionStatus}`);

        if (!this.client || this.connectionStatus !== 'CONNECTED') {
            console.error('❌ [WebSocket] Cannot send message - not connected');
            return;
        }

        // Kick된 방인지 확인
        if (this.kickedRooms.has(roomId)) {
            console.warn(`⚠️ [WebSocket] You have been kicked from room ${roomId}`);
            return;
        }

        const payload = {
            roomId,
            messageType,
            content,
            imageUrl,
        };

        try {
            this.client.publish({
                destination: '/app/chat/send',
                body: JSON.stringify(payload),
            });
            console.log(`✅ [WebSocket] Message sent successfully:`, payload);
        } catch (error) {
            console.error('❌ [WebSocket] Failed to send message:', error);
        }
    }

    /**
     * 특정 방 구독 해제
     */
    unsubscribeFromRoom(roomId: number): void {
        const chatDestination = `/topic/chat/${roomId}`;
        const statusDestination = `/topic/room/${roomId}/status`;

        [chatDestination, statusDestination].forEach((dest) => {
            const subscription = this.subscriptions.get(dest);
            if (subscription) {
                subscription.unsubscribe();
                this.subscriptions.delete(dest);
                this.messageHandlers.delete(dest);
            }
        });
    }

    /**
     * Kick 상태 초기화 (다른 방 입장 시)
     */
    clearKickStatus(roomId: number): void {
        this.kickedRooms.delete(roomId);
    }

    /**
     * 연결 상태 확인
     */
    isConnected(): boolean {
        return this.connectionStatus === 'CONNECTED';
    }

    /**
     * Kick 여부 확인
     */
    isKicked(roomId: number): boolean {
        return this.kickedRooms.has(roomId);
    }
}

// 싱글톤 인스턴스
const websocketClient = new WebSocketClient();

export default websocketClient;
