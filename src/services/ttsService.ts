// src/services/ttsService.ts
import axios from 'axios';

// 백엔드 URL 설정 (환경변수나 상수로 관리 권장)
const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface TtsResponse {
    url: string;         // S3 Presigned URL
    paragraph_id: string;
}

export type VoiceType = 'SEONBI' | 'BORAM' | 'YUNA' | 'KYEON' | 'BITNA';

// VoiceType을 Luxia Voice ID로 매핑
const voiceTypeToId: Record<VoiceType, number> = {
    'SEONBI': 76,
    'BORAM': 2,
    'YUNA': 5,
    'KYEON': 7,
    'BITNA': 8
};

export const ttsService = {
    // 문단 ID로 오디오 URL 요청 (voiceType 추가)
    getAudioUrl: async (paragraphId: string, voiceType: VoiceType = 'SEONBI'): Promise<string> => {
        try {
            const voiceId = voiceTypeToId[voiceType];
            const response = await axios.get<TtsResponse>(
                `${API_BASE_URL}/tts/play/${paragraphId}`,
                {
                    params: { voice_id: voiceId }
                }
            );
            return response.data.url;
        } catch (error) {
            console.error('TTS Audio fetch failed:', error);
            throw error;
        }
    }
};