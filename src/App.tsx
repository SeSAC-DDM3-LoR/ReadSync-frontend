import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { BookStorePage } from './pages/BookStorePage';
import { BookDetailPage } from './pages/BookDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { SignupProfilePage } from './pages/SignupProfilePage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/signup" element={<SignupProfilePage />} />

            <Route path="/*" element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/books" element={<BookStorePage />} />
                  <Route path="/books/:bookId" element={<BookDetailPage />} />

                  <Route path="/library" element={
                    <ProtectedRoute>
                      <LibraryPage />
                    </ProtectedRoute>
                  } />

                  {/* Placeholders */}
                  <Route path="/community" element={
                    <div className="p-8 text-center text-forest-600">커뮤니티 (준비중)</div>
                  } />
                  <Route path="/mypage" element={
                    <ProtectedRoute>
                      <div className="p-8 text-center text-forest-600">마이페이지 (준비중)</div>
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
