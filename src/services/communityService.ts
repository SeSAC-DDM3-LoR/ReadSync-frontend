import api from './api';

// ==================== Types ====================

export interface CommunityPost {
    postId: number;
    title: string;
    content: string;
    views: number;
    likeCount: number;
    report: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

export interface CommunityComment {
    commentId: number;
    content: string;
    userId: number;
    parentId: number | null;
    postId: number;
    createdAt: string;
    updatedAt: string;
}

export interface PostCreateRequest {
    title: string;
    content: string;
}

export interface Friend {
    friendshipId: number;
    friendUserId: number;
    friendNickname: string;
    friendProfileImage: string;
    onlineStatus: string;
}

export interface FriendRequest {
    friendshipId: number;
    requesterId: number;
    requesterName: string;
    addresseeId: number;
    addresseeName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
    createdAt: string;
}

// ==================== Community Service ====================

export const communityService = {
    // 게시글 목록 조회
    getPosts: async (): Promise<CommunityPost[]> => {
        const response = await api.get<CommunityPost[]>('/api/community/posts');
        return response.data;
    },

    // 게시글 단건 조회
    getPost: async (postId: number): Promise<CommunityPost> => {
        const response = await api.get<CommunityPost>(`/api/community/posts/${postId}`);
        return response.data;
    },

    // 게시글 작성
    createPost: async (request: PostCreateRequest): Promise<CommunityPost> => {
        const response = await api.post<CommunityPost>('/api/community/posts', request);
        return response.data;
    },

    // 게시글 수정
    updatePost: async (postId: number, request: PostCreateRequest): Promise<CommunityPost> => {
        const response = await api.put<CommunityPost>(`/api/community/posts/${postId}`, request);
        return response.data;
    },

    // 게시글 삭제
    deletePost: async (postId: number): Promise<void> => {
        await api.delete(`/api/community/posts/${postId}`);
    },

    // 게시글 댓글 목록
    getComments: async (postId: number): Promise<CommunityComment[]> => {
        const response = await api.get<CommunityComment[]>(`/api/community/comments/post/${postId}`);
        return response.data;
    },

    // 댓글 작성
    createComment: async (postId: number, content: string): Promise<CommunityComment> => {
        const response = await api.post<CommunityComment>(`/api/community/comments/post/${postId}`, {
            content,
        });
        return response.data;
    },

    // 댓글 수정
    updateComment: async (commentId: number, content: string): Promise<CommunityComment> => {
        const response = await api.put<CommunityComment>(`/api/community/comments/${commentId}`, {
            content,
        });
        return response.data;
    },

    // 댓글 삭제
    deleteComment: async (commentId: number): Promise<void> => {
        await api.delete(`/api/community/comments/${commentId}`);
    },
};

// ==================== Friendship Service ====================

export const friendshipService = {
    // 내 친구 목록
    getMyFriends: async (): Promise<Friend[]> => {
        const response = await api.get<Friend[]>('/v1/friendship');
        return response.data;
    },

    // 받은 친구 요청
    getReceivedRequests: async (): Promise<FriendRequest[]> => {
        const response = await api.get<FriendRequest[]>('/v1/friendship/requests/received');
        return response.data;
    },

    // 보낸 친구 요청
    getSentRequests: async (): Promise<FriendRequest[]> => {
        const response = await api.get<FriendRequest[]>('/v1/friendship/requests/sent');
        return response.data;
    },

    // 친구 요청 보내기
    sendRequest: async (addresseeId: number): Promise<void> => {
        await api.post(`/v1/friendship/request/${addresseeId}`);
    },

    // 친구 요청 수락
    acceptRequest: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/accept`);
    },

    // 친구 요청 거절
    rejectRequest: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/reject`);
    },

    // 친구 삭제
    unfriend: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}`);
    },

    // 친구 차단
    block: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/block`);
    },

    // 차단 해제
    unblock: async (friendshipId: number): Promise<void> => {
        await api.post(`/v1/friendship/${friendshipId}/unblock`);
    },
};

export default communityService;
