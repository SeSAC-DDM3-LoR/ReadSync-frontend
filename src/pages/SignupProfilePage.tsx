import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { User, Mail, BookOpen, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignupForm {
    nickname: string;
    preferredGenre: string;
}

export function SignupProfilePage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: SignupForm) => {
        setIsLoading(true);
        try {
            // 프로필 업데이트 API 호출 (PATCH /v1/users/me)
            await api.patch('/users/me', {
                nickname: data.nickname,
                preferredGenre: data.preferredGenre
            });

            // 유저 정보 갱신
            await refreshUser();

            // 원래 가려던 곳으로 이동
            const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
            sessionStorage.removeItem('redirectUrl');
            navigate(redirectUrl, { replace: true });
        } catch (error) {
            console.error('Signup failed:', error);
            alert('회원가입 처리에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-forest-50 py-12 px-4 flex items-center justify-center">
            <Card className="max-w-md w-full p-8 border-forest-100 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest-100 text-forest-600 mb-4 animate-bounce">
                        <Crown className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-forest-900">환영합니다!</h1>
                    <p className="text-forest-600 mt-2">ReadSync에서 사용할 프로필을 설정해주세요.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Nickname */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-forest-700 ml-1 flex items-center gap-2">
                            <User className="w-4 h-4" /> 닉네임
                        </label>
                        <input
                            {...register('nickname', {
                                required: '닉네임을 입력해주세요',
                                minLength: { value: 2, message: '2글자 이상 입력해주세요' },
                                maxLength: { value: 10, message: '10글자 이내로 입력해주세요' }
                            })}
                            className="w-full px-4 py-3 rounded-xl border border-forest-200 focus:outline-none focus:ring-2 focus:ring-forest-500/50 focus:border-forest-500 transition-all bg-white"
                            placeholder="멋진 별명을 지어주세요"
                        />
                        {errors.nickname && (
                            <p className="text-xs text-red-500 ml-1">{errors.nickname.message}</p>
                        )}
                    </div>

                    {/* Preferred Genre */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-forest-700 ml-1 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> 선호 장르
                        </label>
                        <select
                            {...register('preferredGenre', { required: '선호 장르를 선택해주세요' })}
                            className="w-full px-4 py-3 rounded-xl border border-forest-200 focus:outline-none focus:ring-2 focus:ring-forest-500/50 focus:border-forest-500 transition-all bg-white"
                        >
                            <option value="">장르를 선택해주세요</option>
                            <option value="소설">소설</option>
                            <option value="인문">인문</option>
                            <option value="경영/경제">경영/경제</option>
                            <option value="자기계발">자기계발</option>
                            <option value="과학">과학</option>
                            <option value="예술">예술</option>
                            <option value="역사">역사</option>
                        </select>
                        {errors.preferredGenre && (
                            <p className="text-xs text-red-500 ml-1">{errors.preferredGenre.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-6 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? '저장 중...' : 'ReadSync 시작하기'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
