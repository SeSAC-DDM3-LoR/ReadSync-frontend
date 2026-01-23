import { UserSidebar } from '../components/dashboard/UserSidebar';
import { LevelRegion } from '../components/dashboard/LevelRegion';
import { BookSection } from '../components/dashboard/BookSection';
import { TTSRooms } from '../components/dashboard/TTSRooms';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Users, BookOpen, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section for non-logged in users */}
            {!isAuthenticated && (
                <div className="relative bg-gradient-to-r from-forest-600 via-forest-500 to-emerald-500 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl shadow-forest-500/20">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            AI가 추천하는 당신만의 책
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                            함께 읽는 즐거움,<br />
                            <span className="text-emerald-200">성장하는 나</span>
                        </h1>
                        <p className="text-lg text-white/80 mb-8 max-w-lg">
                            ReadSync와 함께 독서 여정을 시작하세요.
                            레벨을 올리고, 친구들과 함께 읽고, AI와 대화하세요.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-forest-700 font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                시작하기 <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate('/books')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-medium rounded-full backdrop-blur-sm hover:bg-white/30 transition-all"
                            >
                                <BookOpen className="w-5 h-5" />
                                둘러보기
                            </button>
                        </div>
                    </div>

                    {/* Feature cards */}
                    <div className="relative z-10 grid grid-cols-3 gap-4 mt-10 max-w-md">
                        {[
                            { icon: BookOpen, label: '1,000+ 도서' },
                            { icon: Users, label: '함께 읽기' },
                            { icon: Sparkles, label: 'AI 분석' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white">
                                <item.icon className="w-6 h-6" />
                                <span className="text-xs font-medium text-white/90">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 items-start">
                {/* Left Sidebar - User Info */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="sticky top-24">
                        <UserSidebar />
                    </div>
                </div>

                {/* Center - Level Region */}
                <div className="col-span-12 lg:col-span-5">
                    <div className="sticky top-24">
                        <LevelRegion />
                    </div>
                </div>

                {/* Right - TTS Rooms & Quick Actions */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <TTSRooms />

                        {/* Community Preview */}
                        <Card className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-forest-900">커뮤니티</h4>
                                <span className="text-xs text-forest-500">더보기 →</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { title: '이번 주 인기 책 추천받아요!', replies: 23 },
                                    { title: '해리포터 시리즈 같이 읽을 분', replies: 15 },
                                    { title: '독서 모임 후기 공유합니다', replies: 8 },
                                ].map((post, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-forest-50 rounded-xl hover:bg-forest-100 transition-colors cursor-pointer">
                                        <span className="text-sm text-forest-800 line-clamp-1">{post.title}</span>
                                        <span className="text-xs text-forest-500 whitespace-nowrap ml-2">💬 {post.replies}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Book Section */}
            <BookSection />

            {/* Bottom CTA for guests */}
            {!isAuthenticated && (
                <div className="text-center py-10">
                    <div className="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-forest-50 to-emerald-50 rounded-3xl border-2 border-forest-100">
                        <div className="text-4xl">🌱</div>
                        <h3 className="text-xl font-serif font-bold text-forest-900">
                            당신의 독서 레벨을 확인해보세요
                        </h3>
                        <p className="text-forest-600 max-w-md">
                            로그인하고 AI가 추천하는 맞춤 도서를 만나보세요
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold rounded-full shadow-lg shadow-forest-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            무료로 시작하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
