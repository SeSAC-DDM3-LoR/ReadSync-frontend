import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';
import type { UserDetail } from '../services/authService';

// 인증 스토어 상태
interface AuthState {
    user: UserDetail | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: UserDetail) => void;
    updateUser: (updates: Partial<UserDetail>) => void;
    logout: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    checkAuth: () => boolean;
    fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // 유저 정보 설정
            setUser: (user: UserDetail) => {
                set({
                    user,
                    isAuthenticated: true,
                    error: null,
                });
            },

            // 유저 정보 부분 업데이트
            updateUser: (updates: Partial<UserDetail>) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({
                        user: { ...currentUser, ...updates },
                    });
                }
            },

            // 로그아웃
            logout: async () => {
                try {
                    await authService.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({
                        user: null,
                        isAuthenticated: false,
                    });
                }
            },

            setLoading: (loading: boolean) => set({ isLoading: loading }),
            setError: (error: string | null) => set({ error }),

            // 인증 상태 확인
            checkAuth: () => {
                const token = authService.getAccessToken();
                const { user } = get();
                const isAuthenticated = !!token && !!user;
                set({ isAuthenticated });
                return isAuthenticated;
            },

            // 현재 유저 정보 가져오기
            fetchCurrentUser: async () => {
                const token = authService.getAccessToken();
                if (!token) {
                    set({ user: null, isAuthenticated: false });
                    return;
                }

                try {
                    set({ isLoading: true });
                    const currentUser = get().user;
                    const profile = await authService.getCurrentUser();

                    // 정지된 유저 체크
                    if (profile.status === 'BANNED') {
                        alert('현재 이용이 정지된 아이디입니다.\n고객센터로 문의 부탁드립니다.');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        set({ user: null, isAuthenticated: false, isLoading: false });
                        window.location.href = '/login';
                        return;
                    }

                    // 탈퇴한 유저 체크
                    if (profile.status === 'WITHDRAWN') {
                        alert('탈퇴한 계정입니다.\n새로운 계정으로 가입해 주세요.');
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        set({ user: null, isAuthenticated: false, isLoading: false });
                        window.location.href = '/login';
                        return;
                    }

                    set({
                        user: {
                            userId: profile.userId,
                            nickname: profile.nickname,
                            tag: profile.tag,
                            profileImage: profile.profileImage,
                            role: profile.role || currentUser?.role || 'USER',
                            status: profile.status || 'ACTIVE',
                            levelId: profile.levelId || 1,
                            experience: profile.experience || 0,
                            preferredGenre: profile.preferredGenre,
                            readBookCount: profile.readBookCount || 0,
                            reviewCount: profile.reviewCount || 0,
                            totalCredit: profile.totalCredit || 0,
                        },
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage', // localStorage 키 이름
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;
