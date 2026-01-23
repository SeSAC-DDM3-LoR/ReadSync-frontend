import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type LibraryItem } from '../lib/api';
import { BookOpen, Clock, PlayCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';

const MOCK_LIBRARY: LibraryItem[] = [
    { libraryId: 1, bookId: 1, title: "데이터베이스의 이해", author: "강작가", coverUrl: "", type: "OWNED", readingStatus: 'READING', totalProgress: 45.5, createdAt: new Date().toISOString() },
    { libraryId: 2, bookId: 2, title: "자바 프로그래밍", author: "이코딩", coverUrl: "", type: "OWNED", readingStatus: 'COMPLETED', totalProgress: 100, createdAt: new Date().toISOString() },
];

export function LibraryPage() {
    const [activeTab, setActiveTab] = useState<'READING' | 'COMPLETED'>('READING');

    const { data: libraryItems, isLoading } = useQuery<LibraryItem[]>({
        queryKey: ['my-library'],
        queryFn: async () => {
            try {
                const res = await api.get('/my-library/me');
                return res.data;
            } catch (e) {
                console.warn(e, "Using mock library data");
                return MOCK_LIBRARY;
            }
        }
    });

    const filteredItems = libraryItems?.filter(item => item.readingStatus === activeTab);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-forest-100 pb-4">
                <div>
                    <h1 className="text-3xl font-serif text-forest-900 mb-2">내 서재 (My Library)</h1>
                    <p className="text-forest-600">나만의 지식 정원</p>
                </div>

                <div className="flex gap-1 bg-forest-50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('READING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'READING' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-500 hover:text-forest-600'}`}
                    >
                        읽고 있는 책
                    </button>
                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'COMPLETED' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-500 hover:text-forest-600'}`}
                    >
                        다 읽은 책
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-3 text-center py-20">Loading...</div>
                ) : filteredItems?.length === 0 ? (
                    <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-dashed border-forest-200 text-forest-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>아직 책이 없네요. 서점에서 책을 찾아보세요!</p>
                    </div>
                ) : filteredItems?.map(item => (
                    <Card key={item.libraryId} className="flex gap-4 p-4 hover:shadow-lg transition-shadow border-none bg-white">
                        <div className="w-24 aspect-[2/3] bg-slate-100 rounded-lg flex-shrink-0 relative overflow-hidden group">
                            {item.coverUrl ? (
                                <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-forest-50 text-forest-200">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="w-10 h-10 text-white drop-shadow-md cursor-pointer hover:scale-110 transition-transform" />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <h3 className="font-bold text-forest-900 line-clamp-1 mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-500 mb-3">{item.author}</p>

                                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 최근 독서: 오늘</span>
                                    <span className="px-2 py-0.5 bg-forest-50 text-forest-600 rounded">
                                        {item.type === 'OWNED' ? '소장' : '대여'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <ProgressBar value={item.totalProgress} max={100} label="독서 진행률" className="h-1.5" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
