import api from './api';

// ==================== Request DTOs ====================

export interface SocialLoginRequest {
    provider: 'GOOGLE' | 'KAKAO' | 'NAVER';
    providerId: string;
    email: string;
    nickname: string;
    profileImage?: string;
}

export interface AdminLoginRequest {
    loginId: string;
    password: string;
}

export interface AdminSignupRequest {
    loginId: string;
    password: string;
    nickname: string;
}

export interface UpdateProfileRequest {
    nickname: string;
    preferredGenre: string;
    profileImage?: string;
}

// ==================== Response DTOs ====================

export interface UserDetail {
    userId: number;
    nickname: string | null;
    tag: string | null;  // 4자리 태그 (예: "1234")
    profileImage: string | null;
    role: string; // "USER" | "ADMIN"
    status: string;
    levelId: number;
    experience: number;
    preferredGenre: string | null;
    readBookCount: number;
    reviewCount: number;
    totalCredit: number;
}

export interface UserLoginResponse {
    accessToken: string;
    refreshToken: string;
    detail: UserDetail;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface UserProfile {
    userId: number;
    nickname: string;
    tag: string;
    profileImage: string | null;
    role: string; // "USER" | "ADMIN"
    status: string; // "ACTIVE" | "BANNED" | "WITHDRAWN"
    levelId: number;
    experience: number;
    preferredGenre: string;
    providerId: string;
    readBookCount: number;
    reviewCount: number;
    totalCredit: number;
}

// ==================== Auth Service ====================

export const authService = {
    /**
     * 관리자 로그인 (이메일/비밀번호)
     */
    adminLogin: async (request: AdminLoginRequest): Promise<UserLoginResponse> => {
        const response = await api.post<UserLoginResponse>('/v1/auth/login', request);
        return response.data;
    },

    /**
     * 관리자 회원가입
     */
    adminSignup: async (request: AdminSignupRequest): Promise<UserLoginResponse> => {
        const response = await api.post<UserLoginResponse>('/v1/auth/admin/signup', request);
        return response.data;
    },

    /**
     * 토큰 갱신
     */
    reissueToken: async (refreshToken: string): Promise<TokenResponse> => {
        const response = await api.post<TokenResponse>('/v1/auth/reissue', { refreshToken });
        return response.data;
    },

    /**
     * 로그아웃
     */
    logout: async (): Promise<void> => {
        try {
            await api.post('/v1/auth/logout');
        } catch (error) {
            console.error('Logout API error:', error);
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    /**
     * 현재 유저 정보 조회
     */
    getCurrentUser: async (): Promise<UserProfile> => {
        const response = await api.get<UserProfile>('/v1/users/me');
        return response.data;
    },

    /**
     * 프로필 업데이트 (온보딩 - 닉네임, 선호 장르)
     */
    updateProfile: async (request: UpdateProfileRequest): Promise<UserProfile> => {
        const response = await api.patch<UserProfile>('/v1/users/me', request);
        return response.data;
    },

    /**
     * OAuth 리다이렉트 URL 가져오기
     * 직접 백엔드 서버로 연결 (Vercel 프록시 우회)
     */
    getOAuthUrl: (provider: 'google' | 'kakao' | 'naver'): string => {
        // Vercel 환경변수 VITE_API_BASE_URL 사용, 없으면 프로덕션 기본값
        const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://readsync.kro.kr/api';
        return `${backendUrl}/oauth2/authorization/${provider}`;
    },

    /**
     * 토큰을 로컬 스토리지에 저장
     */
    saveTokens: (accessToken: string, refreshToken: string): void => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    },

    /**
     * 저장된 토큰 가져오기
     */
    getAccessToken: (): string | null => {
        return localStorage.getItem('accessToken');
    },

    getRefreshToken: (): string | null => {
        return localStorage.getItem('refreshToken');
    },

    /**
     * 로그인 여부 확인
     */
    isLoggedIn: (): boolean => {
        return !!localStorage.getItem('accessToken');
    },

    /**
     * 이미지 업로드
     */
    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<string>('/v1/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default authService;
