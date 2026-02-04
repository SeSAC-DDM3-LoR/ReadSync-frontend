import api from './api';

// ==================== Types ====================

export interface Friendship {
    friendshipId: number;
    userId: number;
    friendId: number;
    friendNickname: string;
    friendProfileImage: string | null;
    friendTag: string;
    status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
    createdAt: string;
}

export interface FriendRequest {
    friendshipId: number;
    requesterId: number;
    requesterNickname: string;
    requesterProfileImage: string | null;
    requesterTag: string;
    addresseeId: number;
    addresseeNickname: string;
    addresseeProfileImage: string | null;
    addresseeTag: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}

// ==================== Friendship Service ====================

export const friendshipService = {
    // 친구 요청 보내기
    sendFriendRequest: async (addresseeId: number): Promise<void> => {
        await api.post(`/v1/friendship/request/${addresseeId}`);
    },

    // 내 친구 목록 조회
    getMyFriends: async (): Promise<Friendship[]> => {
        const response = await api.get<Friendship[]>('/v1/friendship');
        return response.data;
    },

    // 친구 요청 수락
    acceptFriendRequest: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/accept`);
    },

    // 친구 요청 거절
    rejectFriendRequest: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/reject`);
    },

    // 친구 요청 취소
    cancelFriendRequest: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/cancel`);
    },

    // 친구 삭제
    unfriend: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}`);
    },

    // 친구 차단
    blockFriend: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/block`);
    },

    // 친구 차단 해제
    unblockFriend: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/unblock`);
    },

    // 받은 친구 요청 목록 조회
    getReceivedRequests: async (): Promise<FriendRequest[]> => {
        const response = await api.get<FriendRequest[]>('/v1/friendship/requests/received');
        return response.data;
    },

    // 보낸 친구 요청 목록 조회
    getSentRequests: async (): Promise<FriendRequest[]> => {
        const response = await api.get<FriendRequest[]>('/v1/friendship/requests/sent');
        return response.data;
    },
};

export default friendshipService;
