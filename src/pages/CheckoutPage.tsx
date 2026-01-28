import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Check, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import useAuthStore from '../stores/authStore';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated]);

    const handlePayment = async () => {
        setIsProcessing(true);
        // 토스 페이먼츠 연동 예정
        setTimeout(() => {
            alert('결제 기능은 곧 연동 예정입니다.');
            setIsProcessing(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* 뒤로가기 */}
                    <Link
                        to="/cart"
                        className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-8"
                    >
                        <ArrowLeft size={20} />
                        장바구니로 돌아가기
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                            <CreditCard className="text-emerald-500" />
                            결제하기
                        </h1>

                        {/* 결제 정보 */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">결제 수단</h2>

                            {/* 결제 방법 선택 (임시) */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-4 p-4 border-2 border-emerald-500 rounded-xl cursor-pointer bg-emerald-50">
                                    <input type="radio" name="payment" checked readOnly className="w-5 h-5 text-emerald-500" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">신용/체크카드</p>
                                        <p className="text-sm text-gray-500">토스페이먼츠로 결제</p>
                                    </div>
                                    <img src="https://static.toss.im/icons/png/4x/icon-toss-logo.png" alt="Toss" className="h-6" />
                                </label>

                                <label className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="payment" className="w-5 h-5" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">카카오페이</p>
                                        <p className="text-sm text-gray-500">간편결제</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 주문 요약 */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">주문 요약</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">상품 금액</span>
                                    <span className="font-medium">₩0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">할인</span>
                                    <span className="font-medium text-red-500">-₩0</span>
                                </div>
                                <hr className="my-4" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold">총 결제금액</span>
                                    <span className="font-extrabold text-emerald-600">₩0</span>
                                </div>
                            </div>
                        </div>

                        {/* 보안 안내 */}
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl mb-6">
                            <ShieldCheck className="text-emerald-600" />
                            <p className="text-sm text-emerald-700">
                                결제 정보는 안전하게 암호화되어 처리됩니다.
                            </p>
                        </div>

                        {/* 결제 버튼 */}
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    결제 처리 중...
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
                                    결제하기
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;
