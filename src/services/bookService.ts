import api from './api';

// ==================== Types ====================

export interface Book {
    bookId: number;
    categoryId: number;
    title: string;
    author: string;
    isAdultOnly: boolean;
    summary: string;
    publisher: string;
    publishedDate: string;
    coverUrl: string;
    viewPermission: 'FREE' | 'PREMIUM' | 'ADMIN';
    price: number;
    language: string;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    categoryId: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface BookRequest {
    categoryId: number;
    title: string;
    author: string;
    isAdultOnly: boolean;
    summary: string;
    publisher: string;
    publishedDate: string;
    coverUrl: string;
    viewPermission: 'FREE' | 'PREMIUM' | 'ADMIN';
    price: number;
    language: string;
}

// ==================== Book Service ====================

export const bookService = {
    // 도서 목록 조회 (페이징)
    getBooks: async (page = 0, size = 12): Promise<PageResponse<Book>> => {
        const response = await api.get<PageResponse<Book>>('/v1/books', {
            params: { page, size },
        });
        return response.data;
    },

    // 도서 검색
    searchBooks: async (keyword: string, page = 0, size = 12): Promise<PageResponse<Book>> => {
        const response = await api.get<PageResponse<Book>>('/v1/books/search', {
            params: { keyword, page, size },
        });
        return response.data;
    },

    // 도서 단건 조회
    getBook: async (bookId: number): Promise<Book> => {
        const response = await api.get<Book>(`/v1/books/${bookId}`);
        return response.data;
    },

    // [관리자] 도서 등록
    createBook: async (request: BookRequest): Promise<number> => {
        const response = await api.post<number>('/v1/books', request);
        return response.data;
    },

    // [관리자] 도서 수정
    updateBook: async (bookId: number, request: BookRequest): Promise<string> => {
        const response = await api.put<string>(`/v1/books/${bookId}`, request);
        return response.data;
    },

    // [관리자] 도서 삭제
    deleteBook: async (bookId: number): Promise<void> => {
        await api.delete(`/v1/books/${bookId}`);
    },

    // 구매한 도서 목록 조회
    getPurchasedBooks: async (): Promise<Book[]> => {
        const response = await api.get<Book[]>('/v1/books/purchased');
        return response.data;
    },

    // 취향 기반 도서 추천
    getRecommendedBooks: async (page = 0, size = 6): Promise<PageResponse<BookRecommendation>> => {
        const response = await api.get<PageResponse<BookRecommendation>>('/v1/book-vectors/search', {
            params: { page, size },
        });
        return response.data;
    },
};

export interface BookRecommendation extends Book {
    score: number;
}

// ==================== Category Service ====================

export const categoryService = {
    // 카테고리 목록 조회
    getCategories: async (page = 0, size = 50): Promise<PageResponse<Category>> => {
        const response = await api.get<PageResponse<Category>>('/v1/categories', {
            params: { page, size },
        });
        return response.data;
    },

    // 카테고리 단건 조회
    getCategory: async (categoryId: number): Promise<Category> => {
        const response = await api.get<Category>(`/v1/categories/${categoryId}`);
        return response.data;
    },
};

export default bookService;
