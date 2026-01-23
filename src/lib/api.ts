import axios from 'axios';

// Base URL configuration
export const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 쿠키 기반 인증 지원
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 에러이고 재시도하지 않은 요청인 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // 토큰 갱신 시도
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post('http://localhost:8080/v1/auth/reissue', {
                        refreshToken
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    // 원래 요청 재시도
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // 갱신 실패 시 로그아웃
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// --- Schema Interfaces ---

export interface Book {
    bookId: number;
    categoryId: number;
    title: string;
    author: string;
    isAdultOnly: boolean;
    summary: string;
    publisher?: string;
    publishedDate?: string;
    coverUrl: string;
    viewPermission: 'FREE' | 'ADMIN' | 'PREMIUM' | 'NOBODY';
    price: number;
    language: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface LibraryItem {
    libraryId: number;
    bookId: number;
    title: string;
    author: string;
    coverUrl: string;
    type: 'OWNED' | 'RENTED';
    readingStatus: 'READING' | 'COMPLETED' | 'STOPPED';
    totalProgress: number;
    createdAt: string;
}

export interface User {
    userId: number;
    loginId: string;
    role: 'USER' | 'ADMIN';
    status: string;
}

export interface UserInfo {
    userInformationId: number;
    userId: number;
    userName: string;
    experience: number;
    preferredGenre: string;
    profileImage?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        userId: number;
        loginId: string;
        userName: string;
        role: 'USER' | 'ADMIN';
    };
}

export interface ExpInfo {
    userId: number;
    totalExp: number;
    level: number;
    levelTitle: string;
}

export interface Category {
    categoryId: number;
    categoryName: string;
    description?: string;
}

export interface Review {
    reviewId: number;
    bookId: number;
    userId: number;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
}
