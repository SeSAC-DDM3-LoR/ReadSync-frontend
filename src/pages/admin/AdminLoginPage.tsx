import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, ArrowLeft } from 'lucide-react';

export function AdminLoginPage() {
    const { adminLogin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // 이미 로그인되어 있다면 대시보드로 이동
    if (isAuthenticated) {
        navigate('/admin/dashboard');
    }

    const [formData, setFormData] = useState({
        loginId: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await adminLogin(formData.loginId, formData.password);
            // 로그인 성공 시 대시보드로 이동
            navigate('/admin/dashboard');
        } catch (err: any) {
            // 에러 처리
            if (err.response?.status === 401 || err.response?.status === 400) {
                setError('아이디 또는 비밀번호를 확인해주세요.');
            } else {
                setError('로그인 중 오류가 발생했습니다.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <button 
                            onClick={() => navigate('/')}
                            className="text-slate-400 hover:text-white flex items-center text-sm transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            메인으로
                        </button>
                        <div className="flex items-center text-blue-500 font-bold">
                            <Lock className="w-4 h-4 mr-2" />
                            Admin Access
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">관리자 로그인</h1>
                        <p className="text-slate-400 text-sm">ReadSync 관리 시스템</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                ID
                            </label>
                            <input
                                type="text"
                                value={formData.loginId}
                                onChange={(e) => setFormData(prev => ({ ...prev, loginId: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder="admin"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder="••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                        >
                            {isSubmitting ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>
                
                <div className="bg-slate-900/50 p-4 text-center border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                        초기 계정: admin / 1234
                    </p>
                </div>
            </div>
        </div>
    );
}