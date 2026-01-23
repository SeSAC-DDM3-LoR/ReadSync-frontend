
import { Trophy, Sprout, Book, Moon, PenTool, Castle, MessageSquare, Award, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';

export function BadgeList() {
    const badges = [
        { name: '첫 걸음', icon: <Sprout className="w-5 h-5 text-green-500" />, acquired: true },
        { name: '다독왕', icon: <Book className="w-5 h-5 text-blue-500" />, acquired: true },
        { name: '밤샘 독서', icon: <Moon className="w-5 h-5 text-yellow-400" />, acquired: true },
        { name: '베스트 리뷰', icon: <PenTool className="w-5 h-5 text-purple-500" />, acquired: false },
        { name: '장르 마스터', icon: <Castle className="w-5 h-5 text-indigo-500" />, acquired: false },
        { name: '수다왕', icon: <MessageSquare className="w-5 h-5 text-pink-500" />, acquired: true }, // Changed from text to icon for consistency
        { name: '100권 돌파', icon: <Award className="w-5 h-5 text-slate-400" />, acquired: false },
        { name: '리더의 품격', icon: <Crown className="w-5 h-5 text-yellow-600" />, acquired: false },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-forest-800">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    내 배지
                </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-4 gap-2">
                {badges.map((badge, i) => (
                    <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 p-2 border ${badge.acquired ? 'bg-white border-forest-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className={`p-2 rounded-full ${badge.acquired ? 'bg-forest-50' : 'bg-slate-200'}`}>
                            {badge.icon}
                        </div>
                        <span className="text-[10px] text-center font-medium text-slate-600 leading-tight">{badge.name}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
