import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
    userId: number;
    loginId: string;
    userName: string;
    role: 'USER' | 'ADMIN';
    experience: number;
    level: number;
    levelTitle: string;
    profileImage?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (provider: 'kakao' | 'naver' | 'google') => void;
    completeLogin: (accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Level 정보 - 레벨에 따른 지역/타이틀
// Level 정보 - 레벨에 따른 지역/타이틀
export const LEVEL_INFO: Record<number, { title: string; region: string }> = {
    1: { title: '새싹 독서가', region: '초원의 마을' },
    2: { title: '견습 독서가', region: '숲 가장자리' },
    3: { title: '열정 독서가', region: '작은 숲' },
    4: { title: '숙련 독서가', region: '깊은 숲' },
    5: { title: '전문 독서가', region: '숲의 심장' },
    6: { title: '모험가', region: '신비로운 계곡' },
    7: { title: '탐험가', region: '수정 동굴' },
    8: { title: '현자', region: '지혜의 탑' },
    9: { title: '대현자', region: '하늘 도서관' },
    10: { title: '전설의 독서가', region: '세계수 꼭대기' },
};

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setUser(null);
                return;
            }

            const [userRes, expRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/exp/me')
            ]);

            const exp = expRes.data.totalExp || 0;
            const level = getLevelFromExp(exp);
            const levelInfo = LEVEL_INFO[level] || LEVEL_INFO[1];

            setUser({
                userId: userRes.data.userId,
                loginId: userRes.data.loginId,
                userName: userRes.data.userName || '독서가',
                role: userRes.data.role || 'USER',
                experience: exp,
                level,
                levelTitle: levelInfo.title,
                profileImage: userRes.data.profileImage,
            });
        } catch (error) {
            console.warn('Failed to fetch user data:', error);
            setUser(null);
            localStorage.removeItem('accessToken');
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            await refreshUser();
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = (provider: 'kakao' | 'naver' | 'google') => {
        // 소셜 로그인 리다이렉트
        const backendUrl = 'http://localhost:8080';
        window.location.href = `${backendUrl}/api/oauth2/authorization/${provider}`;
    };

    const completeLogin = async (accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        await refreshUser();
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('Logout API failed:', error);
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
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


