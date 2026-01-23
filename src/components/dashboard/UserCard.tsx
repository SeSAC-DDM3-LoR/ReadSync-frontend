
import { User, Book, Clock } from 'lucide-react';
import { Card } from '../ui/Card';

export function UserCard() {
    return (
        <Card className="w-full shadow-lg border-2 border-forest-100/50">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-forest-500 to-forest-700 rounded-2xl flex items-center justify-center text-white shadow-md transform rotate-3 hover:rotate-0 transition-transform">
                        <User className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-forest-900">방문자</h3>
                        <p className="text-sm font-medium text-forest-600">Lv.6 모험가</p>
                    </div>
                </div>
                <button className="flex flex-col items-center group">
                    <div className="bg-orange-500 group-hover:bg-orange-600 transition-colors text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm">
                        READ <span className="opacity-80 font-normal">(+Exp)</span>
                    </div>
                    <span className="text-[10px] font-bold text-forest-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">+10 EXP</span>
                </button>
            </div>

            <div className="mb-6 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-forest-900 tracking-wide">
                    <span>EXP</span>
                    <span>700 / 1400</span>
                </div>
                <div className="h-3 w-full bg-forest-100 rounded-full overflow-hidden p-[2px]">
                    <div className="h-full bg-gradient-to-r from-forest-400 to-forest-600 w-1/2 rounded-full shadow-sm" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-forest-50/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center border border-forest-100 hover:bg-forest-100/80 transition-colors cursor-pointer group">
                    <div className="p-2 bg-white rounded-full text-forest-500 group-hover:text-forest-600 group-hover:scale-110 transition-all shadow-sm">
                        <Book className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-forest-500">읽은 책</span>
                        <span className="font-bold text-lg text-forest-900">0권</span>
                    </div>
                </div>
                <div className="bg-forest-50/80 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center border border-forest-100 hover:bg-forest-100/80 transition-colors cursor-pointer group">
                    <div className="p-2 bg-white rounded-full text-forest-500 group-hover:text-forest-600 group-hover:scale-110 transition-all shadow-sm">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-forest-500">독서 시간</span>
                        <span className="font-bold text-lg text-forest-900">0분</span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
