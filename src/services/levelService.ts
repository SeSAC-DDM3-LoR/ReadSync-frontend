import api from './api';

// ==================== Level DTOs ====================

export interface Level {
    levelId: number;
    requiredExp: number;
    maxCommentLimit: number;
    canUploadImage: boolean;
}

export interface LevelUpResult {
    leveledUp: boolean;
    previousLevelId: number;
    currentLevelId: number;
    currentExp: number;
    nextLevelExp: number | null;
}

// ==================== Level Service ====================

export const levelService = {
    /**
     * 모든 레벨 정보 조회
     */
    getAllLevels: async (): Promise<Level[]> => {
        const response = await api.get<Level[]>('/levels');
        return response.data;
    },

    /**
     * 특정 레벨 정보 조회
     */
    getLevelById: async (levelId: number): Promise<Level> => {
        const response = await api.get<Level>(`/levels/${levelId}`);
        return response.data;
    },

    /**
     * 경험치로 레벨 조회
     */
    getLevelByExperience: async (experience: number): Promise<Level> => {
        const response = await api.get<Level>('/levels/by-exp', {
            params: { experience }
        });
        return response.data;
    },
};

// ==================== Level Utils ====================

/**
 * 현재 레벨에서 다음 레벨까지 필요한 총 경험치 계산
 */
export const getExpNeededForNextLevel = (currentLevelId: number, levels: Level[]): number => {
    const currentLevel = levels.find(l => l.levelId === currentLevelId);
    const nextLevel = levels.find(l => l.levelId === currentLevelId + 1);

    if (!currentLevel || !nextLevel) {
        return 100; // 기본값
    }

    return nextLevel.requiredExp - currentLevel.requiredExp;
};

/**
 * 현재 경험치의 진행률 계산 (0~100%)
 */
export const getExpProgress = (currentExp: number, currentLevelId: number, levels: Level[]): number => {
    const expNeeded = getExpNeededForNextLevel(currentLevelId, levels);
    if (expNeeded <= 0) return 100; // 최고 레벨

    const progress = (currentExp / expNeeded) * 100;
    return Math.min(Math.max(progress, 0), 100);
};

/**
 * 다음 레벨까지 남은 경험치 계산
 */
export const getExpToNextLevel = (currentExp: number, currentLevelId: number, levels: Level[]): number => {
    const expNeeded = getExpNeededForNextLevel(currentLevelId, levels);
    return Math.max(expNeeded - currentExp, 0);
};

export default levelService;
