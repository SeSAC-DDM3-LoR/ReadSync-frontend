import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin, Github, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-emerald-900 to-emerald-950 text-white mt-20">
            {/* 상단 웨이브 장식 */}
            <div className="h-16 bg-gradient-to-b from-transparent to-emerald-900 -mt-16"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* 로고 & 소개 */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <BookOpen size={22} />
                            </div>
                            <span className="font-extrabold text-2xl text-white">ReadSync</span>
                        </Link>
                        <p className="text-emerald-200 text-sm leading-relaxed mb-4">
                            책과 함께 성장하는 즐거움을 경험하세요.
                            AI와 함께하는 스마트한 독서 플랫폼, ReadSync에서 새로운 독서 습관을 만들어보세요.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 bg-emerald-800/50 hover:bg-emerald-700 rounded-full flex items-center justify-center transition-colors">
                                <Github size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 bg-emerald-800/50 hover:bg-emerald-700 rounded-full flex items-center justify-center transition-colors">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 bg-emerald-800/50 hover:bg-emerald-700 rounded-full flex items-center justify-center transition-colors">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* 서비스 링크 */}
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-white">서비스</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/books" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    도서 둘러보기
                                </Link>
                            </li>
                            <li>
                                <Link to="/library" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    내 서재
                                </Link>
                            </li>
                            <li>
                                <Link to="/ai-chat" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    AI 독서 도우미
                                </Link>
                            </li>
                            <li>
                                <Link to="/community" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    독서 커뮤니티
                                </Link>
                            </li>
                            <li>
                                <Link to="/subscription" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    구독 상점
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 고객지원 */}
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-white">고객지원</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    자주 묻는 질문
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    이용약관
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    개인정보처리방침
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    환불정책
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-emerald-200 hover:text-white transition-colors text-sm">
                                    공지사항
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 연락처 */}
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-white">연락처</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <Mail size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span className="text-emerald-200 text-sm">support@readsync.com</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span className="text-emerald-200 text-sm">02-1234-5678</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span className="text-emerald-200 text-sm">서울특별시 강남구 테헤란로 123</span>
                            </li>
                        </ul>

                        {/* 고객센터 운영시간 */}
                        <div className="mt-4 p-3 bg-emerald-800/30 rounded-xl">
                            <p className="text-xs text-emerald-300 font-medium">고객센터 운영시간</p>
                            <p className="text-sm text-white">평일 09:00 - 18:00</p>
                            <p className="text-xs text-emerald-300">(주말/공휴일 휴무)</p>
                        </div>
                    </div>
                </div>

                {/* 하단 구분선 & 저작권 */}
                <div className="border-t border-emerald-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-emerald-300 text-sm">
                        © {currentYear} ReadSync. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-emerald-300 hover:text-white text-sm transition-colors">
                            이용약관
                        </a>
                        <a href="#" className="text-emerald-300 hover:text-white text-sm transition-colors">
                            개인정보처리방침
                        </a>
                        <a href="#" className="text-emerald-300 hover:text-white text-sm transition-colors">
                            쿠키정책
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
