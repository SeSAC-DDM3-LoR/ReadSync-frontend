
import { Flame, Sparkles, Sword, Star, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { NotificationList } from './NotificationList';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

function BookItem({ title, author, index }: { title: string, author: string, index: number }) {
    return (
        <div className="w-full group cursor-pointer">
            <div className="aspect-[3/4] bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-300 shadow-sm border border-slate-200 group-hover:-translate-y-1 transition-transform duration-200 relative overflow-hidden">
                <span className="text-2xl font-serif text-slate-300">?</span>
                {/* Mock Cover Gradient */}
                <div className={clsx("absolute inset-0 opacity-20",
                    index % 4 === 0 ? "bg-red-500" :
                        index % 4 === 1 ? "bg-blue-500" :
                            index % 4 === 2 ? "bg-green-500" : "bg-purple-500"
                )} />
            </div>
            <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-forest-700">{title} {index + 1}</h4>
            <p className="text-xs text-slate-500 line-clamp-1">{author}</p>
        </div>
    )
}

function Section({ title, icon: Icon, books, className, iconColor }: any) {
    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-4 text-forest-900 font-bold text-lg border-l-4 border-forest-500 pl-3">
                <Icon className={clsx("w-5 h-5", iconColor)} />
                {title}
            </div>
            <div className="grid grid-cols-4 gap-3">
                {books.map((b: any, i: number) => <BookItem key={i} {...b} index={i} />)}
            </div>
        </div>
    )
}

export function RightSidebar() {
    return (
        <div className="space-y-6 flex flex-col h-full">
            <NotificationList />

            <Card className="w-full flex-1">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4 mb-6">
                    <CardTitle className="text-lg">📚 추천 도서</CardTitle>
                    <Link to="#" className="text-xs text-forest-600 hover:text-forest-800 flex items-center gap-1 font-medium transition-colors">
                        서재 가기 <ArrowRight className="w-3 h-3" />
                    </Link>
                </CardHeader>

                <div className="space-y-10">
                    <Section title="지금 가장 핫한 책" icon={Flame} iconColor="text-orange-500"
                        books={Array(4).fill({ title: '인기도서', author: '작가 A' })}
                    />
                    <Section title="모험가님을 위한 AI 추천" icon={Sparkles} iconColor="text-purple-500"
                        books={Array(4).fill({ title: 'AI 추천', author: 'AI 큐레이터' })}
                    />
                    <Section title="판타지 장르 베스트" icon={Sword} iconColor="text-blue-600"
                        books={Array(4).fill({ title: '판타지', author: '작가 B' })}
                    />
                    <Section title="이번 주 신간" icon={Star} iconColor="text-yellow-500"
                        books={Array(4).fill({ title: '신간', author: '작가 C' })}
                    />
                </div>
            </Card>
        </div>
    )
}
