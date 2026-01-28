import api from './api';

// ==================== Types ====================

export interface ReadingRoom {
    roomId: number;
    roomName: string;
    hostId: number;
    hostName: string;
    bookTitle: string;
    status: 'WAITING' | 'PLAYING' | 'PAUSED' | 'FINISHED';
    voiceType: 'BASIC' | 'PREMIUM';
    playSpeed: number;
    maxCapacity: number;
    currentParticipants: number;
    currentChapterId: number;
}

export interface CreateRoomRequest {
    libraryId?: number;
    bookId?: number;  // 프론트엔드에서 처리용
    roomName: string;
    voiceType?: 'BASIC' | 'PREMIUM';
    ttsVoice?: string;  // TTS 목소리 ID
    ttsSpeed?: number;  // TTS 속도
    maxCapacity?: number;
    currentChapterId?: number;
}

export interface RoomParticipant {
    participantId: number;
    userId: number;
    nickname: string;
    profileImage: string | null;
    isHost: boolean;
    joinedAt: string;
}

export interface RoomInvitation {
    invitationId: number;
    roomId: number;
    roomName: string;
    inviterId: number;
    inviterName: string;
    inviteeId: number;
    inviteeName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}

// ==================== Reading Room Service ====================

export const readingRoomService = {
    // 독서룸 생성
    createRoom: async (request: CreateRoomRequest): Promise<number> => {
        const response = await api.post<number>('/v1/reading-rooms', request);
        return response.data;
    },

    // 독서룸 입장
    enterRoom: async (roomId: number): Promise<void> => {
        await api.post(`/v1/reading-rooms/${roomId}/enter`);
    },

    // 독서룸 퇴장
    leaveRoom: async (roomId: number): Promise<void> => {
        await api.delete(`/v1/reading-rooms/${roomId}/leave`);
    },

    // 참여자 강퇴 (방장 전용)
    kickUser: async (roomId: number, targetUserId: number): Promise<void> => {
        await api.delete(`/v1/reading-rooms/${roomId}/kick/${targetUserId}`);
    },

    // 재생 속도 변경 (방장 전용)
    updatePlaySpeed: async (roomId: number, speed: number): Promise<void> => {
        await api.patch(`/v1/reading-rooms/${roomId}/speed`, null, {
            params: { speed }
        });
    },

    // 독서 시작 (방장 전용)
    startReading: async (roomId: number): Promise<void> => {
        await api.patch(`/v1/reading-rooms/${roomId}/start`);
    },

    // 독서 일시정지/재개 (방장 전용)
    pauseReading: async (roomId: number): Promise<void> => {
        await api.patch(`/v1/reading-rooms/${roomId}/pause`);
    },

    // 독서 종료 (방장 전용)
    finishReading: async (roomId: number): Promise<void> => {
        await api.patch(`/v1/reading-rooms/${roomId}/finish`);
    },

    // TODO: 방 목록 조회 API가 백엔드에 없으면 추가 필요
    // 임시로 mock 데이터 반환
    getRooms: async (): Promise<ReadingRoom[]> => {
        try {
            const response = await api.get<ReadingRoom[]>('/v1/reading-rooms');
            return response.data;
        } catch {
            // 백엔드에 API가 없으면 빈 배열 반환
            console.log('Reading rooms list API not available, returning empty array');
            return [];
        }
    },

    // 독서룸 상세 조회
    getRoom: async (roomId: number): Promise<ReadingRoom> => {
        const response = await api.get<ReadingRoom>(`/v1/reading-rooms/${roomId}`);
        return response.data;
    },

    // 참여자 목록 조회
    getParticipants: async (roomId: number): Promise<RoomParticipant[]> => {
        try {
            const response = await api.get<RoomParticipant[]>(`/v1/reading-rooms/${roomId}/participants`);
            return response.data;
        } catch {
            return [];
        }
    },
};

// ==================== Room Invitation Service ====================

export const roomInvitationService = {
    // 초대장 발송 (방장 전용)
    inviteUser: async (roomId: number, targetUserId: number): Promise<void> => {
        await api.post('/v1/room-invitations/invite', null, {
            params: { roomId, targetUserId }
        });
    },

    // 초대장 수락
    acceptInvitation: async (invitationId: number): Promise<void> => {
        await api.post(`/v1/room-invitations/${invitationId}/accept`);
    },

    // 초대장 거절
    rejectInvitation: async (invitationId: number): Promise<void> => {
        await api.post(`/v1/room-invitations/${invitationId}/reject`);
    },

    // 받은 초대장 목록
    getReceivedInvitations: async (): Promise<RoomInvitation[]> => {
        const response = await api.get<RoomInvitation[]>('/v1/room-invitations/received');
        return response.data;
    },

    // 보낸 초대장 목록
    getSentInvitations: async (): Promise<RoomInvitation[]> => {
        const response = await api.get<RoomInvitation[]>('/v1/room-invitations/sent');
        return response.data;
    },
};

export default readingRoomService;
