import { useAuth, LEVEL_INFO } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { MapPin, TreeDeciduous, Mountain, Castle, CloudSun } from 'lucide-react';

// 레벨별 지역 배경 그라데이션과 아이콘
const LEVEL_REGIONS: Record<number, {
    gradient: string;
    icon: React.ReactNode;
    bgElements: React.ReactNode;
}> = {
    1: {
        gradient: 'from-green-100 via-green-200 to-yellow-100',
        icon: <TreeDeciduous className="w-8 h-8 text-green-600" />,
        bgElements: (
            <>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-400/30 to-transparent" />
                <div className="absolute bottom-10 left-10 w-16 h-20 bg-green-500/40 rounded-full blur-sm" />
                <div className="absolute bottom-10 right-16 w-12 h-16 bg-green-600/30 rounded-full blur-sm" />
            </>
        )
    },
    2: {
        gradient: 'from-green-200 via-emerald-200 to-teal-100',
        icon: <TreeDeciduous className="w-8 h-8 text-emerald-600" />,
        bgElements: (
            <>
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-500/30 to-transparent" />
                <div className="absolute bottom-8 left-8 w-20 h-28 bg-emerald-600/40 rounded-t-full" />
                <div className="absolute bottom-8 right-12 w-16 h-24 bg-green-600/40 rounded-t-full" />
                <div className="absolute bottom-8 left-1/3 w-14 h-20 bg-teal-500/30 rounded-t-full" />
            </>
        )
    },
    3: {
        gradient: 'from-emerald-200 via-green-300 to-emerald-200',
        icon: <TreeDeciduous className="w-8 h-8 text-green-700" />,
        bgElements: (
            <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-green-400/20 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-green-600/40 to-transparent" />
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bottom-6 bg-green-700/50 rounded-t-full"
                        style={{
                            left: `${10 + i * 12}%`,
                            width: `${16 + (i % 3) * 6}px`,
                            height: `${40 + (i % 4) * 15}px`
                        }}
                    />
                ))}
            </>
        )
    },
    4: {
        gradient: 'from-green-300 via-emerald-400 to-green-400',
        icon: <TreeDeciduous className="w-8 h-8 text-green-800" />,
        bgElements: (
            <>
                <div className="absolute inset-0 bg-gradient-to-b from-green-900/10 to-green-700/30" />
                <div className="absolute top-10 left-10 w-32 h-32 bg-green-600/20 rounded-full blur-2xl" />
                <div className="absolute top-20 right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl" />
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bottom-4 bg-green-800/60 rounded-t-full"
                        style={{
                            left: `${5 + i * 8}%`,
                            width: `${20 + (i % 4) * 8}px`,
                            height: `${60 + (i % 5) * 20}px`
                        }}
                    />
                ))}
            </>
        )
    },
    5: {
        gradient: 'from-emerald-400 via-green-500 to-emerald-500',
        icon: <TreeDeciduous className="w-8 h-8 text-white" />,
        bgElements: (
            <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200/20 via-transparent to-transparent" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-300/10 rounded-full blur-3xl animate-pulse" />
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bottom-2 bg-green-900/70 rounded-t-full shadow-lg"
                        style={{
                            left: `${3 + i * 6.5}%`,
                            width: `${24 + (i % 5) * 10}px`,
                            height: `${80 + (i % 6) * 25}px`
                        }}
                    />
                ))}
            </>
        )
    },
    6: {
        gradient: 'from-purple-200 via-indigo-200 to-blue-200',
        icon: <Mountain className="w-8 h-8 text-indigo-600" />,
        bgElements: (
            <>
                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[100px] border-r-[100px] border-b-[150px] border-l-transparent border-r-transparent border-b-purple-400/40" />
                <div className="absolute bottom-0 right-10 w-0 h-0 border-l-[80px] border-r-[80px] border-b-[120px] border-l-transparent border-r-transparent border-b-indigo-400/40" />
                <div className="absolute bottom-0 left-1/3 w-0 h-0 border-l-[120px] border-r-[120px] border-b-[180px] border-l-transparent border-r-transparent border-b-blue-400/30" />
                <div className="absolute top-10 left-10 w-20 h-10 bg-white/40 rounded-full blur-md" />
                <div className="absolute top-20 right-20 w-16 h-8 bg-white/30 rounded-full blur-md" />
            </>
        )
    },
    7: {
        gradient: 'from-cyan-300 via-blue-400 to-indigo-400',
        icon: <Mountain className="w-8 h-8 text-cyan-100" />,
        bgElements: (
            <>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-cyan-600/30" />
                <div className="absolute top-20 left-1/4 w-40 h-40 bg-cyan-200/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-10 right-1/4 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl" />
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-cyan-300/30 rounded-full animate-pulse"
                        style={{
                            top: `${20 + i * 10}%`,
                            left: `${10 + i * 15}%`,
                            width: `${8 + i * 2}px`,
                            height: `${8 + i * 2}px`,
                            animationDelay: `${i * 0.5}s`
                        }}
                    />
                ))}
            </>
        )
    },
    8: {
        gradient: 'from-amber-200 via-yellow-200 to-orange-200',
        icon: <Castle className="w-8 h-8 text-amber-700" />,
        bgElements: (
            <>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                    <div className="w-32 h-48 bg-amber-600/50 relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[30px] border-l-transparent border-r-transparent border-b-amber-700/60" />
                        <div className="absolute -left-8 top-0 w-8 h-32 bg-amber-500/50" />
                        <div className="absolute -right-8 top-0 w-8 h-32 bg-amber-500/50" />
                    </div>
                </div>
                <div className="absolute top-10 right-10 w-12 h-12 bg-yellow-400/40 rounded-full blur-lg animate-pulse" />
            </>
        )
    },
    9: {
        gradient: 'from-sky-200 via-blue-200 to-indigo-200',
        icon: <CloudSun className="w-8 h-8 text-sky-600" />,
        bgElements: (
            <>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-sky-300/20" />
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white/60 rounded-full blur-sm animate-float"
                        style={{
                            top: `${15 + i * 15}%`,
                            left: `${10 + i * 20}%`,
                            width: `${40 + i * 10}px`,
                            height: `${20 + i * 5}px`,
                            animationDelay: `${i * 0.3}s`
                        }}
                    />
                ))}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-40 h-60 bg-gradient-to-t from-amber-300/40 to-sky-100/20 rounded-t-full" />
            </>
        )
    },
    10: {
        gradient: 'from-emerald-300 via-green-400 to-teal-400',
        icon: <TreeDeciduous className="w-8 h-8 text-yellow-300" />,
        bgElements: (
            <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200/40 via-green-300/20 to-transparent" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-80 bg-amber-700/60 rounded-t-lg" />
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-green-500/40 rounded-full"
                        style={{
                            top: `${10 + (i % 4) * 15}%`,
                            left: `${20 + (i % 8) * 8}%`,
                            width: `${60 + (i % 3) * 20}px`,
                            height: `${40 + (i % 3) * 15}px`
                        }}
                    />
                ))}
            </>
        )
    }
};

export function LevelRegion() {
    const { user, isAuthenticated } = useAuth();

    const level = isAuthenticated && user ? user.level : 1;
    const levelInfo = LEVEL_INFO[level] || LEVEL_INFO[1];
    const regionData = LEVEL_REGIONS[level] || LEVEL_REGIONS[1];

    // 현재 레벨 경험치 계산
    const expThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    const currentExp = user?.experience || 0;
    const currentLevelExp = expThresholds[level - 1];
    const nextLevelExp = expThresholds[level] || expThresholds[expThresholds.length - 1];
    const progress = ((currentExp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

    return (
        <Card className="relative overflow-hidden h-full min-h-[500px] border-0 shadow-2xl">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${regionData.gradient}`} />

            {/* Background elements */}
            {regionData.bgElements}

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col p-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-3">
                        <MapPin className="w-4 h-4 text-forest-600" />
                        <span className="font-medium text-forest-800">{levelInfo.region}</span>
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-forest-900 drop-shadow-sm">
                        {isAuthenticated ? `Lv.${level} ${levelInfo.title}` : '모험을 시작하세요'}
                    </h2>
                </div>

                {/* Character Area */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative">
                        {/* Character placeholder */}
                        <div className="w-24 h-24 bg-gradient-to-br from-forest-400 to-forest-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-bounce-slow">
                            {regionData.icon}
                        </div>

                        {/* Level badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 font-bold text-sm px-3 py-1 rounded-full shadow-lg">
                            Lv.{level}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-auto">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-forest-700">
                                {isAuthenticated ? '다음 레벨까지' : '로그인하고 성장하세요'}
                            </span>
                            <span className="text-sm font-bold text-forest-800">
                                {isAuthenticated ? `${currentExp} / ${nextLevelExp} EXP` : '?? EXP'}
                            </span>
                        </div>
                        <div className="h-3 bg-forest-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: isAuthenticated ? `${Math.min(progress, 100)}%` : '0%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
