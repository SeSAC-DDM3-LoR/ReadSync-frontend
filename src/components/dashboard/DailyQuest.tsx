
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';

export function DailyQuest() {
    const quests = [
        { title: '로그인 하기', reward: 50, completed: true },
        { title: '30분 독서하기', reward: 100, completed: false },
        { title: '커뮤니티 글 1개 쓰기', reward: 30, completed: false },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-forest-800">📜 일일 퀘스트</CardTitle>
            </CardHeader>
            <div className="space-y-3">
                {quests.map((q, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${q.completed ? 'bg-forest-50/50 border-forest-200' : 'bg-white border-forest-100 hover:border-forest-200'}`}>
                        <div className="flex items-center gap-3">
                            {q.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-forest-600" />
                            ) : (
                                <Circle className="w-5 h-5 text-forest-300" />
                            )}
                            <span className={`text-sm font-medium ${q.completed ? 'text-forest-700 line-through opacity-70' : 'text-slate-600'}`}>
                                {q.title}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">+{q.reward} Exp</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
