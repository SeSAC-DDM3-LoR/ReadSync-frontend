// src/services/ttsService.ts
import axios from 'axios';

// 백엔드 URL 설정 (환경변수나 상수로 관리 권장)
const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface TtsResponse {
    url: string;         // S3 Presigned URL
    paragraph_id: string;
}

export const ttsService = {
    // 문단 ID로 오디오 URL 요청
    getAudioUrl: async (paragraphId: string): Promise<string> => {
        try {
            const response = await axios.get<TtsResponse>(`${API_BASE_URL}/tts/play/${paragraphId}`);
            return response.data.url;
        } catch (error) {
            console.error('TTS Audio fetch failed:', error);
            throw error;
        }
    }
};