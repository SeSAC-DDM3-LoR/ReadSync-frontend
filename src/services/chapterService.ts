import api from './api';

// ==================== Types ====================

export interface ChapterContent {
    id: string;          // paragraph ID (예: "p_0003")
    speaker: string;     // 화자 이름
    text: string;        // 문단 내용
}

export interface ChapterResponse {
    chapterId: number;
    chapterName: string;
    bookId: number;
    bookTitle: string;
    sequence: number;
    paragraphs: number;
    isEmbedded: boolean;
    fileUrl?: string;    // S3 URL 또는 로컬 파일 URL
    content?: ChapterContent[];  // 챕터 내용 (getChapter일 때만)
}

// ==================== Chapter Service ====================

export const chapterService = {
    // 챕터 상세 조회 (본문 포함 - 로컬 테스트용)
    getChapter: async (chapterId: number): Promise<ChapterResponse> => {
        const response = await api.get<ChapterResponse>(`/v1/chapters/${chapterId}`);
        return response.data;
    },

    // 챕터 URL 조회 (본문 제외 - 실제 서비스용)
    getChapterUrl: async (chapterId: number): Promise<ChapterResponse> => {
        const response = await api.get<ChapterResponse>(`/v1/chapters/${chapterId}/url`);
        return response.data;
    },

    // 책 ID로 챕터 목록 조회
    getChaptersByBookId: async (bookId: number): Promise<ChapterResponse[]> => {
        const response = await api.get<ChapterResponse[]>(`/v1/chapters/book/${bookId}`);
        return response.data;
    },
};

export default chapterService;
