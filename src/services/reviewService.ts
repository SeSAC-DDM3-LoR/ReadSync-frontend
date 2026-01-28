import api from './api';
import type { PageResponse } from './bookService';

// ==================== Types ====================

export interface Review {
    reviewId: number;
    writerId?: number;  // 작성자 ID (프로필 조회용)
    writerName: string;
    bookTitle: string;
    rating: number;
    content: string;
    isChanged: boolean;
    isSpoiler: boolean;
    visibilityStatus: 'ACTIVE' | 'BLINDED' | 'SUSPENDED' | 'DELETED';
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewRequest {
    bookId: number;
    rating: number;
    content: string;
    isSpoiler: boolean;
}

export interface Comment {
    commentId: number;
    nickname: string;
    content: string;
    parentCommentId: number | null;
    status: 'ACTIVE' | 'BLINDED' | 'SUSPENDED' | 'DELETED';
    createdAt: string;
    changedAt: string;
    changed: boolean;
    isSpoiler: boolean;
}

export interface CommentRequest {
    content: string;
    parentCommentId?: number;
    isSpoiler: boolean;
}

export interface LikeResponse {
    message: string;
    totalLikes: number;
    totalDislikes: number;
    pressed: boolean;
}

// ==================== Review Service ====================

export const reviewService = {
    // 도서별 리뷰 목록
    getReviewsByBook: async (bookId: number, page = 0, size = 10): Promise<PageResponse<Review>> => {
        const response = await api.get<PageResponse<Review>>('/v1/reviews', {
            params: { bookId, page, size },
        });
        return response.data;
    },

    // 내 리뷰 목록
    getMyReviews: async (page = 0, size = 10): Promise<PageResponse<Review>> => {
        const response = await api.get<PageResponse<Review>>('/v1/reviews/my', {
            params: { page, size },
        });
        return response.data;
    },

    // 리뷰 단건 조회
    getReview: async (reviewId: number): Promise<Review> => {
        const response = await api.get<Review>(`/v1/reviews/${reviewId}`);
        return response.data;
    },

    // 리뷰 작성
    createReview: async (request: ReviewRequest): Promise<number> => {
        const response = await api.post<number>('/v1/reviews', request);
        return response.data;
    },

    // 리뷰 수정
    updateReview: async (reviewId: number, request: ReviewRequest): Promise<string> => {
        const response = await api.put<string>(`/v1/reviews/${reviewId}`, request);
        return response.data;
    },

    // 리뷰 삭제
    deleteReview: async (reviewId: number): Promise<void> => {
        await api.delete(`/v1/reviews/${reviewId}`);
    },

    // 리뷰 좋아요/싫어요
    toggleReviewLike: async (reviewId: number, likeType: 'LIKE' | 'DISLIKE'): Promise<LikeResponse> => {
        const response = await api.post<LikeResponse>(`/v1/likes/reviews/${reviewId}`, { likeType });
        return response.data;
    },
};

// ==================== Comment Service ====================

export const commentService = {
    // 챕터별 댓글 목록
    getCommentsByChapter: async (chapterId: number): Promise<Comment[]> => {
        const response = await api.get<Comment[]>(`/v1/comments/chapter/${chapterId}`);
        return response.data;
    },

    // 내 댓글 목록
    getMyComments: async (): Promise<Comment[]> => {
        const response = await api.get<Comment[]>('/v1/comments/my');
        return response.data;
    },

    // 댓글 작성
    createComment: async (chapterId: number, request: CommentRequest): Promise<Comment> => {
        const response = await api.post<Comment>(`/v1/comments/${chapterId}`, request);
        return response.data;
    },

    // 댓글 수정
    updateComment: async (commentId: number, request: CommentRequest): Promise<Comment> => {
        const response = await api.patch<Comment>(`/v1/comments/${commentId}`, request);
        return response.data;
    },

    // 댓글 삭제
    deleteComment: async (commentId: number): Promise<void> => {
        await api.delete(`/v1/comments/${commentId}`);
    },

    // 댓글 좋아요/싫어요
    toggleCommentLike: async (commentId: number, likeType: 'LIKE' | 'DISLIKE'): Promise<LikeResponse> => {
        const response = await api.post<LikeResponse>(`/v1/likes/comments/${commentId}`, { likeType });
        return response.data;
    },
};

export default reviewService;
