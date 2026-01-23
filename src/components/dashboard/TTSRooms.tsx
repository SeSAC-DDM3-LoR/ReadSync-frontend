
import { Mic2, PlayCircle, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';

export function TTSRooms() {
    const rooms = [
        { title: '해리포터 정주행 팟', members: 4, host: '덤블도어' },
        { title: '자기전 시 낭송', members: 8, host: '감성밤' },
        { title: '코스모스 함께 읽기', members: 2, host: '칼세이건' },
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="bg-orange-100 w-fit px-2 py-1 rounded text-orange-700 text-sm">
                    <Mic2 className="w-4 h-4 mr-1 inline" />
                    현재 참여 가능한 TTS 룸
                </CardTitle>
            </CardHeader>
            <div className="space-y-3">
                {rooms.map((room, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-forest-100 bg-white hover:border-forest-300 transition-colors group cursor-pointer shadow-sm">
                        <div>
                            <h4 className="font-bold text-forest-900 text-sm mb-0.5">{room.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="flex items-center gap-0.5">👥 {room.members}명</span>
                                <span>•</span>
                                <span>{room.host}</span>
                            </div>
                        </div>
                        <PlayCircle className="w-8 h-8 text-forest-400 group-hover:text-forest-600 transition-colors" />
                    </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-forest-300 text-forest-600 hover:bg-forest-50 hover:border-solid">
                    <Plus className="w-4 h-4 mr-2" />
                    방 만들기
                </Button>
            </div>
        </Card>
    )
}
