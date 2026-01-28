import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ChevronLeft, Bookmark, Volume2, Settings, ArrowLeft, ArrowRight } from 'lucide-react';

const ReaderPage: React.FC = () => {
    const { libraryId, chapterId } = useParams<{ libraryId: string; chapterId: string }>();

    return (
        <div className="min-h-screen bg-amber-50">
            {/* 리더 헤더 */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-amber-100 z-50">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/library" className="flex items-center gap-2 text-amber-800 hover:text-amber-600">
                        <ChevronLeft size={20} />
                        <span>서재로 돌아가기</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg">
                            <Bookmark size={20} />
                        </button>
                        <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg">
                            <Volume2 size={20} />
                        </button>
                        <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* 본문 영역 */}
            <main className="pt-20 pb-24 px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-2xl mx-auto"
                >
                    <article className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
                        <h1 className="text-2xl font-bold text-amber-900 mb-8 text-center">
                            제 {chapterId}장
                        </h1>

                        <div className="prose prose-amber max-w-none text-lg leading-relaxed text-amber-900">
                            <p className="mb-6 indent-8">
                                이것은 뷰어 페이지의 임시 콘텐츠입니다. 실제 구현 시에는 백엔드에서 챕터 본문을 가져와 표시합니다.
                            </p>
                            <p className="mb-6 indent-8">
                                독서 진행 중인 사용자를 위해 북마크 기능, TTS 기능, 글자 크기 조절 등의 기능이 추가될 예정입니다.
                            </p>
                            <p className="mb-6 indent-8">
                                현재 서재 ID: {libraryId}, 챕터 ID: {chapterId}
                            </p>
                            <p className="mb-6 indent-8">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                            <p className="mb-6 indent-8">
                                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>
                        </div>
                    </article>
                </motion.div>
            </main>

            {/* 하단 네비게이션 */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-amber-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-100 rounded-xl">
                        <ArrowLeft size={18} />
                        이전 장
                    </button>

                    <div className="text-sm text-amber-600">
                        1 / 12 장
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700">
                        다음 장
                        <ArrowRight size={18} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ReaderPage;
