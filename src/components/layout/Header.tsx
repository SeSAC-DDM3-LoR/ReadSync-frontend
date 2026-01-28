import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, Menu, Search, X, ShoppingCart, Bell, LogOut, Settings, ChevronDown } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { cartService } from '../../services/cartService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // 장바구니 개수 업데이트
  React.useEffect(() => {
    const fetchCartCount = async () => {
      if (isAuthenticated) {
        try {
          const cartItems = await cartService.getCart();
          setCartCount(cartItems.length);
        } catch (error) {
          console.error('Failed to fetch cart count', error);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();

    // 장바구니 변경 이벤트 리스너 (커스텀 이벤트)
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  // 프로필 이미지 또는 기본 아바타
  const renderProfileImage = () => {
    if (user?.profileImage) {
      return (
        <img
          src={user.profileImage}
          alt={user.nickname || 'Profile'}
          className="w-9 h-9 rounded-full object-cover border-2 border-emerald-200"
        />
      );
    }
    // 기본 아바타 (닉네임 첫 글자)
    const initial = user?.nickname?.charAt(0) || '?';
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold border-2 border-emerald-200">
        {initial}
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-emerald-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* 로고 영역 */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition-shadow">
              <BookOpen size={20} />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              ReadSync
            </span>
          </Link>

          {/* 검색창 (데스크탑) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="책 제목, 저자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 
                           focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 
                           outline-none transition-all text-gray-700 placeholder-gray-400"
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>

          {/* 데스크탑 메뉴 */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/library" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              내 서재
            </Link>
            <Link to="/ai-chat" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              AI 채팅
            </Link>
            <Link to="/community" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              커뮤니티
            </Link>
            <Link to="/subscription" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              구독상점
            </Link>
          </nav>

          {/* 우측 아이콘 */}
          <div className="flex items-center gap-2">
            {/* 모바일 검색 버튼 */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-emerald-50 rounded-full transition-colors"
            >
              <Search size={20} />
            </button>



            {/* 장바구니 */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:bg-emerald-50 rounded-full transition-colors">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* 로그인 상태에 따른 UI */}
            {isAuthenticated && user ? (
              // 로그인된 경우: 프로필 드롭다운
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  {renderProfileImage()}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-gray-800 leading-tight">
                      {user.nickname}
                      <span className="text-gray-400 font-normal">#{user.tag}</span>
                    </p>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
                </button>

                {/* 프로필 드롭다운 */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-800">
                        {user.nickname}
                        <span className="text-gray-400 font-normal">#{user.tag}</span>
                      </p>
                      <p className="text-xs text-gray-500">Lv.{user.levelId} · {user.experience} EXP</p>
                    </div>

                    <Link
                      to="/mypage"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50 transition-colors"
                    >
                      <User size={18} className="text-gray-500" />
                      마이페이지
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50 transition-colors"
                    >
                      <Settings size={18} className="text-gray-500" />
                      설정
                    </Link>

                    {/* 관리자 전용 */}
                    {(user.role === 'ADMIN' || user.role === 'ROLE_ADMIN') && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                      >
                        <Settings size={18} className="text-emerald-600" />
                        관리자 대시보드
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut size={18} />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 비로그인: 로그인 버튼
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all"
              >
                <User size={18} />
                <span>로그인</span>
              </Link>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-emerald-50 rounded-full transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* 모바일 검색창 */}
        {isSearchOpen && (
          <div className="md:hidden py-3 border-t border-emerald-100">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="책 제목, 저자로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-emerald-50/80 border border-emerald-100 
                           focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 
                           outline-none transition-all text-gray-700 placeholder-gray-400"
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
            </form>
          </div>
        )}

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-emerald-100">
            <nav className="flex flex-col space-y-2">
              <Link to="/library" className="px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-xl font-medium transition-colors">
                내 서재
              </Link>
              <Link to="/ai-chat" className="px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-xl font-medium transition-colors">
                AI 채팅
              </Link>
              <Link to="/community" className="px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-xl font-medium transition-colors">
                커뮤니티
              </Link>
              <Link to="/subscription" className="px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-xl font-medium transition-colors">
                구독상점
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="mx-4 mt-2 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl text-center"
                >
                  로그인
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;