import api from './api';

// ==================== 책 콘텐츠 JSON 타입 정의 ====================

/**
 * 책 콘텐츠 아이템의 타입
 * - heading_1: 작품 제목
 * - heading_2: 챕터 번호/제목
 * - heading_3: 소제목 또는 섹션 구분
 * - paragraph: 일반 서술 문단
 * - quote: 직접 대화문
 * - poetry: 시 또는 운문
 * - letter: 편지글 형식
 * - footnote: 각주 또는 주석
 * - image: 삽화나 그림
 */
export type ContentType =
    | 'heading_1'
    | 'heading_2'
    | 'heading_3'
    | 'paragraph'
    | 'quote'
    | 'poetry'
    | 'letter'
    | 'footnote'
    | 'image';

/**
 * 책 콘텐츠 아이템의 스타일 속성
 * (기본값인 경우 객체 자체가 생략됨)
 */
export interface ContentStyle {
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    size?: 'small' | 'medium' | 'large';
}

/**
 * 책 콘텐츠 개별 아이템 (문단, 제목, 대화문 등)
 */
export interface BookContentItem {
    id: string;           // "p_0001" 형태의 고유 ID
    type: ContentType;    // 콘텐츠 타입
    text: string;         // 텍스트 내용
    speaker: string;      // 화자 (대사는 인물명, 지문은 '나레이션')
    img_url?: string;     // type이 'image'인 경우에만 사용
    style?: ContentStyle; // 기본값이 아닌 경우에만 존재
}

/**
 * 책 콘텐츠 전체 구조 (챕터별 JSON 파일)
 */
export interface BookContent {
    book_name: string;           // 책 제목
    series_info: string | null;  // 시리즈 정보
    chapter: number | null;      // 챕터 번호
    chapter_name: string | null; // 챕터 제목
    author: string | null;       // 작가명
    translator: string | null;   // 번역가
    publisher: string | null;    // 출판사
    published_date: string | null; // 출판일
    categories: string[];        // 장르 배열
    paragraphs: number;          // 총 문단 수
    speakers: string[];          // 등장인물 및 나레이터 목록
    summary: string;             // 줄거리 요약
    content: BookContentItem[];  // 본문 콘텐츠 배열
}

/**
 * 챕터 정보 (백엔드 ChapterResponseDTO와 일치)
 */
export interface Chapter {
    chapterId: number;
    bookId: number;
    chapterName: string;
    sequence: number;
    bookContentPath: string;
    bookContent: BookContent | null;
    paragraphs: number;
}

// ==================== URL 변환 및 외부 콘텐츠 로딩 함수 ====================

/**
 * Google Drive 공유 URL을 직접 다운로드 URL로 변환
 * 
 * @param url Google Drive 공유 URL
 * @returns 변환된 다운로드 URL
 * 
 * @example
 * // 입력: https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
 * // 출력: https://drive.google.com/uc?export=download&id=1ABC123xyz
 */
export const convertGoogleDriveUrl = (url: string): string => {
    // 형식: https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }

    // Google Drive open URL 형식도 지원
    // 형식: https://drive.google.com/open?id={FILE_ID}
    const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch) {
        return `https://drive.google.com/uc?export=download&id=${openIdMatch[1]}`;
    }

    return url; // 변환 불가시 원본 반환
};

/**
 * AWS S3 URL인지 확인하고 유효성 검사
 * 
 * @param url 확인할 URL
 * @returns S3 URL 여부
 */
export const isS3Url = (url: string): boolean => {
    // S3 URL 패턴: https://{bucket}.s3.{region}.amazonaws.com/...
    // 또는: https://s3.{region}.amazonaws.com/{bucket}/...
    return /\.s3\.[a-z0-9-]+\.amazonaws\.com/.test(url) ||
        /s3\.[a-z0-9-]+\.amazonaws\.com\//.test(url);
};

/**
 * 외부 URL에서 책 콘텐츠 JSON을 가져와 파싱
 * 
 * @param url 책 콘텐츠 JSON이 저장된 URL (S3 또는 Google Drive)
 * @returns 파싱된 BookContent 객체
 * @throws Error 콘텐츠 로드 실패 시
 * 
 * @example
 * const content = await fetchBookContentFromUrl('https://drive.google.com/file/d/1ABC/view');
 * console.log(content.book_name); // "만세전"
 */
export const fetchBookContentFromUrl = async (url: string): Promise<BookContent> => {
    // URL 종류에 따라 적절히 변환
    let fetchUrl = url;

    // Google Drive URL 변환
    if (url.includes('drive.google.com')) {
        fetchUrl = convertGoogleDriveUrl(url);
    }

    // S3 URL은 그대로 사용 (CORS 설정 필요)
    // 로컬 파일 경로도 그대로 사용 (백엔드 프록시 경유)

    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: 콘텐츠를 불러올 수 없습니다.`);
        }

        const data: BookContent = await response.json();

        // 기본 유효성 검사
        if (!data.content || !Array.isArray(data.content)) {
            throw new Error('잘못된 책 콘텐츠 형식입니다.');
        }

        return data;
    } catch (error) {
        console.error('책 콘텐츠 로드 실패:', error);
        throw error;
    }
};

/**
 * BookContent 객체에서 전체 텍스트 추출 (검색용)
 * 
 * @param content BookContent 객체
 * @returns 전체 텍스트 문자열
 */
export const extractFullText = (content: BookContent): string => {
    return content.content
        .filter(item => item.type !== 'image')
        .map(item => item.text)
        .join('\n\n');
};

/**
 * BookContent 객체에서 특정 타입의 아이템만 필터링
 * 
 * @param content BookContent 객체
 * @param types 필터링할 콘텐츠 타입 배열
 * @returns 필터링된 아이템 배열
 */
export const filterContentByType = (
    content: BookContent,
    types: ContentType[]
): BookContentItem[] => {
    return content.content.filter(item => types.includes(item.type));
};

// ==================== Chapter Service ====================

export const chapterService = {
    // 책의 챕터 목록 조회
    getChaptersByBook: async (bookId: number): Promise<Chapter[]> => {
        const response = await api.get<Chapter[]>(`/v1/chapters/book/${bookId}`);
        return response.data;
    },

    // 챕터 상세 조회 (본문 포함)
    getChapter: async (chapterId: number): Promise<Chapter> => {
        const response = await api.get<Chapter>(`/v1/chapters/${chapterId}`);
        return response.data;
    },

    // 챕터 URL 조회 (본문 미포함)
    getChapterUrl: async (chapterId: number): Promise<Chapter> => {
        const response = await api.get<Chapter>(`/v1/chapters/${chapterId}/url`);
        return response.data;
    },
};

export default chapterService;
