import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import OnboardingPage from './pages/OnboardingPage';

// 사용자 페이지
import BooksPage from './pages/BooksPage';
import BookDetailPage from './pages/BookDetailPage';
import LibraryPage from './pages/LibraryPage';
import CartPage from './pages/CartPage';
import CommunityPage from './pages/CommunityPage';
import MyPage from './pages/MyPage';
import NoticesPage from './pages/NoticesPage';
import InquiryPage from './pages/InquiryPage';
import FriendsPage from './pages/FriendsPage';
import NotificationsPage from './pages/NotificationsPage';

// 추가 페이지
import ReaderPage from './pages/ReaderPage';
import PersonalReaderPage from './pages/PersonalReaderPage';
import CheckoutPage from './pages/CheckoutPage';
import AiChatPage from './pages/AiChatPage';
import TtsRoomPage from './pages/tts/TtsRoomPage';
import SubscriptionStorePage from './pages/SubscriptionStorePage';

// 관리자 페이지
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminNoticesPage from './pages/admin/AdminNoticesPage';
import AdminBooksPage from './pages/admin/AdminBooksPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 메인 페이지 */}
        <Route path="/" element={<MainPage />} />

        {/* 인증 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* 도서 */}
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />

        {/* 서재 */}
        <Route path="/library" element={<LibraryPage />} />

        {/* 뷰어 */}
        <Route path="/reader/:libraryId/:chapterId" element={<PersonalReaderPage />} />
        <Route path="/reader-simple/:libraryId/:chapterId" element={<ReaderPage />} />

        {/* 장바구니 & 결제 */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* 구독 상점 */}
        <Route path="/subscription" element={<SubscriptionStorePage />} />

        {/* AI 기능 */}
        <Route path="/ai-chat" element={<AiChatPage />} />
        <Route path="/tts-room" element={<TtsRoomPage />} />
        <Route path="/tts-room/:roomId" element={<TtsRoomPage />} />

        {/* 커뮤니티 */}
        <Route path="/community" element={<CommunityPage />} />

        {/* 친구 */}
        <Route path="/friends" element={<FriendsPage />} />

        {/* 알림 */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* 마이페이지 */}
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/reviews" element={<MyPage />} />
        <Route path="/mypage/comments" element={<MyPage />} />
        <Route path="/mypage/exp" element={<MyPage />} />
        <Route path="/mypage/credits" element={<MyPage />} />

        {/* 공지 & 문의 */}
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/inquiry" element={<InquiryPage />} />

        {/* 관리자 */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/books" element={<AdminBooksPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/notices" element={<AdminNoticesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
