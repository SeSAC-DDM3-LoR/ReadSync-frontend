import api from './api';

// ==================== 댓글 관련 타입 정의 ====================

/**
 * 댓글 표시 상태
 */
export type VisibilityStatus = 'VISIBLE' | 'BLINDED' | 'SUSPENDED';

/**
 * 댓글 응답 DTO
 */
export interface CommentResponse {
    commentId: number;
    nickname: string;         // 작성자 닉네임
    content: string;          // 댓글 내용
    parentCommentId: number | null;  // 부모 댓글 ID (대댓글인 경우)
    isSpoiler: boolean;       // 스포일러 여부
    isChanged: boolean;       // 수정 여부
    status: VisibilityStatus; // 표시 상태
    createdAt: string;        // 생성일시
    changedAt: string;        // 수정일시
    // 프론트엔드에서 추가로 관리할 필드들
    likeCount?: number;       // 좋아요 수
    dislikeCount?: number;    // 싫어요 수
    myLikeType?: 'LIKE' | 'DISLIKE' | null; // 내가 누른 좋아요 타입
}

/**
 * 댓글 작성/수정 요청 DTO
 */
export interface CommentRequest {
    content: string;          // 댓글 내용
    parentCommentId?: number; // 부모 댓글 ID (대댓글인 경우)
    isSpoiler?: boolean;      // 스포일러 여부 (기본값: false)
}

// ==================== 좋아요/싫어요 관련 타입 정의 ====================

/**
 * 좋아요 타입
 */
export type LikeType = 'LIKE' | 'DISLIKE';

/**
 * 좋아요 요청 DTO
 */
export interface LikeRequest {
    likeType: LikeType;
}

/**
 * 좋아요 응답 DTO
 */
export interface LikeResponse {
    likeId: number | null;    // 좋아요 ID (취소된 경우 null)
    likeType: LikeType | null; // 현재 상태 (취소된 경우 null)
    likeCount: number;        // 현재 좋아요 수
    dislikeCount: number;     // 현재 싫어요 수
}

// ==================== Comment Service ====================

export const commentService = {
    /**
     * 특정 챕터의 댓글 목록 조회
     * 
     * @param chapterId 챕터 ID
     * @returns 댓글 목록
     */
    getCommentsByChapter: async (chapterId: number): Promise<CommentResponse[]> => {
        const response = await api.get<CommentResponse[]>(`/v1/comments/chapter/${chapterId}`);
        return response.data;
    },

    /**
     * 댓글 단건 조회
     * 
     * @param commentId 댓글 ID
     * @returns 댓글 상세 정보
     */
    getComment: async (commentId: number): Promise<CommentResponse> => {
        const response = await api.get<CommentResponse>(`/v1/comments/${commentId}`);
        return response.data;
    },

    /**
     * 내 댓글 목록 조회
     * 
     * @returns 내가 작성한 댓글 목록
     */
    getMyComments: async (): Promise<CommentResponse[]> => {
        const response = await api.get<CommentResponse[]>('/v1/comments/my');
        return response.data;
    },

    /**
     * 댓글 작성
     * 
     * @param chapterId 댓글을 작성할 챕터 ID
     * @param request 댓글 작성 요청 데이터
     * @returns 생성된 댓글 정보
     */
    createComment: async (chapterId: number, request: CommentRequest): Promise<CommentResponse> => {
        const response = await api.post<CommentResponse>(`/v1/comments/${chapterId}`, request);
        return response.data;
    },

    /**
     * 댓글 수정
     * 
     * @param commentId 수정할 댓글 ID
     * @param request 댓글 수정 요청 데이터
     * @returns 수정된 댓글 정보
     */
    updateComment: async (commentId: number, request: CommentRequest): Promise<CommentResponse> => {
        const response = await api.patch<CommentResponse>(`/v1/comments/${commentId}`, request);
        return response.data;
    },

    /**
     * 댓글 삭제 (Soft Delete)
     * 
     * @param commentId 삭제할 댓글 ID
     */
    deleteComment: async (commentId: number): Promise<void> => {
        await api.delete(`/v1/comments/${commentId}`);
    },
};

// ==================== Like Service (댓글용) ====================

export const likeService = {
    /**
     * 댓글 좋아요/싫어요 토글
     * 
     * 같은 타입을 다시 누르면 취소됩니다.
     * 다른 타입을 누르면 기존 것이 취소되고 새 타입이 적용됩니다.
     * 
     * @param commentId 대상 댓글 ID
     * @param likeType 좋아요 타입 ('LIKE' | 'DISLIKE')
     * @returns 업데이트된 좋아요 상태
     */
    toggleCommentLike: async (commentId: number, likeType: LikeType): Promise<LikeResponse> => {
        const response = await api.post<LikeResponse>(`/v1/likes/comments/${commentId}`, {
            likeType,
        });
        return response.data;
    },

    /**
     * 리뷰 좋아요/싫어요 토글
     * 
     * @param reviewId 대상 리뷰 ID
     * @param likeType 좋아요 타입 ('LIKE' | 'DISLIKE')
     * @returns 업데이트된 좋아요 상태
     */
    toggleReviewLike: async (reviewId: number, likeType: LikeType): Promise<LikeResponse> => {
        const response = await api.post<LikeResponse>(`/v1/likes/reviews/${reviewId}`, {
            likeType,
        });
        return response.data;
    },
};

export default commentService;
