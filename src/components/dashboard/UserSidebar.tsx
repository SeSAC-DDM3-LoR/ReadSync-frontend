import { useAuth } from '../../contexts/AuthContext';
import { User, Book, Clock, LogIn, Flame, Target, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';

export function UserSidebar() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return (
            <Card className="p-6 bg-gradient-to-br from-white to-forest-50 border-2 border-forest-100/50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-forest-100 to-forest-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-10 h-10 text-forest-400" />
                    </div>
                    <h3 className="text-xl font-bold text-forest-900 mb-2">환영합니다!</h3>
                    <p className="text-sm text-forest-600 mb-6">
                        로그인하고 독서 여정을 시작하세요
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-forest-500 to-forest-600 text-white font-medium rounded-xl shadow-lg shadow-forest-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <LogIn className="w-5 h-5" />
                        로그인 / 회원가입
                    </button>
                </div>

                {/* Guest Stats Preview */}
                <div className="mt-6 pt-6 border-t border-forest-100">
                    <p className="text-xs text-forest-500 text-center mb-4">
                        로그인하면 이런 것들을 볼 수 있어요
                    </p>
                    <div className="grid grid-cols-2 gap-3 opacity-50">
                        <div className="bg-forest-50 p-3 rounded-xl text-center">
                            <Book className="w-5 h-5 text-forest-400 mx-auto mb-1" />
                            <span className="text-xs text-forest-600">읽은 책</span>
                        </div>
                        <div className="bg-forest-50 p-3 rounded-xl text-center">
                            <Clock className="w-5 h-5 text-forest-400 mx-auto mb-1" />
                            <span className="text-xs text-forest-600">독서 시간</span>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* User Profile Card */}
            <Card className="p-6 bg-gradient-to-br from-white to-forest-50 border-2 border-forest-100/50 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-forest-500 to-forest-700 rounded-2xl flex items-center justify-center text-white shadow-md transform rotate-3 hover:rotate-0 transition-transform">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                            <User className="w-8 h-8" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-xl text-forest-900">{user?.userName || '독서가'}</h3>
                        <p className="text-sm font-medium text-forest-600">
                            Lv.{user?.level} {user?.levelTitle}
                        </p>
                    </div>
                </div>

                {/* EXP Bar */}
                <div className="mb-6 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-forest-900">
                        <span>EXP</span>
                        <span>{user?.experience || 0} / {((user?.level || 1) + 1) * 500}</span>
                    </div>
                    <div className="h-3 w-full bg-forest-100 rounded-full overflow-hidden p-[2px]">
                        <div
                            className="h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full shadow-sm transition-all duration-500"
                            style={{ width: `${Math.min((user?.experience || 0) / (((user?.level || 1) + 1) * 500) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-forest-50/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center border border-forest-100 hover:bg-forest-100/80 transition-colors cursor-pointer group">
                        <div className="p-2 bg-white rounded-full text-forest-500 group-hover:text-forest-600 group-hover:scale-110 transition-all shadow-sm">
                            <Book className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-forest-500">읽은 책</span>
                            <span className="font-bold text-lg text-forest-900">12권</span>
                        </div>
                    </div>
                    <div className="bg-forest-50/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center border border-forest-100 hover:bg-forest-100/80 transition-colors cursor-pointer group">
                        <div className="p-2 bg-white rounded-full text-forest-500 group-hover:text-forest-600 group-hover:scale-110 transition-all shadow-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-forest-500">독서 시간</span>
                            <span className="font-bold text-lg text-forest-900">48시간</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Daily Quest */}
            <Card className="p-5 border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-400 rounded-lg text-white">
                        <Target className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-amber-900">오늘의 퀘스트</h4>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                        <div className="w-6 h-6 rounded-full border-2 border-amber-400 flex items-center justify-center">
                            <div className="w-3 h-3 bg-amber-400 rounded-full" />
                        </div>
                        <span className="text-sm text-amber-800 flex-1">30분 독서하기</span>
                        <span className="text-xs text-amber-600 font-bold">+50 EXP</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl opacity-60">
                        <div className="w-6 h-6 rounded-full border-2 border-amber-300" />
                        <span className="text-sm text-amber-800 flex-1">리뷰 1개 작성</span>
                        <span className="text-xs text-amber-600 font-bold">+30 EXP</span>
                    </div>
                </div>
            </Card>

            {/* Streak */}
            <Card className="p-5 border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg text-white">
                            <Flame className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-orange-600">연속 독서</p>
                            <p className="text-2xl font-bold text-orange-800">7일 🔥</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Badges Preview */}
            <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-forest-600" />
                        <h4 className="font-bold text-forest-900">획득한 뱃지</h4>
                    </div>
                    <span className="text-xs text-forest-500">3/15</span>
                </div>
                <div className="flex gap-2">
                    {['🌱', '📚', '⭐'].map((badge, i) => (
                        <div
                            key={i}
                            className="w-12 h-12 bg-gradient-to-br from-forest-100 to-forest-200 rounded-xl flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        >
                            {badge}
                        </div>
                    ))}
                    <div className="w-12 h-12 bg-forest-50 rounded-xl flex items-center justify-center text-forest-300 border-2 border-dashed border-forest-200">
                        +12
                    </div>
                </div>
            </Card>
        </div>
    );
}
