import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute'; // 새로 만든 컴포넌트

// Pages
import { Dashboard } from './pages/Dashboard';
import { BookStorePage } from './pages/BookStorePage';
import { BookDetailPage } from './pages/BookDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { SignupProfilePage } from './pages/SignupProfilePage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBooksPage } from './pages/admin/AdminBooksPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* === Admin Routes === */}
            {/* /admin 접속 시 바로 로그인 페이지로 리다이렉트 */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            
            {/* 어드민 로그인 페이지 */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            {/* 어드민 대시보드 (AdminRoute로 보호됨) */}
           <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />

            {/* [추가] 도서 관리 페이지 라우트 */}
            <Route path="/admin/books" element={
              <AdminRoute>
                <AdminBooksPage />
              </AdminRoute>
            } />

            {/* === User Routes === */}
            {/* 로그인/회원가입 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/signup" element={<SignupProfilePage />} />

            {/* 메인 레이아웃 적용 페이지들 */}
            <Route path="/*" element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/books" element={<BookStorePage />} />
                  <Route path="/books/:bookId" element={<BookDetailPage />} />

                  {/* 보호된 라우트 (로그인 필요) */}
                  <Route path="/library" element={
                    <ProtectedRoute>
                      <LibraryPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* 아직 없는 페이지들은 임시 처리 */}
                  <Route path="/community" element={<div className="p-10 text-center">커뮤니티 준비중</div>} />
                  <Route path="/mypage" element={
                    <ProtectedRoute>
                      <div className="p-10 text-center">마이페이지 준비중</div>
                    </ProtectedRoute>
                  } />

                  <Route path="/mylibrary" element={<Navigate to="/library" replace />} />
                </Routes>
              </MainLayout>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;