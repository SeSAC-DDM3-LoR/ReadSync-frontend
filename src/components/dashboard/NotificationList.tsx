
import { User, BellRing } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';

export function NotificationList() {
    const notis = [
        { user: '책벌레', action: '"해리포터"를 완독했습니다!', time: '10분 전' },
        { user: '모험왕', action: '레벨 5를 달성했습니다.', time: '30분 전' },
        { user: '독서왕', action: '새 리뷰를 남겼습니다.', time: '1시간 전' },
        { user: '판타지러버', action: '"나니아 연대기"를 시작했습니다.', time: '2시간 전' },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>
                    <BellRing className="w-5 h-5 text-blue-500" />
                    이웃 소식
                </CardTitle>
            </CardHeader>
            <div className="space-y-4">
                {notis.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-forest-50 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0 text-forest-600">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-700 mr-2">
                                <span className="font-bold text-forest-800">{n.user}</span>님이 {n.action}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
