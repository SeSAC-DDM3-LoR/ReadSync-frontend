import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

// [1] LEVEL_INFO 내보내기 (LevelRegion.tsx 오류 해결)
// region 정보를 포함하여 디자인이 깨지지 않게 수정
export const LEVEL_INFO: Record<number, { title: string; region: string; minExp: number; nextExp: number }> = {
    1: { title: '새싹 독서가', region: '초원의 마을', minExp: 0, nextExp: 100 },
    2: { title: '견습 독서가', region: '숲 가장자리', minExp: 100, nextExp: 300 },
    3: { title: '열정 독서가', region: '작은 숲', minExp: 300, nextExp: 600 },
    4: { title: '숙련 독서가', region: '깊은 숲', minExp: 600, nextExp: 1000 },
    5: { title: '전문 독서가', region: '숲의 심장', minExp: 1000, nextExp: 1500 },
    6: { title: '모험가', region: '신비로운 계곡', minExp: 1500, nextExp: 2100 },
    7: { title: '탐험가', region: '수정 동굴', minExp: 2100, nextExp: 2800 },
    8: { title: '현자', region: '지혜의 탑', minExp: 2800, nextExp: 3600 },
    9: { title: '대현자', region: '하늘 도서관', minExp: 3600, nextExp: 4500 },
    10: { title: '전설의 독서가', region: '세계수 꼭대기', minExp: 4500, nextExp: 99999 },
};

// [2] 함수 내보내기 (LevelRegion.tsx 등에서 사용)
export function getLevelFromExp(exp: number): number {
    if (exp < 100) return 1;
    if (exp < 300) return 2;
    if (exp < 600) return 3;
    if (exp < 1000) return 4;
    if (exp < 1500) return 5;
    if (exp < 2100) return 6;
    if (exp < 2800) return 7;
    if (exp < 3600) return 8;
    if (exp < 4500) return 9;
    return 10;
}

// [3] User 인터페이스 정의 (region, userName 필수 포함)
export interface User {
    userId: number;
    loginId: string;
    userName: string;      // 프론트엔드 호환용 (닉네임)
    email?: string;
    role: 'USER' | 'ADMIN';
    profileImage?: string;
    level: number;
    levelTitle: string;
    region: string;        // 디자인 깨짐 방지용 지역 정보
    experience: number;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: 'kakao' | 'naver' | 'google') => void;
    adminLogin: (loginId: string, password: string) => Promise<void>;
    completeLogin: (accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// [4] AuthProvider Props 타입 수정 (ReactNode 빨간줄 해결)
// React.ReactNode를 사용하여 명시적으로 타입을 지정합니다.
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setUser(null);
                return;
            }

            // 병렬 API 호출
            const [userRes, expRes] = await Promise.allSettled([
                api.get('/users/me'),
                api.get('/exp/me')
            ]);

            let userData: any = {};
            let exp = 0;

            if (userRes.status === 'fulfilled') {
                userData = userRes.value.data;
            } else {
                throw new Error('Failed to fetch user');
            }

            if (expRes.status === 'fulfilled') {
                const data = expRes.value.data;
                if (Array.isArray(data)) {
                    exp = data.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
                } else if (typeof data === 'object' && data !== null) {
                    exp = data.totalExp || data.experience || 0;
                }
            }

            const level = getLevelFromExp(exp);
            const levelInfo = LEVEL_INFO[level] || LEVEL_INFO[1];

            // [5] Role 및 데이터 매핑 (로그인 풀림/디자인 깨짐 방지)
            let userRole: 'USER' | 'ADMIN' = 'USER';
            if (userData.role === 'ADMIN' || userData.role === 'ROLE_ADMIN') {
                userRole = 'ADMIN';
            }

            setUser({
                userId: userData.userId,
                loginId: userData.loginId,
                userName: userData.nickname || userData.userName || userData.name || '독서가',
                email: userData.email,
                role: userRole,
                profileImage: userData.profileImage,
                level,
                levelTitle: levelInfo.title,
                region: levelInfo.region, // 필수 데이터
                experience: exp
            });

        } catch (error) {
            console.warn('Auth check failed:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = (provider: 'kakao' | 'naver' | 'google') => {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        // [6] 소셜 로그인 URL 수정 (/api 경로 확인)
        window.location.href = `${backendUrl}/api/oauth2/authorization/${provider}`;
    };

    const adminLogin = async (loginId: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { loginId, password });
            const { accessToken, refreshToken } = response.data;
            
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            
            await refreshUser();
        } catch (error) {
            console.error('Admin login error:', error);
            throw error;
        }
    };

    const completeLogin = async (accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        await refreshUser();
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // ignore
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            adminLogin,
            completeLogin,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}