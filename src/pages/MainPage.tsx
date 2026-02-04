import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import { bookService } from '../services/bookService';
import type { Book as BookType } from '../services/bookService';
import { creditService } from '../services/userService';
import { libraryService } from '../services/libraryService'; // [New] Import
import { levelService, getExpProgress, getExpNeededForNextLevel } from '../services/levelService';
import type { Level } from '../services/levelService';
import {
  ThumbsUp, Book, Trophy, Coins, ChevronRight, ChevronLeft, Leaf, Sparkles,
  Zap, Crown, BookOpen, TreeDeciduous, Volume2, Loader
} from 'lucide-react';

const RecommendedBookCard: React.FC<{
  book: BookType;
  onClick: () => void;
}> = ({ book, onClick }) => (
  <motion.div
    className="w-full bg-white rounded-xl overflow-hidden cursor-pointer border border-emerald-100 shadow-sm hover:shadow-md transition-all relative group"
    onClick={onClick}
    whileHover={{ y: -5 }}
  >
    <div className="h-48 bg-emerald-50 flex items-center justify-center relative overflow-hidden">
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
      ) : (
        <Book size={48} className="text-emerald-200" />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </div>
    <div className="p-3">
      <h4 className="font-bold text-gray-800 text-sm truncate">{book.title}</h4>
      <p className="text-xs text-gray-500 truncate mt-1">{book.author}</p>
    </div>
  </motion.div>
);

const RecommendedBookSection: React.FC<{
  userNickname: string;
  onClickBook: (bookId: number) => void;
}> = ({ userNickname, onClickBook }) => {
  const [recommendations, setRecommendations] = useState<BookType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_VIEW = 6;

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // [변경] 진짜 추천 API 호출 (내가 보유한 책 제외됨) - 20권 조회 (넉넉하게)
        // Score 순으로 정렬되어 넘어옵니다.
        // [Update] 추천 도서와 내 서재 목록을 병렬로 조회하여, 이미 소유한 책은 추천에서 제외
        const [recResponse, libResponse] = await Promise.all([
          bookService.getRecommendedBooks(0, 30), // 필터링될 것을 고려해 넉넉히 조회
          libraryService.getMyLibrary(0, 100)     // 내 서재 책 ID 확인용
        ]);

        const ownedBookIds = new Set(libResponse.content.map(lib => lib.bookId));
        let candidateBooks = recResponse.content.filter(book => !ownedBookIds.has(book.bookId));

        if (candidateBooks.length > 0) {
          setRecommendations(candidateBooks.slice(0, 20));
        } else {
          // Fallback: 전체 도서 랜덤 (여기서도 소유한 책 제외)
          const allBooksResponse = await bookService.getBooks(0, 50);
          const shuffled = [...allBooksResponse.content]
            .filter(book => !ownedBookIds.has(book.bookId))
            .sort(() => 0.5 - Math.random());
          setRecommendations(shuffled.slice(0, 20));
        }
      } catch (err) {
        console.warn("Failed to load recommendations.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleNext = () => {
    // [변경] 무한 루프 제거, 끝에 도달하면 멈춤
    if (currentIndex + ITEMS_PER_VIEW < recommendations.length) {
      setCurrentIndex((prev) => prev + ITEMS_PER_VIEW);
    }
  };

  const handlePrev = () => {
    // [변경] 무한 루프 제거
    if (currentIndex - ITEMS_PER_VIEW >= 0) {
      setCurrentIndex((prev) => prev - ITEMS_PER_VIEW);
    }
  };

  const visibleBooks = recommendations.slice(currentIndex, currentIndex + ITEMS_PER_VIEW);

  if (loading || recommendations.length === 0) return null;

  return (
    <motion.section
      className="mb-12 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ThumbsUp size={24} className="text-amber-500" />
          <span className="text-emerald-700 text-2xl font-extrabold">{userNickname}</span>님을 위한 추천 도서
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-1.5 rounded-full border border-gray-200 transition-colors
              ${currentIndex === 0
                ? 'bg-gray-100 text-gray-300'
                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex + ITEMS_PER_VIEW >= recommendations.length}
            className={`p-1.5 rounded-full border border-gray-200 transition-colors
              ${currentIndex + ITEMS_PER_VIEW >= recommendations.length
                ? 'bg-gray-100 text-gray-300'
                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2 px-1">
        <AnimatePresence mode='wait'>
          {visibleBooks.map((book, idx) => (
            <motion.div
              key={`${book.bookId}-${currentIndex}-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <RecommendedBookCard book={book} onClick={() => onClickBook(book.bookId)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

// 이미지 Assets
import cloudImg from '../assets/cloud.png';
import tree from '../assets/tree.png';
import character from '../assets/character2.png';

// 파티클 컴포넌트
const Particles: React.FC = () => {
  return (
    <div className="particle-container">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 bg-emerald-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particleFloat ${3 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      {[...Array(8)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-yellow-400/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `sparkle ${1.5 + Math.random() * 1}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
};


// 스탯 박스 컴포넌트
const StatBox: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  trend?: string;
}> = ({ icon, label, value, highlight, trend }) => (
  <motion.div
    className={`stat-box ${highlight ? 'stat-box-highlight' : ''}`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400 }}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2.5 rounded-xl ${highlight
        ? 'bg-gradient-to-br from-amber-100 to-yellow-100'
        : 'bg-gradient-to-br from-emerald-100 to-green-100'
        }`}>
        {icon}
      </div>
      <div>
        <span className="font-bold text-gray-700 block">{label}</span>
        {trend && <span className="text-xs text-emerald-600">{trend}</span>}
      </div>
    </div>
    <span className={`font-extrabold text-lg ${highlight ? 'text-amber-600' : 'text-emerald-700'}`}>
      {value}
    </span>
  </motion.div>
);

// 유저 프로필 섹션 (실제 데이터 연동)
const UserProfileSection: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  // 비로그인 상태
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-5 mb-8 relative z-10">
        <motion.div className="avatar" whileHover={{ scale: 1.05, rotate: 3 }}>
          <div className="avatar-inner">👤</div>
        </motion.div>
        <div>
          <h3 className="text-2xl font-extrabold text-green-900 flex items-center gap-2">
            게스트
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">로그인하고 독서를 시작하세요!</span>
          </div>
        </div>
      </div>
    );
  }

  // 프로필 이미지 렌더링
  const renderProfileImage = () => {
    if (user.profileImage) {
      return (
        <img
          src={user.profileImage}
          alt={user.nickname || 'Profile'}
          className="w-full h-full object-cover rounded-2xl"
        />
      );
    }
    // 기본: 닉네임 첫 글자
    return <span>{user.nickname?.charAt(0) || '?'}</span>;
  };

  // 티어 계산 (레벨 기반)
  const getTierInfo = () => {
    const level = user.levelId || 1;
    if (level >= 10) return { name: 'DIAMOND', class: 'tier-badge-diamond', emoji: '💎' };
    if (level >= 7) return { name: 'PLATINUM', class: 'tier-badge-platinum', emoji: '🏆' };
    if (level >= 5) return { name: 'GOLD', class: 'tier-badge-gold', emoji: '🥇' };
    if (level >= 3) return { name: 'SILVER', class: 'tier-badge-silver', emoji: '🥈' };
    return { name: 'BRONZE', class: 'tier-badge-bronze', emoji: '🥉' };
  };

  const tier = getTierInfo();

  return (
    <div className="flex items-center gap-5 mb-8 relative z-10">
      <motion.div className="avatar" whileHover={{ scale: 1.05, rotate: 3 }}>
        <div className="avatar-inner">{renderProfileImage()}</div>
      </motion.div>
      <div>
        <h3 className="text-2xl font-extrabold text-green-900 flex items-center gap-2">
          {user.nickname}
          <span className="text-gray-400 font-normal text-lg">#{user.tag}</span>
          {user.levelId && user.levelId >= 5 && <Crown size={20} className="text-amber-500" />}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={tier.class || 'tier-badge-bronze'}>
            <Trophy size={12} /> {tier.name} TIER
          </span>
          <span className="text-xs text-gray-500">Lv.{user.levelId || 1}</span>
        </div>
      </div>
    </div>
  );
};

// 최근 책 카드 (진행률 제거됨)
const RecentBookCard: React.FC<{
  index: number;
  title: string;
  author: string;
  onClick: () => void;
}> = ({ index, title, author, onClick }) => (
  <motion.div
    className="book-card cursor-pointer"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.03 }}
    onClick={onClick}
  >
    <div className="book-card-cover relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/20" />
      <div className="w-full h-full flex items-center justify-center">
        <Book size={40} className="text-emerald-300 drop-shadow" />
      </div>
    </div>
    <div className="mt-3 px-1">
      <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-gray-500 truncate">{author}</p>
    </div>
  </motion.div>
);

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  // 도서 목록 상태
  const [books, setBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const BOOKS_PER_PAGE = 10;

  // 크레딧 상태
  const [credits, setCredits] = useState<number>(0);

  // 레벨 정보 상태
  const [levels, setLevels] = useState<Level[]>([]);

  // 유저 정보 가져오기 (및 최신화)
  const { user, fetchCurrentUser } = useAuthStore();

  // [New] 페이지 진입 시 유저 경험치/레벨 최신화 (리더 등에서 돌아왔을 때 반영)
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 경험치 진행률 계산 (레벨 데이터 기반)
  const expProgress = user && levels.length > 0
    ? getExpProgress(user.experience || 0, user.levelId || 1, levels)
    : 0;
  const expNeeded = user && levels.length > 0
    ? getExpNeededForNextLevel(user.levelId || 1, levels)
    : 100;

  // 도서 목록 가져오기 (페이지 변경 시 재호출)
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const booksResponse = await bookService.getBooks(currentPage, BOOKS_PER_PAGE);
        setBooks(booksResponse.content);
        setTotalPages(booksResponse.totalPages);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch books:', err);
        setError('도서 목록을 불러오는데 실패했습니다.');
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [currentPage]);

  // 레벨 및 크레딧 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      // 레벨 데이터 가져오기
      try {
        const levelsData = await levelService.getAllLevels();
        setLevels(levelsData);
      } catch (levelErr) {
        console.error('Failed to fetch levels:', levelErr);
      }

      // 크레딧 가져오기 (로그인된 경우에만)
      if (user) {
        try {
          const creditBalance = await creditService.getMyBalance();
          setCredits(creditBalance);
        } catch (creditErr) {
          console.error('Failed to fetch credits:', creditErr);
          setCredits(0);
        }
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-emerald-400/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-green-300/20 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <div className="fixed top-0 w-full z-50">
        <Header />
      </div>

      <main className="layout-container flex-1 z-10">

        {/* --- 상단 메인 섹션 --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12">

          {/* [좌측 7칸] 나만의 독서 숲 (비주얼) */}
          <motion.div
            className="glass-panel lg:col-span-7 relative h-[480px] flex overflow-hidden group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Particles />

            {/* 타이틀 영역 */}
            <div className="absolute top-8 left-8 z-30 max-w-[60%]">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="game-title flex items-center gap-3 text-green-800">
                  <TreeDeciduous className="text-green-600" size={32} />
                  나의 독서 숲
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Leaf className="text-green-500" fill="#10B981" size={24} />
                  </motion.span>
                </h2>
              </motion.div>

              {/* 레벨 정보 박스 */}
              <motion.div
                className="mt-4 bg-white/80 backdrop-blur-md px-5 py-4 rounded-2xl border border-emerald-100 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="level-badge">
                    <Zap size={14} /> {user ? `Lv.${user.levelId || 1}` : 'Lv.1'}
                  </span>
                  <span className="text-green-800 font-bold text-lg">
                    {user?.nickname || '독서 여행자'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 exp-bar">
                    <div className="exp-bar-fill" style={{ width: `${expProgress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {user ? `${user.experience || 0}/${expNeeded}` : '0 EXP'}
                  </span>
                </div>
                <p className="text-green-700 text-sm flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-500" />
                  {user ? '책을 많이 읽어 나무를 성장시키세요!' : '로그인하고 독서를 시작하세요!'}
                </p>
              </motion.div>
            </div>

            {/* 배경 오브젝트 */}
            <motion.img
              src={cloudImg}
              className="absolute top-10 right-10 w-28 opacity-60"
              alt=""
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.img
              src={cloudImg}
              className="absolute top-40 left-10 w-16 opacity-40"
              alt=""
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />

            {/* 메인 비주얼 (나무 & 캐릭터) */}
            <div className="absolute bottom-0 right-[-9%] w-full h-full flex items-end justify-end pr-0 pb-6 z-10">

              {/* 바닥 마법진 */}
              <div className="absolute bottom-8 right-[10%] w-[60%] h-24 bg-emerald-500/30 blur-3xl rounded-full animate-pulse-glow pointer-events-none" />

              {/* 캐릭터 */}
              <motion.div
                className="absolute bottom-8 right-[40%] z-40 cursor-pointer"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-lg text-sm font-bold text-green-800 border-2 border-emerald-200 whitespace-nowrap"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-500" /> 오늘도 화이팅! 🌿
                  </span>
                </motion.div>
                <img src={character} alt="Character" className="w-[180px] md:w-[320px] drop-shadow-2xl" />
              </motion.div>

              {/* 나무 */}
              <motion.div
                className="relative z-20 flex flex-col items-center mr-[-50px] md:mr-[-100px]"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              >
                <img
                  src={tree}
                  alt="Tree"
                  className="w-[280px] md:w-[360px] lg:w-[720px] drop-shadow-2xl filter brightness-105"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* [우측 5칸] 마이 데이터 / 게스트 환영 */}
          <motion.div
            className="glass-panel lg:col-span-5 p-8 flex flex-col justify-between h-auto min-h-[480px] relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-100/50 rounded-full blur-3xl pointer-events-none" />

            {user ? (
              /* === 로그인 사용자 View === */
              <>
                <div>
                  {/* 프로필 */}
                  <UserProfileSection />

                  <div className="space-y-3 relative z-10">
                    {/* 경험치 바 */}
                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 font-bold text-emerald-900">
                          <BookOpen size={20} className="text-emerald-500" /> 성장 진행도
                        </span>
                        <span className="text-sm font-bold text-emerald-600">
                          Lv.{user.levelId || 1} → Lv.{(user.levelId || 1) + 1}
                        </span>
                      </div>
                      <div className="exp-bar">
                        <motion.div
                          className="exp-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${expProgress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-emerald-600 mt-1.5">
                        {user.experience || 0} / {expNeeded} EXP
                      </p>
                    </div>

                    <StatBox
                      icon={<Coins size={24} className="text-yellow-500" />}
                      label="씨앗 포인트"
                      value={`${credits.toLocaleString()} G`}
                      trend="보유 포인트"
                      highlight
                    />
                    <StatBox
                      icon={<Book size={24} className="text-emerald-500" />}
                      label="내 레벨"
                      value={`Lv.${user.levelId || 1}`}
                      trend={`${user.experience || 0} EXP`}
                    />
                  </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex gap-3 mt-6 z-10">
                  <motion.button
                    onClick={() => navigate('/library')}
                    className="btn-game flex-1 flex items-center justify-center gap-2 text-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Book size={22} /> 내 서재
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/tts-room')}
                    className="flex-1 flex items-center justify-center gap-2 text-lg font-bold py-4 px-6 rounded-xl
                               bg-gradient-to-r from-amber-500 to-orange-500 text-white
                               shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Volume2 size={22} /> TTS룸
                  </motion.button>
                </div>
              </>
            ) : (
              /* === 게스트 View === */
              <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                {/* 배경 장식 */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-amber-50/50 rounded-2xl" />

                {/* 아이콘 */}
                <motion.div
                  className="relative mb-6"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200">
                    <TreeDeciduous size={48} className="text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles size={16} className="text-white" />
                  </motion.div>
                </motion.div>

                {/* 환영 메시지 */}
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                  나만의 독서 여정을 시작하세요
                </h3>
                <p className="text-gray-600 mb-6 max-w-xs">
                  책을 읽고 경험치를 쌓아 나무를 성장시키세요!<br />
                  <span className="text-emerald-600 font-semibold">TTS 기능</span>과 함께 더 편하게 읽어보세요.
                </p>

                {/* 혜택 리스트 */}
                <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-sm">
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-gray-100 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Book size={16} className="text-emerald-600" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">내 서재</span>
                    </div>
                    <p className="text-xs text-gray-500">구매한 책을 관리하세요</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-gray-100 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Volume2 size={16} className="text-amber-600" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">TTS 청취</span>
                    </div>
                    <p className="text-xs text-gray-500">AI가 책을 읽어드려요</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-gray-100 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Coins size={16} className="text-yellow-600" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">씨앗 포인트</span>
                    </div>
                    <p className="text-xs text-gray-500">활동으로 포인트 적립</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-gray-100 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Crown size={16} className="text-purple-600" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">레벨 시스템</span>
                    </div>
                    <p className="text-xs text-gray-500">독서로 성장하세요</p>
                  </div>
                </div>

                {/* 버튼 */}
                {/* 버튼 */}
                <motion.button
                  onClick={(e) => {
                    console.log('Login button clicked');
                    e.stopPropagation();
                    navigate('/login');
                  }}
                  className="w-full max-w-sm py-4 px-6 rounded-xl font-bold text-lg
                             bg-gradient-to-r from-emerald-500 to-green-500 text-white
                             shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all
                             flex items-center justify-center gap-2 relative z-50 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles size={20} />
                  시작하기
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>


        {/* --- 추천 도서 섹션 (로그인 시에만) --- */}
        {user && (
          <RecommendedBookSection
            userNickname={user.nickname || "사용자"}
            onClickBook={(bookId) => navigate(`/books/${bookId}`)}
          />
        )}


        {/* --- 최근 책 목록 --- */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between items-end mb-6 px-2">
            <h3 className="game-title text-xl flex items-center gap-2">
              📚 최근 등록된 책
              <span className="text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                {currentPage + 1} / {totalPages || 1} 페이지
              </span>
            </h3>
            <motion.button
              onClick={() => navigate('/books')}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm transition-all hover:shadow-md"
              whileHover={{ x: 3 }}
            >
              전체 도서 보기 <ChevronRight size={16} className="ml-1" />
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-3 text-gray-500">도서 목록 로딩 중...</span>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  다시 시도
                </button>
              </div>
            ) : books.length > 0 ? (
              books.map((book, idx) => (
                <RecentBookCard
                  key={book.bookId}
                  index={idx}
                  title={book.title}
                  author={book.author}
                  onClick={() => navigate(`/books/${book.bookId}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>등록된 도서가 없습니다.</p>
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <motion.button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                whileHover={{ scale: currentPage === 0 ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft size={18} />
                이전
              </motion.button>

              <span className="text-gray-600 font-medium">
                {currentPage + 1} / {totalPages}
              </span>

              <motion.button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                whileHover={{ scale: currentPage >= totalPages - 1 ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                다음
                <ChevronRight size={18} />
              </motion.button>
            </div>
          )}
        </motion.section>

      </main>
      <Footer />
    </div>
  );
};

export default MainPage;