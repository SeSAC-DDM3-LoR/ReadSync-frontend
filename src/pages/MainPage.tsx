import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';
import { bookService } from '../services/bookService';
import type { Book as BookType } from '../services/bookService';
import { creditService } from '../services/userService';
import { libraryService, bookLogService } from '../services/libraryService';
import type { Library } from '../services/libraryService';
import {
  Book, Trophy, Coins, ChevronRight, Leaf, Sparkles,
  Zap, Crown, BookOpen, TreeDeciduous, Volume2, Loader
} from 'lucide-react';

// 이미지 Assets
import cloudImg from '../assets/cloud.png';
import treeBase from '../assets/tree-base.png';
import treeTrunk from '../assets/tree-trunk.png';
import character from '../assets/character.png';

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

// 최근 책 카드
const RecentBookCard: React.FC<{
  index: number;
  title: string;
  author: string;
  progress: number;
  onClick: () => void;
}> = ({ index, title, author, progress, onClick }) => (
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

      {/* 진행률 표시 */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-green-400"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="book-card-badge">
        {progress > 0 ? '이어읽기' : '새로 시작'}
      </div>
    </div>
    <div className="mt-3 px-1">
      <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-gray-500 truncate">{author}</p>
      <div className="flex items-center gap-1 mt-1">
        <div className="flex-1 h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 font-medium">{progress}%</span>
      </div>
    </div>
  </motion.div>
);

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  // 도서 목록 상태
  const [books, setBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 내 서재 (최근 열어본 책)
  const [recentBooks, setRecentBooks] = useState<Library[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // 크레딧 상태
  const [credits, setCredits] = useState<number>(0);

  // 유저 정보 가져오기
  const { user } = useAuthStore();

  // 도서 목록 및 크레딧 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 도서 목록 가져오기
        const booksResponse = await bookService.getBooks(0, 5);
        setBooks(booksResponse.content);

        // 크레딧 및 내 서재 가져오기 (로그인된 경우에만)
        if (user) {
          try {
            const creditBalance = await creditService.getMyBalance();
            setCredits(creditBalance);
          } catch (creditErr) {
            console.error('Failed to fetch credits:', creditErr);
            setCredits(0);
          }

          // 내 서재에서 최근 책 가져오기
          try {
            setIsLoadingRecent(true);
            const libraryData = await libraryService.getMyLibrary(0, 5);
            const bookLogs = await bookLogService.getMyBookLogs();

            // BookLog로 마지막 열람 순 정렬
            const sortedBooks = [...libraryData.content].sort((a, b) => {
              const logA = bookLogs.find(log => log.libraryId === a.libraryId);
              const logB = bookLogs.find(log => log.libraryId === b.libraryId);
              const dateA = logA ? new Date(logA.readDate).getTime() : 0;
              const dateB = logB ? new Date(logB.readDate).getTime() : 0;
              return dateB - dateA;  // 최근순 정렬
            });
            setRecentBooks(sortedBooks.slice(0, 5));
          } catch (libraryErr) {
            console.error('Failed to fetch library:', libraryErr);
            setRecentBooks([]);
          } finally {
            setIsLoadingRecent(false);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('데이터를 불러오는데 실패했습니다.');
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
                    <div className="exp-bar-fill" style={{ width: user ? `${Math.min((user.experience || 0) % 1000 / 10, 100)}%` : '0%' }} />
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {user ? `${user.experience || 0} EXP` : '0 EXP'}
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
            <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-end pr-4 pb-6 z-10">

              {/* 바닥 마법진 */}
              <div className="absolute bottom-8 right-[10%] w-[60%] h-24 bg-emerald-500/30 blur-3xl rounded-full animate-pulse-glow pointer-events-none" />

              {/* 캐릭터 */}
              <motion.div
                className="absolute bottom-12 right-[35%] z-40 cursor-pointer"
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
                <img src={character} alt="Character" className="w-32 md:w-40 drop-shadow-2xl" />
              </motion.div>

              {/* 나무 */}
              <motion.div
                className="relative z-20 flex flex-col items-center mr-4 md:mr-10"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              >
                <img src={treeTrunk} alt="Trunk" className="w-40 md:w-52 z-20 -mb-6 drop-shadow-xl" />
                <img src={treeBase} alt="Base" className="w-64 md:w-80 z-10 drop-shadow-xl" />
              </motion.div>
            </div>
          </motion.div>

          {/* [우측 5칸] 마이 데이터 */}
          <motion.div
            className="glass-panel lg:col-span-5 p-8 flex flex-col justify-between h-auto min-h-[480px] relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-green-100/50 rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* 프로필 - 실제 유저 데이터 연동 */}
              <UserProfileSection />

              <div className="space-y-3 relative z-10">
                {/* 경험치 바 */}
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="flex items-center gap-2 font-bold text-emerald-900">
                      <BookOpen size={20} className="text-emerald-500" /> 성장 진행도
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {user ? `Lv.${user.levelId || 1} → Lv.${(user.levelId || 1) + 1}` : 'Lv.1 → Lv.2'}
                    </span>
                  </div>
                  <div className="exp-bar">
                    <motion.div
                      className="exp-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: user ? `${Math.min((user.experience || 0) % 1000 / 10, 100)}%` : '0%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-1.5">
                    {user ? `${user.experience || 0} EXP` : '로그인 후 확인하세요'}
                  </p>
                </div>

                <StatBox
                  icon={<Coins size={24} className="text-yellow-500" />}
                  label="씨앗 포인트"
                  value={`${credits.toLocaleString()} G`}
                  trend={user ? '보유 포인트' : '로그인 필요'}
                  highlight
                />
                <StatBox
                  icon={<Book size={24} className="text-emerald-500" />}
                  label="내 레벨"
                  value={user ? `Lv.${user.levelId || 1}` : 'Lv.1'}
                  trend={user ? `${user.experience || 0} EXP` : '로그인 필요'}
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
          </motion.div>
        </div>


        {/* --- 최근 책 목록 --- */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between items-end mb-6 px-2">
            <h3 className="game-title text-xl flex items-center gap-2">
              📖 최근 열어본 책
              <span className="text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                최근 5권
              </span>
            </h3>
            <motion.button
              onClick={() => navigate('/library')}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm transition-all hover:shadow-md"
              whileHover={{ x: 3 }}
            >
              전체 서재 보기 <ChevronRight size={16} className="ml-1" />
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {isLoading || isLoadingRecent ? (
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
            ) : user && recentBooks.length > 0 ? (
              // 로그인 사용자: 내 서재의 최근 열어본 책
              recentBooks.map((lib, idx) => (
                <RecentBookCard
                  key={lib.libraryId}
                  index={idx}
                  title={lib.bookTitle}
                  author=""
                  progress={lib.totalProgress || 0}
                  onClick={() => navigate(`/reader/${lib.libraryId}/1`)}
                />
              ))
            ) : books.length > 0 ? (
              // 비로그인 또는 서재 비어있음: 일반 도서 목록
              books.map((book, idx) => (
                <RecentBookCard
                  key={book.bookId}
                  index={idx}
                  title={book.title}
                  author={book.author}
                  progress={0}
                  onClick={() => navigate(`/books/${book.bookId}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{user ? '아직 열어본 책이 없습니다.' : '등록된 도서가 없습니다.'}</p>
              </div>
            )}
          </div>
        </motion.section>

      </main>
      <Footer />
    </div>
  );
};

export default MainPage;